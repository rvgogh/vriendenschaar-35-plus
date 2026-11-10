// Regels voor het trainingsvoorstel. Geen database of React hier, zodat alles los te testen is.

export type DrillCategory = 'warming-up' | 'passen' | 'afwerken' | 'tactisch' | 'partijvorm' | 'conditie';
export type VariantKey = '10-13' | '14-19' | '20-25';
export type Theme = 'passen' | 'afwerken' | 'tactisch';

export interface Drill {
  id: string;
  name: string;
  category: DrillCategory;
  duration: number;
  min_players: number;
  max_players: number;
  tactical: boolean;
  fixed: boolean;
  material: string | null;
  explanation: string;
  coaching_points: string[];
  variants: Partial<Record<VariantKey, string>>;
  sketch: string | null;
}

export type SlotKey = 'warming-up' | 'oefenvorm-1' | 'vast' | 'oefenvorm-2' | 'partijvorm';

export interface Slot {
  key: SlotKey;
  label: string;
  minutes: number;
  categories: DrillCategory[];
}

/** Vaste opbouw van 75 minuten. Het rondje van Max staat altijd op plek 3. */
export const SLOTS: Slot[] = [
  { key: 'warming-up', label: 'Warming-up', minutes: 10, categories: ['warming-up'] },
  { key: 'oefenvorm-1', label: 'Oefenvorm 1', minutes: 15, categories: ['passen', 'afwerken', 'tactisch'] },
  { key: 'vast', label: 'Vast onderdeel', minutes: 10, categories: ['conditie'] },
  { key: 'oefenvorm-2', label: 'Oefenvorm 2', minutes: 15, categories: ['passen', 'afwerken', 'tactisch'] },
  { key: 'partijvorm', label: 'Partijvorm', minutes: 25, categories: ['partijvorm'] },
];

export const THEMES: { value: Theme; label: string }[] = [
  { value: 'passen', label: 'Passen' },
  { value: 'afwerken', label: 'Afwerken' },
  { value: 'tactisch', label: 'Tactisch' },
];

export const CATEGORY_LABELS: Record<DrillCategory, string> = {
  'warming-up': 'Warming-up',
  passen: 'Passen',
  afwerken: 'Afwerken',
  tactisch: 'Tactisch',
  partijvorm: 'Partijvorm',
  conditie: 'Conditie',
};

export const FIXED_DRILL_ID = 'vast-rondje-max';
export const RECENT_DAYS = 21;

export interface PlanBlock {
  position: number;
  drill_id: string;
  minutes: number;
}

export const variantKey = (playerCount: number): VariantKey =>
  playerCount <= 13 ? '10-13' : playerCount <= 19 ? '14-19' : '20-25';

export const variantText = (drill: Drill, playerCount: number): string =>
  drill.variants?.[variantKey(playerCount)] ?? '';

/** Past de oefening bij dit aantal spelers? Onder de 10 en boven de 25 rekenen we met de dichtstbijzijnde grens. */
export const fitsPlayerCount = (drill: Drill, playerCount: number): boolean => {
  const n = Math.min(25, Math.max(10, playerCount));
  return drill.min_players <= n && n <= drill.max_players;
};

/**
 * Indeling van de afsluitende partij: nooit wissels.
 * Tot en met 15 spelers 2 teams op 1 veld, vanaf 16 spelers 4 teams op 2 velden.
 * Bij een oneven aantal is er één extra speler.
 */
export const matchFormat = (playerCount: number): { teamSizes: number[]; extra: boolean } => {
  const extra = playerCount % 2 === 1;
  const even = playerCount - (extra ? 1 : 0);
  if (playerCount < 16) return { teamSizes: [even / 2], extra };
  return { teamSizes: [Math.ceil(even / 4), Math.floor(even / 4)], extra };
};

export const matchFormatText = (playerCount: number): string => {
  if (playerCount < 2) return 'Nog te weinig spelers';
  const { teamSizes, extra } = matchFormat(playerCount);
  const games = teamSizes.map((s) => `${s} tegen ${s}`);
  const fields = teamSizes.length === 1 ? '2 teams' : '4 teams op 2 velden';
  return `${fields}: ${games.join(' en ')}${extra ? ' + extra speler' : ''} · geen wissels`;
};

/** Welke categorie hoort bij de twee oefenvormen, gegeven het thema? */
export const slotCategories = (theme: Theme | null, rng: () => number = Math.random): [DrillCategory, DrillCategory] => {
  if (theme === 'afwerken') return ['passen', 'afwerken'];
  if (theme === 'tactisch') return ['passen', 'tactisch'];
  if (theme === 'passen') return ['passen', 'afwerken'];
  return ['passen', rng() < 0.5 ? 'afwerken' : 'tactisch'];
};

const pick = <T,>(items: T[], rng: () => number): T | undefined =>
  items.length ? items[Math.min(items.length - 1, Math.floor(rng() * items.length))] : undefined;

/** Kandidaten voor een blok. Eerst oefeningen die passen en niet recent gedaan zijn; anders wordt de eis losgelaten. */
export const candidatesFor = (
  drills: Drill[],
  categories: DrillCategory[],
  playerCount: number,
  recentIds: Set<string>,
  usedIds: Set<string> = new Set(),
): Drill[] => {
  const pool = drills.filter((d) => categories.includes(d.category) && !d.fixed && !usedIds.has(d.id));
  const fits = pool.filter((d) => fitsPlayerCount(d, playerCount));
  const fresh = fits.filter((d) => !recentIds.has(d.id));
  if (fresh.length) return fresh;
  if (fits.length) return fits;
  return pool;
};

export interface ProposeInput {
  drills: Drill[];
  playerCount: number;
  theme: Theme | null;
  recentDrillIds: string[];
  rng?: () => number;
}

/** Maakt een voorstel van vijf blokken. Geeft een lege lijst als de bibliotheek nog leeg is. */
export const proposePlan = ({ drills, playerCount, theme, recentDrillIds, rng = Math.random }: ProposeInput): PlanBlock[] => {
  const recent = new Set(recentDrillIds);
  const used = new Set<string>();
  const [first, second] = slotCategories(theme, rng);
  const wanted: Record<SlotKey, DrillCategory[]> = {
    'warming-up': ['warming-up'],
    'oefenvorm-1': [first],
    vast: ['conditie'],
    'oefenvorm-2': [second],
    partijvorm: ['partijvorm'],
  };
  const blocks: PlanBlock[] = [];
  SLOTS.forEach((slot, index) => {
    let drill: Drill | undefined;
    if (slot.key === 'vast') {
      drill = drills.find((d) => d.id === FIXED_DRILL_ID) ?? drills.find((d) => d.fixed);
    } else {
      drill = pick(candidatesFor(drills, wanted[slot.key], playerCount, recent, used), rng)
        ?? pick(candidatesFor(drills, slot.categories, playerCount, recent, used), rng);
    }
    if (!drill) return;
    used.add(drill.id);
    blocks.push({ position: index + 1, drill_id: drill.id, minutes: slot.minutes });
  });
  return blocks.length === SLOTS.length ? blocks : [];
};

/** Begintijd per blok als "19:30", gerekend vanaf de starttijd van de training. */
export const blockTimes = (trainingAt: string, blocks: { minutes: number }[]): string[] => {
  const format = new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' });
  let time = new Date(trainingAt).getTime();
  return blocks.map((block) => {
    const label = format.format(new Date(time));
    time += block.minutes * 60_000;
    return label;
  });
};

export const endTime = (trainingAt: string, blocks: { minutes: number }[]): string => {
  const total = blocks.reduce((sum, b) => sum + b.minutes, 0);
  return new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' })
    .format(new Date(new Date(trainingAt).getTime() + total * 60_000));
};
