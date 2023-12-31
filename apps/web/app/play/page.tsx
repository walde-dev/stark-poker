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
import { ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { useToast } from "../../@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../@/components/ui/card";
import Spinner from "../../@/components/ui/spinner";
import { UserAccountContext } from "../../@/components/UserAccountProvider";
import { WalletButton } from "../../@/components/WalletButton";
import Image from "next/image";
import {
  calculateScore,
  getCardByNumber,
  getRandomCard,
} from "../../@/lib/utils";
import { Contract, RpcProvider } from "starknet";

type GameState = "start" | "searching" | "playing" | "end";

export default function Play() {
  const [gameState, setGameState] = useState<GameState>("start");

  const account = useContext(UserAccountContext);

  if (Boolean(!account.connection) || Boolean(!account.address)) {
    return (
      <main className="flex w-full h-full flex-col justify-center items-center">
        <h1 className="text-3xl w-full  text-center mt-12 font-semibold text-gray-200 [text-wrap:balance] max-w-[500px]">
          You need connect your wallet before joining a game
        </h1>
        <WalletButton className=" mt-12" />
      </main>
    );
  }

  if (gameState === "searching") {
    return <SearchingState setGameState={setGameState} />;
  }

  if (gameState === "playing") {
    return <PlayingState setGameState={setGameState} />;
  }

  return <StartState setGameState={setGameState} />;
}

function StartState({
  setGameState,
}: {
  setGameState: (state: GameState) => void;
}) {
  const account = useContext(UserAccountContext);

  const [betInput, setBetInput] = useState(0);

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
          <Input
            type={"number"}
            id="bet"
            placeholder="Your Bet (in STRK)"
            value={betInput}
            onChange={(e) => {
              setBetInput(parseInt(e.target.value));
            }}
          />
          <Button
            onClick={() => {
              setGameState("searching");
              setTimeout(() => {
                setGameState("playing");
              }, 2000);
            }}
            className="min-w-[25%] whitespace-nowrap"
          >
            Start
          </Button>
        </div>
        <div className="grid w-full mt-4 grid-cols-4 gap-x-2">
          <Button
            onClick={() => setBetInput((prev) => prev + 1)}
            size={"sm"}
            variant={"outline"}
          >
            +1 STRK
          </Button>
          <Button
            onClick={() => setBetInput((prev) => prev + 10)}
            size={"sm"}
            variant={"outline"}
          >
            +10 STRK
          </Button>
          <Button
            onClick={() => setBetInput((prev) => prev + 100)}
            size={"sm"}
            variant={"outline"}
          >
            +100 STRK
          </Button>
          <Button
            onClick={() => setBetInput((prev) => prev + 1000)}
            size={"sm"}
            variant={"outline"}
          >
            +1k STRK
          </Button>
        </div>
      </Card>
      <span className="text-gray-400">
        <span className="text-white">2</span> online players right now
      </span>
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

function PlayingState({
  setGameState,
}: {
  setGameState: (state: GameState) => void;
}) {
  const [logEvents, setLogEvents] = useState<any>([]);

  return (
    <div className="grid grid-cols-3 gap-x-8 h-full">
      <Log logEvents={logEvents} />
      <main className="flex col-span-2 space-y-4 mx-auto justify-center items-center w-full h-full flex-col">
        <BlackJackTable setLogEvents={setLogEvents} />
      </main>
    </div>
  );
}

type CardWrapper = {
  card: number;
  encryptedBy1: number;
  encryptedBy2: number;
  owner: number;
};
function BlackJackTable({ setLogEvents }: { setLogEvents: any }) {
  const [gameState, setGameState] = useState<string>();
  const [handHouse, setHandHouse] = useState<Array<CardWrapper>>([]);
  const [handP1, setHandP1] = useState<Array<CardWrapper>>([]);
  const [handP2, setHandP2] = useState<Array<CardWrapper>>([]);

  const account = useContext(UserAccountContext);

  const providerRPC = new RpcProvider({
    nodeUrl:
      "https://starknet-goerli.infura.io/v3/2bd54ea6a60f49db925e37d3b0704529",
  });

  useEffect(() => {
    const testAddress =
      "0x06164fdbb2a54ebc79d84f5b817f763a8530c865274394308d211d4d919d7024";

    const init = async () => {
      console.log("INIT");

      // @ts-expect-error aas
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call -- aa
      const { abi: testAbi } = await account.provider.getClassAt(testAddress);

      const myTestContract = new Contract(
        testAbi,
        testAddress,
        account.provider as unknown as any
      );
      if (testAbi === undefined) {
        throw new Error("no abi.");
      }
      console.log("LOADING STATE");
      const state: Array<CardWrapper> =
        await myTestContract.readEncryptedCardStack();
      let handHouse: Array<CardWrapper> = [];
      let handP1: Array<CardWrapper> = [];
      let handP2: Array<CardWrapper> = [];
      for (let i = 0; i < state.length; i++) {
        console.log("STATE", state[i], i);
        if (state[i].owner == 3) {
          handHouse.push(state[i]);
        } else if (state[i].owner == 1) {
          handP1.push(state[i]);
        } else if (state[i].owner == 2) {
          handP2.push(state[i]);
        }
      }
      console.log("STATE LOADED", handHouse);
      setHandHouse(handHouse);
      setHandP1(handP1);
      setHandP2(handP2);
    };

    const getEvents = async () => {
      // for an Infura node on Testnet
      const lastBlock = await providerRPC.getBlock("latest");
      const eventsList = await providerRPC.getEvents({
        address: testAddress,
        from_block: { block_number: lastBlock.block_number - 9 },
        to_block: { block_number: lastBlock.block_number },
        keys: [[]],
        chunk_size: 10,
      });
      console.log(eventsList);
      setLogEvents(eventsList);
    };

    init();
    getEvents();

    const interval = setInterval(() => {
      getEvents();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex flex-col justify-between items-center">
      <PlayingHand
        player={"Dealer"}
        cards={handHouse.map((c) =>
          getCardByNumber(
            Boolean(c.encryptedBy1) || Boolean(c.encryptedBy2)
              ? 53
              : parseInt(c.card.toString())
          )
        )}
      />
      <Card className="p-4 flex flex-col gap-y-2">
        <span className="text-lg">Your Turn</span>
        <div className="grid grid-cols-2 gap-x-2 items-center">
          <Button>Hit</Button>
          <Button>Stand</Button>
        </div>
      </Card>
      <div className="w-full flex items-center justify-between">
        <PlayingHand
          player={"Player 1"}
          cards={handP1.map((c) =>
            getCardByNumber(
              Boolean(c.encryptedBy1) || Boolean(c.encryptedBy2)
                ? 53
                : parseInt(c.card.toString())
            )
          )}
        />
        <PlayingHand
          player={"Player 2"}
          cards={handP2.map((c) =>
            getCardByNumber(
              Boolean(c.encryptedBy1) || Boolean(c.encryptedBy2)
                ? 53
                : parseInt(c.card.toString())
            )
          )}
        />
      </div>
    </div>
  );
}

function PlayingHand({ player, cards }: { player: string; cards: string[] }) {
  const score = calculateScore({
    cards: cards
      .filter(
        (card) => !!card.split("_")[0] && card.split("_")[0] != "undefined"
      )
      .map((card) => card.split("_")[1] as CardValue),
  });

  const busted = score > 21;

  return (
    <Card className={`relative p-4 flex flex-col ${busted && "opacity-60"}`}>
      {busted && (
        <span className="text-3xl top-1/2 -translate-y-1/2 -translate-x-1/2 left-1/2 bg-black absolute p-4 rounded-lg border border-gray-800 opacity-100">
          Busted
        </span>
      )}
      <span className="text-lg">{player}</span>
      {Boolean(score) && !isNaN(score) && (
        <span className="text-gray-400">Total Score: {score}</span>
      )}{" "}
      <ul className="flex gap-x-2 mt-2">
        {cards.map((card) => {
          const face = card.split("_")[0];
          const value = card.split("_")[1];

          return (
            <li key={card}>
              <PlayingCard face={face as CardFace} value={value as CardValue} />
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export type CardFace = "clubs" | "diamonds" | "hearts" | "spades" | "undefined";
export type CardValue =
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "jack"
  | "queen"
  | "king"
  | "ace"
  | "undefined";

function PlayingCard({ face, value }: { face?: CardFace; value?: CardValue }) {
  if (!face || !value || face === "undefined" || value === "undefined") {
    return (
      <Image
        alt="playing_card"
        src={`/svg_playing_cards/backs/red.svg`}
        height={100}
        width={100}
      />
    );
  }
  return (
    <Image
      alt="playing_card"
      src={`/svg_playing_cards/fronts/${face}_${value}.svg`}
      height={100}
      width={100}
    />
  );
}

function Log({ logEvents }: { logEvents: any }) {
  const mock = [
    {
      key: "player1_joined",
      child: <span>Player 1 has joined the game</span>,
    },
    {
      key: "player2_joined",
      child: <span>Player 2 has joined the game</span>,
    },
    {
      key: "player2_msg_1",
      child: (
        <span>
          Player 2: <span className="text-white">hi there :D </span>
        </span>
      ),
    },
  ];

  const [log, setLog] = useState(mock);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.elements[0] as HTMLInputElement;
    const message = input.value;
    if (message) {
      setLog((prev) => [
        ...prev,
        {
          key: `player1_msg_${prev.length}`,
          child: (
            <span>
              Player 1: <span className="text-white">{message}</span>
            </span>
          ),
        },
      ]);
    }
    input.value = "";
  };

  useEffect(() => {
    const newEvents = logEvents.events?.map((event: any) => ({
      key: `event_${event.transaction_hash}`,
      child: (
        <span>
          [Block {event.block_number}] {event.transaction_hash.slice(0, 8)}...
        </span>
      ),
    }));
    if (!newEvents) return;
    console.log("LOL", logEvents.events);
    setLog((prev) => {
      const nonEvents = prev.filter(
        (logItem) => !logItem.key.includes("event")
      );
      return [...nonEvents, ...newEvents];
    });
  }, [logEvents]);

  return (
    <Card className="p-4 flex flex-col">
      <div className="h-full">
        <h1 className="text-xl">Game Log</h1>
        <hr className="border border-gray-900 my-2" />
        <ul className="flex flex-col gap-y-2">
          {log.map((logItem) => (
            <li key={logItem.key}>
              <LogItem text={logItem.child} />
            </li>
          ))}
        </ul>
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex  gap-x-2 w-full items-center"
      >
        <Input placeholder="Type a message..." />
        <Button type="submit" variant={"outline"}>
          Send
        </Button>
      </form>
    </Card>
  );
}

function LogItem({ text }: { text: ReactNode }) {
  const currentTime = useMemo(() => {
    return new Date().toLocaleTimeString();
  }, []);
  return (
    <span>
      <span className="text-gray-600">[{currentTime}]: </span>
      <span className="text-gray-400">{text}</span>
    </span>
  );
}
