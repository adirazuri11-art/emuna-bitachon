import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0B132B',
          deep: '#0F172A',
          light: '#1E293B',
        },
        gold: {
          DEFAULT: '#D4AF37',
          soft: '#C5A059',
          light: '#E8D48B',
        },
        cream: '#FAF9F6',
      },
      fontFamily: {
        sans: ['var(--font-assistant)', 'system-ui', 'sans-serif'],
        display: ['var(--font-frank)', 'serif'],
      },
      boxShadow: {
        gold: '0 12px 40px -12px rgba(212, 175, 55, 0.4)',
        card: '0 2px 20px -4px rgba(11, 19, 43, 0.08)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-14px)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2.5s linear infinite',
        float: 'float 7s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
