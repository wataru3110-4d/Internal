/**
 * 静的HTMLジェネレータ（アプリを起動せず CSV → 自己完結HTML を吐き出す）
 *
 * 既存のロジックをそのまま再利用する（単一の真実のソース）:
 *   - parseAssessmentCsv … CSVパース／チーム平均算出
 *   - master-data        … カテゴリ・項目・色・スケール
 *   - compute            … Total 表示値
 *
 * 描画（HTML/CSS/SVG生成）は render.ts に分離（副作用なし・単体テスト対象）。
 * このファイルは CSV読込・ファイル出力・CLI だけを担当する。
 *
 * 使い方:
 *   npm run generate                       # public/data/assessments.csv を変換
 *   npm run generate -- path/to.csv outdir "チーム名"
 *
 * 出力:
 *   <outdir>/index.html      … メンバー一覧（各シートへのリンク）
 *   <outdir>/sheets/*.html   … 1人=1シート（16:9・印刷でPDF化可能）
 *   <outdir>/all.html        … 全シートを連結（一括でPDF化する用）
 */
import { mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parseAssessmentCsv } from "../src/lib/parse-csv";
import {
  FIT_SCRIPT,
  INDEX_CSS,
  htmlDoc,
  indexBody,
  sheet,
  slug,
} from "./render";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// ---- 引数 -------------------------------------------------------------------
const csvArg = process.argv[2] ?? "public/data/assessments.csv";
const outArg = process.argv[3] ?? "dist-static";
const teamArg = process.argv[4]; // 省略時は parse-csv の DEFAULT_TEAM

const CSV_PATH = resolve(ROOT, csvArg);
const OUT_DIR = resolve(ROOT, outArg);

// ---- メイン -----------------------------------------------------------------
const csv = readFileSync(CSV_PATH, "utf8");
const data = parseAssessmentCsv(csv, teamArg ? { team: teamArg } : {});

rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(resolve(OUT_DIR, "sheets"), { recursive: true });

// 1人=1ファイル
const entries = data.people.map((person, i) => {
  const file = `${slug(person.name, i)}.html`;
  const inner = `<div class="scale-outer"><div class="scale-box">${sheet(person, data)}</div></div>${FIT_SCRIPT}`;
  writeFileSync(resolve(OUT_DIR, "sheets", file), htmlDoc(`${person.name} — アセスメント結果`, inner));
  return { person, file };
});

// 全シート連結（一括PDF用）
const allInner =
  `<div class="scale-outer">` +
  entries
    .map(({ person }) => `<div class="scale-box page-break">${sheet(person, data)}</div>`)
    .join("") +
  `</div>${FIT_SCRIPT}`;
writeFileSync(resolve(OUT_DIR, "all.html"), htmlDoc(`${data.team} — 全員のアセスメント結果`, allInner));

// 一覧
writeFileSync(
  resolve(OUT_DIR, "index.html"),
  htmlDoc(`${data.team} — アセスメント結果一覧`, indexBody(data, entries), INDEX_CSS),
);

console.log(`✓ ${data.people.length} 名分を出力しました`);
console.log(`  ${resolve(OUT_DIR, "index.html")}`);
console.log(`  ${resolve(OUT_DIR, "all.html")}  (一括PDF用)`);
console.log(`  ${resolve(OUT_DIR, "sheets")}/*.html  (1人=1ファイル)`);
