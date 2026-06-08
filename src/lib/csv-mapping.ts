import { ITEM_IDS } from "./master-data";
import type { CategoryKey } from "./types";

/**
 * Positional layout of the source CSV (spreadsheet export).
 *
 *   col 0            : 氏名 (person name); the "平均" row marks the team average
 *   col 1 .. 18      : the 18 item scores, in master-data ITEM_IDS order
 *   col 19           : 合計 (total)
 *   col 20, 21, 22   : カテゴリ別コメント (optional, added to the same CSV)
 *
 * The first rows of the file are multi-row headers with empty name cells and
 * are skipped automatically (see parse-csv.ts).
 */
export const NAME_COL = 0;
export const FIRST_SCORE_COL = 1;
export const TOTAL_COL = FIRST_SCORE_COL + ITEM_IDS.length; // 19

/** Optional comment columns, in order, mapped to category keys. */
export const COMMENT_COLS: { col: number; category: CategoryKey }[] = [
  { col: TOTAL_COL + 1, category: "mind" },
  { col: TOTAL_COL + 2, category: "creative" },
  { col: TOTAL_COL + 3, category: "business" },
];

/** Row labels (in col 0) that denote the team-average row rather than a person. */
export const AVERAGE_ROW_LABELS = ["平均", "平均値", "average", "Average"];

/** Default team name when none is supplied (no team column exists in the CSV). */
export const DEFAULT_TEAM = "Front Design Team";
