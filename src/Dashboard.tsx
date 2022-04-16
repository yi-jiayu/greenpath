import axios from "axios";
import useSWR from "swr";
import { useGithubToken } from "./github";
import Layout from "./Layout";
import { useParams } from "react-router-dom";
import TimeAgo from "react-timeago";
import dashboardSchema from "./schema.json";
import Ajv from "ajv";

interface Gist {
  files: Record<string, { content: string }>;
}

interface Build {
  owner: string;
  repo: string;
  ref: string;
}

interface DashboardConfig {
  name: string;
  builds: Build[];
}

const CommitStatusQuery = `query ($owner: String!, $repo: String!, $ref: String!) {
  repository(owner: $owner, name: $repo) {
    object(expression: $ref) {
      ... on Commit {
        statusCheckRollup {
          state
        }
        messageHeadline
        pushedDate
        url
      }
    }
  }
}`;

type CommitStatusResponse = {
  data: {
    repository: {
      object: {
        statusCheckRollup: {
          state: "ERROR" | "EXPECTED" | "FAILURE" | "PENDING" | "SUCCESS";
        };
        messageHeadline: string;
        pushedDate: string;
        url: string;
      };
    };
  };
};

type BuildStatusProps = {
  build: Build;
};

function BuildStatus({ build }: BuildStatusProps) {
  const [githubToken] = useGithubToken();
  const fetcher = async (build: Build) => {
    const res = await axios.post<CommitStatusResponse>(
      "https://api.github.com/graphql",
      {
        query: CommitStatusQuery,
        variables: build,
      },
      { headers: { authorization: `bearer ${githubToken}` } }
    );
    return res.data.data.repository.object;
  };
  const { data } = useSWR(githubToken && build, fetcher);

  if (!data) {
    return <></>;
  }

  const statusColors = {
    ERROR: "bg-orange-600",
    EXPECTED: "bg-gray-600",
    FAILURE: "bg-red-600",
    PENDING: "bg-lime-400 animate-pulse",
    SUCCESS: "bg-green-600",
  };

  return (
    <a href={data.url} target="_blank" rel="noreferrer">
      <div
        className={`${
          statusColors[data.statusCheckRollup.state]
        } rounded-md h-40 flex flex-col justify-between items-center p-3 text-white font-mono`}
      >
        <div>{`${build.owner}/${build.repo}`}</div>
        <div className="w-full truncate text-center">
          {data.messageHeadline}
        </div>
        <div>
          <TimeAgo date={Date.parse(data.pushedDate)} />
        </div>
      </div>
    </a>
  );
}

export default function Dashboard() {
  const [githubToken] = useGithubToken();
  const { gistId } = useParams();

  const fetcher = async (url: string) => {
    const res = await axios.get(url, {
      headers: {
        authorization: `Bearer ${githubToken}`,
      },
    });
    return res.data;
  };
  const { data, error } = useSWR<Gist>(
    `https://api.github.com/gists/${gistId}`,
    fetcher,
    {
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        if (error.response && error.response.status === 404) {
          return;
        }
        setTimeout(() => revalidate({ retryCount }), config.errorRetryInterval);
      },
    }
  );

  if (error && error.response && error.response.status === 404) {
    return (
      <Layout title="Error">
        <p>Could not find a gist with ID {gistId}</p>
      </Layout>
    );
  }

  if (!data) {
    return <Layout title="Loading..." />;
  }

  if (!data.files["dashboard.json"]) {
    return (
      <Layout title="Error">
        <p>
          The gist should contain a file called <code>dashboard.json</code>.
        </p>
      </Layout>
    );
  }

  const ajv = new Ajv();
  const validate = ajv.compile(dashboardSchema);
  const dashboard: DashboardConfig = JSON.parse(
    data.files["dashboard.json"].content
  );
  const valid = validate(dashboard);
  if (!valid) {
    return (
      <Layout title="Error">
        <p>
          Content of <code>dashboard.json</code> is invalid.
        </p>
        <pre>{JSON.stringify(validate.errors, null, 2)}</pre>
      </Layout>
    );
  }

  const title = dashboard.name || "Unnamed dashboard";
  return (
    <Layout title={title}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {dashboard &&
          dashboard.builds.map((params) => (
            <BuildStatus key={Object.values(params).join("/")} build={params} />
          ))}
      </div>
    </Layout>
  );
}
