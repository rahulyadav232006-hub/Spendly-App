import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        sans: ["'Inter'", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        teal: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
        },
      },
      keyframes: {
        sheetUp: {
          from: { transform: "translateY(24px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        toastIn: {
          from: { transform: "translate(-50%, 8px)", opacity: "0" },
          to: { transform: "translate(-50%, 0)", opacity: "1" },
        },
      },
      animation: {
        "sheet-up": "sheetUp 0.25s ease-out",
        "toast-in": "toastIn 0.2s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
