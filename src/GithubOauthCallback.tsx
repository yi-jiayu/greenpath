import { useNavigate, useSearchParams } from "react-router-dom";
import { useGithubToken } from "./github";
import React, { useEffect, useRef } from "react";
import axios from "axios";

interface AccessTokenResponse {
  access_token: string;
  scope: string;
}

export default function GithubOauthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [, setGithubToken] = useGithubToken();
  const semaphore = useRef(false);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      navigate("/settings");
    }
    if (!semaphore.current) {
      semaphore.current = true;
      axios
        .get<AccessTokenResponse>(
          `/.netlify/functions/access_token?code=${code}`
        )
        .then((res) => {
          semaphore.current = false;
          setGithubToken(res.data.access_token);
          navigate("/settings");
        });
    }
  }, [navigate, searchParams, setGithubToken]);

  return <></>;
}
