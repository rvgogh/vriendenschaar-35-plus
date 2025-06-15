
export type PlayerStatus = "IN" | "OUT" | "MAYBE";

export interface Player {
  id: number;
  name: string;
  status: PlayerStatus;
}

export const initialPlayers: Player[] = [
  { id: 1, name: "Leo Messi", status: "IN" },
  { id: 2, name: "Cristiano Ronaldo", status: "IN" },
  { id: 3, name: "Neymar Jr.", status: "MAYBE" },
  { id: 4, name: "Kylian Mbappé", status: "IN" },
  { id: 5, name: "Kevin De Bruyne", status: "OUT" },
  { id: 6, name: "Robert Lewandowski", status: "IN" },
  { id: 7, name: "Mohamed Salah", status: "IN" },
  { id: 8, name: "Virgil van Dijk", status: "IN" },
  { id: 9, name: "Sadio Mané", status: "MAYBE" },
  { id: 10, name: "Luka Modric", status: "OUT" },
  { id: 11, name: "Erling Haaland", status: "IN" },
];
