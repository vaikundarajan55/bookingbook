/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Colours are CSS variables (see index.css) so the admin console can swap in its own theme
      colors: {
        ocean: { DEFAULT: 'rgb(var(--ocean) / <alpha-value>)', 950: 'rgb(var(--ocean-950) / <alpha-value>)', 800: 'rgb(var(--ocean-800) / <alpha-value>)', 700: 'rgb(var(--ocean-700) / <alpha-value>)', 500: 'rgb(var(--ocean-500) / <alpha-value>)', 200: 'rgb(var(--ocean-200) / <alpha-value>)', 100: 'rgb(var(--ocean-100) / <alpha-value>)' },
        brass: { DEFAULT: 'rgb(var(--brass) / <alpha-value>)', 600: 'rgb(var(--brass-600) / <alpha-value>)', 200: 'rgb(var(--brass-200) / <alpha-value>)', 100: 'rgb(var(--brass-100) / <alpha-value>)' },
        mist: 'rgb(var(--mist) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        coral: { DEFAULT: 'rgb(var(--coral) / <alpha-value>)', 100: 'rgb(var(--coral-100) / <alpha-value>)' },
        moss: { DEFAULT: 'rgb(var(--moss) / <alpha-value>)', 100: 'rgb(var(--moss-100) / <alpha-value>)' },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        lift: '0 18px 40px -18px rgba(11,42,59,.35)',
        glass: '0 8px 40px rgba(6,25,35,.25)',
      },
      keyframes: {
        wave: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        pulseDot: { '0%': { boxShadow: '0 0 0 0 rgba(47,143,107,.6)' }, '100%': { boxShadow: '0 0 0 10px rgba(47,143,107,0)' } },
        bars: { '0%,100%': { transform: 'scaleY(.4)' }, '50%': { transform: 'scaleY(1)' } },
      },
      animation: {
        wave: 'wave 14s linear infinite',
        'wave-slow': 'wave 24s linear infinite',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 1.6s linear infinite',
        'pulse-dot': 'pulseDot 1.8s ease-out infinite',
        bars: 'bars 1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
