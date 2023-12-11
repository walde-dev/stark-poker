import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { CardValue } from "../../app/play/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateScoreFromNumbers({ cards }: { cards: number[] }) {
  return cards.reduce((acc, card) => acc + scoreOfCardNumber(card), 0);
}

export function scoreOfCardNumber(card: number) {
  const value = card % 13;
  if (value === 1) {
    return 11;
  } else if (value > 9) {
    return 10;
  } else {
    return value;
  }
}
export function isBusted({ cards }: { cards: number[] }) {
  return calculateScoreFromNumbers({ cards }) > 21;
}
export function calculateScore({ cards }: { cards: CardValue[] }) {
  //calculate the score by converting the value to an int, jack, king and queen are 10, ace is also 10 unless the score is over 21 then it is 1
  let score = 0;
  let aceCount = 0;
  for (const card of cards) {
    if (card === "ace") {
      aceCount++;
      score += 11;
    } else if (card === "jack" || card === "king" || card === "queen") {
      score += 10;
    } else {
      score += parseInt(card);
    }
  }
  while (score > 21 && aceCount > 0) {
    score -= 10;
    aceCount--;
  }
  return score;
}

export function getRandomCard() {
  return getCardByNumber(Math.floor(Math.random() * 52) + 1);
}

export function getCardByNumber(number: number) {
  const faces = ["clubs", "spades", "diamonds", "hearts"];
  const values = [
    "ace",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "jack",
    "queen",
    "king",
  ];
  //number can be 1-52
  const face = faces[Math.floor((number - 1) / 13)];
  const value = values[(number - 1) % 13];

  return `${face}_${value}`;
}
