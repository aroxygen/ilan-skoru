import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          950: "#06080c",
          900: "#0a0f17",
          800: "#101827",
          700: "#1d2a3f",
          500: "#5eead4",
          400: "#2dd4bf",
          300: "#22d3ee"
        }
      }
    }
  },
  plugins: []
};

export default config;
