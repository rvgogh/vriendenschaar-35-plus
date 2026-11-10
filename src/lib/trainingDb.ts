// Databasetoegang voor de training-module.
// De tabellen komen uit de migraties 20261110170000–170200. Ze staan nog niet in de gegenereerde
// Supabase-types, daarom gebruiken we hier een ongetypeerde client met eigen interfaces.
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Drill, PlanBlock, Theme } from "@/lib/trainingPlan";
import { RECENT_DAYS } from "@/lib/trainingPlan";
import type { Assignment, Position, TeamPlayer } from "@/lib/teamBuilder";

const db = supabase as unknown as SupabaseClient;

export interface TrainingRow {
  id: number;
  training_at: string;
}

export interface TrainingPlan {
  id: string;
  training_id: number;
  status: 'concept' | 'published';
  theme: Theme | null;
  player_count: number | null;
  teams_shared: boolean;
  blocks: PlanBlock[];
}

export interface PlanHistoryEntry {
  training_id: number;
  training_at: string;
  drill_ids: string[];
}

export interface PlayerInfo extends TeamPlayer {
  knvb_member: boolean;
  /** false zolang er nog geen rij in player_training_info staat (team is dan afgeleid van KNVB-lidmaatschap). */
  hasInfo: boolean;
}

export const fetchDrills = async (): Promise<Drill[]> => {
  const { data, error } = await db.from('drills').select('*').eq('active', true).order('name');
  if (error) throw error;
  return (data ?? []) as Drill[];
};

export const fetchTraining = async (trainingId: number): Promise<TrainingRow | null> => {
  const { data, error } = await supabase.from('trainings').select('id, training_at').eq('id', trainingId).maybeSingle();
  if (error) throw error;
  return data as TrainingRow | null;
};

/** Spelers die zich hebben aangemeld (status YES). */
export const fetchPresentPlayerIds = async (trainingId: number): Promise<number[]> => {
  const { data, error } = await supabase.from('training_statuses').select('player_id').eq('training_id', trainingId).eq('status', 'YES');
  if (error) throw error;
  return (data ?? []).map((row) => row.player_id);
};

export const fetchPresentCounts = async (trainingIds: number[]): Promise<Map<number, number>> => {
  const counts = new Map<number, number>();
  if (!trainingIds.length) return counts;
  const { data, error } = await supabase.from('training_statuses').select('training_id').in('training_id', trainingIds).eq('status', 'YES');
  if (error) throw error;
  (data ?? []).forEach((row) => counts.set(row.training_id, (counts.get(row.training_id) ?? 0) + 1));
  return counts;
};

type PlanRow = Omit<TrainingPlan, 'blocks'> & { training_plan_blocks?: PlanBlock[] };
const toPlan = (row: PlanRow): TrainingPlan => {
  const { training_plan_blocks, ...plan } = row;
  return { ...plan, blocks: [...(training_plan_blocks ?? [])].sort((a, b) => a.position - b.position) };
};

/** Het plan van een trainingsavond. Spelers krijgen het alleen te zien als het gepubliceerd is. */
export const fetchPlan = async (trainingId: number): Promise<TrainingPlan | null> => {
  const { data, error } = await db.from('training_plans')
    .select('id, training_id, status, theme, player_count, teams_shared, training_plan_blocks(position, drill_id, minutes)')
    .eq('training_id', trainingId).maybeSingle();
  if (error) throw error;
  return data ? toPlan(data as PlanRow) : null;
};

export const fetchPlanStatuses = async (trainingIds: number[]): Promise<Map<number, 'concept' | 'published'>> => {
  const statuses = new Map<number, 'concept' | 'published'>();
  if (!trainingIds.length) return statuses;
  const { data, error } = await db.from('training_plans').select('training_id, status').in('training_id', trainingIds);
  if (error) throw error;
  (data ?? []).forEach((row: { training_id: number; status: 'concept' | 'published' }) => statuses.set(row.training_id, row.status));
  return statuses;
};

/** Welke oefeningen zijn op welke avond gedaan? Basis voor "laatst gedaan" en de regel van 3 weken. */
export const fetchPlanHistory = async (): Promise<PlanHistoryEntry[]> => {
  const { data, error } = await db.from('training_plans')
    .select('training_id, trainings!inner(training_at), training_plan_blocks(drill_id)');
  if (error) throw error;
  type Row = { training_id: number; trainings: { training_at: string } | { training_at: string }[]; training_plan_blocks: { drill_id: string }[] };
  return ((data ?? []) as Row[]).map((row) => ({
    training_id: row.training_id,
    training_at: (Array.isArray(row.trainings) ? row.trainings[0] : row.trainings).training_at,
    drill_ids: (row.training_plan_blocks ?? []).map((b) => b.drill_id),
  }));
};

/** Oefeningen uit de 3 weken vóór deze training (de training zelf telt niet mee). */
export const recentDrillIds = (history: PlanHistoryEntry[], training: TrainingRow): string[] => {
  const end = new Date(training.training_at).getTime();
  const start = end - RECENT_DAYS * 24 * 60 * 60 * 1000;
  return history
    .filter((h) => h.training_id !== training.id)
    .filter((h) => { const t = new Date(h.training_at).getTime(); return t >= start && t < end; })
    .flatMap((h) => h.drill_ids);
};

/** Laatste keer dat een oefening gedaan is (alleen avonden in het verleden). */
export const lastDoneByDrill = (history: PlanHistoryEntry[], before = new Date()): Map<string, string> => {
  const last = new Map<string, string>();
  history.filter((h) => new Date(h.training_at) < before).forEach((h) => h.drill_ids.forEach((id) => {
    if (!last.has(id) || last.get(id)! < h.training_at) last.set(id, h.training_at);
  }));
  return last;
};

export const savePlan = async (input: {
  trainingId: number;
  status: 'concept' | 'published';
  theme: Theme | null;
  playerCount: number;
  blocks: PlanBlock[];
  userId: string | undefined;
}): Promise<string> => {
  const { data, error } = await db.from('training_plans')
    .upsert({
      training_id: input.trainingId,
      status: input.status,
      theme: input.theme,
      player_count: input.playerCount,
      created_by: input.userId ?? null,
    }, { onConflict: 'training_id' })
    .select('id').single();
  if (error) throw error;
  const planId = (data as { id: string }).id;
  const removed = await db.from('training_plan_blocks').delete().eq('plan_id', planId);
  if (removed.error) throw removed.error;
  const inserted = await db.from('training_plan_blocks')
    .insert(input.blocks.map((b) => ({ plan_id: planId, position: b.position, drill_id: b.drill_id, minutes: b.minutes })));
  if (inserted.error) throw inserted.error;
  return planId;
};

export const setPlanStatus = async (planId: string, status: 'concept' | 'published') => {
  const { error } = await db.from('training_plans').update({ status }).eq('id', planId);
  if (error) throw error;
};

/** Alle spelers met team en positie; niveau alleen als de ingelogde gebruiker trainer is. */
export const fetchPlayerInfo = async (withLevels: boolean): Promise<PlayerInfo[]> => {
  const players = await supabase.from('players').select('id, name, knvb_member').order('name');
  if (players.error) throw players.error;
  const info = await db.from('player_training_info').select('player_id, team, position');
  if (info.error) throw info.error;
  const levels = new Map<number, number>();
  if (withLevels) {
    const result = await db.from('player_levels').select('player_id, level');
    if (result.error) throw result.error;
    (result.data ?? []).forEach((row: { player_id: number; level: number }) => levels.set(row.player_id, row.level));
  }
  const infoById = new Map<number, { team: 1 | 2; position: Position | null }>();
  (info.data ?? []).forEach((row: { player_id: number; team: 1 | 2; position: Position | null }) => infoById.set(row.player_id, row));
  return (players.data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    knvb_member: !!p.knvb_member,
    team: infoById.get(p.id)?.team ?? (p.knvb_member ? 1 : 2),
    position: infoById.get(p.id)?.position ?? null,
    level: levels.get(p.id) ?? null,
    hasInfo: infoById.has(p.id),
  }));
};

export const savePlayerInfo = async (playerId: number, team: 1 | 2, position: Position | null) => {
  const { error } = await db.from('player_training_info').upsert({ player_id: playerId, team, position }, { onConflict: 'player_id' });
  if (error) throw error;
};

export const savePlayerLevel = async (playerId: number, level: number | null) => {
  const { error } = level === null
    ? await db.from('player_levels').delete().eq('player_id', playerId)
    : await db.from('player_levels').upsert({ player_id: playerId, level }, { onConflict: 'player_id' });
  if (error) throw error;
};

export const fetchAssignments = async (planId: string): Promise<Assignment[]> => {
  const { data, error } = await db.from('training_team_assignments').select('player_id, field, side').eq('plan_id', planId);
  if (error) throw error;
  return (data ?? []) as Assignment[];
};

export const saveAssignments = async (planId: string, assignments: Assignment[], shared: boolean) => {
  const removed = await db.from('training_team_assignments').delete().eq('plan_id', planId);
  if (removed.error) throw removed.error;
  const inserted = await db.from('training_team_assignments').insert(assignments.map((a) => ({ ...a, plan_id: planId })));
  if (inserted.error) throw inserted.error;
  const updated = await db.from('training_plans').update({ teams_shared: shared }).eq('id', planId);
  if (updated.error) throw updated.error;
};

/** Beheerders: welke spelers zijn trainer of beheerder? */
export const fetchTrainerRoles = async (): Promise<Map<number, string>> => {
  const { data, error } = await db.rpc('admin_list_trainer_player_ids');
  if (error) throw error;
  return new Map(((data ?? []) as { player_id: number; role: string }[]).map((row) => [row.player_id, row.role]));
};

export const setTrainer = async (playerId: number, enabled: boolean) => {
  const { error } = await db.rpc('admin_set_trainer', { _player_id: playerId, _enabled: enabled });
  if (error) throw error;
};

export const formatTrainingDate = (trainingAt: string): string =>
  new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Amsterdam' }).format(new Date(trainingAt));

export const formatShortDate = (date: string): string =>
  new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', timeZone: 'Europe/Amsterdam' }).format(new Date(date));

export const formatClock = (trainingAt: string): string =>
  new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' }).format(new Date(trainingAt));
