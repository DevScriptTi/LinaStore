/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-cairo)', 'sans-serif'],
      },
      colors: {
        // Material Design 3 Color Tokens
        md: {
          primary: {
            DEFAULT: 'var(--md-sys-color-primary)',
            on: 'var(--md-sys-color-on-primary)',
            container: 'var(--md-sys-color-primary-container)',
            'on-container': 'var(--md-sys-color-on-primary-container)',
          },
          secondary: {
            DEFAULT: 'var(--md-sys-color-secondary)',
            on: 'var(--md-sys-color-on-secondary)',
            container: 'var(--md-sys-color-secondary-container)',
            'on-container': 'var(--md-sys-color-on-secondary-container)',
          },
          tertiary: {
            DEFAULT: 'var(--md-sys-color-tertiary)',
            on: 'var(--md-sys-color-on-tertiary)',
            container: 'var(--md-sys-color-tertiary-container)',
            'on-container': 'var(--md-sys-color-on-tertiary-container)',
          },
          error: {
            DEFAULT: 'var(--md-sys-color-error)',
            on: 'var(--md-sys-color-on-error)',
            container: 'var(--md-sys-color-error-container)',
            'on-container': 'var(--md-sys-color-on-error-container)',
          },
          background: {
            DEFAULT: 'var(--md-sys-color-background)',
            on: 'var(--md-sys-color-on-background)',
          },
          surface: {
            DEFAULT: 'var(--md-sys-color-surface)',
            on: 'var(--md-sys-color-on-surface)',
            variant: 'var(--md-sys-color-surface-variant)',
            'on-variant': 'var(--md-sys-color-on-surface-variant)',
            container: 'var(--md-sys-color-surface-container)',
            'container-low': 'var(--md-sys-color-surface-container-low)',
            'container-high': 'var(--md-sys-color-surface-container-high)',
            'container-highest': 'var(--md-sys-color-surface-container-highest)',
          },
          outline: {
            DEFAULT: 'var(--md-sys-color-outline)',
            variant: 'var(--md-sys-color-outline-variant)',
          },
        },
      },
      boxShadow: {
        // MD3 Elevation Tokens
        'md-1': '0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)',
        'md-2': '0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)',
        'md-3': '0px 1px 3px 0px rgba(0, 0, 0, 0.30), 0px 4px 8px 3px rgba(0, 0, 0, 0.15)',
        'md-4': '0px 2px 3px 0px rgba(0, 0, 0, 0.30), 0px 6px 10px 4px rgba(0, 0, 0, 0.15)',
        'md-5': '0px 4px 4px 0px rgba(0, 0, 0, 0.30), 0px 8px 12px 6px rgba(0, 0, 0, 0.15)',
      },
      borderRadius: {
        // MD3 Shape Tokens
        'md-xs': '4px',
        'md-sm': '8px',
        'md-md': '12px',
        'md-lg': '16px',
        'md-xl': '28px',
        'md-full': '9999px',
      },
    },
  },
  plugins: [],
};
