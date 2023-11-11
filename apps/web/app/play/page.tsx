"use client";

import { useUsername } from "../../@/lib/useUsername";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../@/components/ui/dialog";
import { Button } from "../../@/components/ui/button";
import Avatar from "boring-avatars";
import { Input } from "../../@/components/ui/input";
import { useContext, useState } from "react";
import { useToast } from "../../@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../@/components/ui/card";
import Spinner from "../../@/components/ui/spinner";
import { UserAccountContext } from "../../@/components/UserAccountProvider";

type GameState = "start" | "searching" | "playing" | "end";

export default function Play() {
  const [gameState, setGameState] = useState<GameState>("start");

  // if (!isConnected || !address) {
  //   return (
  //     <main className="flex w-full h-full flex-col justify-center items-center">
  //       <h1 className="text-3xl w-full  text-center mt-12 font-semibold text-gray-200 [text-wrap:balance] max-w-[500px]">
  //         You need connect your wallet before joining a game
  //       </h1>
  //       {/* <WalletButton className=" mt-12" /> */}
  //     </main>
  //   );
  // }

  if (gameState === "searching") {
    return <SearchingState setGameState={setGameState} />;
  }

  return <StartState setGameState={setGameState} />;
}

function StartState({
  setGameState,
}: {
  setGameState: (state: GameState) => void;
}) {
  const account = useContext(UserAccountContext);

  const { username, handleUsernameChange } = useUsername({
    address: account.address ?? "",
  });

  const { toast } = useToast();

  const [usernameInput, setUsernameInput] = useState("");
  return (
    <main className="flex space-y-4 mx-auto max-w-[500px] justify-center items-center w-full h-full flex-col">
      <Dialog>
        <Card className="flex w-full flex-col">
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center space-x-4">
            <Avatar variant={"beam"} size={32} name={account.address ?? ""} />
            <div className="flex items-center">
              <span className="text-xl">{username}</span>
              <DialogTrigger>
                <Button variant={"link"}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                    />
                  </svg>
                </Button>
              </DialogTrigger>
            </div>
          </CardContent>
        </Card>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-gray-200">
              Set your username
            </DialogTitle>
            <DialogDescription>
              This is how you will be seen by other players and on the
              leaderboard
            </DialogDescription>
          </DialogHeader>
          <div className="flex mt-4 items-center  space-x-6">
            <Avatar name={account.address ?? ""} size={32} variant={"beam"} />
            <Input
              className="text-gray-200"
              id="username"
              onChange={(e) => {
                setUsernameInput(e.target.value);
              }}
              placeholder="Your username"
              value={usernameInput || username}
            />
            <DialogClose>
              <Button
                onClick={() => {
                  handleUsernameChange(usernameInput);
                  toast({
                    title: "Username changed",
                    description: "Your username has been changed",
                    status: "success",
                  });
                }}
              >
                Submit
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
      <Card className="flex w-full flex-col p-4">
        <span className="text-gray-400">
          Your available balance:{" "}
          <span className="text-white font-semibold">4.43k</span> STRK
        </span>
        <span></span>
      </Card>
      <Card className="w-full flex flex-col p-4">
        <span className="text-gray-400">Set your bid and start playing!</span>
        <div className="flex items-center w-full mt-4 space-x-4">
          <Input type={"number"} placeholder="Your Bet (in STRK)" />
          <Button
            onClick={() => {
              setGameState("searching");
            }}
            className="min-w-[25%] whitespace-nowrap"
          >
            Start
          </Button>
        </div>
        <div className="grid w-full mt-4 grid-cols-4 gap-x-2">
          <Button size={"sm"} variant={"outline"}>
            +1 STRK
          </Button>
          <Button size={"sm"} variant={"outline"}>
            +10 STRK
          </Button>
          <Button size={"sm"} variant={"outline"}>
            +100 STRK
          </Button>
          <Button size={"sm"} variant={"outline"}>
            +1k STRK
          </Button>
        </div>
      </Card>
    </main>
  );
}

function SearchingState({
  setGameState,
}: {
  setGameState: (state: GameState) => void;
}) {
  return (
    <main className="max-w-[500px] mx-auto mt-24">
      <Card className="flex w-full justify-center items-center flex-col p-4">
        <span className="text-2xl text-gray-400">
          You are currently in queue...
        </span>
        <Spinner className="mt-4" />
        <Button
          variant={"outline"}
          onClick={() => {
            setGameState("start");
          }}
          className="mt-4 min-w-[25%] whitespace-nowrap"
        >
          Cancel
        </Button>
      </Card>
    </main>
  );
}
