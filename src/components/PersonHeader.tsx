import { displayTotal } from "../lib/compute";
import type { Person } from "../lib/types";
import { Thumbnail } from "./Thumbnail";

/** Top banner: avatar, name, team, and the large Total score (Figma header). */
export function PersonHeader({ person }: { person: Person }) {
  return (
    <header className="flex items-center justify-between bg-[#eceef0] px-[75px] py-8">
      <div className="flex items-center gap-[30px]">
        <Thumbnail name={person.name} size={78} />
        <div className="flex flex-col gap-[3px]">
          <p className="font-num text-[40px] font-bold leading-none text-ink">
            {person.name}
          </p>
          <p className="text-[18px] text-ink">{person.team}</p>
        </div>
      </div>
      <div className="flex w-[320px] items-end justify-between border-b border-ink pb-3">
        <span className="font-num text-[24px] font-bold text-ink">Total</span>
        <span className="font-num text-[56px] font-bold leading-none text-ink">
          {displayTotal(person)}
        </span>
      </div>
    </header>
  );
}
