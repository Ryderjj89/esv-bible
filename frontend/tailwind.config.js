/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        serif: ['Times New Roman', 'Georgia', 'serif'],
        sans: ['Times New Roman', 'Georgia', 'serif'],
      },
      typography: {
        DEFAULT: {
          css: {
            color: 'inherit',
            a: {
              color: 'inherit',
              textDecoration: 'none',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
