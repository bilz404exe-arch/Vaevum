import type { Config } from "tailwindcss";

// NOTE: Tailwind v4 uses CSS-based configuration via @theme in globals.css.
// This file documents the VAEVUM design tokens for reference and tooling support.
// The actual token definitions live in src/styles/globals.css under @theme.
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050507",
        surface: "#12121c",
        surface2: "#1a1a28",
        border: "rgba(255,255,255,0.06)",
        "border-active": "rgba(255,255,255,0.10)",
        "accent-purple": "#9d8cff",
        "accent-pink": "#ff6b9d",
        "accent-gold": "#ffb347",
        text: "#e8e6f0",
        "text-dim": "#6b6880",
        "text-muted": "#3a3850",
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', "serif"],
        mono: ['"Space Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
