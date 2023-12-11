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
import {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
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

import { DataConnection, Peer } from "peerjs";
import { TrialState } from "./test";
import {
  EventType,
  OpponentDetailsT,
  PlayerDetailsT,
  PlayingCardT,
} from "./types";
import { Log } from "./Log";
import { BlackJackTable } from "./gameDisplay";

export type GameState = "start" | "searching" | "playing" | "end" | "test";
interface GameContextI {
  dconn: DataConnection | undefined;
  cardState: Array<PlayingCardT>;
  playerDetails: PlayerDetailsT;
  opponentDetails: OpponentDetailsT | undefined;
  setDconn: (value: any) => void | undefined;
  setCardState: (value: SetStateAction<PlayingCardT[]>) => void | undefined;
  setPlayerDetails: (
    value: SetStateAction<{
      key: number;
      playerId: number;
    }>
  ) => void | undefined;
  setOpponentDetails: (
    value: SetStateAction<OpponentDetailsT>
  ) => void | undefined;
}

const initialState: GameContextI = {} as GameContextI;
export const GameContext = createContext(initialState);
export function useGame() {
  return useContext(GameContext);
}
const GameContextProvider = (props) => {
  const [gameState, setGameState] = useState(undefined);
  const [cardState, setCardState] = useState<Array<PlayingCardT>>([]);
  const [opponentDetails, setOpponentDetails] = useState<OpponentDetailsT>();
  const [playerDetails, setPlayerDetails] = useState({
    key: Math.round(Math.random() * 256),
    playerId: 0,
  });
  return (
    <GameContext.Provider
      value={{
        dconn: gameState,
        setDconn: setGameState,
        playerDetails: playerDetails,
        cardState: cardState,
        opponentDetails: opponentDetails,
        setOpponentDetails: setOpponentDetails,
        setCardState: setCardState,
        setPlayerDetails: setPlayerDetails,
      }}
    >
      {props.children}
    </GameContext.Provider>
  );
};
export default function Play() {
  const [gameState, setGameState] = useState<GameState>("playing");

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
    return (
      <GameContextProvider>
        <PlayingState setGameState={setGameState} />;
      </GameContextProvider>
    );
  }

  if (gameState === "test") {
    return <div>broken</div>;
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
  const [peer, setPeer] = useState<DataConnection>();

  useEffect(() => {}, []);

  const [usernameInput, setUsernameInput] = useState("");
  return (
    <main className="flex space-y-4 mx-auto max-w-[500px] justify-center items-center w-full h-full flex-col">
      <Dialog>
        <Card className="flex w-full flex-col">
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <Button
              onClick={() => {
                setGameState("test");
              }}
              variant={"link"}
            >
              enter tesmode
            </Button>
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
          <Button
            onClick={() => {
              // console.log("PEER", peer);
              // if (peer) {
              //   peer.send("Hello!");
              //   console.log("SENT");
              //   // peer?.getConnection("asddff",)?.send("Hello!");
              // }
              console.log("INIT PEER");
              const peer = new Peer("tpc");
              // var conn = peer.connect("asddff");
              peer.on("open", function () {
                console.log("Connected to peer");
              });
              peer.on("connection", function (dconn: DataConnection) {
                console.log("CONNECTED TO PEER", dconn);
                dconn.on("data", function (data) {
                  // Will print 'hi!'
                  console.log(data);
                });
                dconn.send("Hello!");
              });
              // conn.connect();
              // setPeer(conn);
            }}
          >
            Test
          </Button>
          <Button
            onClick={() => {
              // console.log("PEER", peer);
              // if (peer) {
              //   peer.send("Hello!");
              //   console.log("SENT");
              //   // peer?.getConnection("asddff",)?.send("Hello!");
              // }
              console.log("INIT PEER");
              const peer = new Peer("myself");
              peer.on("open", function (id) {
                console.log("Connected to peer", id);
                var conn = peer.connect("tpc");
                conn.on("open", function () {
                  console.log("Connected to peer");
                  conn.send("hi!");
                });
                conn.on("data", function (data) {
                  // Will print 'hi!'
                  console.log("GOT");
                  console.log(data);
                });
              });

              // conn.connect();
              // setPeer(conn);
            }}
          >
            Test Connect
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
  const [logEvents, setLogEvents] = useState<EventType[]>([]);

  function addLog(log: EventType) {
    console.log("LOG", log);
    setLogEvents((prev) => [...prev, log]);
  }
  return (
    <div className="grid grid-cols-3 gap-x-8 h-full">
      <Log logEvents={{ events: logEvents }} addToLog={addLog} />
      <main className="flex col-span-2 space-y-4 mx-auto justify-center items-center w-full h-full flex-col">
        {/* <BlackJackTable setLogEvents={setLogEvents} /> */}
        <TrialState setGameState={setGameState} addLog={addLog} />
        <BlackJackTable />
      </main>
    </div>
  );
}
