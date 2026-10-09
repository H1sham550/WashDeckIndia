import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--bg))",
        foreground: "hsl(var(--text-primary))",
        primary: {
          DEFAULT: "hsl(var(--brand-blue))",
          foreground: "hsl(var(--text-inverse))",
        },
        muted: {
          DEFAULT: "hsl(var(--bg-subtle))",
          foreground: "hsl(var(--text-tertiary))",
        },
        card: {
          DEFAULT: "hsl(var(--surface))",
          foreground: "hsl(var(--text-primary))",
        },
        accent: {
          DEFAULT: "hsl(var(--brand-blue-light))",
          foreground: "hsl(var(--brand-blue))",
        },
        // Clownfish theme mapping for blue scale (Sunset Persimmon #D9531E — balanced warm automotive orange)
        blue: {
          50:  "#FFF8F4", // Softest warm peach-cream tint
          100: "#FEEDDF", // Soft warm tint
          200: "#FCD7BF", // Delicate warm border
          300: "#F7B28B", // Soft warm accent
          400: "#EE8652", // Mid warm orange
          500: "#E3662B", // Bright persimmon
          600: "#D9531E", // Sunset Persimmon (Primary CTA — unmistakable orange, zero brown, zero glare)
          700: "#BD4313", // Deep persimmon hover
          800: "#98340E", // Deep terracotta
          900: "#75280B", // Dark warm espresso mahogany
          950: "#441404", // Charcoal ember
        },
        // Dedicated Clownfish semantic tokens
        clownfish: {
          canvas: "#F2F0E4",
          card: "#FFFFFF",
          black: "#000000",
          orange: "#D9531E",
          hover: "#BD4313",
          sand: "#E0DAC8",
          peach: "#FFF8F4",
        },
        // WashDeck brand teal remapped to Sunset Persimmon palette (eliminates residual teal)
        "wd-teal": {
          DEFAULT: "#D9531E",
          50:  "#FFF8F4",
          100: "#FEEDDF",
          200: "#FCD7BF",
          300: "#F7B28B",
          400: "#EE8652",
          500: "#D9531E",
          600: "#BD4313",
          700: "#98340E",
          800: "#75280B",
          900: "#441404",
          950: "#240A02",
        },
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
      animation: {
        shimmer: "shimmer 1.6s ease-in-out infinite",
        "fade-in": "fadeIn var(--anim-base) ease-out",
        "slide-up": "slideUp var(--anim-base) ease-out",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

