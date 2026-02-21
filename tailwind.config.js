// tailwind.config.js
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        popover: "#ffffff",
        "popover-foreground": "#000000",
      },
    },
  },
  safelist: [
    'bg-popover',
    'text-popover-foreground',
  ],
  plugins: [
    require('tailwindcss-animatecss')
  ],
}
