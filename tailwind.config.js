// tailwind.config.js
module.exports = {
    darkMode: ["class"],
    content: [
      "./app/**/*.{ts,tsx,js,jsx}",
      "./components/**/*.{ts,tsx,js,jsx}",
      "./pages/**/*.{ts,tsx,js,jsx}",
    ],
    theme: {
      extend: {
        colors: {
          background: "hsl(var(--background))",
          foreground: "hsl(var(--foreground))",
          card: "hsl(var(--card))",
          "card-foreground": "hsl(var(--card-foreground))",
          border: "hsl(var(--border))",
          input: "hsl(var(--input))",
          ring: "hsl(var(--ring))",
          muted: "hsl(var(--muted))",
          "muted-foreground": "hsl(var(--muted-foreground))",
          secondary: "hsl(var(--secondary))",
          "secondary-foreground": "hsl(var(--secondary-foreground))",
          success: "hsl(var(--success))",
          "success-light": "hsl(var(--success-light))",
          "success-foreground": "hsl(var(--success-foreground))",
        },
        borderRadius: {
          lg: "var(--radius)",
          xl: "calc(var(--radius) + 4px)",
          "2xl": "calc(var(--radius) + 8px)",
        },
      },
    },
    plugins: [],
  };
  