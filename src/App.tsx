import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { RecoilRoot } from "recoil";
import Settings from "./Settings";
import GithubOauthCallback from "./GithubOauthCallback";
import Home from "./Home";
import Dashboard from "./Dashboard";

function App() {
  return (
    <RecoilRoot>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/oauth/github/callback"
            element={<GithubOauthCallback />}
          />
          <Route path="/settings" element={<Settings />} />
          <Route path="/gists/:gistId" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </RecoilRoot>
  );
}

export default App;
