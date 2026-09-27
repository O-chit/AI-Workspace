import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#2a14b4',
        'primary-container': '#4338ca',
        'on-primary': '#ffffff',
        'on-primary-container': '#c1beff',
        'primary-fixed': '#e3dfff',
        'primary-fixed-dim': '#c3c0ff',
        'on-primary-fixed': '#100069',
        'on-primary-fixed-variant': '#372abf',
        'inverse-primary': '#c3c0ff',

        secondary: '#006a61',
        'secondary-container': '#86f2e4',
        'on-secondary': '#ffffff',
        'on-secondary-container': '#006f66',
        'secondary-fixed': '#89f5e7',
        'secondary-fixed-dim': '#6bd8cb',
        'on-secondary-fixed': '#00201d',
        'on-secondary-fixed-variant': '#005049',

        tertiary: '#1f1ab3',
        'tertiary-container': '#3b3bc9',
        'on-tertiary': '#ffffff',
        'on-tertiary-container': '#bebfff',
        'tertiary-fixed': '#e1e0ff',
        'tertiary-fixed-dim': '#c0c1ff',
        'on-tertiary-fixed': '#07006c',
        'on-tertiary-fixed-variant': '#2f2ebe',

        background: '#f8f9ff',
        'on-background': '#0b1c30',

        surface: '#f8f9ff',
        'surface-dim': '#cbdbf5',
        'surface-bright': '#f8f9ff',
        'surface-variant': '#d3e4fe',
        'on-surface': '#0b1c30',
        'on-surface-variant': '#464554',
        'inverse-surface': '#213145',
        'inverse-on-surface': '#eaf1ff',
        'surface-tint': '#5148d7',

        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#eff4ff',
        'surface-container': '#e5eeff',
        'surface-container-high': '#dce9ff',
        'surface-container-highest': '#d3e4fe',

        outline: '#777586',
        'outline-variant': '#c7c4d7',

        error: '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      spacing: {
        'space-xs': '0.25rem',
        'space-sm': '0.5rem',
        'space-md': '1rem',
        'space-lg': '1.5rem',
        'space-xl': '2.5rem',
        margin: '2rem',
        gutter: '1.5rem',
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'elevation-1': '0px 4px 20px -2px rgba(15,23,42,0.04), 0px 2px 6px -1px rgba(15,23,42,0.02)',
        'elevation-2': '0px 16px 36px -4px rgba(67,56,202,0.08), 0px 6px 12px -2px rgba(15,23,42,0.03)',
      },
    },
  },
  plugins: [],
} satisfies Config;
