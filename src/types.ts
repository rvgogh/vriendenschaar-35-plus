
export type PlayerStatus = "IN" | "OUT" | "MAYBE" | "UNKNOWN";

export interface Player {
  id: number;
  name: string;
  knvb_member: boolean;
}

export interface PlayerWithStatus extends Player {
  status: PlayerStatus;
}

export interface Match {
  id: number;
  opponent: string;
  match_date: string | null;
  start_time: string | null;
  arrival_time: string | null;
}

export type TrainingAttendanceStatus = "YES" | "NO" | "UNKNOWN";

export interface Training {
  id: number;
  training_at: string;
}

export interface PlayerWithTrainingStatus extends Player {
  status: TrainingAttendanceStatus;
}

export type EventAttendanceStatus = "YES" | "NO" | "MAYBE" | "UNKNOWN";

export interface Event {
  id: number;
  title: string;
  subtitle: string | null;
  event_date: string | null;
  event_time: string | null;
  location: string | null;
  description: string | null;
  created_at: string | null;
}

export interface PlayerWithEventStatus extends Player {
  status: EventAttendanceStatus;
}
