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
        // Self-hosted fonts only; see src/index.css @font-face.
        sans: ["Noto Sans JP", "system-ui", "sans-serif"],
        num: ["Barlow Condensed", "Noto Sans JP", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
