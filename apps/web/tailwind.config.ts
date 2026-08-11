import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "rgb(var(--border) / <alpha-value>)",
        "border-strong": "rgb(var(--border-strong) / <alpha-value>)",
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-subtle": "rgb(var(--surface-subtle) / <alpha-value>)",
        "surface-inverse": "rgb(var(--surface-inverse) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        "muted-foreground": "rgb(var(--muted-foreground) / <alpha-value>)",
        "secondary-foreground": "rgb(var(--secondary-foreground) / <alpha-value>)",
        primary: "rgb(var(--primary) / <alpha-value>)",
        "primary-hover": "rgb(var(--primary-hover) / <alpha-value>)",
        "primary-foreground": "rgb(var(--primary-foreground) / <alpha-value>)",
        "primary-soft": "rgb(var(--primary-soft) / <alpha-value>)",
        "primary-border": "rgb(var(--primary-border) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        "accent-soft": "rgb(var(--accent-soft) / <alpha-value>)",
        "accent-highlight": "rgb(var(--accent-highlight) / <alpha-value>)",
        "inverse-foreground": "rgb(var(--inverse-foreground) / <alpha-value>)",
        "inverse-muted": "rgb(var(--inverse-muted) / <alpha-value>)",
        info: "rgb(var(--info) / <alpha-value>)",
        "info-surface": "rgb(var(--info-surface) / <alpha-value>)",
        "info-border": "rgb(var(--info-border) / <alpha-value>)",
        success: "rgb(var(--success) / <alpha-value>)",
        "success-surface": "rgb(var(--success-surface) / <alpha-value>)",
        "success-border": "rgb(var(--success-border) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
        "warning-surface": "rgb(var(--warning-surface) / <alpha-value>)",
        "warning-border": "rgb(var(--warning-border) / <alpha-value>)",
        destructive: "rgb(var(--destructive) / <alpha-value>)",
        "destructive-surface": "rgb(var(--destructive-surface) / <alpha-value>)",
        "destructive-border": "rgb(var(--destructive-border) / <alpha-value>)",
        "destructive-foreground": "rgb(var(--destructive-foreground) / <alpha-value>)",
        overlay: "rgb(var(--overlay) / <alpha-value>)"
      },
      boxShadow: {
        soft: "0 10px 30px rgb(var(--shadow-color) / 0.08)",
        raised: "0 18px 48px rgb(var(--shadow-color) / 0.1)",
        overlay: "0 24px 60px rgb(var(--shadow-color) / 0.18)"
      }
    }
  },
  plugins: []
};

export default config;
