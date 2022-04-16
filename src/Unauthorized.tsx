import Layout from "./Layout";
import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <Layout title="Unauthorized">
      <p>
        If you have not provided a GitHub access token, go to{" "}
        <Link
          to="/settings"
          className="font-medium text-blue-800 hover:underline"
        >
          Settings
        </Link>{" "}
        to configure one.
      </p>
    </Layout>
  );
}
