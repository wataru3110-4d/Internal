import type { CategoryDef, ItemDef } from "./types";

/**
 * Fixed assessment structure, Figma-accurate (file hMAzWHVOa4JFYgM90aNUrz, node 21:3).
 *
 * Item order matches the source spreadsheet's column order so the CSV can be
 * mapped positionally (see csv-mapping.ts). This is the single source of truth
 * for category/item labels, colors and ordering; the CSV only supplies values.
 *
 * Note on label differences vs the sample CSV: the CSV uses "Basic"/"課題解決力";
 * we keep the Figma labels "Business"/"課題解決思考".
 */
export const CATEGORIES: CategoryDef[] = [
  {
    key: "mind",
    label: "Mind",
    color: "#ea7c1c",
    items: [
      { id: "designer_mind", label: "デザイナーマインド" },
      { id: "verbalization", label: "言語化力" },
      { id: "visualization", label: "可視化力" },
      { id: "problem_solving", label: "課題解決思考" },
      { id: "will", label: "意志", axisLabel: ["担当としての", "意志"] },
    ],
  },
  {
    key: "creative",
    label: "Creative",
    color: "#1d97d8",
    items: [
      { id: "design_process", label: "デザインプロセス" },
      { id: "research", label: "リサーチ" },
      { id: "user_understanding", label: "ユーザー理解" },
      { id: "experience_design", label: "体験設計" },
      { id: "ia_ui", label: "IA・UI設計" },
      { id: "art_direction", label: "アートディレクション", axisLabel: ["アート", "ディレクション"] },
      { id: "technology", label: "テクノロジー" },
      { id: "lamp_ops", label: "LAMP運用" },
    ],
  },
  {
    key: "business",
    label: "Business",
    color: "#0bbe72",
    items: [
      { id: "pj_management", label: "PJ管理" },
      { id: "communication", label: "コミュニケーション", axisLabel: ["コミュニ", "ケーション"] },
      { id: "logical_thinking", label: "論理的思考" },
      { id: "presentation", label: "プレゼンテーション" },
      { id: "docomo_context", label: "ドコモ文脈の理解", axisLabel: ["ドコモ文脈", "の理解"] },
    ],
  },
];

/** Max value of the assessment scale (radar rings 1..5). */
export const SCALE_MAX = 5;

/** All items flattened in CSV column order. */
export const ALL_ITEMS: ItemDef[] = CATEGORIES.flatMap((c) => c.items);

/** All item ids in CSV column order. */
export const ITEM_IDS: string[] = ALL_ITEMS.map((i) => i.id);
