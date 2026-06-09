import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { parseAssessmentCsv } from "../src/lib/parse-csv";
import { CATEGORIES, SCALE_MAX } from "../src/lib/master-data";
import {
  FONT_FACE_CSS,
  SHEET_CSS,
  categoryPanel,
  radarSvg,
  sheet,
} from "./render";

const HERE = dirname(fileURLToPath(import.meta.url));
const sampleCsv = readFileSync(resolve(HERE, "../public/data/sample.csv"), "utf8");
const data = parseAssessmentCsv(sampleCsv);
const person = data.people[0];

/** SHEET_CSS から `selector{...}` の宣言ブロックを取り出す（selector の直後は必ず `{`）。 */
function declsOf(selector: string): Record<string, string> {
  const re = new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*\\{([^}]*)\\}");
  const m = SHEET_CSS.match(re);
  if (!m) throw new Error(`selector not found: ${selector}`);
  const out: Record<string, string> = {};
  for (const part of m[1].split(";")) {
    const i = part.indexOf(":");
    if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return out;
}

// Figma (file hMAzWHVOa4JFYgM90aNUrz) から読み取った余白・サイズの基準値
describe("レイアウトの余白・サイズが Figma と一致する", () => {
  it("シートは 16:9 / 1920x1080", () => {
    const s = declsOf(".sheet");
    expect(s.width).toBe("1920px");
    expect(s.height).toBe("1080px");
  });

  it("ヘッダーの余白は padding 32px 72px（Figma px-72 / py-32）", () => {
    expect(declsOf(".sheet-head").padding).toBe("32px 72px");
    expect(declsOf(".who").gap).toBe("30px"); // プロフィールの gap-30
  });

  it("Total ブロックは幅320 / 下余白12", () => {
    const t = declsOf(".total");
    expect(t.width).toBe("320px");
    expect(t["padding-bottom"]).toBe("12px");
  });

  it("チーム平均の凡例は padding 32px 40px 0 / gap 8px（Figma pt-32 px-40 gap-8）", () => {
    const l = declsOf(".legend-row");
    expect(l.padding).toBe("32px 40px 0");
    expect(l.gap).toBe("8px");
  });

  it("カテゴリ列の余白：パネル gap16 / padding 0 24、スコア列 column-gap32 row-gap24", () => {
    const panel = declsOf(".panel");
    expect(panel.gap).toBe("16px");
    expect(panel.padding).toBe("0 24px");
    const scores = declsOf(".scores");
    expect(scores["column-gap"]).toBe("32px"); // Figma: 列228px・左16px・次列 x=276 → 間隔32
    expect(scores["row-gap"]).toBe("24px"); // Figma: 行ピッチ48 − 行高24
  });

  it("項目行は gap4（ラベル/数値と線の間）/ 線は高さ2px", () => {
    expect(declsOf(".row").gap).toBe("4px");
    expect(declsOf(".row-bar").height).toBe("2px");
    expect(declsOf(".row-bar-fill").height).toBe("2px");
  });

  it("コメント枠は余白16 / 行間1.5（Figma p-16 leading-1.5）", () => {
    const c = declsOf(".comment");
    expect(c.padding).toBe("16px");
    expect(c["line-height"]).toBe("1.5");
  });
});

describe("文字サイズ・ウェイトが Figma と一致する", () => {
  it("氏名40.5 / チーム名18 / Totalラベル24 / Total値56 / カテゴリ見出し24", () => {
    expect(declsOf(".who-name")["font-size"]).toBe("40.5px");
    expect(declsOf(".who-team")["font-size"]).toBe("18px");
    expect(declsOf(".total-label")["font-size"]).toBe("24px");
    expect(declsOf(".total-val")["font-size"]).toBe("56px");
    expect(declsOf(".cat-title")["font-size"]).toBe("24px");
  });
  it("カテゴリ見出しのハイライトは高さ10px", () => {
    expect(declsOf(".cat-hl").height).toBe("10px");
  });
  it("スコア項目・凡例は15px / 12px", () => {
    expect(declsOf(".row-top")["font-size"]).toBe("15px");
    expect(declsOf(".legend-row")["font-size"]).toBe("12px");
  });
});

describe("英字フォントは Akshar に統一（DIN/Barlow を使わない）", () => {
  it("Akshar の woff2 が埋め込まれている", () => {
    expect(FONT_FACE_CSS).toContain('font-family:"Akshar"');
    expect(FONT_FACE_CSS).toContain("data:font/woff2;base64,");
  });
  it("CSS に Barlow / DIN Alternate が残っていない", () => {
    expect(SHEET_CSS).not.toContain("Barlow");
    expect(SHEET_CSS).not.toContain("DIN Alternate");
  });
  it("Total 値・カテゴリ見出しは Akshar 指定", () => {
    expect(declsOf(".total-val")["font-family"]).toContain("Akshar");
    expect(declsOf(".cat-title")["font-family"]).toContain("Akshar");
  });
});

describe("レーダーチャートが Figma の仕様に合う", () => {
  const axes = CATEGORIES[0].items.map((it) => ({ label: it.label, lines: it.axisLabel }));
  const svg = radarSvg(
    axes,
    SCALE_MAX,
    [
      { values: axes.map(() => 3), color: "#999999", style: "dashed" },
      { values: axes.map(() => 4), color: "#ea7c1c", style: "solid", fill: true },
    ],
  );

  it("グリッド背景は同心円（SCALE_MAX 本の円リング）", () => {
    const rings = svg.match(/<circle[^>]*fill="none"[^>]*stroke="#e6e6e6"[^>]*\/>/g) ?? [];
    expect(rings).toHaveLength(SCALE_MAX);
  });
  it("放射スポークは点線（リングは実線）", () => {
    const spokes = svg.match(/<line[^>]*stroke-dasharray="2 3"[^>]*\/>/g) ?? [];
    expect(spokes).toHaveLength(axes.length);
  });
  it("チーム平均は細い破線（stroke-width 1 / dasharray）", () => {
    expect(svg).toMatch(/<polygon[^>]*stroke="#999999" stroke-width="1" stroke-dasharray="4 3"/);
  });
  it("本人は実線2px・塗り0.25", () => {
    expect(svg).toMatch(/<polygon[^>]*fill-opacity="0.25" stroke="#ea7c1c" stroke-width="2"/);
  });
});

describe("数値に合わせた線（スコアバー）の長さが score/SCALE_MAX に一致する", () => {
  it("カテゴリパネルの各項目バー幅 = 値/最大×100%", () => {
    const cat = CATEGORIES[0];
    const html = categoryPanel(cat, person, data.teamAverage);
    for (const item of cat.items) {
      const v = person.scores[item.id];
      if (v === undefined) continue;
      const pct = (v / SCALE_MAX) * 100;
      expect(html).toContain(`width:${pct}%;background:${cat.color}`);
    }
  });
});

describe("シート全体の構造", () => {
  const html = sheet(person, data);
  it("3カテゴリ分のパネルがある", () => {
    expect(html.match(/class="panel"/g)).toHaveLength(CATEGORIES.length);
  });
  it("ヘッダー（氏名・Total）と凡例を含む", () => {
    expect(html).toContain(`class="who-name">${person.name}`);
    expect(html).toContain('class="total-label">Total');
    expect(html).toContain('class="legend-label">チーム平均');
  });
});
