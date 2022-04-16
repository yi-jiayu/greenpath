import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { RecoilRoot } from "recoil";
import Settings from "./Settings";
import GithubOauthCallback from "./GithubOauthCallback";
import Home from "./Home";

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
        </Routes>
      </BrowserRouter>
    </RecoilRoot>
  );
}

export default App;
