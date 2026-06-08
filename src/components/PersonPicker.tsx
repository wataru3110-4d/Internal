import type { Person } from "../lib/types";

interface PersonPickerProps {
  people: Person[];
  selected: number;
  onSelect: (index: number) => void;
}

/** Select which person's sheet to display. */
export function PersonPicker({ people, selected, onSelect }: PersonPickerProps) {
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      表示する人
      <select
        className="rounded border border-gray-300 bg-white px-2 py-1 text-ink"
        value={selected}
        onChange={(e) => onSelect(Number(e.target.value))}
      >
        {people.map((p, i) => (
          <option key={p.name} value={i}>
            {p.name}
          </option>
        ))}
      </select>
    </label>
  );
}
