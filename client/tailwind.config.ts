import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    screens: {
      xs: '320px',
      sm: '481px',
      md: '768px',
      lg: '1025px',
      xl: '1280px',
      '2xl': '1440px',
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      colors: {
        brand: {
          bg: 'var(--color-bg-primary)',
          surface: 'var(--color-bg-secondary)',
          elevated: 'var(--color-bg-elevated)',
          promo: 'var(--color-bg-promo)',
          stage: 'var(--color-bg-cover-stage)',
          primary: 'var(--color-brand-primary)',
          primaryHover: 'var(--color-brand-primary-hover)',
          primaryActive: 'var(--color-brand-primary-active)',
          secondary: 'var(--color-brand-secondary)',
          accent: 'var(--color-brand-accent)',
          red: 'var(--color-brand-primary)',
          redHover: 'var(--color-brand-primary-hover)',
          redSoft: 'var(--color-brand-accent)',
          text: 'var(--color-text-primary)',
          muted: 'var(--color-text-secondary)',
          subtle: 'var(--color-text-muted)',
          border: 'var(--color-border-default)',
          borderInput: 'var(--color-border-input)',
          borderPromo: 'var(--color-border-promo)',
          success: 'var(--color-success)',
          warning: 'var(--color-warning)',
          error: 'var(--color-error)',
          info: 'var(--color-info)',
          gold: 'var(--color-rating-gold)',
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        modal: 'var(--shadow-modal)',
      },
    },
  },
  plugins: [],
};

export default config;
