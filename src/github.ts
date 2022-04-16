import { atom, AtomEffect, useRecoilState } from "recoil";

function localStorageEffect<T>(key: string, defaultValue: T): AtomEffect<T> {
  return ({ setSelf, onSet }) => {
    const savedValue = localStorage.getItem(key);
    if (savedValue != null) {
      try {
        setSelf(JSON.parse(savedValue));
      } catch {
        setSelf(defaultValue);
      }
    }

    onSet((newValue, _, isReset) => {
      isReset
        ? localStorage.removeItem(key)
        : localStorage.setItem(key, JSON.stringify(newValue));
    });
  };
}

const githubTokenState = atom<string>({
  key: "githubToken",
  default: "",
  effects: [localStorageEffect("greenpathGithubTokenV0", "")],
});

export const useGithubToken = () => useRecoilState(githubTokenState);
