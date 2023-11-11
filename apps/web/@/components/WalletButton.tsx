/* eslint-disable unicorn/filename-case -- fdsf */
/* eslint-disable @typescript-eslint/no-floating-promises -- dfdf */
/* eslint-disable @typescript-eslint/no-unsafe-return -- fdf*/
/* eslint-disable no-console -- sdf*/
/* eslint-disable @typescript-eslint/no-unused-vars -- fsd */
/* eslint-disable import/no-extraneous-dependencies -- fdf */
/* eslint-disable @typescript-eslint/no-misused-promises -- fsdf */
"use client";

import { Button } from "./ui/button";
import { Suspense, useContext } from "react";
import Avatar from "boring-avatars";
import Link from "next/link";
import useAccount from "../lib/useAccount";
import { UserAccountContext } from "./UserAccountProvider";
import { connect, disconnect } from "starknetkit";

export function WalletButton({
  className,
  showAvatar = true,
}: {
  className?: string;
  showAvatar?: boolean;
}) {
  const account = useContext(UserAccountContext);

  const disconnectWallet = async () => {
    await disconnect();

    account.setConnection?.(null);
    account.setProvider?.(undefined);
    account.setAddress?.("");
  };

  if (Boolean(account.connection) && showAvatar && Boolean(account.address)) {
    return (
      <button onClick={() => disconnectWallet()}>
        <Suspense>
          <Avatar name={account.address ?? ""} size={32} variant="beam" />
        </Suspense>
      </button>
    );
  }

  if (Boolean(account.connection) && !showAvatar) {
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
