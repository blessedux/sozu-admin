import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-manrope)", "system-ui", "sans-serif"],
        manrope: ["var(--font-manrope)", "sans-serif"],
      },
      colors: {
        sozu: {
          cyan: "#00cfff",
          surface: "#0a0a0a",
          panel: "#141414",
          border: "#262626",
        },
      },
    },
  },
  plugins: [],
};

export default config;
