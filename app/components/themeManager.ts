// Sistema de Temas - Colores y Configuración
export const colors = {
  primary: {
    light: "#ffffff",
    dark: "#0f172a"
  },
  background: {
    light: "#f8fafc",
    dark: "#000000"
  },
  accent: {
    primary: "#3b82f6",
    dark: "#1e40af",
    light: "#dbeafe"
  },
  text: {
    primary: {
      light: "#0f172a",
      dark: "#ffffff"
    },
    secondary: {
      light: "#64748b",
      dark: "#cbd5e1"
    },
    muted: {
      light: "#94a3b8",
      dark: "#78716c"
    }
  },
  border: {
    light: "#e2e8f0",
    dark: "#27272a"
  },
  hover: {
    light: "#f1f5f9",
    dark: "#1f2937"
  },
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6"
};

export const themes = {
  light: {
    bg: colors.background.light,
    bgSecondary: "#ffffff",
    text: colors.text.primary.light,
    textSecondary: colors.text.secondary.light,
    border: colors.border.light,
    hover: colors.hover.light,
    navBg: "rgba(255, 255, 255, 0.8)",
    cardBg: "#ffffff",
    dropdownBg: "#ffffff",
    accent: colors.accent.primary
  },
  dark: {
    bg: colors.background.dark,
    bgSecondary: "#0f172a",
    text: colors.text.primary.dark,
    textSecondary: colors.text.secondary.dark,
    border: colors.border.dark,
    hover: colors.hover.dark,
    navBg: "black",
    cardBg: "black",
    dropdownBg: "#1f2937",
    accent: colors.accent.primary
  }
};

export class ThemeManager {
  currentTheme: string;
  constructor() {
    this.currentTheme = this.getStoredTheme() || this.getSystemTheme();
    this.applyTheme(this.currentTheme);
  }
  getStoredTheme() {
    return typeof window !== "undefined" ? localStorage.getItem('tecno-theme') : null;
  }
  setStoredTheme(theme: string) {
    if (typeof window !== "undefined") {
      localStorage.setItem('tecno-theme', theme);
    }
  }
  getSystemTheme() {
    if (typeof window !== "undefined") {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'dark';
    }
    return 'dark';
  }
  applyTheme(theme: string) {
    this.currentTheme = theme;
    if (typeof document !== "undefined") {
      const html = document.documentElement;
      // Set dark/light class for Tailwind and CSS variable compatibility
      if (theme === 'dark') {
        html.classList.add('dark');
        html.classList.remove('light');
      } else {
        html.classList.remove('dark');
        html.classList.add('light');
      }
      // Las variables CSS se manejan ahora en globals.css con las clases .dark y .light
    }
    this.setStoredTheme(theme);
    this.dispatchThemeChangeEvent();
  }
  toggleTheme() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(newTheme);
  }
  dispatchThemeChangeEvent() {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent('theme-changed', {
        detail: { theme: this.currentTheme }
      }));
    }
  }
  getTheme() {
    return this.currentTheme;
  }
  getThemeColors() {
    return themes[this.currentTheme];
  }
}

export const themeManager = new ThemeManager();
