/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        ".scrollbar-hidden": {
          /* Webkit 기반 브라우저 (Chrome, Safari) */
          "::-webkit-scrollbar": {
            display: "none",
          },
          /* Firefox */
          "scrollbar-width": "none",
          /* IE 및 Edge (구형 브라우저 지원) */
          "-ms-overflow-style": "none",
        },
      });
    },
  ],
};