import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'rgb(var(--color-canvas) / <alpha-value>)',
        panel: 'rgb(var(--color-panel) / <alpha-value>)',
        elevated: 'rgb(var(--color-elevated) / <alpha-value>)',
        text: 'rgb(var(--color-text) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        line: 'rgb(var(--color-line) / <alpha-value>)',
        cyan: 'rgb(var(--color-accent-cyan) / <alpha-value>)',
        violet: 'rgb(var(--color-accent-violet) / <alpha-value>)',
        blue: 'rgb(var(--color-accent-blue) / <alpha-value>)',
      },
      borderRadius: {
        token: 'var(--radius-card)',
        control: 'var(--radius-control)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        panel: 'var(--shadow-panel)',
        glow: 'var(--shadow-glow)',
      },
    },
  },
  plugins: [],
} satisfies Config
