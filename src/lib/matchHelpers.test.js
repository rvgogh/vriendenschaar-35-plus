import { test, expect } from 'bun:test';
import { countMatchStatuses, matchStatusOptions } from './matchHelpers';

test('supporter is an extra match signup option', () => {
  expect(matchStatusOptions(true)).toEqual(['IN', 'SUPPORTER', 'MAYBE', 'OUT']);
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