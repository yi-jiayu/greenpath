import { URL } from "url";
import { Handler } from "@netlify/functions";
import axios from "axios";

async function getAccessToken(code: string) {
  const u = new URL("https://github.com/login/oauth/access_token");
  u.searchParams.set("client_id", process.env.REACT_APP_GITHUB_CLIENT_ID!);
  u.searchParams.set("client_secret", process.env.GITHUB_CLIENT_SECRET!);
  u.searchParams.set("code", code);
  const res = await axios({
    method: "post",
    url: u.toString(),
    headers: {
      accept: "application/json",
    },
  });
  const data = res.data;
  if (data.hasOwnProperty("error")) {
    throw data;
  }
  return data;
}

const handler: Handler = async (event, context) => {
  if (!event.queryStringParameters || !event.queryStringParameters.code) {
    return {
      statusCode: 400,
    };
  }
  const code = event.queryStringParameters.code;
  try {
    const token = await getAccessToken(code);
    return {
      statusCode: 200,
      body: JSON.stringify(token),
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify(e),
    };
  }
};

export { handler };
