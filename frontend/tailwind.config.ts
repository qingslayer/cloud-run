import type { Config } from 'tailwindcss';

const config: Config = {
  // Enable class-based dark mode
  darkMode: 'class',

  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],

  theme: {
    extend: {},
  },

  plugins: [],
};

export default config;
