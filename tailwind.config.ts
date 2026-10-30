import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0c2340",
          mid: "#16365c",
          deep: "#081628",
        },
        graphite: "#243140",
        mist: "#f3f5f8",
        line: "#e3e8ef",
        cta: {
          DEFAULT: "#e4570e",
          hover: "#c4470a",
        },
        ok: "#0f7b4c",
      },
      boxShadow: {
        card: "0 1px 2px rgba(12,35,64,.06), 0 10px 28px rgba(12,35,64,.05)",
      },
      maxWidth: {
        page: "80rem",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
