/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        /**
         * `camel` is now driven by CSS custom properties instead of
         * fixed hex values (see app/globals.css :root / .theme-seller).
         * This means every existing `bg-camel-500`, `text-camel-600`,
         * `border-camel-300`, etc. — used across ~40 files already —
         * automatically repaints for the current role WITHOUT changing
         * a single className anywhere else in the app. The name
         * "camel" stays only as the Tailwind token id; the actual hue
         * is entirely determined by which theme class is on <html>
         * (set in app/layout.tsx based on the logged-in user's role):
         *   - no class / .theme-buyer → orange (original brand color)
         *   - .theme-seller           → sky blue (slightly deeper than
         *                               Tailwind's default sky scale)
         * `rgb(var(--camel-500) / <alpha-value>)` preserves opacity
         * modifiers like `bg-camel-500/50`.
         */
        camel: {
          50: "rgb(var(--camel-50) / <alpha-value>)",
          100: "rgb(var(--camel-100) / <alpha-value>)",
          200: "rgb(var(--camel-200) / <alpha-value>)",
          300: "rgb(var(--camel-300) / <alpha-value>)",
          400: "rgb(var(--camel-400) / <alpha-value>)",
          500: "rgb(var(--camel-500) / <alpha-value>)",
          600: "rgb(var(--camel-600) / <alpha-value>)",
          700: "rgb(var(--camel-700) / <alpha-value>)",
          800: "rgb(var(--camel-800) / <alpha-value>)",
          900: "rgb(var(--camel-900) / <alpha-value>)"
        },
        ink: {
          50: "#F7F5F3",
          400: "#8A8078",
          600: "#544C44",
          800: "#2C261F",
          900: "#1B1611"
        },
        sand: "#FDF9F4",
        line: "#EEE3D5",
        success: "#1E8F6F",
        danger: "#C43D3D",
        gold: "#C99A2E"
      },
      fontFamily: {
        // "sans" stays as the global default (body text, buttons,
        // labels — everything that doesn't explicitly ask for a
        // different role) and is an alias for the same font as
        // `font-body`, so existing `font-sans` usage across the app
        // keeps working without changes.
        sans: ["var(--font-body)", "Tahoma", "sans-serif"],
        heading: ["var(--font-heading)", "Tahoma", "sans-serif"],
        body: ["var(--font-body)", "Tahoma", "sans-serif"],
        numeral: ["var(--font-numeral)", "Tahoma", "sans-serif"]
      },
      borderRadius: {
        xl2: "1.25rem"
      },
      boxShadow: {
        card: "0 1px 2px rgba(27,22,17,0.04), 0 8px 24px -12px rgba(27,22,17,0.12)",
        // Was a hardcoded orange rgba — now follows the active theme
        // color too, so buttons/CTAs glow the right hue for sellers.
        pop: "0 12px 32px -8px rgb(var(--camel-500) / 0.35)"
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        rise: "rise 0.5s ease-out both"
      }
    }
  },
  plugins: []
};
