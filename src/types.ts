
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
  match_date: string | null;
}

export type TrainingAttendanceStatus = "YES" | "NO" | "UNKNOWN";

export interface Training {
  id: number;
  training_at: string;
}

export interface PlayerWithTrainingStatus extends Player {
  status: TrainingAttendanceStatus;
}
