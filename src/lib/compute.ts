import { ITEM_IDS, SCALE_MAX } from "./master-data";
import type { Person } from "./types";

/**
 * Average score per item across the given people (missing scores excluded,
 * not counted as zero). Returns itemId -> average, rounded to one decimal.
 */
export function teamAverageByItem(people: Person[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const id of ITEM_IDS) {
    let sum = 0;
    let count = 0;
    for (const p of people) {
      const v = p.scores[id];
      if (v !== undefined) {
        sum += v;
        count += 1;
      }
    }
    if (count > 0) out[id] = Math.round((sum / count) * 10) / 10;
  }
  return out;
}

/** Sum of all item scores for a person (the Figma "Total"). */
export function computeTotal(person: Person): number {
  return ITEM_IDS.reduce((acc, id) => acc + (person.scores[id] ?? 0), 0);
}

/** Total to display: the CSV "合計" when present, else computed. */
export function displayTotal(person: Person): number {
  return person.total ?? computeTotal(person);
}

/** Whether a value sits on the allowed 0.5 grid within [0, SCALE_MAX]. */
export function isValidScore(value: number): boolean {
  return value >= 0 && value <= SCALE_MAX && Number.isInteger(value * 2);
}
