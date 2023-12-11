/* eslint-disable unicorn/filename-case -- fdf*/
/* eslint-disable @typescript-eslint/no-floating-promises -- fdf */
/* eslint-disable import/no-extraneous-dependencies -- fdsf*/
/* eslint-disable @typescript-eslint/no-unsafe-assignment -- sfd*/
/* eslint-disable unicorn/filename-case -- fsdf */

"use client";

import { createContext, useEffect, useState } from "react";
import { connect, type StarknetWindowObject } from "starknetkit";
import { contractAddress } from "../../app/play/contractInteractions";
import { Contract } from "starknet";

export type UserAccountContextType = {
  connect: (() => Promise<void>) | null;
  address: string | null;
  provider: any;
  contract: any;
  connection: StarknetWindowObject | null;
  lastBlockheight: number;
  setConnection: ((connection: StarknetWindowObject | null) => void) | null;
  setProvider: ((provider: unknown) => void) | null;
  setAddress: ((address: string | null) => void) | null;
  setLastBlockheight: ((blockheight: number) => void) | null;
};
export const UserAccountContext = createContext<UserAccountContextType>({
  connect: null,
  address: null,
  provider: null,
  lastBlockheight: 0,
  connection: null,
  setConnection: null,
  setProvider: null,
  setAddress: null,
  contract: null,
  setLastBlockheight: null,
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
  const [contract, setContract] = useState<null | any>(null);
  const [lastBlockheight, setLastBlockheight] = useState<number>(0);

  const connectToStarknet = async () => {
    const init = await connect();

    if (init && init.isConnected) {
      setConnection(init);
      setProvider(init.account);
      setAddress(init.selectedAddress);
      const { abi: testAbi } = await (init.account as any)?.getClassAt(
        contractAddress
      );

      const myTestContract = new Contract(
        testAbi,
        contractAddress,
        init.account
      );
      if (testAbi === undefined) {
        throw new Error("no abi.");
      }
      setContract(myTestContract);
      // alert("connected to contract");
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
        contract,
        lastBlockheight,
        setLastBlockheight,
        setConnection,
        setProvider,
        setAddress,
      }}
    >
      {children}
    </UserAccountContext.Provider>
  );
}
