/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#2CBB00",
      },
    },
  },
  plugins: [
    // ...
  ],
  corePlugins: {
    preflight: false, // <== disable this!
    divideStyle: true
  },
};
