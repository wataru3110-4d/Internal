export type CategoryKey = "mind" | "creative" | "business";

export interface ItemDef {
  /** Stable id, used as the key for score lookups. */
  id: string;
  /** Display label (Figma-accurate). */
  label: string;
  /** Label split across lines for the radar chart axis, when needed. */
  axisLabel?: string[];
}

export interface CategoryDef {
  key: CategoryKey;
  /** Display label (Figma-accurate). */
  label: string;
  /** Accent color hex. */
  color: string;
  /** Items in CSV column order. */
  items: ItemDef[];
}

/** One person's full assessment, normalized from the CSV. */
export interface Person {
  name: string;
  /** Team label (derived from file/config, not per-row in the CSV). */
  team: string;
  /** itemId -> score (0..5, 0.5 steps). Missing items are absent. */
  scores: Record<string, number>;
  /** categoryKey -> free-text comment, when present in the CSV. */
  comments: Partial<Record<CategoryKey, string>>;
  /** Total from the CSV "合計" column when present. */
  total?: number;
}

/** Parsed result of a whole CSV file (one team, one point in time). */
export interface AssessmentData {
  team: string;
  people: Person[];
  /** Team-average scores by itemId (from the "平均" row or computed). */
  teamAverage: Record<string, number>;
  /** True when teamAverage came from a CSV "平均" row rather than computed. */
  averageFromCsv: boolean;
}
