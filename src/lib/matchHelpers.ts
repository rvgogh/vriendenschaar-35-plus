/**
 * Determines if a match is open to all players (KNVB members and non-members).
 * Currently this applies to the Gecu cup matches.
 */
export const isOpenToAllPlayers = (opponent: string | null | undefined): boolean => {
  if (!opponent) return false;
  return opponent.toLowerCase().includes("gecu");
};

export const canPlayMatch = (player: { knvb_member: boolean }, opponent: string | null | undefined) =>
  player.knvb_member || isOpenToAllPlayers(opponent);

export const matchStatusOptions = (canPlay: boolean) =>
  canPlay ? ["IN", "SUPPORTER", "MAYBE", "OUT"] as const : ["SUPPORTER"] as const;

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
