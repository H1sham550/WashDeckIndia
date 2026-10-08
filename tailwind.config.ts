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
        // Clownfish theme mapping for blue scale (seamless dashboard & app adoption)
        blue: {
          50:  "#FFF7ED", // Warm peach light tint
          100: "#FFEDD5", // Soft peach
          200: "#FED7AA", // Warm sand-orange border
          300: "#FDBA74", // Apricot
          400: "#FB923C", // Bright tangerine
          500: "#F28705", // Clownfish Golden Tangerine
          600: "#F25C05", // Clownfish Vivid Warm Orange (Primary Brand / CTA)
          700: "#F24405", // Clownfish Fiery Vermilion (Hover / Active)
          800: "#C23603", // Deep burnt orange
          900: "#7C2202", // Deep rust
          950: "#431201", // Dark mahogany
        },
        // Dedicated Clownfish semantic tokens
        clownfish: {
          canvas: "#F2F0E4",
          card: "#FFFFFF",
          black: "#000000",
          orange: "#F25C05",
          vermilion: "#F24405",
          tangerine: "#F28705",
          sand: "#E0DAC8",
          peach: "#FFF7ED",
        },
        // WashDeck brand teal — rich high-contrast scale
        "wd-teal": {
          DEFAULT: "#0F766E",
          50:  "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#2dd4bf",
          400: "#0d9488",
          500: "#0f766e",
          600: "#115e59",
          700: "#134e4a",
          800: "#042f2e",
          900: "#02201e",
          950: "#011211",
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

