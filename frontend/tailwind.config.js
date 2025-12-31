/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Color palette from https://colorhunt.co/palette/efece38fabd44a70a9000000
        // Cream: #EFECE3, Light Blue: #8FABD4, Medium Blue: #4A70A9, Black: #000000
        primary: {
          50: "#f0f4f8",
          100: "#d9e4f0",
          200: "#b3c9e1",
          300: "#8FABD4",
          400: "#6a8fc0",
          500: "#5a80b5",
          600: "#4A70A9",
          700: "#3d5c8a",
          800: "#30486b",
          900: "#23344c",
        },
        secondary: {
          50: "#faf9f7",
          100: "#EFECE3",
          200: "#e5e1d4",
          300: "#d4cfc0",
          400: "#c3bcab",
          500: "#b2aa96",
          600: "#9a9282",
          700: "#7d766a",
          800: "#605b52",
          900: "#43403a",
        },
        dark: {
          50: "#f5f5f5",
          100: "#e0e0e0",
          200: "#bdbdbd",
          300: "#9e9e9e",
          400: "#757575",
          500: "#616161",
          600: "#424242",
          700: "#303030",
          800: "#1a1a1a",
          900: "#000000",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        brand: ["'BBH Bartle'", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 8px rgba(0, 0, 0, 0.08)",
        "card-hover": "0 4px 16px rgba(0, 0, 0, 0.12)",
        button: "0 2px 4px rgba(74, 112, 169, 0.25)",
      },
    },
  },
  plugins: [],
};
