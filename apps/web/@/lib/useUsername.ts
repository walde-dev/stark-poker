"use client";

import { useState } from "react";

export function useUsername({ address }: { address?: string }) {
  //write a hook that initializes a username if none is saved in localstorage that is mapped to the given address
  //if there is a username in localstorage, return that username

  //if there is no username in localstorage, prompt the user to enter a username

  const [username, setUsername] = useState(
    !!address ? localStorage.getItem(address) || "" : ""
  );

  const handleUsernameChange = (e: string) => {
    if (!address) return;
    setUsername(e);
    localStorage.setItem(address, e);
  };

  return { username, handleUsernameChange };
}
