/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        rico: {
          sage: "#A8CDA4",
          mint: "#5EC7A5",
          teal: "#1D8E8E",
          darkTeal: "#166D77",
        },
        polarHaze: "#F5F7FD",
        softWinter: "#FCFCF5",
        arcticVeil: "#FAFDFE",
        paleCustard: "#FFFFF8",
        eggShell: "#FAFFFF",
        blancDeBlanc: "#F6F6F6",
      },
    },
  },
  plugins: [],
};
