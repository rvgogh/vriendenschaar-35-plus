// Teams maken voor de afsluitende partij. Geen database of React hier, zodat alles los te testen is.
import { matchFormat } from './trainingPlan';

/** Posities in de 1-2-3-1: keeper, verdediger, mid-mid, vleugel, spits. */
export type Position = 'K' | 'V' | 'MM' | 'VL' | 'S';
export const POSITIONS: { value: Position; label: string }[] = [
  { value: 'K', label: 'Keeper' },
  { value: 'V', label: 'Verdediger' },
  { value: 'MM', label: 'Mid-mid' },
  { value: 'VL', label: 'Vleugel' },
  { value: 'S', label: 'Spits' },
];
export const POSITION_LABEL: Record<Position, string> = Object.fromEntries(POSITIONS.map((p) => [p.value, p.label])) as Record<Position, string>;
/** Korte weergave: "1. Spits · 2. Vleugel". */
export const positionsSummary = (positions: Position[]): string =>
  positions.length ? positions.map((p, i) => `${i + 1}. ${POSITION_LABEL[p]}`).join(' · ') : 'Geen voorkeur';

/** Niveau in vier groepen. Iedereen begint als Eeuwig talent. */
export type Level = 'rookie' | 'decent' | 'talent' | 'goat';
export const LEVELS: { value: Level; label: string }[] = [
  { value: 'rookie', label: 'Rookie' },
  { value: 'decent', label: 'Mag er ook zijn' },
  { value: 'talent', label: 'Eeuwig talent' },
  { value: 'goat', label: 'GOAT' },
];
export const LEVEL_LABEL: Record<Level, string> = { rookie: 'Rookie', decent: 'Mag er ook zijn', talent: 'Eeuwig talent', goat: 'GOAT' };
export const DEFAULT_LEVEL: Level = 'talent';
const LEVEL_POINTS: Record<Level, number> = { rookie: 1, decent: 1.5, talent: 2, goat: 3 };

export type Side = 'hesjes' | 'zonder';
export type TeamMode = 'eigen' | 'gemengd';

export interface TeamPlayer {
  id: number;
  name: string;
  /** Eigen clubteam: 1 of 2. */
  team: 1 | 2;
  /** Voorkeursposities op volgorde; de eerste is de favoriet. Leeg = geen voorkeur opgegeven. */
  positions: Position[];
  /** Zonder niveau geldt Eeuwig talent. */
  level: Level | null;
}

export interface Assignment {
  player_id: number;
  field: 1 | 2;
  side: Side | 'extra';
}

export interface FieldTeams {
  field: 1 | 2;
  hesjes: TeamPlayer[];
  zonder: TeamPlayer[];
}

export interface TeamResult {
  fields: FieldTeams[];
  /** Extra speler bij een oneven aantal: speelt mee met het team dat als laatste een doelpunt tegen kreeg. */
  extra: TeamPlayer | null;
  extraField: 1 | 2 | null;
  /** Bij dit team begint de extra speler: het team met het laagste totaalniveau. */
  extraStartsWith: Side | null;
}

export const levelOf = (p: TeamPlayer): number => LEVEL_POINTS[p.level ?? DEFAULT_LEVEL];
export const primaryPosition = (p: TeamPlayer): Position | null => p.positions[0] ?? null;
/** Hoeveel spelers per niveau in een team, voor de balans die de trainer ziet. */
export const levelCounts = (players: TeamPlayer[]): Record<Level, number> => {
  const counts: Record<Level, number> = { rookie: 0, decent: 0, talent: 0, goat: 0 };
  players.forEach((p) => { counts[p.level ?? DEFAULT_LEVEL] += 1; });
  return counts;
};
export const teamLevel = (players: TeamPlayer[]): number => players.reduce((sum, p) => sum + levelOf(p), 0);

/** Volgorde bij gelijk niveau. Standaard op id; met een willekeurige volgorde geeft "Opnieuw verdelen" een andere indeling. */
type TieOrder = Map<number, number> | null;
const byLevelDesc = (tie: TieOrder) => (a: TeamPlayer, b: TeamPlayer) =>
  levelOf(b) - levelOf(a) || (tie ? (tie.get(a.id) ?? 0) - (tie.get(b.id) ?? 0) : 0) || a.id - b.id;

/**
 * Verdeelt spelers over bakken met een vaste grootte. De sterkste speler eerst; elke speler gaat naar de bak
 * met de minste spelers met dezelfde favoriete positie, daarna het laagste totaalniveau.
 */
const distribute = (players: TeamPlayer[], capacities: number[], tie: TieOrder = null): TeamPlayer[][] => {
  const bins: TeamPlayer[][] = capacities.map(() => []);
  [...players].sort(byLevelDesc(tie)).forEach((player) => {
    let best = -1;
    bins.forEach((bin, i) => {
      if (bin.length >= capacities[i]) return;
      if (best === -1) { best = i; return; }
      const pos = primaryPosition(player);
      const samePos = (b: TeamPlayer[]) => (pos ? b.filter((p) => primaryPosition(p) === pos).length : 0);
      const a = [samePos(bin), teamLevel(bin), bin.length];
      const b = [samePos(bins[best]), teamLevel(bins[best]), bins[best].length];
      for (let k = 0; k < a.length; k++) {
        if (a[k] !== b[k]) { if (a[k] < b[k]) best = i; break; }
      }
    });
    if (best >= 0) bins[best].push(player);
  });
  return bins;
};

/** De speler die het dichtst bij het gemiddelde niveau zit: de minst storende keuze als extra speler. */
const pickExtra = (players: TeamPlayer[]): TeamPlayer => {
  const avg = teamLevel(players) / players.length;
  return [...players].sort((a, b) =>
    Math.abs(levelOf(a) - avg) - Math.abs(levelOf(b) - avg)
    || Number(primaryPosition(a) === 'K') - Number(primaryPosition(b) === 'K')
    || b.id - a.id)[0];
};

/** Eigen teams: Team 1 in hesjes, Team 2 zonder. Is één kant groter, dan schuiven er zo min mogelijk spelers door. */
const splitOwnTeams = (players: TeamPlayer[], size: number): [TeamPlayer[], TeamPlayer[]] => {
  const hesjes = players.filter((p) => p.team === 1);
  const zonder = players.filter((p) => p.team === 2);
  const move = (from: TeamPlayer[], to: TeamPlayer[]) => {
    while (from.length > size) {
      // Kies de speler waarmee het niveauverschil na het doorschuiven het kleinst is.
      const diff = teamLevel(from) - teamLevel(to);
      const chosen = [...from].sort((a, b) =>
        Math.abs(diff - 2 * levelOf(a)) - Math.abs(diff - 2 * levelOf(b))
        || Number(primaryPosition(a) === 'K') - Number(primaryPosition(b) === 'K')
        || b.id - a.id)[0];
      from.splice(from.indexOf(chosen), 1);
      to.push(chosen);
    }
  };
  move(hesjes, zonder);
  move(zonder, hesjes);
  return [hesjes, zonder];
};

/**
 * Maakt de teams. Niemand staat wissel: iedereen speelt, en bij een oneven aantal is er één extra speler.
 * Tot en met 15 spelers 2 teams, vanaf 16 spelers 4 teams op 2 velden.
 */
export const buildTeams = (present: TeamPlayer[], mode: TeamMode, rng?: () => number): TeamResult => {
  const players = [...present];
  const tie: TieOrder = rng ? new Map(players.map((p) => [p.id, rng()])) : null;
  const empty: TeamResult = { fields: [], extra: null, extraField: null, extraStartsWith: null };
  if (players.length < 2) return empty;

  const { teamSizes, extra: hasExtra } = matchFormat(players.length);
  let extra: TeamPlayer | null = null;
  if (hasExtra) {
    // In de stand "eigen teams" komt de extra speler uit het grootste clubteam, zodat de teams heel blijven.
    const team1 = players.filter((p) => p.team === 1);
    const team2 = players.filter((p) => p.team === 2);
    const pool = mode === 'eigen' && team1.length !== team2.length
      ? (team1.length > team2.length ? team1 : team2)
      : players;
    extra = pickExtra(pool);
    players.splice(players.indexOf(extra), 1);
  }

  const perSide = teamSizes.reduce((sum, s) => sum + s, 0);
  let hesjes: TeamPlayer[];
  let zonder: TeamPlayer[];
  if (mode === 'eigen') {
    [hesjes, zonder] = splitOwnTeams(players, perSide);
  } else {
    [hesjes, zonder] = distribute(players, [perSide, perSide], tie);
  }

  const hesjesPerField = distribute(hesjes, teamSizes, tie);
  const zonderPerField = distribute(zonder, teamSizes, tie);
  const fields: FieldTeams[] = teamSizes.map((_, i) => ({
    field: (i + 1) as 1 | 2,
    hesjes: hesjesPerField[i],
    zonder: zonderPerField[i],
  }));

  if (!extra) return { fields, extra: null, extraField: null, extraStartsWith: null };
  // De extra speler staat op het veld met de kleinste teams (het laatste veld).
  const last = fields[fields.length - 1];
  return {
    fields,
    extra,
    extraField: last.field,
    extraStartsWith: teamLevel(last.hesjes) <= teamLevel(last.zonder) ? 'hesjes' : 'zonder',
  };
};

/** Wisselt twee spelers van plek (ook met de extra speler). */
export const swapPlayers = (result: TeamResult, a: number, b: number): TeamResult => {
  if (a === b) return result;
  const all = [...result.fields.flatMap((f) => [...f.hesjes, ...f.zonder]), ...(result.extra ? [result.extra] : [])];
  const pa = all.find((p) => p.id === a);
  const pb = all.find((p) => p.id === b);
  if (!pa || !pb) return result;
  const swap = (p: TeamPlayer) => (p.id === a ? pb : p.id === b ? pa : p);
  const fields = result.fields.map((f) => ({ ...f, hesjes: f.hesjes.map(swap), zonder: f.zonder.map(swap) }));
  const extra = result.extra ? swap(result.extra) : null;
  const last = fields[fields.length - 1];
  return {
    fields,
    extra,
    extraField: result.extraField,
    extraStartsWith: extra ? (teamLevel(last.hesjes) <= teamLevel(last.zonder) ? 'hesjes' : 'zonder') : null,
  };
};

export const toAssignments = (result: TeamResult): Assignment[] => [
  ...result.fields.flatMap((f) => [
    ...f.hesjes.map((p) => ({ player_id: p.id, field: f.field, side: 'hesjes' as const })),
    ...f.zonder.map((p) => ({ player_id: p.id, field: f.field, side: 'zonder' as const })),
  ]),
  ...(result.extra && result.extraField ? [{ player_id: result.extra.id, field: result.extraField, side: 'extra' as const }] : []),
];

/** Bouwt de indeling terug op uit opgeslagen rijen. */
export const fromAssignments = (assignments: Assignment[], players: TeamPlayer[]): TeamResult => {
  const byId = new Map(players.map((p) => [p.id, p]));
  const fieldNumbers = [...new Set(assignments.filter((a) => a.side !== 'extra').map((a) => a.field))].sort();
  const get = (field: number, side: Side) =>
    assignments.filter((a) => a.field === field && a.side === side).map((a) => byId.get(a.player_id)).filter(Boolean) as TeamPlayer[];
  const fields: FieldTeams[] = fieldNumbers.map((field) => ({ field, hesjes: get(field, 'hesjes'), zonder: get(field, 'zonder') }));
  const extraRow = assignments.find((a) => a.side === 'extra');
  const extra = extraRow ? byId.get(extraRow.player_id) ?? null : null;
  const last = fields[fields.length - 1];
  return {
    fields,
    extra,
    extraField: extra && last ? last.field : null,
    extraStartsWith: extra && last ? (teamLevel(last.hesjes) <= teamLevel(last.zonder) ? 'hesjes' : 'zonder') : null,
  };
};

/**
 * Opstelling per teamgrootte, gebaseerd op de 1-2-3-1 (7 spelers). Kleinere teams laten eerst een vleugel vallen,
 * dan de tweede vleugel, dan een verdediger.
 */
export const formationFor = (size: number): Position[] => {
  const seven: Position[] = ['K', 'V', 'V', 'MM', 'VL', 'VL', 'S'];
  if (size >= 7) return [...seven, ...Array.from({ length: size - 7 }, (_, i): Position => (i % 2 ? 'V' : 'MM'))];
  const drop: Position[][] = [
    [], ['VL'], ['VL', 'VL'], ['VL', 'VL', 'V'], ['VL', 'VL', 'V', 'S'], ['VL', 'VL', 'V', 'S', 'MM'], ['VL', 'VL', 'V', 'S', 'MM', 'V'],
  ];
  const result = [...seven];
  drop[7 - Math.max(1, size)].forEach((pos) => result.splice(result.lastIndexOf(pos), 1));
  return result;
};

/** Hoe graag speelt iemand op deze positie? 0 = favoriet. Wie niets heeft ingevuld, kan overal staan. */
const positionCost = (player: TeamPlayer, pos: Position): number => {
  if (!player.positions.length) return 2.5;
  const rank = player.positions.indexOf(pos);
  return rank === -1 ? 10 : rank;
};

export interface LineupSpot {
  player: TeamPlayer;
  position: Position;
}

/**
 * Zet een team op in de 1-2-3-1 zodat zoveel mogelijk spelers op een positie staan die ze graag spelen.
 * Exact uitgerekend (teams zijn hooguit een handvol spelers). Volgorde: keeper, verdediging, middenveld, spits.
 */
export const lineup = (players: TeamPlayer[]): LineupSpot[] => {
  const slots = formationFor(players.length);
  const n = players.length;
  if (!n) return [];
  const sorted = [...players].sort((a, b) => a.id - b.id);
  // best[mask] = laagste kosten als de spelers in `mask` de eerste popcount(mask) plekken vullen.
  const size = 1 << n;
  const best = new Array<number>(size).fill(Infinity);
  const from = new Array<number>(size).fill(-1);
  best[0] = 0;
  for (let mask = 0; mask < size; mask++) {
    if (best[mask] === Infinity) continue;
    let slot = 0;
    for (let m = mask; m; m &= m - 1) slot++;
    if (slot >= n) continue;
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) continue;
      const next = mask | (1 << i);
      const cost = best[mask] + positionCost(sorted[i], slots[slot]);
      if (cost < best[next]) { best[next] = cost; from[next] = i; }
    }
  }
  const spots: LineupSpot[] = [];
  let mask = size - 1;
  for (let slot = n - 1; slot >= 0; slot--) {
    const i = from[mask];
    spots[slot] = { player: sorted[i], position: slots[slot] };
    mask &= ~(1 << i);
  }
  return spots;
};
