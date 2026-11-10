import { describe, test, expect } from 'bun:test';
import { buildTeams, swapPlayers, toAssignments, fromAssignments, teamLevel } from './teamBuilder';

const positions = ['K', 'V', 'V', 'M', 'M', 'A'];
/** n spelers; de eerste `team1` horen bij Team 1. Niveau loopt rond van 1 tot 5. */
const squad = (n, team1 = Math.ceil(n / 2)) => Array.from({ length: n }, (_, i) => ({
  id: i + 1, name: `Speler ${i + 1}`, team: i < team1 ? 1 : 2, position: positions[i % positions.length], level: (i % 5) + 1,
}));
const ids = (result) => toAssignments(result).map((a) => a.player_id).sort((a, b) => a - b);

describe('teams maken', () => {
  test('iedereen speelt, niemand staat wissel', () => {
    for (let n = 10; n <= 25; n++) {
      for (const mode of ['eigen', 'gemengd']) {
        const result = buildTeams(squad(n), mode);
        expect(ids(result)).toEqual(squad(n).map((p) => p.id));
      }
    }
  });
  test('tot en met 15 spelers 2 teams, vanaf 16 spelers 4 teams op 2 velden', () => {
    expect(buildTeams(squad(15), 'gemengd').fields.length).toBe(1);
    expect(buildTeams(squad(16), 'gemengd').fields.length).toBe(2);
    const r = buildTeams(squad(18), 'gemengd');
    expect(r.fields.map((f) => [f.hesjes.length, f.zonder.length])).toEqual([[5, 5], [4, 4]]);
  });
  test('per veld zijn de teams even groot', () => {
    for (let n = 10; n <= 25; n++) {
      for (const f of buildTeams(squad(n, 3), 'eigen').fields) expect(f.hesjes.length).toBe(f.zonder.length);
    }
  });
  test('oneven aantal: één extra speler op het veld met de kleinste teams', () => {
    const r = buildTeams(squad(19), 'gemengd');
    expect(r.extra).not.toBeNull();
    expect(r.extraField).toBe(2);
    expect(['hesjes', 'zonder']).toContain(r.extraStartsWith);
    expect(buildTeams(squad(18), 'gemengd').extra).toBeNull();
    expect(buildTeams(squad(11), 'gemengd').extraField).toBe(1);
  });
  test('extra speler begint bij het team met het laagste niveau', () => {
    const r = buildTeams(squad(13), 'gemengd');
    const f = r.fields[0];
    expect(r.extraStartsWith).toBe(teamLevel(f.hesjes) <= teamLevel(f.zonder) ? 'hesjes' : 'zonder');
  });
  test('eigen teams: Team 1 in hesjes, Team 2 zonder', () => {
    const r = buildTeams(squad(18, 9), 'eigen');
    for (const f of r.fields) {
      expect(f.hesjes.every((p) => p.team === 1)).toBe(true);
      expect(f.zonder.every((p) => p.team === 2)).toBe(true);
    }
  });
  test('eigen teams bij 10 tegen 9: extra speler komt uit het grootste team, niemand schuift door', () => {
    const r = buildTeams(squad(19, 10), 'eigen');
    expect(r.extra.team).toBe(1);
    expect(r.fields.every((f) => f.hesjes.every((p) => p.team === 1) && f.zonder.every((p) => p.team === 2))).toBe(true);
  });
  test('eigen teams bij ongelijke aantallen: zo min mogelijk spelers schuiven door', () => {
    const r = buildTeams(squad(18, 12), 'eigen');
    const moved = r.fields.flatMap((f) => f.zonder).filter((p) => p.team === 1).length;
    expect(moved).toBe(3);
    expect(r.fields.flatMap((f) => f.hesjes).every((p) => p.team === 1)).toBe(true);
  });
  test('gemengd: niveau per veld ligt dicht bij elkaar en keepers zijn gespreid', () => {
    const r = buildTeams(squad(20), 'gemengd');
    for (const f of r.fields) expect(Math.abs(teamLevel(f.hesjes) - teamLevel(f.zonder))).toBeLessThanOrEqual(2);
    const keepers = r.fields.flatMap((f) => [f.hesjes, f.zonder]).map((t) => t.filter((p) => p.position === 'K').length);
    expect(Math.max(...keepers)).toBe(1);
  });
  test('spelers zonder niveau of positie worden gewoon ingedeeld', () => {
    const blank = squad(12).map((p) => ({ ...p, level: null, position: null }));
    expect(ids(buildTeams(blank, 'gemengd')).length).toBe(12);
  });
  test('twee spelers ruilen, ook met de extra speler', () => {
    const r = buildTeams(squad(11), 'gemengd');
    const other = r.fields[0].hesjes[0];
    const swapped = swapPlayers(r, r.extra.id, other.id);
    expect(swapped.extra.id).toBe(other.id);
    expect(swapped.fields[0].hesjes[0].id).toBe(r.extra.id);
    expect(ids(swapped)).toEqual(ids(r));
  });
  test('opslaan en terughalen geeft dezelfde indeling', () => {
    const players = squad(19);
    const r = buildTeams(players, 'gemengd');
    expect(fromAssignments(toAssignments(r), players)).toEqual(r);
  });
});
