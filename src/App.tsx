import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { parseAssessmentCsv } from "./lib/parse-csv";
import type { AssessmentData } from "./lib/types";
import { AssessmentSheet } from "./components/AssessmentSheet";
import { PersonPicker } from "./components/PersonPicker";
import { CsvLoader } from "./components/CsvLoader";

const SHEET_WIDTH = 1920;
const SHEET_HEIGHT = 1080;

export default function App() {
  const [data, setData] = useState<AssessmentData | null>(null);
  const [selected, setSelected] = useState(0);
  const [status, setStatus] = useState<string>("");

  // Primary path: auto-load the bundled CSV when served over http(s).
  useEffect(() => {
    fetch("./data/assessments.csv")
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then((csv) => {
        setData(parseAssessmentCsv(csv));
        setStatus("");
      })
      .catch(() => setStatus("CSVが自動読込できませんでした。「CSV読込」から選択してください。"));
  }, []);

  const handleLoad = (csv: string) => {
    try {
      setData(parseAssessmentCsv(csv));
      setSelected(0);
      setStatus("");
    } catch {
      setStatus("CSVの解析に失敗しました。フォーマットを確認してください。");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex flex-wrap items-center gap-4 border-b bg-white px-4 py-2 print:hidden">
        <span className="font-num text-lg font-bold text-ink">
          デザインスキル アセスメント
        </span>
        {data && (
          <>
            <span className="text-sm text-muted">{data.team}</span>
            <PersonPicker
              people={data.people}
              selected={selected}
              onSelect={setSelected}
            />
            <span className="text-xs text-muted">
              チーム平均: {data.averageFromCsv ? "CSVの平均行" : "メンバーから自動算出"}
            </span>
          </>
        )}
        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            className="rounded border border-gray-300 px-3 py-1.5 text-sm text-ink hover:bg-gray-50"
            onClick={() => window.print()}
          >
            印刷 / PDF
          </button>
          <CsvLoader onLoad={handleLoad} />
        </div>
      </div>

      {status && (
        <p className="px-4 py-2 text-sm text-amber-700 print:hidden">{status}</p>
      )}

      {data && data.people[selected] && (
        <ScaledSheet>
          <AssessmentSheet person={data.people[selected]} data={data} />
        </ScaledSheet>
      )}
    </div>
  );
}

/** Scales the fixed 1920x1080 sheet down to fit the container width. */
function ScaledSheet({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / SHEET_WIDTH));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className="sheet-scale-outer w-full overflow-hidden p-4">
      <div
        className="sheet-scale-box"
        style={{
          width: SHEET_WIDTH * scale,
          height: SHEET_HEIGHT * scale,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            width: SHEET_WIDTH,
            height: SHEET_HEIGHT,
          }}
          className="sheet-scale-inner shadow-lg"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
