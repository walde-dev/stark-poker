import { Contract, RpcProvider } from "starknet";
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
  ReactNode,
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
import { CardFace, CardValue, PlayingCardT } from "./types";
import { calculateScore, getCardByNumber } from "../../@/lib/utils";
import Image from "next/image";
import { useGame } from "./page";
import { decryptCardIfPossible } from "./library";

export function BlackJackTable() {
  const [gameState, setGameState] = useState<string>();
  const [handHouse, setHandHouse] = useState<Array<PlayingCardT>>([]);
  const [handP1, setHandP1] = useState<Array<PlayingCardT>>([]);
  const [handP2, setHandP2] = useState<Array<PlayingCardT>>([]);

  const gameContext = useGame();
  async function setHands(state: Array<PlayingCardT>) {
    let handHouse: Array<PlayingCardT> = [];
    let handP1: Array<PlayingCardT> = [];
    let handP2: Array<PlayingCardT> = [];

    for (let i = 0; i < state.length; i++) {
      // console.log("STATE", state[i], i);
      if (!state[i]) continue;
      if (state[i].owner == 3) {
        handHouse.push(state[i]);
      } else if (state[i].owner == 1) {
        if (gameContext.playerDetails.playerId == 1) {
          handP1.push(
            await decryptCardIfPossible(state[i], gameContext.playerDetails)
          );
        } else {
          handP1.push(state[i]);
        }
      } else if (state[i].owner == 2) {
        if (gameContext.playerDetails.playerId == 2) {
          handP2.push(
            await decryptCardIfPossible(state[i], gameContext.playerDetails)
          );
        } else {
          handP2.push(state[i]);
        }
      }
    }
    console.log("STATE LOADED", state);
    setHandHouse(handHouse);
    setHandP1(handP1);
    setHandP2(handP2);
  }
  useEffect(() => {
    const state: Array<PlayingCardT> = gameContext.cardState;
    console.log("RECOMPUTE GAME FIELD");
    setHands(state);
  }, [JSON.stringify(gameContext.cardState)]);
  console.log("LAST RENDER", gameContext.cardState);
  // console.log("rendering with", handHouse, handP1, handP2);
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
      {/* <Card className="p-4 flex flex-col gap-y-2">
        <span className="text-lg">Your Turn</span>
        <div className="grid grid-cols-2 gap-x-2 items-center">
          <Button>Hit</Button>
          <Button>Stand</Button>
        </div>
      </Card> */}
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
        {cards.map((card, i) => {
          const face = card.split("_")[0];
          const value = card.split("_")[1];
          // console.log("CARD", card, face, value, card + player + value + face);
          const key = i + player;
          return (
            <li key={key}>
              <PlayingCard
                face={face as CardFace}
                value={value as CardValue}
                key={key}
              />
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

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
