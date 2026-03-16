/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#F7F5F0',
        'background-deep': '#F0EDE6',
        surface: '#FFFFFF',
        'surface-elevated': '#FFFFFF',
        'surface-secondary': '#F2F0EB',
        surface: '#FFFFFF',
        foreground: '#1A1A24',
        'foreground-muted': '#2D2D3A',
        muted: '#6B6B7A',
        'muted-light': '#9A9AA6',
        accent: '#A67C52',
        'accent-gold': '#C9A227',
        'accent-hover': '#8B6B3D',
        success: '#2D7A4F',
        'success-muted': '#E8F5EE',
        danger: '#B83232',
        'danger-muted': '#FDF2F2',
        border: '#E8E5DF',
        'border-subtle': '#EDEBE6',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Cormorant Garamond', 'Cinzel', 'Georgia', 'serif'],
      },
      fontSize: {
        'display-lg': ['2.5rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        'display-md': ['2rem', { lineHeight: '1.25', letterSpacing: '-0.02em' }],
        'display-sm': ['1.5rem', { lineHeight: '1.3' }],
      },
      boxShadow: {
        'soft': '0 2px 8px -2px rgba(26, 26, 36, 0.06), 0 4px 16px -4px rgba(26, 26, 36, 0.04)',
        'soft-lg': '0 4px 16px -4px rgba(26, 26, 36, 0.08), 0 8px 32px -8px rgba(26, 26, 36, 0.06)',
        'card': '0 1px 3px rgba(26, 26, 36, 0.04)',
        'card-hover': '0 4px 12px -2px rgba(26, 26, 36, 0.06), 0 8px 24px -4px rgba(26, 26, 36, 0.04)',
        'inner': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.6)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      transitionDuration: {
        '250': '250ms',
      },
    },
  },
  plugins: [],
}
