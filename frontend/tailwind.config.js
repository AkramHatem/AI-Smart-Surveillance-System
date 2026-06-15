/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        surface: {
          DEFAULT: 'hsl(220 14% 6%)',
          raised: 'hsl(220 12% 9%)',
          overlay: 'hsl(220 10% 12%)',
          border: 'hsl(220 8% 18%)',
          muted: 'hsl(220 6% 35%)',
        },
        accent: {
          DEFAULT: 'hsl(20 90% 55%)',
          dim: 'hsl(20 80% 45%)',
          glow: 'hsl(20 90% 65%)',
        },
        fire: 'hsl(18 92% 52%)',
        accident: 'hsl(45 95% 50%)',
        violence: 'hsl(345 80% 52%)',
        safe: 'hsl(152 60% 45%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 2s linear infinite',
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-up': 'slideUp 0.35s ease forwards',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(0%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
