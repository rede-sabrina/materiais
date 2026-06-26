module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#EC008C',
      },
      borderRadius: {
        xl: '0.75rem'
      },
      boxShadow: {
        soft: '0 6px 18px rgba(0,0,0,0.08)'
      }
    },
  },
  plugins: [],
}
