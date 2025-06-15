
export type PlayerStatus = "IN" | "OUT" | "MAYBE";

export interface Player {
  id: number;
  name: string;
  status: PlayerStatus;
}

export const initialPlayers: Player[] = [
  { id: 1, name: "Maikel Aragon van den Broeke", status: "IN" },
  { id: 2, name: "Isidoor van den Berk", status: "IN" },
  { id: 3, name: "Dieter van den Broeck", status: "MAYBE" },
  { id: 4, name: "Geurt van den Broek", status: "IN" },
  { id: 5, name: "Robin Caerteling", status: "OUT" },
  { id: 6, name: "Teun Fransen", status: "IN" },
  { id: 7, name: "Roland van Gogh", status: "IN" },
  { id: 8, name: "Luuk van Hees", status: "IN" },
  { id: 9, name: "William van Heteren", status: "MAYBE" },
  { id: 10, name: "Ivo van der Hout", status: "OUT" },
  { id: 11, name: "Niek Loman", status: "IN" },
  { id: 12, name: "Sjors Overman", status: "IN" },
  { id: 13, name: "Thomas Pels", status: "MAYBE" },
  { id: 14, name: "Martijn Schakel", status: "IN" },
  { id: 15, name: "Joop Schell", status: "OUT" },
  { id: 16, name: "JanJaap Schep", status: "IN" },
  { id: 17, name: "Ronnie van Veen", status: "IN" },
  { id: 18, name: "Max Visser", status: "IN" },
  { id: 19, name: "Arthur van Westerop", status: "MAYBE" },
  { id: 20, name: "Lars Wierenga", status: "OUT" },
];
