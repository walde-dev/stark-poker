"use client";

/* eslint-disable import/no-extraneous-dependencies -- sf*/

import { WalletButton } from "../@/components/WalletButton";
import { connect } from "starknetkit";

//GlobalContext for connection, provider and address

export default function Page(): JSX.Element {
  return (
    <main className="w-full h-full flex justify-center py-24">
      <div className="flex items-center flex-col">
        <h1 className="font-semibold text-7xl leading-snug text-center [text-wrap:balance] max-w-[2/3]">
          Fully on-chain Blackjack powered by{" "}
          <span className="bg-[#0C0C4F] text-[#E87880] px-6 py-1 rounded-2xl">
            Starknet
          </span>
        </h1>

        <h3 className="font-medium mt-10 text-3xl text-gray-400">
          Experience Unrivaled Security and Speed
        </h3>
        <WalletButton showAvatar={false} className="mt-10" />
      </div>
    </main>
  );
}
