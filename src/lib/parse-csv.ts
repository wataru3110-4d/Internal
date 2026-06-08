import Papa from "papaparse";
import { ITEM_IDS } from "./master-data";
import type { AssessmentData, CategoryKey, Person } from "./types";
import {
  AVERAGE_ROW_LABELS,
  COMMENT_COLS,
  DEFAULT_TEAM,
  FIRST_SCORE_COL,
  NAME_COL,
  TOTAL_COL,
} from "./csv-mapping";
import { teamAverageByItem } from "./compute";

export interface ParseOptions {
  /** Team label to attach to every person (CSV has no team column). */
  team?: string;
}

/** Parse a numeric cell; returns undefined for blank/non-numeric cells. */
function parseScore(cell: string | undefined): number | undefined {
  if (cell == null) return undefined;
  const trimmed = cell.trim();
  if (trimmed === "") return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : undefined;
}

function isAverageRow(name: string): boolean {
  return AVERAGE_ROW_LABELS.includes(name.trim());
}

/** Turn one CSV row into a Person (scores + optional comments + total). */
function rowToPerson(row: string[], team: string): Person {
  const scores: Record<string, number> = {};
  ITEM_IDS.forEach((id, i) => {
    const v = parseScore(row[FIRST_SCORE_COL + i]);
    if (v !== undefined) scores[id] = v;
  });

  const comments: Partial<Record<CategoryKey, string>> = {};
  for (const { col, category } of COMMENT_COLS) {
    const text = row[col]?.trim();
    if (text) comments[category] = text;
  }

  return {
    name: row[NAME_COL].trim(),
    team,
    scores,
    comments,
    total: parseScore(row[TOTAL_COL]),
  };
}

/**
 * Parse a CSV string exported from the assessment spreadsheet.
 *
 * Header rows (empty name cell) are skipped. A row whose name is "平均"
 * becomes the team average; if absent, the average is computed from members.
 */
export function parseAssessmentCsv(
  csv: string,
  options: ParseOptions = {},
): AssessmentData {
  const team = options.team ?? DEFAULT_TEAM;
  const { data } = Papa.parse<string[]>(csv, {
    skipEmptyLines: true,
  });

  const people: Person[] = [];
  let csvAverage: Person | undefined;

  for (const row of data) {
    const name = (row[NAME_COL] ?? "").trim();
    if (name === "") continue; // header / spacer rows have no name
    if (isAverageRow(name)) {
      csvAverage = rowToPerson(row, team);
      continue;
    }
    people.push(rowToPerson(row, team));
  }

  const teamAverage = csvAverage
    ? csvAverage.scores
    : teamAverageByItem(people);

  return {
    team,
    people,
    teamAverage,
    averageFromCsv: Boolean(csvAverage),
  };
}
