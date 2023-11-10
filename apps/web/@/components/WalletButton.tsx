"use client";

import { Button } from "./ui/button";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { Suspense } from "react";
import Avatar from "boring-avatars";
import { useAccount } from "wagmi";

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { open } = useWeb3Modal();

  if (isConnected && !!address) {
    return (
      <button onClick={() => open()}>
        <Suspense>
          <Avatar size={32} name={address} />
        </Suspense>
      </button>
    );
  }

  return <Button onClick={() => open()}>Connect Wallet</Button>;
}
