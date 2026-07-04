import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      screens: {
        // Keep 1080p displays in the compact desktop layout. The expanded
        // dashboard treatment needs more horizontal room than 1920px.
        "3xl": "2200px",
        "4xl": "2560px"
      },
      colors: {
        deck: {
          950: "#070a0f",
          900: "#0b1018",
          850: "#101722",
          800: "#141c28",
          700: "#202b3a"
        }
      },
      boxShadow: {
        critical: "0 0 0 1px rgba(248,113,113,.45), 0 16px 40px rgba(127,29,29,.18)"
      }
    }
  },
  plugins: []
};

export default config;
