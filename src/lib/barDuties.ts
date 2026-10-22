export type DutyPlayer = { id: number; name: string; knvb_member: boolean };
export type DutyAssignment = { player_one_id: number; player_two_id: number };

export const INITIAL_DUTY_DATES = ['2026-11-04', '2026-11-11', '2026-11-18', '2026-11-25', '2026-12-02'];

export function countBarDuties(duties: DutyAssignment[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const duty of duties) {
    for (const id of [duty.player_one_id, duty.player_two_id]) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

export function chooseBarPlayers(players: DutyPlayer[], duties: DutyAssignment[], knvbOnly: boolean): [number, number] {
  const counts = countBarDuties(duties);
  const candidates = players.filter(player => !knvbOnly || player.knvb_member)
    .sort((a, b) => (counts.get(a.id) ?? 0) - (counts.get(b.id) ?? 0) || a.id - b.id);
  const first = candidates[0];
  const second = candidates[1];
  if (!first || !second) throw new Error('Er zijn minimaal twee geschikte spelers nodig.');
  return [first.id, second.id];
}

export function isDutyWednesday(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && new Date(`${date}T12:00:00Z`).getUTCDay() === 3;
}