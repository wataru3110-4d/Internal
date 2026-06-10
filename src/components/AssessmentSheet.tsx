import { Fragment } from "react";
import { CATEGORIES } from "../lib/master-data";
import type { AssessmentData, Person } from "../lib/types";
import { CategoryPanel } from "./CategoryPanel";
import { PersonHeader } from "./PersonHeader";

interface AssessmentSheetProps {
  person: Person;
  data: AssessmentData;
}

/**
 * The full 16:9 result sheet for one person, matching the Figma format.
 * Rendered at a fixed 1920x1080 canvas so it reproduces consistently for
 * screenshots / print / PDF, then scaled to fit its container.
 */
export function AssessmentSheet({ person, data }: AssessmentSheetProps) {
  return (
    <div
      className="assessment-sheet flex flex-col bg-white"
      style={{ width: 1920, height: 1080 }}
    >
      <PersonHeader person={person} />
      <div className="flex items-center gap-2 px-10 pt-8 text-[12px] text-muted">
        <span className="whitespace-nowrap">チーム平均</span>
        <svg width="60" height="2" aria-hidden>
          <line
            x1="0"
            y1="1"
            x2="60"
            y2="1"
            stroke="#999"
            strokeWidth="1.5"
            strokeDasharray="5 4"
          />
        </svg>
      </div>
      <div className="flex flex-1 items-stretch justify-center gap-[27.5px] pb-8 pt-6">
        {CATEGORIES.map((category, i) => (
          <Fragment key={category.key}>
            {i > 0 && <div className="self-stretch border-l border-[#eee]" />}
            <CategoryPanel
              category={category}
              person={person}
              average={data.teamAverage}
            />
          </Fragment>
        ))}
      </div>
    </div>
  );
}
