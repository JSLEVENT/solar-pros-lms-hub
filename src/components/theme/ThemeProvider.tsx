import { ReactNode, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
const STORAGE_KEY = 'sp_theme';

export function ThemeProvider({ children }: { children: ReactNode }){
  const [theme, setTheme] = useState<Theme>('dark'); // default dark

  // Initialize from localStorage / prefers-color-scheme
  useEffect(()=>{
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme|null);
    if (stored) {
      setTheme(stored);
      document.documentElement.classList.toggle('dark', stored==='dark');
    } else {
      // Default dark (design requirement)
      document.documentElement.classList.add('dark');
    }
  },[]);

  const toggle = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEY, next);
      document.documentElement.classList.toggle('dark', next==='dark');
      return next;
    });
  };

  const value = { theme, toggle };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

interface ThemeContextValue { theme: Theme; toggle: ()=>void }
import { createContext, useContext } from 'react';
const ThemeContext = createContext<ThemeContextValue>({ theme:'dark', toggle: ()=>{} });
export function useTheme(){ return useContext(ThemeContext); }