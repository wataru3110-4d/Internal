import type { CategoryDef } from "../lib/types";

interface ScoreListProps {
  category: CategoryDef;
  scores: Record<string, number>;
  average: Record<string, number>;
}

/** Per-item score rows for one category (label + person value). */
export function ScoreList({ category, scores }: ScoreListProps) {
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-0">
      {category.items.map((item) => {
        const v = scores[item.id];
        return (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 border-b border-[#eee] py-3 text-[15px] text-muted"
          >
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            <span className="shrink-0 font-num tabular-nums">
              {v ?? "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
