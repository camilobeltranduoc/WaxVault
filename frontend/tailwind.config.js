/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta de colores temática para WaxVault
        vinyl: {
          black: '#1a1a1a',     // Negro de disco de vinilo
          groove: '#2d2d2d',    // Gris oscuro de los surcos
          label: '#c9a84c',     // Dorado cálido (etiquetas vintage de los discos)
          cream: '#f5f0e8',     // Crema (fondos estilo portada de LP)
          red: '#c0392b',       // Rojo clásico de sellos (Columbia, etc.)
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Georgia', 'serif'],  // Para títulos estilo vintage
      },
      boxShadow: {
        vinyl: '0 4px 20px rgba(0, 0, 0, 0.3)',  // Sombra más pronunciada para tarjetas
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',  // Para animación de disco girando
      },
    },
  },
  plugins: [],
}
