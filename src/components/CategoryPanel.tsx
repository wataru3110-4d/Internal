import type { CategoryDef, CategoryKey, Person } from "../lib/types";
import { RadarChart } from "./RadarChart";
import { ScoreList } from "./ScoreList";
import { SCALE_MAX } from "../lib/master-data";

interface CategoryPanelProps {
  category: CategoryDef;
  person: Person;
  average: Record<string, number>;
}

/** One category column: header, radar chart, item scores, comment. */
export function CategoryPanel({ category, person, average }: CategoryPanelProps) {
  const axes = category.items.map((it) => ({
    label: it.label,
    lines: it.axisLabel,
  }));
  const personValues = category.items.map((it) => person.scores[it.id]);
  const avgValues = category.items.map((it) => average[it.id]);
  const comment = person.comments[category.key as CategoryKey];

  return (
    <section className="flex w-[520px] shrink-0 flex-col gap-4 px-6">
      <div className="text-center">
        <h2 className="relative inline-block font-num text-[24px] font-bold text-ink">
          <span
            className="absolute bottom-[2px] left-0 -z-10 h-[10px] w-full"
            style={{ backgroundColor: category.color, opacity: 0.35 }}
          />
          {category.label}
        </h2>
      </div>

      <div className="mx-auto aspect-square w-full">
        <RadarChart
          axes={axes}
          max={SCALE_MAX}
          series={[
            {
              values: avgValues,
              color: "#999999",
              style: "dashed",
              label: "チーム平均",
            },
            {
              values: personValues,
              color: category.color,
              style: "solid",
              fill: true,
              label: "本人",
            },
          ]}
        />
      </div>

      <ScoreList category={category} scores={person.scores} average={average} />

      {comment && (
        <div className="whitespace-pre-line rounded-md bg-[#f5f5f5] p-4 text-[12px] leading-relaxed text-muted">
          {comment}
        </div>
      )}
    </section>
  );
}
