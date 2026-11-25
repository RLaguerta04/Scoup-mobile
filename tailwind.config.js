/** @type {import('tailwindcss').Config} */
// Scoup brand tokens (ported from the web app's src/styles.css) so the mobile UI
// reads as the same product. Data-viz uses the Okabe–Ito colorblind-safe palette.
module.exports = {
  darkMode: 'class', // light-only app; avoids the 'media' auto color-scheme error
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Surfaces
        bg: '#faf9f5', // warm cream — app background
        surface: '#ffffff', // cards
        surface2: '#f5f4ed', // sidebar / modal
        surface3: '#f0eee6',
        surface4: '#e8e6dc',
        // Ink
        ink: '#121212',
        'ink-2': '#3d3d3a',
        'ink-3': '#73726c',
        'ink-4': '#505050',
        // Lines
        border: '#e8e6dc',
        'border-strong': 'rgba(31,30,29,0.3)',
        // Brand / actions
        primary: '#121212', // near-black primary action
        brand: '#f5a623', // amber accent (logo / highlights)
        link: '#578bd9',
        campaign: '#5b35b8',
        // Data-viz (Okabe–Ito, colorblind-safe)
        positive: '#0072b2',
        negative: '#d55e00',
        neutral: '#999999',
        viz: {
          blue: '#0072b2',
          vermillion: '#d55e00',
          green: '#009e73',
          orange: '#e69f00',
          sky: '#56b4e9',
          purple: '#cc79a7',
          yellow: '#f0e442',
          neutral: '#999999',
        },
      },
      // Weights are applied via the <Txt> component (each maps to its own loaded
      // font file), so only the base families live here.
      fontFamily: {
        sans: ['Archivo_400Regular'],
        mono: ['ChivoMono_400Regular'],
      },
      borderRadius: {
        card: '16px',
      },
    },
  },
  plugins: [],
};
