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
        camel: {
          50: "#FFF8F1",
          100: "#FCEBDA",
          200: "#F8D3AE",
          300: "#F2B378",
          400: "#EC9750",
          500: "#E8792A",
          600: "#CC611C",
          700: "#A54B16",
          800: "#7C3812",
          900: "#4F240C"
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
        sans: ["var(--font-vazir)", "Tahoma", "sans-serif"]
      },
      borderRadius: {
        xl2: "1.25rem"
      },
      boxShadow: {
        card: "0 1px 2px rgba(27,22,17,0.04), 0 8px 24px -12px rgba(27,22,17,0.12)",
        pop: "0 12px 32px -8px rgba(232,121,42,0.35)"
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
