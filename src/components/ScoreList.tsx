import type { CategoryDef } from "../lib/types";
import { SCALE_MAX } from "../lib/master-data";

interface ScoreListProps {
  category: CategoryDef;
  scores: Record<string, number>;
  average: Record<string, number>;
}

/** Per-item score rows for one category: label + value, with a score bar. */
export function ScoreList({ category, scores }: ScoreListProps) {
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
      {category.items.map((item) => {
        const v = scores[item.id];
        const pct =
          v === undefined ? 0 : Math.max(0, Math.min(100, (v / SCALE_MAX) * 100));
        return (
          <div key={item.id} className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-3 text-[15px] text-muted">
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              <span className="shrink-0 font-num tabular-nums">{v ?? "—"}</span>
            </div>
            <div className="flex h-0.5 w-full overflow-hidden rounded-full bg-[#eee]">
              <span
                className="h-0.5 rounded-full"
                style={{ width: `${pct}%`, background: category.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
