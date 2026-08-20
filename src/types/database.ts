import { Tables, Enums } from "@/integrations/supabase/types";

// Database table types
// Non-sensitive player fields readable by any signed-in user.
// The linked auth account id (user_id) is only available for your own player
// (get_my_player) or to superusers (admin_list_players).
export type PublicPlayer = Omit<Tables<'players'>, 'user_id'>;
export type Player = PublicPlayer & { user_id?: string | null };
export type Match = Tables<'matches'>;
export type Training = Tables<'trainings'>;
export type Event = Tables<'events'>;
export type Profile = Tables<'profiles'>;
export type Season = Tables<'seasons'>;

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
