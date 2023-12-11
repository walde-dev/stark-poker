import { getSHA256Hash } from "boring-webcrypto-sha256";
import { PlayingCardT } from "./types";

export async function setStartingHand(
  deck: Array<PlayingCardT>
): Promise<Array<PlayingCardT>> {
  deck[0].owner = 3;
  deck[1].owner = 3;
  deck[2].owner = 1;
  deck[3].owner = 1;
  deck[4].owner = 2;
  deck[5].owner = 2;
  return deck;
}

export function getNextCardIndex(
  deck: Array<PlayingCardT>
): number | undefined {
  for (let i = 0; i < deck.length; i++) {
    if (deck[i].owner == 0) {
      return i;
    }
  }
  return undefined;
}
export async function hashStack(stack: Array<PlayingCardT>): Promise<string> {
  let hashString = "";
  for (let i = 0; i < stack.length; i++) {
    hashString += stack[i].card;
    hashString += stack[i].encryptedBy1;
    hashString += stack[i].encryptedBy2;
    hashString += stack[i].owner;
  }
  const hash = await getSHA256Hash(hashString);
  return hash;
}
