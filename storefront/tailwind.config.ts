import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{vue,js,ts}",
    "./components/**/*.{vue,js,ts}",
    "./layouts/**/*.{vue,js,ts}",
    "./pages/**/*.{vue,js,ts}",
    "./plugins/**/*.{js,ts}",
    "./nuxt.config.ts",
  ],
  theme: {
    extend: {
      colors: {
        background: "#faf6f0",
        surface: "#ffffff",
        "surface-alt": "#f5efe6",
        primary: "#6b4423",
        "primary-hover": "#57361c",
        "primary-active": "#442815",
        secondary: "#b88a44",
        "secondary-light": "#d4af37",
        accent: "#d8b48a",
        heading: "#2f2419",
        text: "#56483a",
        muted: "#867666",
        placeholder: "#b3a18e",
        border: "#e8ddd0",
        divider: "#f0e7dc",
        success: "#5f7d63",
        warning: "#b6872c",
        danger: "#a84d43",
        info: "#6488a6",
      },
      fontFamily: {
        heading: ["Cormorant Garamond", "serif"],
        body: ["Inter", "sans-serif"],
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
      boxShadow: {
        sm: "0 2px 6px rgba(45, 34, 24, 0.05)",
        md: "0 8px 20px rgba(45, 34, 24, 0.06)",
        lg: "0 18px 40px rgba(45, 34, 24, 0.08)",
      },
      transitionTimingFunction: {
        fast: "ease",
      },
      transitionDuration: {
        fast: "150ms",
        DEFAULT: "220ms",
      },
    },
  },
  plugins: [],
} satisfies Config;
