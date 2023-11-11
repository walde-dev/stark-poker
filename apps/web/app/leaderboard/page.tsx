import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../@/components/ui/table";

const mockData = [
  {
    user: "walde",
    address: "0xw4ld3",
    winnings: "250.00 STRK",
  },
  {
    user: "tachys",
    address: "0xt4chys",
    winnings: "200.00 STRK",
  },
  {
    user: "joe",
    address: "0xj03",
    winnings: "150.00 STRK",
  },
  {
    user: "alice",
    address: "0x4l1c3",
    winnings: "100.00 STRK",
  },
];

export default function Page(): JSX.Element {
  return (
    <div className="px-[200px] py-12">
      <h1 className="font-semibold text-5xl text-center w-full">Leaderboard</h1>
      <Table className="mt-12">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Ranking</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Address</TableHead>
            <TableHead className="text-right">Winnings</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockData.map((d, i) => {
            return (
              <TableRow>
                <TableCell className="font-medium">#{i}</TableCell>
                <TableCell>{d.user}</TableCell>
                <TableCell>{d.address}</TableCell>
                <TableCell className="text-right">{d.winnings}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
