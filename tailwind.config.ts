import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // ── Design tokens · clean white + warm-neutral (single source of truth) ──
        // Ratio target: 75–85% white/neutral surfaces · 10–15% ink/borders · 5–10% brand/semantic.

        // Surfaces & borders — `ink` = neutral surface scale (canvas → hover)
        ink: {
          base: "#FFFFFF", // main application background
          surface: "#FFFFFF", // cards / panels
          overlay: "#F1F0ED", // secondary fills / chips / hover
        },
        surface: {
          soft: "#F8F8F6", // subtle section separation band
          warm: "#F1F0ED", // secondary fills / chips / hover
        },
        line: {
          DEFAULT: "#E4E2DE", // standard borders & dividers
          muted: "#DAD7D2", // stronger hover border
        },

        // Typography — `content` scale (charcoal, not pure black)
        content: {
          primary: "#252321", // headings / body
          secondary: "#6F6B66", // labels / descriptions
          muted: "#9A958E", // placeholders / disabled
        },

        // Brand — terracotta (reserved for CTAs, active nav, selected states)
        accent: {
          DEFAULT: "#A95C45",
          dark: "#8E4937", // pressed
          hover: "#8E4937", // alias of dark
          soft: "#F5E9E4", // tinted background (active nav, selection)
        },

        // Secondary accent — warm gold (used sparingly: attention, follow-ups)
        gold: {
          DEFAULT: "#C8904C",
          soft: "#F7EFE3",
        },

        // Semantic
        success: { DEFAULT: "#6D876F", soft: "#EDF3EE" },
        warn: { DEFAULT: "#B48742", soft: "#F8F1E4" },
        danger: { DEFAULT: "#B85C55", soft: "#F8ECEA" },

        // Pipeline stages — mostly neutral warm tones; only won/lost carry
        // semantic color. Kept restrained (no rainbow).
        stage: {
          blue: "#8C857E", // prospecting — warm gray
          cyan: "#A08C64", // solution_design — sand
          indigo: "#967E6A", // proposal_sent — taupe
          amber: "#A95C45", // negotiation — terracotta emphasis
          green: "#6D876F", // closed_won — sage
          rose: "#B85C55", // closed_lost — red
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      screens: {
        // Drawer-width breakpoint: the right-side drawer is ~384–420px wide, so
        // container queries decide when its two-column fields sit side-by-side.
        dxs: "400px",
        // Landscape-phone mode: short viewports get tighter vertical rhythm
        // without losing touch targets or switching to desktop structure.
        landscape: { raw: "(orientation: landscape) and (max-height: 500px)" },
      },
      borderRadius: {
        xl: "12px", // major containers
        lg: "10px", // smaller controls
        md: "8px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(37,35,33,0.04)",
        lift: "0 1px 2px rgba(37,35,33,0.05), 0 6px 16px -10px rgba(37,35,33,0.10)",
        panel: "0 1px 3px rgba(37,35,33,0.05), 0 10px 30px -18px rgba(37,35,33,0.14)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)", opacity: "0.4" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "pulse-ring": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(184,92,85,0.4)" },
          "50%": { boxShadow: "0 0 0 6px rgba(184,92,85,0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in-right": "slide-in-right 0.3s cubic-bezier(0.16,1,0.3,1)",
        "pulse-ring": "pulse-ring 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
