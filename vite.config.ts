import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative base so the built app can be opened from any path,
// including directly via file:// in an air-gapped environment.
export default defineConfig({
  base: "./",
  plugins: [react()],
});
