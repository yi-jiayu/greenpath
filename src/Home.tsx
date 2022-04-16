import Layout from "./Layout";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [gistURL, setGistURL] = useState("");
  const navigate = useNavigate();
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (gistURL) {
      const match = gistURL.match("\\w+$");
      if (match) {
        const [gistID] = match;
        navigate(`/gists/${gistID}`);
      }
    }
    navigate(`gists/60dba3de0d23895023a125949ed18c63`);
  };

  return (
    <Layout title="Home">
      <div className="grid gap-y-2">
        <p>Load dashboard from GitHub Gist:</p>
        <form className="flex" onSubmit={handleSubmit}>
          <input
            type="text"
            value={gistURL}
            onChange={(event) => setGistURL(event.target.value)}
            placeholder="https://gist.github.com/yi-jiayu/60dba3de0d23895023a125949ed18c63"
            className="grow border-2 rounded-md"
          />
        </form>
      </div>
    </Layout>
  );
}
