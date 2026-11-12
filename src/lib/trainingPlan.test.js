import { describe, test, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
import {
  proposePlan, matchFormat, matchFormatText, variantKey, blockTimes, endTime, candidatesFor, SLOTS, FIXED_DRILL_ID,
} from './trainingPlan';

const drill = (id, category, extra = {}) => ({
  id, name: id, category, duration: 15, min_players: 4, max_players: 25, tactical: false, fixed: false,
  material: null, explanation: '', coaching_points: [], variants: {}, sketch: null, ...extra,
});
const drills = [
  drill('wu-a', 'warming-up'), drill('wu-b', 'warming-up'),
  drill('pas-a', 'passen'), drill('pas-b', 'passen'),
  drill('af-a', 'afwerken'), drill('af-b', 'afwerken'),
  drill('tac-a', 'tactisch'),
  drill('pv-a', 'partijvorm'), drill('pv-b', 'partijvorm'),
  drill(FIXED_DRILL_ID, 'conditie', { fixed: true }),
];
const first = () => 0;

describe('trainingsvoorstel', () => {
  test('vijf blokken van samen 75 minuten, rondje van Max op plek 3', () => {
    const plan = proposePlan({ drills, playerCount: 18, theme: 'passen', recentDrillIds: [], rng: first });
    expect(plan.map((b) => b.minutes)).toEqual([10, 15, 10, 15, 25]);
    expect(plan.reduce((s, b) => s + b.minutes, 0)).toBe(75);
    expect(plan[2].drill_id).toBe(FIXED_DRILL_ID);
    expect(plan.map((b) => b.position)).toEqual([1, 2, 3, 4, 5]);
  });
  test('oefeningen uit de laatste 3 weken worden overgeslagen', () => {
    const plan = proposePlan({ drills, playerCount: 18, theme: 'passen', recentDrillIds: ['wu-a', 'pas-a', 'af-a', 'pv-a'], rng: first });
    expect(plan.map((b) => b.drill_id)).toEqual(['wu-b', 'pas-b', FIXED_DRILL_ID, 'af-b', 'pv-b']);
  });
  test('is alles recent gedaan, dan komt er toch een voorstel', () => {
    const plan = proposePlan({ drills, playerCount: 18, theme: null, recentDrillIds: drills.map((d) => d.id), rng: first });
    expect(plan.length).toBe(5);
  });
  test('thema bepaalt de oefenvormen en geen oefening komt twee keer voor', () => {
    const plan = proposePlan({ drills, playerCount: 12, theme: 'tactisch', recentDrillIds: [], rng: first });
    expect(plan[1].drill_id.startsWith('pas-')).toBe(true);
    expect(plan[3].drill_id).toBe('tac-a');
    expect(new Set(plan.map((b) => b.drill_id)).size).toBe(5);
  });
  test('oefeningen die niet bij het aantal spelers passen vallen af', () => {
    const small = [...drills, drill('pas-klein', 'passen', { max_players: 12 })];
    const ids = candidatesFor(small, ['passen'], 18, new Set()).map((d) => d.id);
    expect(ids).toEqual(['pas-a', 'pas-b']);
  });
  test('lege bibliotheek geeft geen voorstel', () => {
    expect(proposePlan({ drills: [], playerCount: 18, theme: null, recentDrillIds: [] })).toEqual([]);
  });
  test('variant volgt het aantal spelers', () => {
    expect([10, 13, 14, 19, 20, 25].map(variantKey)).toEqual(['10-13', '10-13', '14-19', '14-19', '20-25', '20-25']);
  });
  test('tijden lopen van 19:30 tot 20:45', () => {
    const at = '2026-11-11T18:30:00+00:00';
    expect(blockTimes(at, SLOTS)).toEqual(['19:30', '19:40', '19:55', '20:05', '20:20']);
    expect(endTime(at, SLOTS)).toBe('20:45');
  });
});

describe('afsluitende partij', () => {
  test('tot en met 15 spelers 2 teams, vanaf 16 spelers 4 teams', () => {
    expect(matchFormat(10)).toEqual({ teamSizes: [5], extra: false });
    expect(matchFormat(15)).toEqual({ teamSizes: [7], extra: true });
    expect(matchFormat(16)).toEqual({ teamSizes: [4, 4], extra: false });
    expect(matchFormat(18)).toEqual({ teamSizes: [5, 4], extra: false });
    expect(matchFormat(19)).toEqual({ teamSizes: [5, 4], extra: true });
    expect(matchFormat(25)).toEqual({ teamSizes: [6, 6], extra: true });
  });
  test('nooit wissels: iedereen heeft een plek', () => {
    for (let n = 10; n <= 25; n++) {
      const { teamSizes, extra } = matchFormat(n);
      expect(teamSizes.reduce((s, t) => s + 2 * t, 0) + (extra ? 1 : 0)).toBe(n);
    }
    expect(matchFormatText(18)).toBe('4 teams op 2 velden: 5 tegen 5 en 4 tegen 4 · geen wissels');
    expect(matchFormatText(15)).toBe('2 teams: 7 tegen 7 + extra speler · geen wissels');
  });
});

describe('bibliotheek in de migratie', () => {
  const sql = readFileSync(new URL('../../supabase/migrations/20261110170200_5b1c2a4e-7d10-4c1f-9a51-0f1a2b3c4d03.sql', import.meta.url), 'utf8');
  const ids = [...sql.matchAll(/^ {2}\('([a-z0-9-]+)',/gm)].map((m) => m[1]);
  test('34 oefeningen, elk met een schets in public/oefeningen', () => {
    expect(ids.length).toBe(34);
    for (const id of ids) {
      expect(() => readFileSync(new URL(`../../public/oefeningen/${id}.svg`, import.meta.url))).not.toThrow();
    }
  });
  test('geen partijvorm met wissels', () => {
    const partij = sql.split('\n').filter((line) => line.includes("'partijvorm'"));
    expect(partij.length).toBe(5);
    expect(partij.some((line) => /\+ wissels|met wissels|Wissels elke/.test(line))).toBe(false);
  });
});
