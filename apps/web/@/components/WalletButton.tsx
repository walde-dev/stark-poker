/* eslint-disable unicorn/filename-case -- fdsf */
/* eslint-disable @typescript-eslint/no-unused-vars -- fsd */
/* eslint-disable import/no-extraneous-dependencies -- fdf */
/* eslint-disable @typescript-eslint/no-misused-promises -- fsdf */
"use client";

import { Button } from "./ui/button";
import { Suspense } from "react";
import Avatar from "boring-avatars";
import Link from "next/link";
import useAccount from "../lib/useAccount";

export function WalletButton({
  className,
  showAvatar = true,
}: {
  className?: string;
  showAvatar?: boolean;
}) {
  const {
    address,
    connection,
    provider,
    setAddress,
    setConnection,
    setProvider,
    connect,
  } = useAccount();

  if (Boolean(connection) && showAvatar && Boolean(address)) {
    return (
      <button onClick={() => open()}>
        <Suspense>
          <Avatar name={address ?? ""} size={32} variant="beam" />
        </Suspense>
      </button>
    );
  }

  if (Boolean(connection) && !showAvatar) {
    return (
      <Button className={className}>
        <Link href="/play">Start playing</Link>
      </Button>
    );
  }

  return (
    <Button className={className} onClick={() => connect()}>
      Connect Wallet
    </Button>
  );
}
