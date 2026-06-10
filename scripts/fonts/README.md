# 埋め込みフォント（静的HTML書き出し用）

`generate-static-html.ts` が、出力HTMLに base64 で埋め込む Latin サブセットの woff2 です
（外部CDN・実行時依存をなくし、単体HTMLで完結させるため）。日本語は埋め込まず、
システムの日本語フォント（Noto Sans JP 等）にフォールバックします。

| ファイル | 用途 |
|---|---|
| `akshar-500-latin.woff2` | 英字すべて（氏名・チーム名・Total・カテゴリ見出し・数値・目盛り） |

- 英字は **Akshar Medium** に統一しています（Figma の DIN Alternate 箇所も Akshar）。
- Akshar は **SIL Open Font License 1.1**（Google Fonts 配布）。OFL は woff2 への変換・
  埋め込み・再配布を許諾しています。出典: https://fonts.google.com/specimen/Akshar
