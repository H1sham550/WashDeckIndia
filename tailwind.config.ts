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
        // Clownfish theme mapping for blue scale (darkened, grounded burnt orange)
        blue: {
          50:  "#FAF6F2", // Softest warm neutral tint
          100: "#F5ECE5", // Subtle warm sand
          200: "#E8D5C6", // Muted warm border
          300: "#CFAAA0", // Muted terracotta
          400: "#A96240", // Soft warm clay
          500: "#8F3C18", // Warm roasted amber
          600: "#7C2D12", // Deep Darkened Burnt Orange (Primary CTA — grounded, mature, glare-free)
          700: "#63230D", // Dark roasted terracotta hover
          800: "#4D1B0A", // Deep mahogany rust
          900: "#361307", // Dark espresso
          950: "#1F0B04", // Deep charcoal ember
        },
        // Dedicated Clownfish semantic tokens
        clownfish: {
          canvas: "#F2F0E4",
          card: "#FFFFFF",
          black: "#000000",
          orange: "#7C2D12",
          hover: "#63230D",
          sand: "#E0DAC8",
          peach: "#FAF6F2",
        },
        // WashDeck brand teal remapped to darkened burnt orange palette (eliminates residual teal)
        "wd-teal": {
          DEFAULT: "#7C2D12",
          50:  "#FAF6F2",
          100: "#F5ECE5",
          200: "#E8D5C6",
          300: "#CFAAA0",
          400: "#8F3C18",
          500: "#7C2D12",
          600: "#63230D",
          700: "#4D1B0A",
          800: "#361307",
          900: "#1F0B04",
          950: "#120602",
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

