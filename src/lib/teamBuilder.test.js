import { describe, test, expect } from 'bun:test';
import { buildTeams, swapPlayers, toAssignments, fromAssignments, teamLevel, lineup, formationFor, levelCounts, LEVELS, levelOf } from './teamBuilder';

const prefs = [['K'], ['V', 'MM'], ['V', 'VL'], ['MM', 'V', 'VL'], ['VL', 'S'], ['VL', 'MM'], ['S', 'VL']];
const levels = ['rookie', 'talent', 'talent', 'goat'];
/** n spelers; de eerste `team1` horen bij Team 1. Posities volgen een 1-2-3-1, niveau loopt rond. */
const squad = (n, team1 = Math.ceil(n / 2)) => Array.from({ length: n }, (_, i) => ({
  id: i + 1, name: `Speler ${i + 1}`, team: i < team1 ? 1 : 2, positions: prefs[i % prefs.length], level: levels[i % levels.length],
}));
const ids = (result) => toAssignments(result).map((a) => a.player_id).sort((a, b) => a - b);

describe('teams maken', () => {
  test('Mag er ook zijn staat tussen Rookie en Eeuwig talent en telt mee in de balans', () => {
    expect(LEVELS.map((level) => level.value)).toEqual(['rookie', 'decent', 'talent', 'goat']);
    const player = { id: 1, name: 'A', team: 1, positions: [], level: 'decent' };
    expect(levelOf(player)).toBe(1.5);
    expect(levelOf(player)).toBeGreaterThan(levelOf({ ...player, level: 'rookie' }));
    expect(levelOf(player)).toBeLessThan(levelOf({ ...player, level: 'talent' }));
    expect(levelCounts([player])).toEqual({ rookie: 0, decent: 1, talent: 0, goat: 0 });
  });
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
    const keepers = r.fields.flatMap((f) => [f.hesjes, f.zonder]).map((t) => t.filter((p) => p.positions[0] === 'K').length);
    expect(Math.max(...keepers)).toBe(1);
  });
  test('spelers zonder niveau of positie worden gewoon ingedeeld', () => {
    const blank = squad(12).map((p) => ({ ...p, level: null, positions: [] }));
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
  test('GOATs worden over de teams verdeeld', () => {
    const r = buildTeams(squad(14), 'gemengd');
    const [a, b] = [levelCounts(r.fields[0].hesjes), levelCounts(r.fields[0].zonder)];
    expect(Math.abs(a.goat - b.goat)).toBeLessThanOrEqual(1);
  });
  test('zonder niveau telt als Eeuwig talent', () => {
    expect(teamLevel([{ id: 1, name: 'A', team: 1, positions: [], level: null }]))
      .toBe(teamLevel([{ id: 1, name: 'A', team: 1, positions: [], level: 'talent' }]));
  });
});

describe('opstelling 1-2-3-1', () => {
  test('bij 7 spelers: keeper, 2 verdedigers, mid-mid, 2 vleugels, spits', () => {
    expect(formationFor(7)).toEqual(['K', 'V', 'V', 'MM', 'VL', 'VL', 'S']);
    expect(formationFor(6)).toEqual(['K', 'V', 'V', 'MM', 'VL', 'S']);
    expect(formationFor(5)).toEqual(['K', 'V', 'V', 'MM', 'S']);
    expect(formationFor(4)).toEqual(['K', 'V', 'MM', 'S']);
  });
  test('ieder op zijn favoriete positie als dat kan', () => {
    const team = squad(7);
    const spots = lineup(team);
    expect(spots.map((s) => s.position)).toEqual(formationFor(7));
    for (const s of spots) expect(s.player.positions).toContain(s.position);
    expect(spots.filter((s) => s.player.positions[0] === s.position).length).toBeGreaterThanOrEqual(5);
  });
  test('volgorde telt: tweede keus gaat voor een positie die niet genoemd is', () => {
    const team = [
      { id: 1, name: 'A', team: 1, positions: ['S', 'K'], level: null },
      { id: 2, name: 'B', team: 1, positions: ['S'], level: null },
      { id: 3, name: 'C', team: 1, positions: ['V'], level: null },
      { id: 4, name: 'D', team: 1, positions: ['MM'], level: null },
    ];
    const byPos = Object.fromEntries(lineup(team).map((s) => [s.position, s.player.name]));
    expect(byPos).toEqual({ K: 'A', S: 'B', V: 'C', MM: 'D' });
  });
  test('iedereen krijgt precies één plek, ook zonder voorkeur', () => {
    const team = squad(6).map((p) => ({ ...p, positions: [] }));
    expect(lineup(team).map((s) => s.player.id).sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
