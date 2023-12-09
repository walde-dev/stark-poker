import { useContext, useEffect, useRef, useState } from "react";
import { Button } from "../../@/components/ui/button";
import { GameState, useGame } from "./page";
import Peer, { DataConnection } from "peerjs";
import { Input } from "../../@/components/ui/input";
import { EventType, PlayerDetailsT, PlayingCardT } from "./types";
import { randomUUID } from "crypto";
import { getSHA256Hash } from "boring-webcrypto-sha256";
import { decryptCards, encryptCardStack } from "./library";
import { getNextCardIndex, setStartingHand } from "./gameLogic";
import { useEventListener } from "./eventListener";
import { UserAccountContext } from "../../@/components/UserAccountProvider";

type CommunicationState =
  | "initialE"
  | "reE"
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
  const [usernameInput, setUsernameInput] = useState("testuser");
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
          addStringLog("MSG: " + data);
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
    dConnLocal?: DataConnection
  ) {
    addStringLog(`STATE SENT C:${clientType} S:${communicationState}`);
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
    addStringLog(`ACTION SENT C:${clientType} S:${communicationState}`);
    console.log("SENDING ACTION", action, dConn, dConnLocal);
    dConnLocal?.send("ACTION" + action);
    if (!dConnLocal) {
      dConn?.send("ACTION" + action);
    }
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
        sendState(encryptedState, comConn);
        setCommunicationState("solvingHands");
      }
      if (playerId === 1 && communicationState === "reE") {
        setCommunicationState("solvingHands");
        addStringLog("SOLVING HANDS");
        let encryptedState = await decryptCards([0, 1, 4, 5], details, state);
        sendState(encryptedState, comConn);
        setCommunicationState("playing1");
      }

      if (playerId === 2 && communicationState === "solvingHands") {
        const readableCards = [state[0], state[1], state[4], state[5]];
        console.log("READABLE CARDS", readableCards);
        const valid = readableCards.every((card) => card.encryptedBy1 == 0);
        if (!valid) {
          alert("CHEATER" + valid);
          return false;
        }
        setCommunicationState("playing1");
      }
      if (playerId === 1 && communicationState === "solvingHands") {
        setCommunicationState("playing1");
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
          sendState(newState, comConn);
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
        }
      }
      return true;
    } else {
      return false;
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
        dconn.send("Hello!");
      });
    }
    if (clientType == "client") {
      const peer = new Peer(myname);
      peer.on("open", function () {
        addStringLog("Connected to peer as client " + myname);
        var conn = peer.connect(connectName);
        addStringLog("Connecting to host:" + connectName);
        conn.on("open", function () {
          // Receive messages
          addStringLog("CONNECTED TO PEER" + conn);
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
        placeholder="Your username"
        value={usernameInput}
      />
      <Button onClick={() => setClientType("server")}>Server</Button>
      <Button onClick={() => setClientType("client")}>Client</Button>
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
          console.log("STATE", state, gameContext.cardState);
          const newDetails = {
            ...gameContext.playerDetails,
            playerId: clientType === "server" ? 1 : 2,
          };
          const encryptedState = await encryptCardStack(state, newDetails);
          gameContext.setPlayerDetails(newDetails);
          gameContext.setCardState(encryptedState);
          addStringLog(JSON.stringify(newDetails));
          sendState(encryptedState);
          setCommunicationState("reE");

          dConn?.send("Hello!");
        }}
      >
        Test
      </Button>
      <Button onClick={() => setGameState("start")}>Back</Button>
      <div className="row-auto">
        <div className="col">
          <span>Communication State: {communicationState}</span>
          <span>Client Type: {clientType}</span>
          <span>game: {JSON.stringify(gameContext.playerDetails)}</span>
        </div>
        <div className="col">
          <Button
            onClick={() => sendAction("hit")}
            disabled={currentPid != gameContext.playerDetails.playerId}
          >
            Hit
          </Button>
          <Button
            onClick={() => {
              sendAction("stand");
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
