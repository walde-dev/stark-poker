import Link from "next/link";
import { Button } from "./button";
import { WalletButton } from "../WalletButton";

export function Header() {
  return (
    <header className="w-full flex items-center justify-between">
      <Link href="/">
        <h1 className="text-2xl shadow-md font-bold ">
          <span className="bg-gradient-to-r from-[#2700D7] via-[#790186] to-[#E2001E] text-transparent bg-clip-text">
            zk
          </span>{" "}
          <span>stark-poker</span>
        </h1>
      </Link>
      <div className="flex flex-row space-x-4 items-center">
        <Button variant={"link"}>
          <Link href={"/leaderboard"}>Leaderboard</Link>
        </Button>
        <Button variant={"link"}>Learn more</Button>
        <WalletButton showAvatar />
      </div>
    </header>
  );
}
