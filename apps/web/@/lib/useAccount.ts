/* eslint-disable unicorn/filename-case -- fdsf */
/* eslint-disable import/no-extraneous-dependencies -- fd */
"use client";

import { useEffect, useState } from "react";
import type { StarknetWindowObject } from "starknetkit";
import { connect, disconnect } from "starknetkit";

export default function useAccount() {
  const [connection, setConnection] = useState<StarknetWindowObject | null>(
    localStorage.getItem("connection") as unknown as StarknetWindowObject
  );
  const [provider, setProvider] = useState<unknown>(
    localStorage.getItem("provider")
  );
  const [address, setAddress] = useState<null | string>(
    localStorage.getItem("address")
  );

  const connectToStarknet = async () => {
    const init = await connect();

    if (init && init.isConnected) {
      setConnection(init);
      setProvider(init.account);
      setAddress(init.selectedAddress);
    }
  };

  //write data in localstorage
  useEffect(() => {
    if (address) {
      localStorage.setItem("address", address);
    }

    if (provider) {
      localStorage.setItem("provider", JSON.stringify(provider));
    }

    if (connection) {
      localStorage.setItem("connection", JSON.stringify(connection));
    }

    if (localStorage.getItem("address") !== address) {
      setAddress(localStorage.getItem("address"));
    }

    if (localStorage.getItem("provider") !== provider) {
      setProvider(localStorage.getItem("provider"));
    }

    if (localStorage.getItem("connection") !== connection) {
      setConnection(
        localStorage.getItem("connection") as unknown as StarknetWindowObject
      );
    }
  }, [address, provider, connection, localStorage]);

  return {
    disconnect,
    connect: connectToStarknet,
    connection,
    provider,
    address,
    setConnection,
    setAddress,
    setProvider,
  };
}
