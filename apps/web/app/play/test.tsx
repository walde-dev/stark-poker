import { useContext, useEffect, useRef, useState } from "react";
import { Button } from "../../@/components/ui/button";
import { GameState, useGame } from "./page";
import Peer, { DataConnection } from "peerjs";
import { Input } from "../../@/components/ui/input";
import { EventType, PlayerDetailsT, PlayingCardT } from "./types";
import { randomUUID } from "crypto";
import { getSHA256Hash } from "boring-webcrypto-sha256";
import {
  decryptCardIfPossible,
  decryptCards,
  encryptCardStack,
} from "./library";
import { getNextCardIndex, hashStack, setStartingHand } from "./gameLogic";
import { useEventListener } from "./eventListener";
import { UserAccountContext } from "../../@/components/UserAccountProvider";
import {
  setupGame,
  submitAction,
  submitBet,
  submitFinalGamestate,
  submitHash,
} from "./contractInteractions";
import { calculateScoreFromNumbers, isBusted } from "../../@/lib/utils";

type CommunicationState =
  | "initialE"
  | "reE"
  | "betting"
  | "solvingHands"
  | "playing1"
  | "playing2"
  | "end";
type ClientType = "server" | "client" | undefined;
export function TrialState({
  setGameState,
  addLog,
}: {
  setGameState: (state: GameState) => void;
  addLog: (log: EventType) => void;
}) {
  const [communicationState, setCommunicationState] =
    useState<CommunicationState>("initialE");
  const [usernameInput, setUsernameInput] = useState<string>();
  const [betAmount, setBetAmount] = useState(0);
  const [clientType, setClientType] = useState<ClientType>();
  const [dConn, setDConn] = useState<DataConnection>();
  const gameContext = useGame();
  const currentPid = communicationState === "playing1" ? 1 : 2;
  const account = useContext(UserAccountContext);
  // console.log("RERENDER WITH", gameContext);
  function addStringLog(log: string) {
    addLog({
      key: "event_" + getSHA256Hash(log),
      child: <div>{log}</div>,
    });
  }
  const ref = useRef();
  const handleEvent = (data) => {
    console.log("Event Handled", data);
    handlePotentialState((data.detail.data as any).toString()).then(
      (handled) => {
        if (!handled) {
          addStringLog("GOT: " + data.detail.data);
        } else {
          addStringLog("STATE RECEIVED");
        }
      }
    );
  };

  useEventListener("msgGotten", handleEvent, ref.current);
  /**
   *
   * @param state Functio to prefix with STATE
   * @param dConnLocal
   */
  async function sendState(
    state: Array<PlayingCardT>,
    dConnLocal?: DataConnection,
    note?: string
  ) {
    // addStringLog(`STATE SENT C:${clientType} S:${communicationState}`);
    if (!gameContext.opponentDetails?.address || !account.address) {
      alert("no opponent");
      return;
    }
    // await attemptHash(
    //   state,
    //   gameContext.opponentDetails.address,
    //   account.address,
    //   note
    // );
    console.log("SENDING STATE", state, dConn, dConnLocal);
    dConnLocal?.send("STATE" + JSON.stringify(state));
    if (!dConnLocal) {
      dConn?.send("STATE" + JSON.stringify(state));
    }
    gameContext.setCardState(state);
  }
  async function sendAction(
    action: "hit" | "stand",
    dConnLocal?: DataConnection
  ) {
    addStringLog(`preparing ACTION ${action} for chain`);
    if (!gameContext.opponentDetails?.address) {
      alert("no opponent");
      return false;
    }

    const success = await submitAction(
      account,
      gameContext.opponentDetails.address,
      clientType === "server",
      action === "hit" ? 1 : 2
    );
    if (!success) {
      addStringLog("ACTION submitting to chain FAILED");
      return false;
    }
    addStringLog(`ACTION SENT C:${clientType} S:${communicationState}`);
    console.log("SENDING ACTION", action, dConn, dConnLocal);
    dConnLocal?.send("ACTION" + action);
    if (!dConnLocal) {
      dConn?.send("ACTION" + action);
    }
    return true;
  }
  async function handlePotentialState(
    msg: string,
    params?: {
      specialDetails?: PlayerDetailsT;
      dConnLocal?: DataConnection;
    }
  ) {
    const details = params?.specialDetails ?? gameContext.playerDetails;
    const playerId = params?.specialDetails?.playerId ?? details.playerId;
    const comConn = params?.dConnLocal ?? dConn;
    if (msg.startsWith("STATE")) {
      console.log("STATE GAME", gameContext);
      const state = JSON.parse(msg.slice(5));
      gameContext.setCardState(state);
      addStringLog(`STATE RECEIVED C:${clientType} S:${communicationState}`);
      if (playerId === 2 && communicationState === "initialE") {
        setCommunicationState("reE");
        addStringLog("REENCRYPTING STATE");
        let encryptedState = await encryptCardStack(state, details);
        addStringLog("REENCRYPTED STATE");
        encryptedState = await setStartingHand(encryptedState);
        addStringLog("STARTING HAND SET");
        encryptedState = await decryptCards(
          [0, 1, 2, 3],
          details,
          encryptedState
        );
        console.log("Start STATE", encryptedState);
        sendState(encryptedState, comConn, "Initial Deck with Hands");
        setCommunicationState("solvingHands");
      }
      if (playerId === 1 && communicationState === "reE") {
        setCommunicationState("solvingHands");
        addStringLog("SOLVING HANDS");
        let encryptedState = await decryptCards([0, 1, 4, 5], details, state);
        sendState(encryptedState, comConn, "Solving Hand for opponent");
        setCommunicationState("betting");
        // setCommunicationState("playing1");
      }

      if (playerId === 2 && communicationState === "solvingHands") {
        const readableCards = [state[0], state[1], state[4], state[5]];
        console.log("READABLE CARDS", readableCards);
        const valid = readableCards.every((card) => card.encryptedBy1 == 0);
        if (!valid) {
          alert("CHEATER" + valid);
          return false;
        }
        setCommunicationState("betting");
      }
      if (playerId === 1 && communicationState === "solvingHands") {
        setCommunicationState("betting");
      }
      if (playerId === 2 && communicationState === "end") {
        addStringLog("Game Ended, decrypting cards");
        const unencryptedStack: PlayingCardT[] = [];
        await Promise.all(
          state.map(async (card) => {
            const clearCard = await decryptCardIfPossible(card, details);
            unencryptedStack.push(clearCard);
          })
        );
        sendState(unencryptedStack, comConn, "End Game");
        gameContext.setCardState(unencryptedStack);
        console.log("FINAL STATE", unencryptedStack);
      }
      if (playerId === 1 && communicationState === "end") {
        addStringLog("Game Ended, decrypted all cards");
        gameContext.setCardState(state);
        const houseHand: PlayingCardT[] = [];
        const playerHand: PlayingCardT[][] = [[], []];
        state.forEach((card) => {
          if (card.owner === 3) {
            houseHand.push(card);
          } else if (card.owner > 0) {
            playerHand[card.owner - 1].push(card);
          }
        });
        const houseHandNumbers = houseHand.map((c) => c.card);
        const p1Hand = playerHand[0].map((c) => c.card);
        const p2Hand = playerHand[1].map((c) => c.card);
        addStringLog(
          "House Hand: " +
            calculateScoreFromNumbers({ cards: houseHandNumbers })
        );
        addStringLog(
          "Player 1 Hand: " +
            calculateScoreFromNumbers({
              cards: p1Hand,
            })
        );
        if (isBusted({ cards: p1Hand })) {
          addStringLog("Player 1 BUSTED");
        }
        addStringLog(
          "Player 2 Hand: " +
            calculateScoreFromNumbers({
              cards: p2Hand,
            })
        );
        if (isBusted({ cards: p2Hand })) {
          addStringLog("Player 2 BUSTED");
        }
        if (!gameContext.opponentDetails?.address) {
          alert("no opponent");
          return false;
        }
        addStringLog("Submitting Final Gamestate");
        await submitFinalGamestate(
          account,
          gameContext.opponentDetails.address,
          clientType === "server",
          state
        );
      }

      return true;
    } else if (msg.startsWith("ACTION")) {
      const action = msg.slice(6);
      const pid = communicationState === "playing1" ? 1 : 2;
      if (action === "hit") {
        if (pid == playerId) {
          alert("CANT TELL ME TO HIT MYSELF");
          return false;
        } else {
          const nextCardIndex = getNextCardIndex(gameContext.cardState);
          if (nextCardIndex == undefined) {
            alert("NO MORE CARDS");
            return false;
          }

          const newState = await decryptCards(
            [nextCardIndex],
            details,
            gameContext.cardState
          );
          newState[nextCardIndex].owner = pid;
          sendState(newState, comConn, "Hit Card");
          gameContext.setCardState(newState);
          console.log("SET STATE", newState);
        }
      }
      if (action === "stand") {
        if (pid === 1) {
          setCommunicationState("playing2");
        }
        if (pid === 2) {
          setCommunicationState("end");
          addStringLog("Game Ended, decrypting cards");
          const unencryptedStack: PlayingCardT[] = [];
          Promise.all(
            gameContext.cardState.map(async (card) => {
              const clearCard = await decryptCardIfPossible(card, details);
              unencryptedStack.push(clearCard);
            })
          ).then(() => {
            sendState(unencryptedStack, comConn, "End Game");
          });
        }
      }
      return true;
    } else {
      return false;
    }
  }
  async function attemptHash(encryptedState, opponent, host, note?: string) {
    try {
      const stackHash = await hashStack(encryptedState);
      console.log("STACK HASH", stackHash);
      addStringLog("Please Sign State for: " + note);
      await submitHash(account, opponent, host, stackHash, (tx) =>
        addStringLog(`Waiting for ${note} transaction to be mined: ` + tx)
      );
      addStringLog("Hash Submitted");
      return stackHash;
    } catch (e) {
      console.log("ERROR", e);
      addStringLog("You failed to sign the hash");
    }
  }
  useEffect(() => {
    console.log("clientType", clientType);
    if (!account.address) {
      alert("Account not properly connected, reconnect and try again");
      return;
    }
    let myname = account.address.toLowerCase().replace("0x0", "0x");
    let connectName = usernameInput?.toLowerCase().replace("0x0", "0x");
    if (clientType === "server") {
      addStringLog("INIT PEER");

      const peer = new Peer(myname);
      // var conn = peer.connect("asddff");
      peer.on("open", function (name) {
        addStringLog("Connected to peer\n" + name);
      });
      peer.on("connection", function (dconn: DataConnection) {
        addStringLog("CONNECTED TO PEER" + dconn);
        setDConn(dconn);
        addStringLog("Opponent:" + dconn.peer);
        gameContext.setOpponentDetails({
          address: dconn.peer,
          name: dconn.peer.slice(0, 6),
        });
        gameContext.setDconn(dconn);
        dconn.on("data", function (data) {
          // Will print 'hi!'
          document.dispatchEvent(
            new CustomEvent("msgGotten", {
              bubbles: true,
              detail: { data: data },
            })
          );
        });
        setupGame(account, dconn.peer).then((res) => {
          addStringLog("SETUP GAME" + res);
          dconn.send("Setup Game!");
        });
      });
    }
    if (clientType == "client") {
      const peer = new Peer(myname);
      peer.on("open", function () {
        addStringLog("Connected to peer as client " + myname);
        if (!connectName) {
          alert("No Host Name");
          return;
        }
        var conn = peer.connect(connectName);
        addStringLog("Connecting to host:" + connectName);
        conn.on("open", function () {
          // Receive messages
          gameContext.setOpponentDetails({
            address: conn.peer,
            name: conn.peer.slice(0, 6),
          });
          setDConn(conn);
          gameContext.setDconn(conn);
          const newDetails = {
            ...gameContext.playerDetails,
            playerId: 2,
          };
          gameContext.setPlayerDetails(newDetails);
          conn.on("data", function (data) {
            document.dispatchEvent(
              new CustomEvent("msgGotten", {
                bubbles: true,
                detail: { data: data },
              })
            );
          });

          addStringLog(JSON.stringify(newDetails));

          // Send messages
          conn.send("Hello!");
        });
      });
    }
  }, [clientType]);
  return (
    <div>
      <Input
        className="text-gray-200"
        id="username"
        onChange={(e) => {
          setUsernameInput(e.target.value);
        }}
        placeholder="Your hosts address"
        value={usernameInput}
      />
      <Button
        onClick={() => setClientType("server")}
        disabled={clientType !== undefined}
      >
        Server
      </Button>
      <Button
        onClick={() => setClientType("client")}
        disabled={clientType !== undefined}
      >
        Client
      </Button>
      <Button
        onClick={async () => {
          addStringLog("INITIALIZING STATE");
          let state: Array<PlayingCardT> = [];
          for (let i = 0; i < 52; i++) {
            state.push({
              encryptedBy1: 0,
              encryptedBy2: 0,
              card: i + 1,
              owner: 0,
            });
          }
          state = state.sort(() => Math.random() - 0.5);
          console.log("STATE", state, gameContext.cardState);
          const newDetails = {
            ...gameContext.playerDetails,
            playerId: clientType === "server" ? 1 : 2,
          };
          const encryptedState = await encryptCardStack(state, newDetails);

          gameContext.setPlayerDetails(newDetails);
          gameContext.setCardState(encryptedState);
          addStringLog(JSON.stringify(newDetails));
          sendState(encryptedState, undefined, "Initial Deck");
          setCommunicationState("reE");

          dConn?.send("Hello!");
        }}
        disabled={communicationState !== "initialE"}
      >
        Setup Game
      </Button>
      {communicationState === "betting" && (
        <div className="col">
          <Input
            className="text-gray-200"
            id="betAmount"
            onChange={(e) => {
              setBetAmount(parseInt(e.target.value) ?? 0);
            }}
            placeholder="Bet Amount"
            value={betAmount}
          />
          <Button
            onClick={async () => {
              if (betAmount > 0) {
                if (!gameContext.opponentDetails?.address) {
                  alert("no opponent");
                  return;
                }
                addStringLog("BETTING:" + betAmount);
                await submitBet(
                  account,
                  gameContext.opponentDetails.address,
                  clientType === "server",
                  betAmount
                );
                gameContext.dconn?.send(
                  account.address?.slice(0, 6) + "... bet:" + betAmount
                );
                setCommunicationState("playing1");
              } else {
                alert("Bet Amount must be greater than 0");
              }
            }}
          >
            Submit Bet
          </Button>
        </div>
      )}
      <Button onClick={() => setGameState("start")}>Back</Button>
      <div className="row-auto">
        <div className="col">
          <span>Communication State: {communicationState}</span>
          <span>Client Type: {clientType}</span>
          <span>game: {JSON.stringify(gameContext.playerDetails)}</span>
          <div>
            <h4>playing against:</h4>
            {gameContext.opponentDetails?.name}
          </div>
        </div>
        <div className="col">
          <Button
            onClick={() => sendAction("hit")}
            disabled={currentPid != gameContext.playerDetails.playerId}
          >
            Hit
          </Button>
          <Button
            onClick={async () => {
              const success = await sendAction("stand");
              if (!success) return;
              if (communicationState === "playing1") {
                setCommunicationState("playing2");
              }
              if (communicationState === "playing2") {
                setCommunicationState("end");
              }
            }}
            disabled={currentPid != gameContext.playerDetails.playerId}
          >
            Stand
          </Button>
        </div>
      </div>
    </div>
  );
}
