/**
 * 静的HTMLジェネレータ（アプリを起動せず CSV → 自己完結HTML を吐き出す）
 *
 * 既存のロジックをそのまま再利用する（単一の真実のソース）:
 *   - parseAssessmentCsv … CSVパース／チーム平均算出
 *   - master-data        … カテゴリ・項目・色・スケール
 *   - compute            … Total 表示値
 *
 * ビュー層だけ、React/Tailwind に依存しない素のHTML＋インラインSVGで再現する。
 * 出力はすべて自己完結（外部CSS・外部フォント・外部画像に実行時依存しない）。
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
import { CATEGORIES, SCALE_MAX } from "../src/lib/master-data";
import { displayTotal } from "../src/lib/compute";
import type { AssessmentData, CategoryDef, Person } from "../src/lib/types";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// ---- 引数 -------------------------------------------------------------------
const csvArg = process.argv[2] ?? "public/data/assessments.csv";
const outArg = process.argv[3] ?? "dist-static";
const teamArg = process.argv[4]; // 省略時は parse-csv の DEFAULT_TEAM

const CSV_PATH = resolve(ROOT, csvArg);
const OUT_DIR = resolve(ROOT, outArg);

// ---- 配色（tailwind.config.ts と一致） --------------------------------------
const INK = "#4d4d4d";
const MUTED = "#666666";
const HEADER_BG = "#eceef0";
const DIVIDER = "#eeeeee";
const RING = "#e6e6e6";
const RING_NUM = "#d5d5d5";
const AVG = "#999999";

const FONT_SANS =
  '"Noto Sans JP", system-ui, -apple-system, "Hiragino Kaku Gothic ProN", "Yu Gothic", Meiryo, sans-serif';
const FONT_NUM = '"Barlow Condensed", "Noto Sans JP", sans-serif';

// ---- ユーティリティ ----------------------------------------------------------
const esc = (s: unknown): string =>
  String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const initial = (name: string): string =>
  name.replace(/さん$/, "").slice(0, 1) || "?";

const slug = (name: string, i: number): string => {
  const base = name.replace(/さん$/, "").replace(/[^\w぀-ヿ一-鿿-]+/g, "_");
  return `${String(i + 1).padStart(2, "0")}_${base || "person"}`;
};

// ---- レーダーチャート（RadarChart.tsx と同一ジオメトリ） ----------------------
interface Series {
  values: (number | undefined)[];
  color: string;
  style: "solid" | "dashed";
  fill?: boolean;
}
const axisAngle = (i: number, n: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
const pointAt = (cx: number, cy: number, r: number, a: number) => ({
  x: cx + r * Math.cos(a),
  y: cy + r * Math.sin(a),
});

function radarSvg(
  axes: { label: string; lines?: string[] }[],
  max: number,
  series: Series[],
  size = 360,
): string {
  const n = axes.length;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.34;
  const labelGap = 18;
  const scale = (v: number) => (v / max) * radius;
  const ringValues = Array.from({ length: max }, (_, i) => i + 1);

  const poly = (rForV: (v: number) => number, values: (number | undefined)[]) =>
    axes
      .map((_, i) => {
        const v = values[i];
        if (v === undefined) return null;
        const p = pointAt(cx, cy, rForV(v), axisAngle(i, n));
        return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
      })
      .filter(Boolean)
      .join(" ");

  const rings = ringValues
    .map(
      (ring) =>
        `<polygon points="${axes
          .map((_, i) => {
            const p = pointAt(cx, cy, scale(ring), axisAngle(i, n));
            return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
          })
          .join(" ")}" fill="none" stroke="${RING}" stroke-width="1"/>`,
    )
    .join("");

  const spokes = axes
    .map((_, i) => {
      const p = pointAt(cx, cy, radius, axisAngle(i, n));
      return `<line x1="${cx}" y1="${cy}" x2="${p.x.toFixed(2)}" y2="${p.y.toFixed(
        2,
      )}" stroke="${RING}" stroke-width="1"/>`;
    })
    .join("");

  const ringNums = ringValues
    .map((ring) => {
      const p = pointAt(cx, cy, scale(ring), axisAngle(0, n));
      return `<text x="${(p.x + 6).toFixed(2)}" y="${(p.y + 4).toFixed(
        2,
      )}" font-size="11" fill="${RING_NUM}" style="font-family:${FONT_NUM}">${ring}</text>`;
    })
    .join("");

  const seriesSvg = series
    .map((s) => {
      const pts = poly(scale, s.values);
      if (!pts) return "";
      const dash = s.style === "dashed" ? ` stroke-dasharray="5 4"` : "";
      const fill = s.fill ? `${s.color}` : "none";
      const fillOp = s.fill ? 0.25 : 0;
      const dots = s.values
        .map((v, i) => {
          if (v === undefined) return "";
          const p = pointAt(cx, cy, scale(v), axisAngle(i, n));
          return `<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="${
            s.style === "dashed" ? 2.5 : 3.5
          }" fill="${s.color}"/>`;
        })
        .join("");
      return `<polygon points="${pts}" fill="${fill}" fill-opacity="${fillOp}" stroke="${s.color}" stroke-width="2"${dash} stroke-linejoin="round"/>${dots}`;
    })
    .join("");

  const labels = axes
    .map((axis, i) => {
      const angle = axisAngle(i, n);
      const p = pointAt(cx, cy, radius + labelGap, angle);
      const cos = Math.cos(angle);
      const anchor = cos > 0.2 ? "start" : cos < -0.2 ? "end" : "middle";
      const lines = axis.lines ?? [axis.label];
      const tspans = lines
        .map(
          (line, li) =>
            `<tspan x="${p.x.toFixed(2)}" dy="${
              li === 0 ? `${-((lines.length - 1) * 0.6)}em` : "1.2em"
            }">${esc(line)}</tspan>`,
        )
        .join("");
      return `<text x="${p.x.toFixed(2)}" y="${p.y.toFixed(
        2,
      )}" font-size="13" fill="${MUTED}" text-anchor="${anchor}" dominant-baseline="middle" style="font-family:${FONT_SANS}">${tspans}</text>`;
    })
    .join("");

  // 軸ラベルが外周より外に出るぶん、viewBox に左右・上下の余白を確保して見切れを防ぐ
  const padX = 52;
  const padY = 16;
  return `<svg viewBox="${-padX} ${-padY} ${size + padX * 2} ${
    size + padY * 2
  }" width="100%" height="100%" role="img">${rings}${spokes}${ringNums}${seriesSvg}${labels}</svg>`;
}

// ---- カテゴリパネル（CategoryPanel / ScoreList / ScoreLegend 相当） -----------
function categoryPanel(category: CategoryDef, person: Person, average: Record<string, number>): string {
  const axes = category.items.map((it) => ({ label: it.label, lines: it.axisLabel }));
  const personValues = category.items.map((it) => person.scores[it.id]);
  const avgValues = category.items.map((it) => average[it.id]);
  const comment = person.comments[category.key];

  const svg = radarSvg(axes, SCALE_MAX, [
    { values: avgValues, color: AVG, style: "dashed" },
    { values: personValues, color: category.color, style: "solid", fill: true },
  ]);

  const scoreRows = category.items
    .map((item) => {
      const v = person.scores[item.id];
      return `<div class="row"><span class="row-label">${esc(item.label)}</span><span class="row-val">${
        v ?? "—"
      }</span></div>`;
    })
    .join("");

  const legend = `<div class="legend">
      <span><svg width="24" height="6"><line x1="0" y1="3" x2="24" y2="3" stroke="${category.color}" stroke-width="2"/></svg>本人</span>
      <span><svg width="24" height="6"><line x1="0" y1="3" x2="24" y2="3" stroke="${AVG}" stroke-width="2" stroke-dasharray="5 4"/></svg>チーム平均</span>
    </div>`;

  return `<section class="panel">
    <div class="panel-head">
      <h2 class="cat-title"><span class="cat-hl" style="background:${category.color}"></span>${esc(
        category.label,
      )}</h2>
      ${legend}
    </div>
    <div class="chart">${svg}</div>
    <div class="scores">${scoreRows}</div>
    ${
      comment
        ? `<div class="comment">${esc(comment)}</div>`
        : `<div class="comment comment-empty">コメント未入力</div>`
    }
  </section>`;
}

// ---- 1人分のシート（AssessmentSheet / PersonHeader 相当） --------------------
function sheet(person: Person, data: AssessmentData): string {
  const panels = CATEGORIES.map((c) => categoryPanel(c, person, data.teamAverage)).join("");
  return `<div class="sheet">
    <header class="sheet-head">
      <div class="who">
        <div class="avatar">${esc(initial(person.name))}</div>
        <div class="who-text">
          <p class="who-name">${esc(person.name)}</p>
          <p class="who-team">${esc(person.team)}</p>
        </div>
      </div>
      <div class="total"><span class="total-label">Total</span><span class="total-val">${displayTotal(
        person,
      )}</span></div>
    </header>
    <div class="body">${panels}</div>
  </div>`;
}

// ---- 共通スタイル（Tailwind 相当を素のCSSで） --------------------------------
const SHEET_CSS = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:${FONT_SANS};color:${INK};background:#f3f4f6}
  .sheet{width:1920px;height:1080px;background:#fff;display:flex;flex-direction:column}
  .sheet-head{display:flex;align-items:center;justify-content:space-between;background:${HEADER_BG};padding:32px 75px}
  .who{display:flex;align-items:center;gap:30px}
  .avatar{width:78px;height:78px;border-radius:50%;background:rgba(77,77,77,.1);display:flex;align-items:center;justify-content:center;font-family:${FONT_NUM};font-size:33px;color:${INK}}
  .who-name{font-family:${FONT_NUM};font-size:40px;font-weight:700;line-height:1;color:${INK}}
  .who-team{font-size:18px;color:${INK};margin-top:3px}
  .total{width:320px;display:flex;align-items:flex-end;justify-content:space-between;border-bottom:1px solid ${INK};padding-bottom:12px}
  .total-label{font-family:${FONT_NUM};font-size:24px;font-weight:700;color:${INK}}
  .total-val{font-family:${FONT_NUM};font-size:56px;font-weight:700;line-height:1;color:${INK}}
  .body{display:flex;flex:1;align-items:stretch;padding:32px 40px}
  .panel{flex:1;display:flex;flex-direction:column;gap:16px;padding:0 24px}
  .panel + .panel{border-left:1px solid ${DIVIDER}}
  .panel-head{display:flex;align-items:center;justify-content:space-between}
  .cat-title{position:relative;display:inline-block;font-family:${FONT_NUM};font-size:24px;font-weight:700;color:${INK}}
  .cat-hl{position:absolute;bottom:4px;left:0;z-index:-1;height:9px;width:100%;opacity:.35}
  .legend{display:flex;align-items:center;gap:16px;font-size:12px;color:${MUTED}}
  .legend span{display:flex;align-items:center;gap:6px}
  .chart{margin:0 auto;width:100%;max-width:380px;aspect-ratio:1/1}
  .scores{display:grid;grid-template-columns:1fr 1fr;column-gap:32px}
  .row{display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid ${DIVIDER};padding:6px 0;font-size:15px;color:${MUTED}}
  .row-label{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .row-val{flex-shrink:0;font-family:${FONT_NUM};font-variant-numeric:tabular-nums}
  .comment{margin-top:auto;white-space:pre-line;border-radius:6px;background:#f5f5f5;padding:16px;font-size:12px;line-height:1.7;color:${MUTED};min-height:96px}
  .comment-empty{color:#bbbbbb}
`;

// 画面では幅にフィット、印刷では原寸1920×1080
const PAGE_CSS = `
  .scale-outer{padding:24px;overflow:auto}
  .scale-box{margin:0 auto;box-shadow:0 1px 8px rgba(0,0,0,.12)}
  @media print{
    @page{size:1920px 1080px;margin:0}
    body{background:#fff}
    .scale-outer{padding:0 !important;overflow:visible !important}
    .scale-box{box-shadow:none !important}
    .page-break{page-break-after:always}
  }
`;

function htmlDoc(title: string, bodyInner: string, extraCss = ""): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${esc(title)}</title>
<style>${SHEET_CSS}${PAGE_CSS}${extraCss}</style>
</head>
<body>${bodyInner}</body>
</html>`;
}

// 画面で原寸を縮小表示するためのラッパ（JSで親幅にフィット）
const FIT_SCRIPT = `<script>
(function(){
  function fit(){
    document.querySelectorAll('.scale-box').forEach(function(box){
      var sheet=box.querySelector('.sheet');if(!sheet)return;
      var s=Math.min(1,(box.parentElement.clientWidth-48)/1920);
      sheet.style.transformOrigin='top left';sheet.style.transform='scale('+s+')';
      box.style.width=(1920*s)+'px';box.style.height=(1080*s)+'px';
    });
  }
  window.addEventListener('resize',fit);window.addEventListener('load',fit);fit();
})();
</script>`;

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
const cards = entries
  .map(
    ({ person, file }) =>
      `<a class="card" href="./sheets/${esc(file)}">
        <span class="card-avatar">${esc(initial(person.name))}</span>
        <span class="card-name">${esc(person.name)}</span>
        <span class="card-total">${displayTotal(person)}</span>
      </a>`,
  )
  .join("");
const indexCss = `
  body{background:#f3f4f6;padding:40px}
  .wrap{max-width:880px;margin:0 auto}
  h1{font-family:${FONT_NUM};font-size:28px;color:${INK};margin-bottom:4px}
  .meta{color:${MUTED};font-size:14px;margin-bottom:24px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}
  .card{display:flex;align-items:center;gap:14px;background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;text-decoration:none;color:${INK}}
  .card:hover{border-color:#cbd5e1;box-shadow:0 1px 6px rgba(0,0,0,.08)}
  .card-avatar{width:44px;height:44px;border-radius:50%;background:rgba(77,77,77,.1);display:flex;align-items:center;justify-content:center;font-family:${FONT_NUM};font-size:18px}
  .card-name{flex:1;font-size:16px}
  .card-total{font-family:${FONT_NUM};font-size:24px;font-weight:700}
  .all-link{display:inline-block;margin-bottom:24px;color:#2563eb;font-size:14px}
`;
const indexInner = `<div class="wrap">
  <h1>${esc(data.team)}</h1>
  <p class="meta">${data.people.length}名 ／ チーム平均: ${
    data.averageFromCsv ? "CSVの平均行" : "メンバーから自動算出"
  }</p>
  <a class="all-link" href="./all.html">▸ 全員分を1ページに表示（一括PDF用）</a>
  <div class="grid">${cards}</div>
</div>`;
writeFileSync(resolve(OUT_DIR, "index.html"), htmlDoc(`${data.team} — アセスメント結果一覧`, indexInner, indexCss));

console.log(`✓ ${data.people.length} 名分を出力しました`);
console.log(`  ${resolve(OUT_DIR, "index.html")}`);
console.log(`  ${resolve(OUT_DIR, "all.html")}  (一括PDF用)`);
console.log(`  ${resolve(OUT_DIR, "sheets")}/*.html  (1人=1ファイル)`);
