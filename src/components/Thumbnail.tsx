interface ThumbnailProps {
  name: string;
  size?: number;
}

/** Avatar with initials fallback (no external images in the offline build). */
export function Thumbnail({ name, size = 78 }: ThumbnailProps) {
  const initial = name.replace(/さん$/, "").slice(0, 1) || "?";
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-ink/10 font-num text-ink"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden
    >
      {initial}
    </div>
  );
}
