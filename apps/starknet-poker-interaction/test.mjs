import { Account, Provider, constants } from "starknet";
import { Contract, json } from "starknet";
import fs from "fs";
import { cryptAll, decrypt, encrypt } from "./encrypt.mjs";

const provider = new Provider({
  sequencer: { network: constants.NetworkName.SN_GOERLI },
}); // for testnet

// const provider = new Provider({
//   rpc: {
//     nodeUrl:
//       "https://starknet-goerli.infura.io/v3/2bd54ea6a60f49db925e37d3b0704529",
//   },
// });

const key1 = 23;
const key2 = 19;

const privateKey =
  "0x053fdf19e5f3aab906fa24246905a5b1f768f2d1be4d918b6f504d3f319db102";
const accountAddress =
  "0x04267aF1cdb394c1a777831848cB733a9b731C8a65F54A70BCF3CeF8C78DC99D";

const privateKey2 =
  "0x0582514ce7bc5ab496ab6c4a93914d0db248a189383edfe8a211811c0fa436cb";
const accountAddress2 =
  "0x05D7bB4b75167a4d0018ab6C76272492Eb5B764a6E926f20646Ac3121807b454";

// initialize deployed contract
const testAddress =
  "0x0615ef248710b081673fee9c4f398154a61379d1cee2daaabc2114f0c1f8568e";

const { abi: testAbi } = await provider.getClassAt(testAddress);
if (testAbi === undefined) {
  throw new Error("no abi.");
}
const account = new Account(provider, accountAddress, privateKey, "1");
const account2 = new Account(provider, accountAddress2, privateKey2, "1");
const myTestContract = new Contract(testAbi, testAddress, provider);
const myTestContract2 = new Contract(testAbi, testAddress, provider);
myTestContract.connect(account);
myTestContract2.connect(account2);

async function test() {
  console.log("account: ", account);

  const compiledContract = json.parse(
    fs.readFileSync("./contractabi.json").toString("ascii")
  );

  console.log("testAbi: ", testAbi);
  const init = true;
  const reencrypt = true;
  const setupGame = true;
  const solve = true;
  // // Interaction with the contract with call
  if (init) {
    const shuffle = await myTestContract.initStack();
    console.log("shuffle: ", shuffle);
    const rec = await provider.waitForTransaction(shuffle.transaction_hash);
    console.log("shuffle: ", shuffle, rec);
    await sleep(1000);
    const cards = await myTestContract.readCardStack();
    console.log("cards: ", cards.length);
    validateCardSet(cards);
    // //1. p1 encrypt and shuffle
    const shuffleCards = cards.sort(() => 0.5 - Math.random());
    const encryptedCards = shuffleCards.map((card) => encrypt(card.card, key1));
    console.log("encryptedCards: ", encryptedCards);
    const preparedCards = myTestContract.populate("setEncryptedCards", [
      1,
      encryptedCards,
    ]);
    console.log("preparedCards: ", preparedCards);
    // //2. p1 set to contract
    const encCards = await myTestContract.setEncryptedCards(1, encryptedCards);
    console.log("encCards: ", encCards);
    await provider.waitForTransaction(encCards.transaction_hash);
    await sleep(1000);
  }
  if (reencrypt) {
    // // 3. p2 shuffle and encrypt N-2
    myTestContract.connect(account2);

    const p2_cards = await myTestContract2.readEncryptedCardStack();

    validateCardSet(p2_cards);
    console.log("p2_cards: ", p2_cards.length, p2_cards[0]);
    const shuffleCards2 = p2_cards
      .map((card) => card.card)
      .sort(() => 0.5 - Math.random());
    // const finalCards = [
    //   shuffleCards2[0],
    //   shuffleCards2[1],
    //   ...encryptedCards(shuffleCards2.slice(2)),
    // ];
    //4. p2 set to contract
    const encCards2 = await myTestContract2.setEncryptedCards(
      2,
      cryptAll(shuffleCards2, key2)
    );
    const resE2 = await provider.waitForTransaction(encCards2.transaction_hash);
    console.log("encCards2: ", encCards2, encCards2[0]);
  }
  // // reset the cards (can be avoided later)
  let cardStack = await myTestContract2.readEncryptedCardStack();
  console.log("cardStack Before setup: ", cardStack.length, cardStack[0]);

  if (setupGame) {
    //5. p2 decrypt first 2 cards
    await decryptCard(myTestContract2, provider, 2, 0, key2, cardStack);
    await decryptCard(myTestContract2, provider, 2, 1, key2, cardStack);

    //6. p1 decrypt first 2 cards
    await decryptCard(myTestContract, provider, 1, 0, key1, cardStack);
    await decryptCard(myTestContract, provider, 1, 1, key1, cardStack);
    //the bank has been revealed

    //7. p2 decrypt next 2 cards (hand player 1)
    await decryptCard(myTestContract2, provider, 2, 2, key2, cardStack);
    await decryptCard(myTestContract2, provider, 2, 3, key2, cardStack);

    //8. p1 decrypt next 2 cards (hand player 2)

    await decryptCard(myTestContract, provider, 1, 4, key1, cardStack);
    await decryptCard(myTestContract, provider, 1, 5, key1, cardStack);
    // Initial Gamestate Reached
  }
  //add hame logic

  // end game

  if (solve) {
    cardStack = await myTestContract.readEncryptedCardStack();
    console.log("cardStack BEFORE SOLVE: ", cardStack.length, cardStack[0]);

    validateCardSet(cardStack);

    //p1 decrypt where needed
    const fullDec1 = cardStack.map((card) => {
      if (card.encryptedBy1 === 1) {
        return decrypt(card.card, key1);
      } else {
        return card.card;
      }
    });

    console.log("Decrypting as player 1", fullDec1.length, cardStack.length);
    const decryptStep1 = await myTestContract.decryptAll(1, fullDec1);
    await provider.waitForTransaction(decryptStep1.transaction_hash);
    await sleep(1000);
    //p2 decrypt where needed

    cardStack = await myTestContract2.readEncryptedCardStack();
    console.log("cardStack eg: ", cardStack[5]);

    const fullDec2 = cardStack.map((card) => {
      if (card.encryptedBy2 === 1) {
        return decrypt(card.card, key2);
      } else {
        return card.card;
      }
    });
    console.log("FinalDec", fullDec2.length, fullDec2);

    console.log("Decrypting as player 2", fullDec2.length);
    const decryptStep2 = await myTestContract.decryptAll(2, fullDec2);
    await provider.waitForTransaction(decryptStep2.transaction_hash);
    sleep(1000);

    cardStack = await myTestContract2.readEncryptedCardStack();
    console.log(
      "cardStack eg: ",
      cardStack.length,
      cardStack.map((card) => parseInt(card.card)).sort()
    );

    const subKey = await myTestContract.submitKey(1, key1);
    const subKey2 = await myTestContract2.submitKey(2, key2);
  }
}

async function reset() {
  const reset = await myTestContract.reset();
  await provider.waitForTransaction(reset.transaction_hash);
  console.log("RESET: ", reset);
}

test();

// reset();

async function decryptCard(contract, provider, playerId, cardId, key, cards) {
  console.log(
    "decrypting card",
    cardId,
    "for player",
    playerId,
    "with key",
    key
  );
  const card = cards[cardId];
  const cardValue = card.card;
  const decrypted = decrypt(cardValue, key);
  console.log("  value", cardValue, "decrypted", decrypted);

  let ta = await contract.setDecryptedCard(playerId, cardId, decrypted);
  await provider.waitForTransaction(ta.transaction_hash);

  console.log(
    "  DONE decrypting card",
    cardId,
    "for player",
    playerId,
    "with key",
    key
  );
  await sleep(1000);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function validateCardSet(cardSet) {
  const cardValues = cardSet.map((card) => card.card);
  if (!cardValues.length == 52) {
    throw new Error("card set is invalidly long" + cardValues.length);
  }
  const allCards = cardSet.map((card) => {
    return decryptAlways(card);
  });
  const sortedValues = allCards.sort();

  const inOrder = sortedValues.every((value, index) => {
    return value === index + 1;
  });
  if (!inOrder) {
    throw new Error(
      "card set is not in order" + sortedValues + "TYPE" + typeof sortedValues
    );
  }

  console.log("VALIDATION COMPLETE", sortedValues);
  return true;
}

function decryptAlways(card) {
  const val = card.card;
  if (card.encryptedBy1 === 1) {
    val = decrypt(val, key1);
  }
  if (card.encryptedBy2 === 1) {
    val = decrypt(val, key2);
  }
  return parseInt(val.toString());
}
