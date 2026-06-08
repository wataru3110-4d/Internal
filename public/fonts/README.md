# フォント（ローカル同梱）

オフライン動作のため、フォントはこのフォルダに同梱します（外部CDN不使用）。
オンラインのマシンで一度だけ取得し、ここに配置してください。

必要なファイル:

- `NotoSansJP.woff2` — 日本語テキスト用。Google Fonts の Noto Sans JP から取得。
  https://fonts.google.com/nota/specimen/Noto+Sans+JP （woff2 を `NotoSansJP.woff2` にリネーム）
- `BarlowCondensed.woff2` — 数字・英字見出し用（Figma の DIN の無償代替）。
  https://fonts.google.com/specimen/Barlow+Condensed

ファイルが無くても動作します（システムフォントにフォールバック）。
Figma と完全一致させたい場合（DIN Alternate / DIN 2014）はライセンス保有時に
同名で差し替え、`src/index.css` の `@font-face` の `src` を合わせてください。
