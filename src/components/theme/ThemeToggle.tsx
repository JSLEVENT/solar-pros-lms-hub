import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }:{ className?: string }){
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={toggle}
      className={cn('inline-flex items-center gap-1 rounded-md border px-3 py-2 text-xs font-medium transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background', className)}
    >
      {theme==='dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="hidden sm:inline">{theme==='dark' ? 'Light' : 'Dark'}</span>
    </button>
  );
}