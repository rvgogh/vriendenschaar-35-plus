import { describe, test, expect } from 'bun:test';
import { chooseBarPlayers, INITIAL_DUTY_DATES, isDutyWednesday } from './barDuties';

const players = [
  { id: 1, name: 'A', knvb_member: true },
  { id: 2, name: 'B', knvb_member: true },
  { id: 3, name: 'C', knvb_member: true },
  { id: 4, name: 'D', knvb_member: false },
];
describe('bardienstregels', () => {
  test('twee verschillende spelers per avond', () => {
    expect(chooseBarPlayers(players, [], false)).toEqual([1, 2]);
  });
  test('eerste ronde alleen KNVB-spelers', () => {
    expect(chooseBarPlayers(players, [{ player_one_id: 1, player_two_id: 2 }], true)).toEqual([3, 1]);
  });
  test('spelers zonder eerdere beurt komen eerst, ook in volgende rondes', () => {
    expect(chooseBarPlayers(players, [{ player_one_id: 1, player_two_id: 2 }], false)).toEqual([3, 4]);
  });
  test('vijf opgegeven woensdagen in 2026', () => {
    expect(INITIAL_DUTY_DATES).toEqual(['2026-11-04', '2026-11-11', '2026-11-18', '2026-11-25', '2026-12-02']);
    expect(INITIAL_DUTY_DATES.every(isDutyWednesday)).toBe(true);
    expect(isDutyWednesday('2026-11-05')).toBe(false);
  });
});