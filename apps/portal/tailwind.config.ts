import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1a6e3c',
          light: '#2d9e59',
          dark: '#145530',
        },
      },
    },
  },
  plugins: [],
};

export default config;
