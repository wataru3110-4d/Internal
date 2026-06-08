import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseAssessmentCsv } from "./parse-csv";
import { computeTotal, displayTotal, teamAverageByItem } from "./compute";

const csv = readFileSync(
  fileURLToPath(new URL("../../public/data/sample.csv", import.meta.url)),
  "utf-8",
);

describe("parseAssessmentCsv", () => {
  const data = parseAssessmentCsv(csv);

  it("skips header rows and parses every person", () => {
    expect(data.people.map((p) => p.name)).toEqual([
      "奈良さん",
      "新川さん",
      "山口さん",
      "加藤さん",
      "隅本さん",
    ]);
  });

  it("matches the Figma reference person (新川さん = 31)", () => {
    const shinkawa = data.people.find((p) => p.name === "新川さん")!;
    expect(shinkawa.total).toBe(31);
    expect(shinkawa.scores.designer_mind).toBe(1.5);
    expect(shinkawa.scores.will).toBe(2);
    expect(shinkawa.scores.research).toBe(0.5);
    expect(shinkawa.scores.presentation).toBe(3);
    // CSV total equals the sum of the 18 item scores.
    expect(computeTotal(shinkawa)).toBe(31);
    expect(displayTotal(shinkawa)).toBe(31);
  });

  it("uses the CSV 平均 row as the team average", () => {
    expect(data.averageFromCsv).toBe(true);
    expect(data.teamAverage.designer_mind).toBe(2.1);
    expect(data.teamAverage.communication).toBe(2.8);
  });

  it("reads category comments when present", () => {
    const shinkawa = data.people.find((p) => p.name === "新川さん")!;
    expect(shinkawa.comments.mind).toContain("良くしたい");
    expect(shinkawa.comments.creative).toContain("リサーチ");
    expect(shinkawa.comments.business).toContain("プレゼンテーション");
    // Others have no comments.
    expect(data.people[0].comments.mind).toBeUndefined();
  });
});

describe("teamAverageByItem", () => {
  it("excludes missing scores rather than counting them as zero", () => {
    const avg = teamAverageByItem([
      { name: "a", team: "t", scores: { will: 2 }, comments: {} },
      { name: "b", team: "t", scores: {}, comments: {} },
    ]);
    expect(avg.will).toBe(2);
  });
});
