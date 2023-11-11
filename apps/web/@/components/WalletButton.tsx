"use client";

import { Button } from "./ui/button";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { Suspense } from "react";
import Avatar from "boring-avatars";
import { useAccount } from "wagmi";
import Link from "next/link";

export function WalletButton({
  className,
  showAvatar = true,
}: {
  className?: string;
  showAvatar?: boolean;
}) {
  const { address, isConnected } = useAccount();
  const { open } = useWeb3Modal();

  if (isConnected && !!address && showAvatar) {
    return (
      <button onClick={() => open()}>
        <Suspense>
          <Avatar variant={"beam"} size={32} name={address} />
        </Suspense>
      </button>
    );
  }

  if (isConnected && !!address && !showAvatar) {
    return (
      <Button className={className}>
        <Link href="/play">Start playing</Link>
      </Button>
    );
  }

  return (
    <Button className={className} onClick={() => open()}>
      Connect Wallet
    </Button>
  );
}
