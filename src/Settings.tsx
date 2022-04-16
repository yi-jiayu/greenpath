import Layout from "./Layout";
import { useGithubToken } from "./github";

function githubSigninURL(scope?: string) {
  const u = new URL("https://github.com/login/oauth/authorize");
  u.searchParams.set("client_id", process.env.REACT_APP_GITHUB_CLIENT_ID!);
  if (scope) {
    u.searchParams.set("scope", scope);
  }
  return u.toString();
}

export default function Settings() {
  const [token, setToken] = useGithubToken();
  return (
    <Layout title="Settings">
      <div>
        <label
          htmlFor="token"
          className="block text-sm font-medium text-gray-700"
        >
          GitHub token
        </label>
        <div className="mt-1">
          <input
            type="text"
            name="token"
            id="token"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full max-w-sm sm:text-sm border-gray-300 rounded-md"
          />
        </div>
        <p className="mt-2 text-sm text-gray-500" id="token-description">
          Provide your own personal access token or sign in with GitHub below to
          automatically acquire an access token.
        </p>
      </div>
      <div className="flex gap-x-2 gap-y-2 flex-wrap">
        <a
          href={githubSigninURL()}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Sign in with GitHub
        </a>
        <a
          href={githubSigninURL("repo")}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Sign in with GitHub (include private repositories)
        </a>
      </div>
    </Layout>
  );
}
