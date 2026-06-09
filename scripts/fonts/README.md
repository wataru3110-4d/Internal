# 埋め込みフォント（静的HTML書き出し用）

`generate-static-html.ts` が、出力HTMLに base64 で埋め込む Latin サブセットの woff2 です
（外部CDN・実行時依存をなくし、単体HTMLで完結させるため）。日本語は埋め込まず、
システムの日本語フォント（Noto Sans JP 等）にフォールバックします。

| ファイル | 用途（Figma） | 代替元 |
|---|---|---|
| `akshar-500-latin.woff2` | 氏名・チーム名・Total ラベル・カテゴリ見出し（Akshar Medium） | Akshar 本体 |
| `barlow-700-latin.woff2` | 大きな数値 Total（Figma は DIN Alternate Bold） | Barlow Bold で近似 |

- Akshar / Barlow はいずれも **SIL Open Font License 1.1**（Google Fonts 配布）。
  OFL は woff2 への変換・埋め込み・再配布を許諾しています。
  - Akshar: https://fonts.google.com/specimen/Akshar
  - Barlow: https://fonts.google.com/specimen/Barlow
- Figma 指定の **DIN Alternate** は商用フォントのため同梱できません。見た目が近い
  Barlow Bold で代用しています。ライセンス済みの DIN Alternate (.woff2) があれば、
  本ディレクトリに置き換え、`generate-static-html.ts` の `fontFace(...)` を差し替えれば
  完全一致できます。
