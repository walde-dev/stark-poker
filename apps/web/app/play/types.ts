import { type } from "os";
import { ReactNode } from "react";

export type EventType = {
  key: string;
  child: ReactNode;
};

export type PlayingCardT = {
  card: number;
  encryptedBy1: number;
  encryptedBy2: number;
  owner?: number;
};

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
export type PlayerDetailsT = { key: number; playerId: number };
export type OpponentDetailsT = { address: string; name: string | undefined };
