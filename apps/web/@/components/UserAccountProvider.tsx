/* eslint-disable unicorn/filename-case -- fdf*/
/* eslint-disable @typescript-eslint/no-floating-promises -- fdf */
/* eslint-disable import/no-extraneous-dependencies -- fdsf*/
/* eslint-disable @typescript-eslint/no-unsafe-assignment -- sfd*/
/* eslint-disable unicorn/filename-case -- fsdf */

"use client";

import { createContext, useEffect, useState } from "react";
import { connect, type StarknetWindowObject } from "starknetkit";

export const UserAccountContext = createContext<{
  connect: (() => Promise<void>) | null;
  address: string | null;
  provider: unknown;
  connection: StarknetWindowObject | null;
  setConnection: ((connection: StarknetWindowObject | null) => void) | null;
  setProvider: ((provider: unknown) => void) | null;
  setAddress: ((address: string | null) => void) | null;
}>({
  connect: null,
  address: null,
  provider: null,
  connection: null,
  setConnection: null,
  setProvider: null,
  setAddress: null,
});

export default function UserAccountProvider({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const [connection, setConnection] = useState<StarknetWindowObject | null>(
    null
  );
  const [provider, setProvider] = useState<unknown>(null);
  const [address, setAddress] = useState<null | string>(null);

  const connectToStarknet = async () => {
    const init = await connect();

    if (init && init.isConnected) {
      setConnection(init);
      setProvider(init.account);
      setAddress(init.selectedAddress);
    }
  };

  useEffect(() => {
    connectToStarknet();
  }, []);

  return (
    <UserAccountContext.Provider
      value={{
        connect: connectToStarknet,
        connection,
        provider,
        address,
        setConnection,
        setProvider,
        setAddress,
      }}
    >
      {children}
    </UserAccountContext.Provider>
  );
}
