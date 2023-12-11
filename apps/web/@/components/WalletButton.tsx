/* eslint-disable unicorn/filename-case -- fdsf */
/* eslint-disable @typescript-eslint/no-floating-promises -- dfdf */
/* eslint-disable @typescript-eslint/no-unsafe-return -- fdf*/
/* eslint-disable no-console -- sdf*/
/* eslint-disable @typescript-eslint/no-unused-vars -- fsd */
/* eslint-disable import/no-extraneous-dependencies -- fdf */
/* eslint-disable @typescript-eslint/no-misused-promises -- fsdf */
"use client";

import { Button } from "./ui/button";
import { Suspense, useContext, useEffect, useState } from "react";
import Avatar from "boring-avatars";
import Link from "next/link";
import useAccount from "../lib/useAccount";
import { UserAccountContext } from "./UserAccountProvider";
import { connect, disconnect } from "starknetkit";
import { enterCasino, getFunds } from "../../app/play/contractInteractions";

export function WalletButton({
  className,
  showAvatar = true,
}: {
  className?: string;
  showAvatar?: boolean;
}) {
  const [funds, setFunds] = useState<number>(0);
  const account = useContext(UserAccountContext);
  useEffect(() => {
    if (account.contract) {
      getFunds(account).then((funds) => {
        setFunds(funds);
        console.log("fundsSET", funds);
      });
    }
  }, [account.contract, account.lastBlockheight]);
  const disconnectWallet = async () => {
    await disconnect();

    account.setConnection?.(null);
    account.setProvider?.(undefined);
    account.setAddress?.("");
  };

  if (Boolean(account.connection) && showAvatar && Boolean(account.address)) {
    return (
      <button type="button" onClick={() => disconnectWallet()}>
        <Suspense>
          <Avatar name={account.address ?? ""} size={32} variant="beam" />
        </Suspense>
      </button>
    );
  }

  if (Boolean(account.connection) && !showAvatar) {
    return (
      <div>
        <Button className={className}>
          <Link href="/play">Start playing</Link>
        </Button>
        <Button
          className={className}
          onClick={() =>
            enterCasino(account).then(() => {
              account.setLastBlockheight?.(account.lastBlockheight + 1);
            })
          }
          disabled={funds !== 0}
        >
          Enter Casino ({funds} chips)
        </Button>
        @{account.lastBlockheight}
      </div>
    );
  }

  return (
    <Button className={className} onClick={() => connect()}>
      Connect Wallet
    </Button>
  );
}
