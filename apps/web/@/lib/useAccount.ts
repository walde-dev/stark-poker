/* eslint-disable unicorn/filename-case -- fdsf */
/* eslint-disable import/no-extraneous-dependencies -- fd */
"use client";

import { useState } from "react";
import type { StarknetWindowObject } from "starknetkit";
import { connect } from "starknetkit";

export default function useAccount() {
  const [connection, setConnection] = useState<StarknetWindowObject | null>(
    null
  );
  const [provider, setProvider] = useState<unknown>(null);
  const [address, setAddress] = useState<null | string>("");

  const connectToStarknet = async () => {
    const init = await connect();

    if (init && init.isConnected) {
      setConnection(init);
      setProvider(init.account);
      setAddress(init.selectedAddress);
    }
  };

  return {
    connect: connectToStarknet,
    connection,
    provider,
    address,
    setConnection,
    setAddress,
    setProvider,
  };
}
