/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    screens: {
      sm: "480px",
      md: "768px",
      lg: "976px",
      xl: "1440px",
    },
    fontSize: {
      xs: "0.5rem",
      sm: "0.8rem",
      base: "1rem",
      lg: "1.2rem",
      xl: "1.5rem",
      "2xl": "2rem",
      "3xl": "3rem",
    },
    fontWeight: {
      hairline: "100",
      extralight: "200",
      light: "300",
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
      extrabold: "800",
      heavy: "900",
    },
    extend: {
      transitionProperty: {
        "max-height": "max-height",
      },
    },
  },
  plugins: [],
};
