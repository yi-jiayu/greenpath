import axios from "axios";
import useSWR from "swr";
import { useGithubToken } from "./github";
import Layout from "./Layout";
import { useParams } from "react-router-dom";
import TimeAgo from "react-timeago";
import dashboardSchema from "./schema.json";
import Ajv from "ajv";
import Unauthorized from "./Unauthorized";

const ajv = new Ajv();
const dashboardSchemaValidator = ajv.compile(dashboardSchema);

interface Gist {
  files: Record<string, { content: string }>;
}

interface Build {
  owner: string;
  repo: string;
  ref: string;
  include_prs: boolean;
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

const PullRequestsStatusesQuery = `query ($owner: String!, $repo: String!, $ref: String!) {
  repository(owner: $owner, name: $repo) {
    pullRequests(
      baseRefName: $ref
      first: 10
      states: OPEN
      orderBy: {field: UPDATED_AT, direction: DESC}
    ) {
      edges {
        node {
          id
          commits(last: 1) {
            nodes {
              commit {
                pushedDate
                statusCheckRollup {
                  state
                }
              }
            }
          }
          url
          title
          number
        }
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

type PullRequestStatusesResponse = {
  data: {
    repository: {
      pullRequests: {
        edges: Array<{
          node: {
            id: string;
            commits: {
              nodes: [
                {
                  commit: {
                    pushedDate: string;
                    statusCheckRollup: {
                      state:
                        | "ERROR"
                        | "EXPECTED"
                        | "FAILURE"
                        | "PENDING"
                        | "SUCCESS";
                    };
                  };
                }
              ];
            };
            url: string;
            title: string;
            number: number;
          };
        }>;
      };
    };
  };
};

type BuildStatusProps = {
  build: Build;
};

function BuildStatus({ build }: BuildStatusProps) {
  const [githubToken] = useGithubToken();
  const fetcher = async (query: string, build: Build) => {
    const res = await axios.post<CommitStatusResponse>(
      "https://api.github.com/graphql",
      {
        query,
        variables: build,
      },
      { headers: { authorization: `bearer ${githubToken}` } }
    );
    return res.data.data.repository.object;
  };
  const { data } = useSWR(githubToken && [CommitStatusQuery, build], fetcher);

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
          <TimeAgo date={new Date(data.pushedDate)} />
        </div>
      </div>
    </a>
  );
}

function PullRequestsStatuses({ build }: BuildStatusProps) {
  const [githubToken] = useGithubToken();
  const fetcher = async (query: string, build: Build) => {
    const res = await axios.post(
      "https://api.github.com/graphql",
      {
        query,
        variables: build,
      },
      { headers: { authorization: `bearer ${githubToken}` } }
    );
    return res.data;
  };
  const { data } = useSWR<PullRequestStatusesResponse>(
    githubToken && [PullRequestsStatusesQuery, build],
    fetcher
  );

  if (!data) {
    return <></>;
  }

  const pullRequests = data.data.repository.pullRequests.edges.map(
    (pr) => pr.node
  );

  const statusColors = {
    ERROR: "bg-orange-600",
    EXPECTED: "bg-gray-600",
    FAILURE: "bg-red-600",
    PENDING: "bg-lime-400 animate-pulse",
    SUCCESS: "bg-green-600",
    undefined: "bg-gray-400",
  };

  return (
    <>
      {pullRequests.map((pr) => (
        <a key={pr.id} href={pr.url} target="_blank" rel="noreferrer">
          <div
            className={`${
              statusColors[pr.commits.nodes[0].commit.statusCheckRollup?.state]
            } rounded-md h-40 flex flex-col justify-between items-center p-3 text-white font-mono`}
          >
            <div>
              {`${build.owner}/${build.repo}`} (#{pr.number})
            </div>
            <div className="w-full truncate text-center">{pr.title}</div>
            <div>
              <TimeAgo date={new Date(pr.commits.nodes[0].commit.pushedDate)} />
            </div>
          </div>
        </a>
      ))}
    </>
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
    fetcher
  );

  if (error && error.response && error.response.status === 404) {
    return (
      <Layout title="Error">
        <p>Could not find a gist with ID {gistId}</p>
      </Layout>
    );
  }

  if (error && error.response && error.response.status === 401) {
    return <Unauthorized />;
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

  const content = data.files["dashboard.json"].content;
  let dashboard: DashboardConfig;
  try {
    dashboard = JSON.parse(content);
  } catch (e) {
    return (
      <Layout title="Error">
        <p>Error while parsing dashboard config:</p>
        <pre className="p-2 bg-gray-200 rounded-md">{String(e)}</pre>
        <p>
          Content of <code>dashboard.json:</code>
        </p>
        <pre className="p-2 bg-gray-200 rounded-md">{content}</pre>
      </Layout>
    );
  }
  const valid = dashboardSchemaValidator(dashboard);
  if (!valid) {
    return (
      <Layout title="Error">
        <p>
          Content of <code>dashboard.json</code> is invalid:
        </p>
        <pre>{JSON.stringify(dashboardSchemaValidator.errors, null, 2)}</pre>
        <p>
          Content of <code>dashboard.json:</code>
        </p>
        <pre className="p-2 bg-gray-200 rounded-md">{content}</pre>
      </Layout>
    );
  }

  const title = dashboard.name || "Unnamed dashboard";
  const pullRequests = dashboard
    ? dashboard.builds
        .filter((build) => build.include_prs)
        .map((params) => (
          <PullRequestsStatuses
            key={Object.values(params).join("/")}
            build={params}
          />
        ))
    : [];
  return (
    <Layout title={title}>
      <div>
        <h2 className="font-medium text-2xl mb-2">Builds</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {dashboard &&
            dashboard.builds.map((params) => (
              <BuildStatus
                key={Object.values(params).join("/")}
                build={params}
              />
            ))}
        </div>
      </div>
      {pullRequests.length > 0 && (
        <div>
          <h2 className="font-medium text-2xl mb-2">Open pull requests</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pullRequests}
          </div>
        </div>
      )}{" "}
    </Layout>
  );
}
