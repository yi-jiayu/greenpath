import axios from "axios";
import useSWR from "swr";
import { useGithubToken } from "./github";
import Layout from "./Layout";
import { useParams } from "react-router-dom";
import TimeAgo from "react-timeago";

interface Gist {
  description: string;
  files: Record<string, { content: string }>;
}

interface Build {
  owner: string;
  repo: string;
  ref: string;
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

  const fetcher = async (gistId: string) => {
    const res = await axios({
      method: "get",
      url: `https://api.github.com/gists/${gistId}`,
      headers: {
        authorization: `Bearer ${githubToken}`,
      },
    });
    return res.data;
  };
  const { data } = useSWR<Gist>(gistId, fetcher);
  let builds: Build[] = [];
  if (data && data.files["builds.json"]) {
    try {
      const parsed = JSON.parse(data.files["builds.json"].content);
      if (Array.isArray(parsed)) {
        for (let elem of parsed) {
          if (
            elem.hasOwnProperty("owner") &&
            typeof elem.owner === "string" &&
            elem.hasOwnProperty("repo") &&
            typeof elem.repo === "string" &&
            elem.hasOwnProperty("ref") &&
            typeof elem.ref === "string"
          ) {
            builds.push({ owner: elem.owner, repo: elem.repo, ref: elem.ref });
          }
        }
      }
    } catch {}
  }

  const title = data ? data.description || "Unnamed dashboard" : "Loading...";
  return (
    <Layout title={title}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {builds.map((params) => (
          <BuildStatus key={Object.values(params).join("/")} build={params} />
        ))}
      </div>
    </Layout>
  );
}
