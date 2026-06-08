/** Legend explaining the solid (person) vs dashed (team average) lines. */
export function ScoreLegend({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-4 text-[12px] text-muted">
      <span className="flex items-center gap-1.5">
        <svg width="24" height="6" aria-hidden>
          <line x1="0" y1="3" x2="24" y2="3" stroke={color} strokeWidth="2" />
        </svg>
        本人
      </span>
      <span className="flex items-center gap-1.5">
        <svg width="24" height="6" aria-hidden>
          <line
            x1="0"
            y1="3"
            x2="24"
            y2="3"
            stroke="#999"
            strokeWidth="2"
            strokeDasharray="5 4"
          />
        </svg>
        チーム平均
      </span>
    </div>
  );
}
