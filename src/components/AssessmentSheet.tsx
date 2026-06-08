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
      <div className="flex flex-1 items-stretch divide-x divide-[#eee] px-10 py-8">
        {CATEGORIES.map((category) => (
          <CategoryPanel
            key={category.key}
            category={category}
            person={person}
            average={data.teamAverage}
          />
        ))}
      </div>
    </div>
  );
}
