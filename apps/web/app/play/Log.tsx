import { ReactNode, useMemo } from "react";
import { Button } from "../../@/components/ui/button";
import { Card } from "../../@/components/ui/card";
import { Input } from "../../@/components/ui/input";
import { EventType } from "./types";
import { useGame } from "./page";

export function Log({
  logEvents,
  addToLog,
}: {
  logEvents: { events: EventType[] };
  addToLog: (log: EventType) => void;
}) {
  const mock = logEvents.events;
  // [
  //   {
  //     key: "player1_joined",
  //     child: <span>Player 1 has joined the game</span>,
  //   },
  //   {
  //     key: "player2_joined",
  //     child: <span>Player 2 has joined the game</span>,
  //   },
  //   {
  //     key: "player2_msg_1",
  //     child: (
  //       <span>
  //         Player 2: <span className="text-white">hi there :D </span>
  //       </span>
  //     ),
  //   },
  // ];

  // const [log, setLog] = useState(mock);
  console.log("LOG", mock);
  const gameContext = useGame();
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.elements[0] as HTMLInputElement;
    const message = input.value;
    if (message) {
      gameContext.dconn?.send(message);
      addToLog({
        key: `player1_msg_${mock.length}`,
        child: (
          <span>
            SEND <span className="text-white">{message}</span>
          </span>
        ),
      });
      // setLog((prev) => [
      //   ...prev,
      //   {
      //     key: `player1_msg_${prev.length}`,
      //     child: (
      //       <span>
      //         Player 1: <span className="text-white">{message}</span>
      //       </span>
      //     ),
      //   },
      // ]);
    }
    input.value = "";
  };

  // useEffect(() => {
  //   const newEvents = logEvents.events?.map((event: any) => ({
  //     key: `event_${event.transaction_hash}`,
  //     child: (
  //       <span>
  //         [Block {event.block_number}] {event.transaction_hash.slice(0, 8)}...
  //       </span>
  //     ),
  //   }));
  //   if (!newEvents) return;
  //   console.log("LOL", logEvents.events);
  //   setLog((prev) => {
  //     const nonEvents = prev.filter(
  //       (logItem) => !logItem.key.includes("event")
  //     );
  //     return [...nonEvents, ...newEvents];
  //   });
  // }, [logEvents]);

  return (
    <Card className="p-4 flex flex-col">
      <div className="h-full">
        <h1 className="text-xl">Game Log</h1>
        <hr className="border border-gray-900 my-2" />
        <ul className="flex flex-col gap-y-2">
          {mock?.map((logItem) => (
            <li key={logItem.key}>
              <LogItem text={logItem.child} />
            </li>
          ))}
        </ul>
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex  gap-x-2 w-full items-center"
      >
        <Input placeholder="Type a message..." />
        <Button type="submit" variant={"outline"}>
          Send
        </Button>
      </form>
    </Card>
  );
}

function LogItem({ text }: { text: ReactNode }) {
  const currentTime = useMemo(() => {
    return new Date().toLocaleTimeString();
  }, []);
  return (
    <span>
      <span className="text-gray-600">[{currentTime}]: </span>
      <span className="text-gray-400">{text}</span>
    </span>
  );
}
