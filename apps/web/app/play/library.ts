import { PlayerDetailsT, PlayingCardT } from "./types";

export async function decryptCardLocal(card, key, playerId) {
  let cardValue = card.card;

  if (playerId == 1 && card.encryptedBy1 == 1) {
    cardValue = decrypt(cardValue, key);
  } else if (playerId == 2 && card.encryptedBy2 == 1) {
    cardValue = decrypt(cardValue, key);
  } else {
    throw Error("card not encrypted for player" + card.toString() + playerId);
  }
  console.log("  value", card.card, "decrypted", cardValue);
  return {
    card: cardValue,
    encryptedBy1: playerId == 1 ? 0 : card.encryptedBy1,
    encryptedBy2: playerId == 2 ? 0 : card.encryptedBy2,
    owner: card.owner,
  };
}
export async function encryptCardLocal(card, key, playerId) {
  let cardValue = card.card;

  if (playerId == 1 && card.encryptedBy1 == 0) {
    cardValue = encrypt(cardValue, key);
  } else if (playerId == 2 && card.encryptedBy2 == 0) {
    cardValue = encrypt(cardValue, key);
  } else {
    throw Error("card not decrypted for player" + card.toString() + playerId);
  }
  console.log("  value", card.card, "decrypted", cardValue);
  return {
    card: cardValue,
    encryptedBy1: playerId == 1 ? 1 : card.encryptedBy1,
    encryptedBy2: playerId == 2 ? 1 : card.encryptedBy2,
    owner: card.owner,
  };
}
export function encrypt(number, key) {
  return Number.parseInt(number) ^ key;
}
export function decrypt(number, key) {
  return Number.parseInt(number) ^ key;
}
async function decryptCardsLocal(ids, key, playerId, stack) {
  await Promise.all(
    ids.map(async (id) => {
      stack[id] = await decryptCardLocal(stack[id], key, playerId);
    })
  );
  return stack;
}
export async function decryptCards(
  ids: number[],
  playerDetails: PlayerDetailsT,
  stack: Array<PlayingCardT>
): Promise<Array<PlayingCardT>> {
  console.log("decrypting cards", ids);
  return await decryptCardsLocal(
    ids,
    playerDetails.key,
    playerDetails.playerId,
    stack
  );
}
export async function encryptCardsLocal(
  ids: number[] | boolean,
  key: number,
  playerId: number,
  stack: Array<PlayingCardT>
): Promise<Array<PlayingCardT>> {
  if (ids == true || ids == false) {
    console.log("encrypting all cards");
    stack = await Promise.all(
      stack.map(async (card) => await encryptCardLocal(card, key, playerId))
    );
  } else {
    await Promise.all(
      ids.map(async (id) => {
        stack[id] = await encryptCardLocal(stack[id], key, playerId);
      })
    );
  }
  return stack;
}

export async function encryptCardStack(
  stack: Array<PlayingCardT>,
  playerDetails: PlayerDetailsT
): Promise<Array<PlayingCardT>> {
  return await encryptCardsLocal(
    false,
    playerDetails.key,
    playerDetails.playerId,
    stack
  );
}

export async function decryptCardIfPossible(
  card: PlayingCardT,
  playerDetails: PlayerDetailsT
): Promise<PlayingCardT> {
  if (encryptedByPlayer(card, playerDetails.playerId)) {
    return await decryptCardLocal(
      card,
      playerDetails.key,
      playerDetails.playerId
    );
  } else {
    return card;
  }
}

function encryptedByPlayer(card, playerId) {
  if (card.encryptedBy1 == 1 && playerId == 1) {
    return true;
  }
  if (card.encryptedBy2 == 1 && playerId == 2) {
    return true;
  }
  return false;
}
