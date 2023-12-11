import { Contract } from "starknet";
import { UserAccountContextType } from "../../@/components/UserAccountProvider";
import { PlayingCardT } from "./types";

export const contractAddress =
  "0x05199c90812801d8b14ad73a61bbab29046f712b9547954fda7fcb2afe76b008";

export async function enterCasino(account: UserAccountContextType) {
  console.log("setting up casino", account, typeof account.provider);

  console.log("Entering casino...");
  const enter = await account.contract.enterCasino();
  console.log("prewait", enter);
  await account.provider?.waitForTransaction(enter.transaction_hash);
  console.log("entered", enter);
  alert("entered" + JSON.stringify(enter));
}
export async function getFunds(account: UserAccountContextType) {
  console.log("setting up casino", account, typeof account.provider);

  const funds = await account.contract.readChips(account.address);
  console.log("funds", funds);
  return parseInt(funds.toString());
}

export async function setupGame(
  account: UserAccountContextType,
  opponent: string
) {
  const newGame = await account.contract.setNewGame(opponent, account.address);
  console.log("newGame", newGame);
  await account.provider?.waitForTransaction(newGame.transaction_hash);
  console.log("newGame", newGame);
  return newGame;
}

export async function submitHash(
  account: UserAccountContextType,
  opponent: string,
  host: string,
  hash: string,
  onWait?: (tx: any) => void
) {
  let toHash = hash;
  if (!toHash.startsWith("0x")) {
    toHash = "0x" + toHash;
  }
  if (toHash.length > 9) {
    toHash = toHash.slice(0, 9);
  }
  const submit = await account.contract.writeHash(opponent, host, toHash);
  console.log("submit", submit);
  if (onWait) onWait(submit.transaction_hash);
  await account.provider?.waitForTransaction(submit.transaction_hash);
  console.log("submit", submit);
  return submit;
}

export async function submitBet(
  account: UserAccountContextType,
  opponent: string,
  isHost: boolean,
  amount: number
) {
  const currentGame = await getCurrentGame(account, opponent, isHost);
  console.log("currentGame", currentGame);
  const submit = await account.contract.setBet(
    opponent,
    isHost ? account.address : opponent,
    currentGame[2],
    amount
  );
  console.log("submit", submit);
  await account.provider?.waitForTransaction(submit.transaction_hash);
  return true;
}

export async function getCurrentGame(
  account: UserAccountContextType,
  opponent: string,
  isHost: boolean
) {
  let currentGame;
  if (isHost) {
    currentGame = await account.contract.getCurrentGame(
      account.address,
      opponent,
      account.address
    );
  } else {
    currentGame = await account.contract.getCurrentGame(
      opponent,
      account.address,
      opponent
    );
  }
  return currentGame;
}

export async function submitFinalGamestate(
  account: UserAccountContextType,
  opponent: string,
  isHost: boolean,
  gameState: PlayingCardT[]
) {
  const currentGame = await getCurrentGame(account, opponent, isHost);
  const host = isHost ? account.address : opponent;
  console.log("currentGame", currentGame);
  const myCall = account.contract.populate("submitFinalGameState", [
    opponent,
    host,
    gameState,
  ]);

  const res = await account.contract.submitFinalGameState(myCall.calldata);
  console.log("submit", res);
  await account.provider?.waitForTransaction(res.transaction_hash);
  return true;
}

export async function submitAction(
  account: UserAccountContextType,
  opponent: string,
  isHost: boolean,
  action: number
) {
  try {
    const currentGame = await getCurrentGame(account, opponent, isHost);
    const host = isHost ? account.address : opponent;
    console.log("currentGame", currentGame);
    const myCall = account.contract.populate("submitAction", [
      opponent,
      host,
      action,
    ]);

    const res = await account.contract.submitAction(myCall.calldata);
    console.log("submit", res);
    await account.provider?.waitForTransaction(res.transaction_hash);
  } catch (e) {
    console.log("submitAction error", e);
    return false;
  }
  return true;
}

// export async function gameEx
// export async function initGame(account: UserAccountContextType) {
//   const { abi: testAbi } = await account.provider?.getClassAt(testAddress);

//   const myTestContract = new Contract(
//     testAbi,
//     testAddress,
//     account.provider as unknown as any
//   );
//   if (testAbi === undefined) {
//     throw new Error("no abi.");
//   }
//   console.log("Setting up game...");
//   //   const state: Array<CardWrapper> =
//   //     await myTestContract.readEncryptedCardStack();
// }
