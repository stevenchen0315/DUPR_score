import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      animation: {
        blinkBg: 'blinkBg 2s ease-in-out infinite',
      },
      keyframes: {
        blinkBg: {
          '0%, 100%': { backgroundColor: '#FEF9C3' }, // yellow-100
          '50%': { backgroundColor: '#FDE68A' }, // yellow-200
        },
      },
    },
  },
  plugins: [],
}

export default config
