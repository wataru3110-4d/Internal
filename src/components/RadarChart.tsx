interface RadarSeries {
  /** One value per axis, in axis order. Missing entries (undefined) are skipped. */
  values: (number | undefined)[];
  color: string;
  style: "solid" | "dashed";
  /** Fill the polygon with a translucent tint (used for the person series). */
  fill?: boolean;
  label: string;
}

interface RadarAxis {
  label: string;
  /** Optional multi-line label. */
  lines?: string[];
}

interface RadarChartProps {
  axes: RadarAxis[];
  max: number;
  series: RadarSeries[];
  /** Square SVG viewBox size in px. */
  size?: number;
}

/** Angle (radians) for axis i, starting at the top and going clockwise. */
function axisAngle(i: number, n: number): number {
  return -Math.PI / 2 + (i * 2 * Math.PI) / n;
}

function pointAt(cx: number, cy: number, radius: number, angle: number) {
  return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
}

/**
 * Pure SVG radar/pentagon chart. Deterministic (no state, no animation) so it
 * renders identically for screenshots/print, with no external dependencies.
 */
export function RadarChart({ axes, max, series, size = 360 }: RadarChartProps) {
  const n = axes.length;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.34;
  const labelGap = 18;

  const ringValues = Array.from({ length: max }, (_, i) => i + 1);

  const polygonPoints = (radiusForValue: (v: number) => number, values: (number | undefined)[]) =>
    axes
      .map((_, i) => {
        const v = values[i];
        if (v === undefined) return null;
        const p = pointAt(cx, cy, radiusForValue(v), axisAngle(i, n));
        return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
      })
      .filter(Boolean)
      .join(" ");

  const scale = (v: number) => (v / max) * radius;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%" role="img">
      {/* Concentric grid rings */}
      {ringValues.map((ring) => (
        <polygon
          key={`ring-${ring}`}
          points={axes
            .map((_, i) => {
              const p = pointAt(cx, cy, scale(ring), axisAngle(i, n));
              return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
            })
            .join(" ")}
          fill="none"
          stroke="#e6e6e6"
          strokeWidth={1}
        />
      ))}

      {/* Axis spokes */}
      {axes.map((_, i) => {
        const p = pointAt(cx, cy, radius, axisAngle(i, n));
        return (
          <line
            key={`spoke-${i}`}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke="#e6e6e6"
            strokeWidth={1}
          />
        );
      })}

      {/* Ring scale numbers along the top spoke (1..max) */}
      {ringValues.map((ring) => {
        const p = pointAt(cx, cy, scale(ring), axisAngle(0, n));
        return (
          <text
            key={`ringnum-${ring}`}
            x={p.x + 6}
            y={p.y + 4}
            fontSize={11}
            fill="#d5d5d5"
            className="font-num"
          >
            {ring}
          </text>
        );
      })}

      {/* Data series (drawn after grid so they sit on top) */}
      {series.map((s, si) => {
        const pts = polygonPoints(scale, s.values);
        if (!pts) return null;
        return (
          <g key={`series-${si}`}>
            <polygon
              points={pts}
              fill={s.fill ? s.color : "none"}
              fillOpacity={s.fill ? 0.25 : 0}
              stroke={s.color}
              strokeWidth={2}
              strokeDasharray={s.style === "dashed" ? "5 4" : undefined}
              strokeLinejoin="round"
            />
            {s.values.map((v, i) => {
              if (v === undefined) return null;
              const p = pointAt(cx, cy, scale(v), axisAngle(i, n));
              return (
                <circle
                  key={`dot-${si}-${i}`}
                  cx={p.x}
                  cy={p.y}
                  r={s.style === "dashed" ? 2.5 : 3.5}
                  fill={s.color}
                />
              );
            })}
          </g>
        );
      })}

      {/* Axis labels outside the outer ring */}
      {axes.map((axis, i) => {
        const angle = axisAngle(i, n);
        const p = pointAt(cx, cy, radius + labelGap, angle);
        const cos = Math.cos(angle);
        const anchor = cos > 0.2 ? "start" : cos < -0.2 ? "end" : "middle";
        const lines = axis.lines ?? [axis.label];
        return (
          <text
            key={`label-${i}`}
            x={p.x}
            y={p.y}
            fontSize={13}
            fill="#666"
            textAnchor={anchor}
            dominantBaseline="middle"
            className="font-sans"
          >
            {lines.map((line, li) => (
              <tspan
                key={li}
                x={p.x}
                dy={li === 0 ? `${-((lines.length - 1) * 0.6)}em` : "1.2em"}
              >
                {line}
              </tspan>
            ))}
          </text>
        );
      })}
    </svg>
  );
}
