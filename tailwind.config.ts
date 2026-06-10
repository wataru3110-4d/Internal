import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Category accent colors taken from the Figma format (node 21:3)
        mind: "#ea7c1c",
        creative: "#1d97d8",
        business: "#0bbe72",
        ink: "#4d4d4d",
        muted: "#666666",
      },
      fontFamily: {
        // Akshar everywhere (self-hosted; see src/index.css @font-face).
        // Akshar is Latin-only, so Japanese falls back to Noto Sans JP.
        sans: ["Akshar", "Noto Sans JP", "system-ui", "sans-serif"],
        num: ["Akshar", "Noto Sans JP", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
