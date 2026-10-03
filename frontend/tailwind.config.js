/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#090D16",
        surface: {
          DEFAULT: "#0F172A",
          elevated: "#162032",
          hover: "#1E2C44",
        },
        border: {
          DEFAULT: "#1E293B",
          subtle: "#172233",
          active: "#334155",
        },
        primary: {
          DEFAULT: "#3B82F6",
          hover: "#2563EB",
          subtle: "#1D4ED8",
          foreground: "#FFFFFF",
        },
        foreground: {
          DEFAULT: "#F8FAFC",
          muted: "#94A3B8",
          subtle: "#64748B",
        },
        risk: {
          low: "#10B981",
          moderate: "#F59E0B",
          high: "#F97316",
          critical: "#EF4444",
        }
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
}
