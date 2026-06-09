# CLAUDE.md — 引き継ぎ / プロジェクト要件

> デザインスキル・アセスメント結果の**表示専用**プロジェクト。
> このファイルは後任（人／Claude）が作業を継続するための要件・設計・運用メモです。
> 仕様の「単一の真実のソース」は `src/lib/`（マスタ定義・CSVパース・集計）です。

---

## 1. 何をするものか（要件）

- デザインスキル評価の結果（スコア＋コメント）を **Figma フォーマットと同じ見た目**で表示する。
- データは Google スプレッドシートから **CSV をダウンロードして取り込む**（評価入力・管理画面・DB は持たない）。
- レーダーチャート（**Mind / Creative / Business** の3カテゴリ）に、本人スコアと
  **チーム平均（点線）**を重ねて表示する。
- **完全オフライン動作**（外部 CDN・外部フォント・外部画像に実行時依存しない）。
- 1人 = 16:9（1920×1080）の1シート。ブラウザの「印刷 / PDF」で資料化できる。

### 出力の3系統（同一デザインで揃えること）
1. **React アプリ（SPA）** … 閲覧・CSV差し替え用（`src/`）
2. **静的HTMLジェネレータ** … アプリを起動せず CSV → 自己完結HTML を一括生成（`scripts/`）
3. **Figma ネイティブ要素** … 既存 Figma ファイルに編集可能な要素として書き出し（MCP 経由・オンライン作業）

> ⚠️ 3系統はデザインが一致している必要があります。変更時は**必ず3つとも更新**してください（後述の差分メモも参照）。

---

## 2. 確定デザイン仕様（数値）

シート全体: **1920 × 1080**（固定）

| 要素 | 値 |
|---|---|
| ヘッダー背景 | `#eceef0` / 左にアバター(78px円)＋氏名＋チーム名、右に Total(ラベル24px＋数値56px・下線) |
| 全体凡例 | ヘッダー直下・左上に「チーム平均」＋灰色の点線（`stroke-dasharray 5 4`）。**本人の凡例は出さない** |
| セクション（パネル） | **幅 520px・固定**。3枚を**中央寄せ**、**間隔 55px**、間に **1px の区切り線**（`#eeeeee`）を中央配置 |
| パネル内パディング | 左右 24px |
| カテゴリ見出し | **中央寄せ**・24px。背景に半透明(0.35)のカラーハイライト（下端・高さ10px） |
| レーダーチャート | **パネル幅いっぱい**（横幅の上限なし）。`viewBox` 内 `radius = size * 0.34`、軸ラベルは外周 `+18px` |
| グリッド | 同心の**多角形**リング（`#e6e6e6`）＋スポーク＋目盛り数値(1..5, `#d5d5d5`) |
| 系列 | 本人＝カラー実線＋塗り(opacity 0.25)・点 r3.5／チーム平均＝灰`#999`点線・点 r2.5 |
| スコア一覧 | 2列グリッド・列間 32px・**行間 24px**。各行 = ラベル＋数値(15px)＋下に**スコアバー**（トラック`#eee` 2px / カラー塗り幅 = `score / 5`） |
| コメント | 背景 `#f5f5f5`・角丸6px・12px・行間1.5・最小高 96px。未入力時は「コメント未入力」(`#bbbbbb`) |

### 配色（`tailwind.config.ts` / `scripts/render.ts` で一致させる）
- Mind `#ea7c1c` / Creative `#1d97d8` / Business `#0bbe72`
- ink `#4d4d4d` / muted `#666666` / divider `#eeeeee` / ring `#e6e6e6` / ring-num `#d5d5d5` / avg `#999999` / header-bg `#eceef0`

### スケール
- 0〜5、**0.5刻み**（`isValidScore` で検証）。レーダーのリングは 1〜5。

---

## 3. データモデル / CSV 仕様

`src/lib/types.ts`（`Person` / `AssessmentData` など）、`src/lib/master-data.ts`（カテゴリ・項目・色・順序の**唯一の定義**）。

**カテゴリと項目（CSV列順）** — 計18項目:
- Mind(5): designer_mind, verbalization, visualization, problem_solving, will
- Creative(8): design_process, research, user_understanding, experience_design, ia_ui, art_direction, technology, lamp_ops
- Business(5): pj_management, communication, logical_thinking, presentation, docomo_context

**CSV の位置ベースのレイアウト**（`src/lib/csv-mapping.ts`）:
```
col 0        : 氏名（"平均"等の行はチーム平均行）
col 1..18    : 18項目のスコア（master-data の ITEM_IDS 順）
col 19       : 合計（任意。あれば displayTotal がこれを優先）
col 20,21,22 : Mind / Creative / Business のコメント（任意）
```
- 先頭の複数行ヘッダー（氏名セルが空）は自動スキップ。
- チーム平均は CSV の「平均」行があればそれを使用、無ければ在籍メンバーから算出（`teamAverageByItem`、欠損は0扱いせず除外）。
- チーム名は CSV に列が無く、引数 or 既定 `DEFAULT_TEAM = "Front Design Team"`。
- ラベル差異メモ: CSV側 "Basic"/"課題解決力" → 本アプリは Figma 準拠の "Business"/"課題解決思考" を採用。

サンプル: `public/data/sample.csv`、既定読込: `public/data/assessments.csv`。

---

## 4. ディレクトリ構成（主要ファイル）

```
src/
  App.tsx                     画面シェル・CSV読込・1920x1080をコンテナ幅に縮小表示
  components/
    AssessmentSheet.tsx       1人分シート（ヘッダー＋全体凡例＋3パネル＋中央区切り線）
    PersonHeader.tsx          氏名・チーム・Total
    CategoryPanel.tsx         1カテゴリ（中央見出し＋レーダー＋スコア一覧＋コメント）
    RadarChart.tsx            純SVGレーダー（無状態・印刷再現性あり）
    ScoreList.tsx             項目行（ラベル＋数値＋スコアバー）
    PersonPicker / CsvLoader / Thumbnail
  lib/
    types.ts                  型
    master-data.ts            カテゴリ/項目/色/順序（唯一の定義）・SCALE_MAX=5
    csv-mapping.ts            CSV列マッピング・平均行ラベル・既定チーム名
    parse-csv.ts              CSV → AssessmentData（papaparse 使用）
    compute.ts                teamAverageByItem / computeTotal / displayTotal / isValidScore
scripts/
  render.ts                   静的版の描画ロジック（HTML/CSS/SVG生成・副作用なし＝テスト対象）
  generate-static-html.ts     CSV読込・ファイル出力・CLI（render.ts を使う）
  render.test.ts              静的版の単体テスト
  fonts/akshar-500-latin.woff2 静的HTMLに base64 で埋め込む Akshar(500)
public/data/*.csv             入力CSV
```

---

## 5. 実行方法

```bash
npm install            # 初回（オンライン環境で）
npm run dev            # 開発サーバ http://localhost:5173
npm test               # vitest（parse-csv / render の単体テスト）
npm run build          # dist/ に SPA ビルド
npm run preview        # ビルド物をローカル配信（assessments.csv 自動読込）

# 静的HTML一括生成（アプリ不要）
npm run generate                                   # public/data/assessments.csv → dist-static/
npm run generate -- 入力.csv 出力先 "チーム名"        # 入出力・チーム名を指定
#   出力: index.html(一覧) / sheets/NN_氏名.html(1人1枚) / all.html(連結・一括PDF用)
#   各HTMLは CSS・SVG・フォントをインライン化した自己完結ファイル（file:// で開ける）
```

---

## 6. Figma 連携（ネイティブ要素の書き出し）

- **対象ファイル**: fileKey `hMAzWHVOa4JFYgM90aNUrz`（"FD担当_アセスメント"）。マスタ定義はこの node `21:3` 由来。
- **書き出し先**: 同ファイル内のページ **「アセスメント_自動生成」**（再生成のたびに作り直す）。
- **方法**: Figma MCP の `use_figma`（Plugin API を JS 実行）で、全員分のシートを
  フレーム／楕円・矩形／ベクター（`createVector` の `vectorPaths`）／テキストとして生成。
  - フォントは `Akshar`(Medium) ＝英字/数字、`Noto Sans JP` ＝日本語（無ければ Inter フォールバック）。
  - `use_figma` 呼び出し前に figma-use ガイドの読込が推奨（本環境では `/figma-use` スキル未提供のため API 作法に準拠して実行）。
  - `figma.currentPage = ...` は不可。**`await figma.setCurrentPageAsync(page)`** を使う。
  - 生成スクリプト本体はリポジトリには未コミット（MCP 経由のワンショット）。再生成時は本ファイルの「確定デザイン仕様」に合わせること。

---

## 7. 既知の差分・注意点（**要修正候補**）

1. ~~フォント差分~~ **解消済み**: 全系統で **Akshar** に統一（欧文＝Akshar／日本語＝Noto Sans JP フォールバック）。
   React は `public/fonts/akshar-500-latin.woff2` を self-host（`src/index.css` の `@font-face`、`tailwind.config.ts` の `sans`/`num` とも Akshar 優先）。静的版は同 woff2 を base64 埋め込み。Akshar は weight 500(Latin) のみなので太字は擬似ボールド。
2. **レーダーの軸ラベル余白**: `RadarChart.tsx` の `viewBox` は `0 0 size size`（ラベル用余白なし）。静的版 `render.ts` は `padX=52 / padY=16` の余白あり。React 側は端のラベルが見切れる可能性 → React の viewBox にも余白を付けると一致する。
3. **Figma のグリッド形状**: 現状の Figma 生成は**円（楕円）リング**。React/静的版は**多角形**リング。厳密一致させるなら Figma 側も多角形に。
4. 3系統のデザインは**手動同期**。いずれかを直したら他2つ（と Figma）も必ず合わせる。

---

## 8. 現在の状態（このブランチで完了済み）

ブランチ `claude/great-bohr-sOv7m`（ドラフト PR #3）。直近で実施:
- パネルを **固定520px・中央寄せ・55px間隔＋中央区切り線**に変更
- レーダーを**パネル幅いっぱい**に（380px上限を撤廃）
- スコア行間を **24px**に
- React を静的版に統一（**スコアバー追加・全体凡例化・見出し中央**、未使用 `ScoreLegend` 削除）
- Figma を確定デザインに合わせて全員分（5名）再生成
- `npm test` 25件パス / `tsc -b` パス

### 次にやり得ること
- §7 の残差分（軸ラベル余白 / Figma の多角形リング）の解消
- 実データ CSV（`public/data/assessments.csv`）の差し替え運用フロー整備
- Figma 生成のスクリプト化（再現可能な書き出し手順をリポジトリに保存）

---

## 9. 規約 / 作業の進め方

- **変更は3系統そろえる**（React / 静的 / Figma）。デザイン数値は本ファイル §2 を基準に。
- ロジック（集計・パース・マスタ）は `src/lib/` を唯一のソースとし、静的版は import して再利用する。
- 変更後は `npm test` と `tsc -b` を通す。`render.ts` の挙動は `scripts/render.test.ts` で担保。
- コミットは目的が分かる粒度で。プッシュは作業ブランチへ。
