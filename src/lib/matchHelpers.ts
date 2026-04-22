/**
 * Determines if a match is open to all players (KNVB members and non-members).
 * Currently this applies to the Gecu cup matches.
 */
export const isOpenToAllPlayers = (opponent: string | null | undefined): boolean => {
  if (!opponent) return false;
  return opponent.toLowerCase().includes("gecu");
};
