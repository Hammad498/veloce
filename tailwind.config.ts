import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Geist", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "monospace"],
      },
      colors: {
        dark: {
          50: "#0a0e27",
          100: "#111629",
          200: "#1a1f3a",
          300: "#2d3142",
        },
        "accent-green": {
          DEFAULT: "#00d084",
          dark: "#00a86b",
          light: "#1fee9f",
        },
      },
      backgroundColor: {
        "glass": "rgba(255, 255, 255, 0.05)",
      },
      borderColor: {
        "glass": "rgba(255, 255, 255, 0.1)",
      },
      boxShadow: {
        "glow-green": "0 0 20px rgba(0, 208, 132, 0.4)",
        "glow-lg": "0 10px 40px rgba(0, 208, 132, 0.2)",
      },
      animation: {
        "fadeInUp": "fadeInUp 0.5s ease-out",
        "slideInLeft": "slideInLeft 0.5s ease-out",
        "slideInRight": "slideInRight 0.5s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(0, 208, 132, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(0, 208, 132, 0.6)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
