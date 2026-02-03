import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Theme-aware semantic colors (use CSS variables)
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        border: "var(--border)",
        // Glass backgrounds (theme-aware)
        glass: {
          1: "var(--glass-1)",
          2: "var(--glass-2)",
        },
        // Brand colors (same in both themes)
        brand: {
          teal: "#1BD0B8",
          orange: "#F27229",
        },
        // Legacy semantic aliases (keeping for compatibility)
        bg: {
          base: "var(--background)",
          elevated: "var(--card)",
          muted: "var(--muted)",
        },
        text: {
          primary: "var(--foreground)",
          secondary: "var(--muted-foreground)",
          muted: "var(--muted-foreground)",
        },
        // Iron scale (dark theme)
        iron: {
          25: "#FAFAFB",
          50: "#F2F3F3",
          100: "#E7E8E9",
          200: "#D5D7D9",
          300: "#BFC2C4",
          400: "#A8ACAF",
          500: "#8E9296",
          600: "#6F7479",
          700: "#4E5257",
          800: "#2F3236",
          900: "#1B1D20",
          950: "#111214",
        },
        // Semantic colors
        success: "#67AD5C",
        error: "#DE5E57",
        warning: "#F19D38",
        info: "#4CA7EE",
        // Agent status
        agent: {
          active: "#1BD0B8",
          idle: "#8E9296",
          working: "#F27229",
          error: "#DE5E57",
          offline: "#4E5257",
        },
      },
      fontFamily: {
        heading: [
          "var(--font-inter)",
          "Inter",
          "SF Pro Display",
          "-apple-system",
          "sans-serif",
        ],
        body: [
          "var(--font-instrument)",
          "Instrument Sans",
          "var(--font-inter)",
          "Inter",
          "SF Pro Text",
          "-apple-system",
          "sans-serif",
        ],
      },
      fontSize: {
        h1: ["72px", { lineHeight: "1.1" }],
        h2: ["56px", { lineHeight: "1.1" }],
        h3: ["40px", { lineHeight: "1.1" }],
        h4: ["32px", { lineHeight: "1.3" }],
        h5: ["24px", { lineHeight: "1.3" }],
        h6: ["18px", { lineHeight: "1.3" }],
        "body-lg": ["18px", { lineHeight: "1.5" }],
        body: ["16px", { lineHeight: "1.5" }],
        "body-sm": ["14px", { lineHeight: "1.5" }],
        caption: ["12px", { lineHeight: "1.5" }],
      },
      spacing: {
        "3xs": "4px",
        "2xs": "8px",
        xs: "16px",
        sm: "24px",
        md: "32px",
        lg: "48px",
        xl: "64px",
        "2xl": "80px",
        "3xl": "112px",
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "16px",
        xl: "24px",
      },
      boxShadow: {
        card: "0px 12px 48px rgba(0, 0, 0, 0.32)",
        hover: "0px 8px 16px rgba(0, 0, 0, 0.25)",
        "glow-teal":
          "0px 8px 16px rgba(27, 208, 184, 0.16), inset 0px 0px 4px #1BD0B8",
        "glow-teal-hover": "0 0 20px rgba(27, 208, 184, 0.4)",
        "glow-orange":
          "0px 8px 16px rgba(242, 114, 41, 0.16), inset 0px 0px 4px #F27229",
      },
      backdropBlur: {
        glass: "28px",
      },
      transitionDuration: {
        fast: "150ms",
        base: "200ms",
        slow: "300ms",
        smooth: "400ms",
      },
      zIndex: {
        base: "0",
        elevated: "10",
        dropdown: "100",
        sticky: "200",
        modal: "300",
        tooltip: "400",
        toast: "500",
      },
      maxWidth: {
        container: "1280px",
        content: "720px",
      },
      animation: {
        "heartbeat-glow": "heartbeat-glow 2s ease-in-out infinite",
        pulse: "pulse 2s ease-in-out infinite",
        "radar-sweep": "radar-sweep 2s linear infinite",
      },
      keyframes: {
        "heartbeat-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(27, 208, 184, 0.4)" },
          "50%": { boxShadow: "0 0 30px rgba(27, 208, 184, 0.7)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "radar-sweep": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
