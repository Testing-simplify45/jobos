import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          bg: "#0a0e0f",
          panel: "#0f1416",
          panelAlt: "#121819",
          border: "#1e2528",
          borderLight: "#252d30",
        },
        accent: {
          DEFAULT: "#2dd4bf",
          bright: "#5eead4",
          dim: "#0f2e2a",
        },
        warn: {
          DEFAULT: "#f5a623",
          dim: "#2e2410",
        },
        text: {
          primary: "#e6ecec",
          secondary: "#8b9a9c",
          tertiary: "#5a6a6c",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "10px",
      },
    },
  },
  plugins: [],
};

export default config;
