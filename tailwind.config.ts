import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F7F3EC',
        ink: '#2B2B33',
        net: '#2F6FED',
        teal: '#19B5A5',
        sun: '#F7C331',
        alert: '#E5484D',
        violet: '#7B4FD6',
        orange: '#F28B30',
      },
    },
  },
  plugins: [],
} satisfies Config;
