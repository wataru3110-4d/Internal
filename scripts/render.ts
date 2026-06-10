/**
 * 描画ロジック（副作用なし）。CSV読込・ファイル出力は generate-static-html.ts 側。
 * ここを単体テスト（render.test.ts）で検証する。
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { CATEGORIES, SCALE_MAX } from "../src/lib/master-data";
import { displayTotal } from "../src/lib/compute";
import type { AssessmentData, CategoryDef, Person } from "../src/lib/types";

const HERE = dirname(fileURLToPath(import.meta.url));

// ---- 配色（tailwind.config.ts と一致） --------------------------------------
export const INK = "#4d4d4d";
export const MUTED = "#666666";
export const HEADER_BG = "#eceef0";
export const DIVIDER = "#eeeeee";
export const RING = "#e6e6e6";
export const RING_NUM = "#d5d5d5";
export const AVG = "#999999";

// 英字は Akshar、日本語はシステムの日本語フォントにフォールバック（Akshar は欧文のみ）
export const FONT_SANS =
  '"Akshar", "Noto Sans JP", system-ui, -apple-system, "Hiragino Kaku Gothic ProN", "Yu Gothic", Meiryo, sans-serif';
// 英字はすべて Akshar に統一（見出し・名前・ラベル・数値）。Figma の DIN Alternate 箇所も Akshar
export const FONT_DISPLAY = '"Akshar", "Noto Sans JP", sans-serif';
export const FONT_NUMBER = FONT_DISPLAY;

// Latin サブセットの woff2 を base64 で @font-face に埋め込む（外部依存なし・単体HTMLで完結）
const fontFace = (family: string, weight: number, file: string): string => {
  const b64 = readFileSync(resolve(HERE, "fonts", file)).toString("base64");
  return `@font-face{font-family:"${family}";font-style:normal;font-weight:${weight};font-display:swap;src:url(data:font/woff2;base64,${b64}) format("woff2")}`;
};
export const FONT_FACE_CSS = fontFace("Akshar", 500, "akshar-500-latin.woff2");

// ---- ユーティリティ ----------------------------------------------------------
export const esc = (s: unknown): string =>
  String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export const initial = (name: string): string =>
  name.replace(/さん$/, "").slice(0, 1) || "?";

export const slug = (name: string, i: number): string => {
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

export function radarSvg(
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

  // グリッドの背景は同心円（Figma: gridType=circle）。リングは実線
  const rings = ringValues
    .map(
      (ring) =>
        `<circle cx="${cx}" cy="${cy}" r="${scale(ring).toFixed(
          2,
        )}" fill="none" stroke="${RING}" stroke-width="1"/>`,
    )
    .join("");

  // 放射軸（スポーク）は点線にして、円のリング（実線）と区別する
  const spokes = axes
    .map((_, i) => {
      const p = pointAt(cx, cy, radius, axisAngle(i, n));
      return `<line x1="${cx}" y1="${cy}" x2="${p.x.toFixed(2)}" y2="${p.y.toFixed(
        2,
      )}" stroke="${RING}" stroke-width="1" stroke-dasharray="2 3"/>`;
    })
    .join("");

  // 目盛り数値は上スポーク上に中央寄せ。背景に白を敷いてリング線を避ける
  const ringNums = ringValues
    .map((ring) => {
      const p = pointAt(cx, cy, scale(ring), axisAngle(0, n));
      return `<rect x="${(p.x - 5).toFixed(2)}" y="${(p.y - 7).toFixed(
        2,
      )}" width="10" height="14" fill="#ffffff"/><text x="${p.x.toFixed(2)}" y="${(
        p.y + 4
      ).toFixed(
        2,
      )}" font-size="12" fill="${RING_NUM}" text-anchor="middle" style="font-family:${FONT_DISPLAY}">${ring}</text>`;
    })
    .join("");

  const seriesSvg = series
    .map((s) => {
      const pts = poly(scale, s.values);
      if (!pts) return "";
      // 平均（dashed）はできるだけ細い線・小さい点に
      const isAvg = s.style === "dashed";
      const dash = isAvg ? ` stroke-dasharray="4 3"` : "";
      const strokeW = isAvg ? 1 : 2;
      const dotR = isAvg ? 2 : 3.5;
      const fill = s.fill ? `${s.color}` : "none";
      const fillOp = s.fill ? 0.25 : 0;
      const dots = s.values
        .map((v, i) => {
          if (v === undefined) return "";
          const p = pointAt(cx, cy, scale(v), axisAngle(i, n));
          return `<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(
            2,
          )}" r="${dotR}" fill="${s.color}"/>`;
        })
        .join("");
      return `<polygon points="${pts}" fill="${fill}" fill-opacity="${fillOp}" stroke="${s.color}" stroke-width="${strokeW}"${dash} stroke-linejoin="round"/>${dots}`;
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
export function categoryPanel(
  category: CategoryDef,
  person: Person,
  average: Record<string, number>,
): string {
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
      // 数値に合わせた線（Figma: ラベル/数値の下に高さ2pxの帯。色付き幅 = score / SCALE_MAX）
      const pct = v === undefined ? 0 : Math.max(0, Math.min(100, (v / SCALE_MAX) * 100));
      return `<div class="row">
        <div class="row-top"><span class="row-label">${esc(item.label)}</span><span class="row-val">${
        v ?? "—"
      }</span></div>
        <div class="row-bar"><span class="row-bar-fill" style="width:${pct}%;background:${
        category.color
      }"></span></div>
      </div>`;
    })
    .join("");

  return `<section class="panel">
    <div class="panel-head">
      <h2 class="cat-title"><span class="cat-hl" style="background:${category.color}"></span>${esc(
        category.label,
      )}</h2>
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
export function sheet(person: Person, data: AssessmentData): string {
  const panels = CATEGORIES.map((c) => categoryPanel(c, person, data.teamAverage)).join(
    '<div class="vrule"></div>',
  );
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
    <div class="legend-row">
      <span class="legend-label">チーム平均</span>
      <svg width="60" height="2" aria-hidden><line x1="0" y1="1" x2="60" y2="1" stroke="${AVG}" stroke-width="1.5" stroke-dasharray="5 4"/></svg>
    </div>
    <div class="body">${panels}</div>
  </div>`;
}

// ---- 共通スタイル（Tailwind 相当を素のCSSで） --------------------------------
export const SHEET_CSS = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:${FONT_SANS};color:${INK};background:#f3f4f6}
  .sheet{width:1920px;height:1080px;background:#fff;display:flex;flex-direction:column}
  .sheet-head{display:flex;align-items:center;justify-content:space-between;background:${HEADER_BG};padding:32px 72px}
  .who{display:flex;align-items:center;gap:30px}
  .avatar{width:78px;height:78px;border-radius:50%;background:rgba(77,77,77,.1);display:flex;align-items:center;justify-content:center;font-family:${FONT_SANS};font-size:33px;color:${INK}}
  .who-name{font-family:${FONT_DISPLAY};font-size:40.5px;font-weight:500;line-height:1;color:${INK}}
  .who-team{font-family:${FONT_DISPLAY};font-size:18px;font-weight:500;color:${INK};margin-top:3px}
  .total{width:320px;display:flex;align-items:flex-end;justify-content:space-between;border-bottom:1px solid ${INK};padding-bottom:12px}
  .total-label{font-family:${FONT_DISPLAY};font-size:24px;font-weight:500;color:${INK}}
  .total-val{font-family:${FONT_NUMBER};font-size:56px;font-weight:500;line-height:1;color:${INK}}
  .legend-row{display:flex;align-items:center;gap:8px;padding:32px 40px 0;font-size:12px;color:${MUTED}}
  .legend-label{white-space:nowrap}
  .body{display:flex;flex:1;align-items:stretch;justify-content:center;gap:27.5px;padding:24px 0 32px}
  .panel{width:520px;flex:none;display:flex;flex-direction:column;gap:16px;padding:0 24px}
  .vrule{align-self:stretch;border-left:1px solid ${DIVIDER}}
  .panel-head{text-align:center}
  .cat-title{position:relative;display:inline-block;font-family:${FONT_DISPLAY};font-size:24px;font-weight:500;color:${INK}}
  .cat-hl{position:absolute;bottom:2px;left:0;z-index:-1;height:10px;width:100%;opacity:.35}
  .chart{margin:0 auto;width:100%;aspect-ratio:1/1}
  .scores{display:grid;grid-template-columns:1fr 1fr;column-gap:32px;row-gap:24px}
  .row{display:flex;flex-direction:column;gap:4px}
  .row-top{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:15px;color:${MUTED}}
  .row-label{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .row-val{flex-shrink:0;font-variant-numeric:tabular-nums}
  .row-bar{display:flex;width:100%;height:2px;border-radius:30px;overflow:hidden;background:${DIVIDER}}
  .row-bar-fill{height:2px;border-radius:30px}
  .comment{margin-top:auto;white-space:pre-line;border-radius:6px;background:#f5f5f5;padding:16px;font-size:12px;line-height:1.5;color:${MUTED};min-height:96px}
  .comment-empty{color:#bbbbbb}
`;

// 画面では幅にフィット、印刷では原寸1920×1080
export const PAGE_CSS = `
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

export function htmlDoc(title: string, bodyInner: string, extraCss = ""): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${esc(title)}</title>
<style>${FONT_FACE_CSS}${SHEET_CSS}${PAGE_CSS}${extraCss}</style>
</head>
<body>${bodyInner}</body>
</html>`;
}

// 画面で原寸を縮小表示するためのラッパ（JSで親幅にフィット）
export const FIT_SCRIPT = `<script>
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

// ---- 一覧ページ（index.html） -----------------------------------------------
export const INDEX_CSS = `
  body{background:#f3f4f6;padding:40px}
  .wrap{max-width:880px;margin:0 auto}
  h1{font-family:${FONT_DISPLAY};font-size:28px;font-weight:500;color:${INK};margin-bottom:4px}
  .meta{color:${MUTED};font-size:14px;margin-bottom:24px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}
  .card{display:flex;align-items:center;gap:14px;background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;text-decoration:none;color:${INK}}
  .card:hover{border-color:#cbd5e1;box-shadow:0 1px 6px rgba(0,0,0,.08)}
  .card-avatar{width:44px;height:44px;border-radius:50%;background:rgba(77,77,77,.1);display:flex;align-items:center;justify-content:center;font-family:${FONT_SANS};font-size:18px}
  .card-name{flex:1;font-size:16px}
  .card-total{font-family:${FONT_NUMBER};font-size:24px;font-weight:500}
  .all-link{display:inline-block;margin-bottom:24px;color:#2563eb;font-size:14px}
`;

export function indexBody(
  data: AssessmentData,
  entries: { person: Person; file: string }[],
): string {
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
  return `<div class="wrap">
  <h1>${esc(data.team)}</h1>
  <p class="meta">${data.people.length}名 ／ チーム平均: ${
    data.averageFromCsv ? "CSVの平均行" : "メンバーから自動算出"
  }</p>
  <a class="all-link" href="./all.html">▸ 全員分を1ページに表示（一括PDF用）</a>
  <div class="grid">${cards}</div>
</div>`;
}
