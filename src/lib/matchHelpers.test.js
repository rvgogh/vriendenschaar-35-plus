import { test, expect } from 'bun:test';
import { countMatchStatuses, matchStatusOptions, matchSeasonStatusCounts, matchStatusLabel, isMatchCancelled } from './matchHelpers';

test('match statuses read Gepland, Gespeeld and Afgelast', () => {
  expect(matchStatusLabel('planned')).toBe('Gepland');
  expect(matchStatusLabel('played')).toBe('Gespeeld');
  expect(matchStatusLabel('cancelled')).toBe('Afgelast');
  expect(matchStatusLabel(null)).toBe('Gepland');
});

test('only a cancelled match counts as cancelled', () => {
  expect(isMatchCancelled('cancelled')).toBe(true);
  expect(isMatchCancelled('planned')).toBe(false);
  expect(isMatchCancelled(undefined)).toBe(false);
});

test('supporter is an extra match signup option', () => {
  expect(matchStatusOptions(true)).toEqual(['IN', 'MAYBE', 'OUT', 'SUPPORTER']);
});
test('training members can support a regular match without signing up to play', () => {
  expect(matchStatusOptions(false)).toEqual(['SUPPORTER']);
});
test('the five named supporters are separate from available players and unknown responses', () => {
  const players = [
    { id: 25, knvb_member: false }, { id: 26, knvb_member: false },
    { id: 2, knvb_member: true }, { id: 5, knvb_member: true }, { id: 18, knvb_member: true },
    { id: 8, knvb_member: true }, { id: 9, knvb_member: true },
  ];
  const statuses = [25, 26, 2, 5, 18].map(player_id => ({ player_id, status: 'SUPPORTER' }));
  statuses.push({ player_id: 8, status: 'IN' });
  expect(countMatchStatuses(players, statuses, 'Vriendenschaar')).toEqual({
    inCount: 1, supporterCount: 5, maybeCount: 0, outCount: 0, unknownCount: 1,
  });
});

test('season statistics include all five supporters without counting them as players or missing responses', () => {
  const players = [25, 26, 2, 5, 18, 8].map(id => ({ id, knvb_member: id !== 25 && id !== 26 }));
  const statuses = [25, 26, 2, 5, 18].map(player_id => ({ match_id: 29, player_id, status: 'SUPPORTER' }));
  // An attendance row outside the selected season must not affect its statistics.
  statuses.push({ match_id: 30, player_id: 8, status: 'SUPPORTER' });
  expect(matchSeasonStatusCounts(players, [{ id: 29, opponent: 'Vriendenschaar' }], statuses)).toEqual([
    { name: 'IN', value: 0 }, { name: 'MAYBE', value: 0 }, { name: 'OUT', value: 0 },
    { name: 'UNKNOWN', value: 1 }, { name: 'SUPPORTER', value: 5 },
  ]);
});