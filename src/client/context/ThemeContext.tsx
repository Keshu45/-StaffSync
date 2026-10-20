import React, { createContext, useContext, useEffect, useLayoutEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

export interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Synchronously applies theme classes and data attributes to the DOM and persists to localStorage.
 */
export function applyThemeToDOM(t: Theme) {
  if (typeof document === 'undefined') return;

  // Persist across standard keys for maximum compatibility
  try {
    localStorage.setItem('staffsync_theme', t);
    localStorage.setItem('theme', t);
  } catch (e) {
    // ignore in restricted environments (sandboxed iframes, private browsing)
  }

  const root = document.documentElement;
  const body = document.body;

  if (t === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
    root.setAttribute('data-theme', 'dark');
    root.setAttribute('data-mode', 'dark');
    root.style.colorScheme = 'dark';

    if (body) {
      body.classList.add('dark');
      body.classList.remove('light');
      body.setAttribute('data-theme', 'dark');
      body.setAttribute('data-mode', 'dark');
      body.style.colorScheme = 'dark';
    }
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
    root.setAttribute('data-theme', 'light');
    root.setAttribute('data-mode', 'light');
    root.style.colorScheme = 'light';

    if (body) {
      body.classList.remove('dark');
      body.classList.add('light');
      body.setAttribute('data-theme', 'light');
      body.setAttribute('data-mode', 'light');
      body.style.colorScheme = 'light';
    }
  }
}

/**
 * Resolves the initial theme using localStorage, DOM attributes, or prefers-color-scheme.
 */
function resolveInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';

  try {
    const saved = (localStorage.getItem('staffsync_theme') || localStorage.getItem('theme')) as Theme | null;
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }

    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      const dataTheme = root.getAttribute('data-theme') || root.getAttribute('data-mode');
      if (dataTheme === 'dark' || root.classList.contains('dark')) {
        return 'dark';
      }
      if (dataTheme === 'light' || root.classList.contains('light')) {
        return 'light';
      }
    }

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch (e) {
    // ignore
  }

  return 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const initial = resolveInitialTheme();
    // Synchronously ensure DOM matches initial resolved theme on first load
    if (typeof document !== 'undefined') {
      applyThemeToDOM(initial);
    }
    return initial;
  });

  // Synchronously update DOM before paint
  useIsomorphicLayoutEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  // Sync with cross-tab localStorage changes
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if ((e.key === 'staffsync_theme' || e.key === 'theme') && (e.newValue === 'light' || e.newValue === 'dark')) {
        const next = e.newValue as Theme;
        applyThemeToDOM(next);
        setThemeState(next);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Sync with system preference if user hasn't chosen a persistent preference
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      try {
        const saved = localStorage.getItem('staffsync_theme') || localStorage.getItem('theme');
        if (!saved) {
          const next: Theme = e.matches ? 'dark' : 'light';
          applyThemeToDOM(next);
          setThemeState(next);
        }
      } catch (err) {
        // ignore
      }
    };
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setThemeState(prev => {
      const next: Theme = prev === 'light' ? 'dark' : 'light';
      applyThemeToDOM(next);
      return next;
    });
  };

  const setTheme = (t: Theme) => {
    applyThemeToDOM(t);
    setThemeState(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
