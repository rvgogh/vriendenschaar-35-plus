
export type PlayerStatus = "IN" | "OUT" | "MAYBE" | "UNKNOWN";

export interface Player {
  id: number;
  name: string;
}

export interface PlayerWithStatus extends Player {
  status: PlayerStatus;
}

export interface Match {
  id: number;
  opponent: string;
}
