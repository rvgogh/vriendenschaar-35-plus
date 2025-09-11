import { Tables, Enums } from "@/integrations/supabase/types";

// Database table types
export type Player = Tables<'players'>;
export type Match = Tables<'matches'>;
export type Training = Tables<'trainings'>;
export type Event = Tables<'events'>;
export type Profile = Tables<'profiles'>;

// Enum types
export type PlayerStatus = Enums<'player_status'>;
export type TrainingAttendanceStatus = Enums<'training_status'>;
export type EventAttendanceStatus = Enums<'event_attendance_status'>;
export type AppRole = Enums<'app_role'>;

// Extended types with status
export type PlayerWithStatus = Player & { status: PlayerStatus };
export type PlayerWithTrainingStatus = Player & { status: TrainingAttendanceStatus };
export type PlayerWithEventStatus = Player & { status: EventAttendanceStatus };

// Status count types
export type StatusCount = {
  status: string;
  count: number;
  players: Array<{ id: number; name: string }>;
  emoji: string;
  label: string;
  color: string;
};
