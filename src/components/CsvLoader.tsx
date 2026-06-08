import { useRef } from "react";

interface CsvLoaderProps {
  onLoad: (csv: string, fileName: string) => void;
}

/** File-picker fallback for loading a CSV with no server (e.g. file://). */
export function CsvLoader({ onLoad }: CsvLoaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onLoad(String(reader.result), file.name);
    reader.readAsText(file);
  };

  return (
    <>
      <button
        type="button"
        className="rounded bg-ink px-3 py-1.5 text-sm text-white hover:opacity-90"
        onClick={() => inputRef.current?.click()}
      >
        CSV読込
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </>
  );
}
