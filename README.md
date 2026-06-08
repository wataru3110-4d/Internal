# デザインスキル アセスメント結果表示アプリ

デザインスキル評価の結果（スコア＋コメント）を Figma フォーマットと同じ見た目で
表示する、**オフライン・表示専用**アプリです。データは Google スプレッドシートから
**CSV をダウンロードして取り込み**ます。評価入力・管理画面・DB はありません。

- レーダーチャート（Mind / Creative / Business の3カテゴリ）に本人スコアと
  **チーム平均（点線）**を重ねて表示
- 完全オフライン動作（外部 CDN・外部フォント・外部画像に実行時依存しない）
- 16:9 レイアウト。ブラウザの「印刷 / PDF」で資料化可能
  （※ Figma への書き戻し出力は別経路・オンライン作業として今後追加予定）

## セットアップ（オンラインのマシンで初回のみ）

```bash
npm install
# 任意: public/fonts に Noto Sans JP / Barlow Condensed の .woff2 を配置
#       （未配置でもシステムフォントにフォールバックして動作します）
```

## 開発

```bash
npm run dev      # http://localhost:5173
npm test         # 取込・集計の単体テスト
```

## ビルドと配布（オフライン環境）

```bash
npm run build    # dist/ に静的出力
npm run preview  # ローカル配信で public/data/assessments.csv を自動読込
```

エアギャップ環境へは `dist/` 一式を持ち込み、社内/ローカルの静的サーバで配信するか、
`index.html` を `file://` で直接開いて画面右上の「CSV読込」から CSV を選択します。

## 静的HTML書き出し（アプリを起動しない）

アプリ（SPA）を立てずに、CSV から **そのまま開ける自己完結HTML** を一括生成します。
ビューア本体と同じ `src/lib`（CSVパース・マスタ・チーム平均）をそのまま使うので
見た目・集計はアプリと一致します。出力は React/Tailwind に実行時依存しません。

```bash
npm run generate                              # public/data/assessments.csv → dist-static/
npm run generate -- path/to.csv out "チーム名"  # 入力CSV・出力先・チーム名を指定
```

生成物（`dist-static/`）:

- `index.html` … メンバー一覧（各シートへのリンク・Total）
- `sheets/*.html` … 1人 = 1ファイル（16:9。ブラウザの「印刷 / PDF」で資料化）
- `all.html` … 全員分を1ページに連結（一括で PDF 化する用。ページ区切り入り）

各ファイルは CSS・SVG をインライン化した単体HTMLなので、`file://` で直接開けて
そのまま配布・印刷できます（外部CDN・外部フォント・外部画像に依存しません）。

## データの更新

1. スプレッドシートを CSV でダウンロード。
2. **静的サーバ配信時**: `public/data/assessments.csv`（配布後は `dist/data/assessments.csv`）
   を差し替えてリロード。
3. **`file://` 直開き時**: 「CSV読込」ボタンから CSV を選択。

### CSV フォーマット

1 ファイル = 1 チーム・1 時点。列は **位置** で対応します（列名は参照しません）。

| 列 | 内容 |
|---|---|
| 1 | 氏名（`平均` 行はチーム平均として扱う） |
| 2–6 | Mind 5項目 |
| 7–14 | Creative 8項目 |
| 15–19 | Business 5項目 |
| 20 | 合計 |
| 21–23 | カテゴリ別コメント（任意。`comment_mind` / `comment_creative` / `comment_business`） |

- 先頭の見出し行（氏名セルが空の行）は自動でスキップします。
- `平均` 行があればそれをチーム平均に採用し、無ければメンバーから自動算出します。
- 項目の定義（カテゴリ・並び・色・ラベル）は `src/lib/master-data.ts` が正です。
- サンプル: `public/data/sample.csv`

## 構成

- `src/lib/` … 固定マスタ・CSV マッピング・パース・集計
- `src/components/RadarChart.tsx` … 自前 SVG レーダーチャート（5/8軸・2系列）
- `src/components/AssessmentSheet.tsx` … 16:9（1920×1080）の結果シート
