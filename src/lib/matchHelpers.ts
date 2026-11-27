/**
 * Determines if a match is open to all players (KNVB members and non-members).
 * Currently this applies to the Gecu cup matches.
 */
export type MatchStatus = 'planned' | 'played' | 'cancelled';

export const MATCH_STATUS_LABEL: Record<MatchStatus, string> = {
  planned: 'Gepland',
  played: 'Gespeeld',
  cancelled: 'Afgelast',
};

/** Dutch label for a match status; unknown or missing values read as Gepland. */
export const matchStatusLabel = (status: string | null | undefined): string =>
  MATCH_STATUS_LABEL[status as MatchStatus] ?? MATCH_STATUS_LABEL.planned;

export const isMatchCancelled = (status: string | null | undefined): boolean =>
  status === 'cancelled';

export const isOpenToAllPlayers = (opponent: string | null | undefined): boolean => {
  if (!opponent) return false;
  return opponent.toLowerCase().includes("gecu");
};

export const canPlayMatch = (player: { knvb_member: boolean }, opponent: string | null | undefined) =>
  player.knvb_member || isOpenToAllPlayers(opponent);

export const matchStatusOptions = (canPlay: boolean) =>
  canPlay ? ["IN", "MAYBE", "OUT", "SUPPORTER"] as const : ["SUPPORTER"] as const;

export const countMatchStatuses = (
  players: Array<{ id: number; knvb_member: boolean }>,
  statuses: Array<{ player_id: number; status: string }>,
  opponent: string | null | undefined,
) => {
  const eligible = players.filter(p => canPlayMatch(p, opponent));
  const eligibleIds = new Set(eligible.map(p => p.id));
  const playerIds = new Set(players.map(p => p.id));
  const inCount = statuses.filter(s => eligibleIds.has(s.player_id) && s.status === 'IN').length;
  const maybeCount = statuses.filter(s => eligibleIds.has(s.player_id) && s.status === 'MAYBE').length;
  const outCount = statuses.filter(s => eligibleIds.has(s.player_id) && s.status === 'OUT').length;
  const supporterCount = statuses.filter(s => playerIds.has(s.player_id) && s.status === 'SUPPORTER').length;
  const eligibleSupporters = statuses.filter(s => eligibleIds.has(s.player_id) && s.status === 'SUPPORTER').length;
  return { inCount, maybeCount, outCount, supporterCount,
    unknownCount: Math.max(0, eligible.length - inCount - maybeCount - outCount - eligibleSupporters) };
};

export const matchSeasonStatusCounts = (
  players: Array<{ id: number; knvb_member: boolean }>,
  matches: Array<{ id: number; opponent: string | null }>,
  statuses: Array<{ match_id: number; player_id: number; status: string }>,
) => {
  const totals = { IN: 0, MAYBE: 0, OUT: 0, UNKNOWN: 0, SUPPORTER: 0 };
  for (const match of matches) {
    const counts = countMatchStatuses(players, statuses.filter(s => s.match_id === match.id), match.opponent);
    totals.IN += counts.inCount;
    totals.MAYBE += counts.maybeCount;
    totals.OUT += counts.outCount;
    totals.UNKNOWN += counts.unknownCount;
    totals.SUPPORTER += counts.supporterCount;
  }
  return Object.entries(totals).map(([name, value]) => ({ name, value }));
};
