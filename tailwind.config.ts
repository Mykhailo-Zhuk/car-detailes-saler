import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: "#7C5CFC",
        "primary-hover": "#6B4AE8",
        bg: "#1a1a1a",
        "bg-card": "#2a2a2a",
        "bg-hover": "#333333",
        text: "#ffffff",
        "text-secondary": "#c9c9c9",
        "text-muted": "#888888",
        border: "#3a3a3a",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
        info: "#3b82f6",
      },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config
