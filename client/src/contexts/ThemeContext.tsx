import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeColor = {
  name: string;
  primary: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  border: string;
  accent: string;
};

type ThemeContextType = {
  currentTheme: string;
  setTheme: (theme: string) => void;
  availableThemes: ThemeColor[];
};

const defaultThemes: ThemeColor[] = [
  {
    name: 'Default',
    primary: '222.2 47.4% 11.2%',
    background: '0 0% 100%',
    foreground: '222.2 84% 4.9%',
    card: '0 0% 100%',
    cardForeground: '222.2 84% 4.9%',
    border: '214.3 31.8% 91.4%',
    accent: '210 40% 96.1%',
  },
  {
    name: 'Blue',
    primary: '221 83% 53%',
    background: '210 40% 98%',
    foreground: '222.2 84% 4.9%',
    card: '0 0% 100%',
    cardForeground: '222.2 84% 4.9%',
    border: '214.3 31.8% 91.4%',
    accent: '217 91% 60% / 10%',
  },
  {
    name: 'Green',
    primary: '142 76% 36%',
    background: '120 60% 98%',
    foreground: '222.2 84% 4.9%',
    card: '0 0% 100%',
    cardForeground: '222.2 84% 4.9%',
    border: '214.3 31.8% 91.4%',
    accent: '142 71% 45% / 10%',
  },
  {
    name: 'Purple',
    primary: '267 83% 60%',
    background: '270 50% 98%',
    foreground: '222.2 84% 4.9%',
    card: '0 0% 100%',
    cardForeground: '222.2 84% 4.9%',
    border: '214.3 31.8% 91.4%',
    accent: '267 83% 60% / 10%',
  },
  {
    name: 'Orange',
    primary: '24 95% 53%',
    background: '30 50% 98%',
    foreground: '222.2 84% 4.9%',
    card: '0 0% 100%',
    cardForeground: '222.2 84% 4.9%',
    border: '214.3 31.8% 91.4%',
    accent: '24 95% 53% / 10%',
  },
];

const ThemeContext = createContext<ThemeContextType>({
  currentTheme: 'Default',
  setTheme: () => {},
  availableThemes: defaultThemes,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<string>('Default');

  // Load theme from localStorage on initial render
  useEffect(() => {
    const savedTheme = localStorage.getItem('ielts-theme');
    if (savedTheme) {
      setCurrentTheme(savedTheme);
    }
  }, []);

  // Apply theme CSS variables when theme changes
  useEffect(() => {
    const theme = defaultThemes.find((t) => t.name === currentTheme) || defaultThemes[0];
    const root = document.documentElement;

    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--background', theme.background);
    root.style.setProperty('--foreground', theme.foreground);
    root.style.setProperty('--card', theme.card);
    root.style.setProperty('--card-foreground', theme.cardForeground);
    root.style.setProperty('--border', theme.border);
    root.style.setProperty('--accent', theme.accent);

    // Save theme preference to localStorage
    localStorage.setItem('ielts-theme', currentTheme);
  }, [currentTheme]);

  const setTheme = (theme: string) => {
    setCurrentTheme(theme);
  };

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        setTheme,
        availableThemes: defaultThemes,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);