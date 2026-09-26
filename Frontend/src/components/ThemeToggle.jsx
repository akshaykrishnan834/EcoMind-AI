import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, ChevronDown, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle = ({ variant = 'button', className = '' }) => {
  const { theme, setTheme, isDark, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Variant: Modern Header Button Toggle (Symbol / Icon Only)
  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`p-2 rounded-xl text-gray-700 dark:text-gray-200 hover:text-emerald-700 dark:hover:text-emerald-400 bg-gray-100/90 dark:bg-[#181b20] hover:bg-gray-200/80 dark:hover:bg-[#242930] border border-gray-200/80 dark:border-white/10 shadow-2xs transition-all duration-200 cursor-pointer flex items-center justify-center group ${className}`}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        aria-label="Toggle theme"
      >
        <div className="relative w-4 h-4 flex items-center justify-center">
          {isDark ? (
            <Moon className="w-4 h-4 text-indigo-400 group-hover:rotate-12 transition-transform duration-300" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500 group-hover:rotate-45 transition-transform duration-300" />
          )}
        </div>
      </button>
    );
  }

  // Variant: Sidebar Row Item
  if (variant === 'sidebar') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`w-full flex items-center justify-between p-2.5 rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/80 dark:bg-[#181b20] hover:bg-gray-100/90 dark:hover:bg-[#242930] transition-all cursor-pointer ${className}`}
        title={`Currently ${isDark ? 'Dark Mode' : 'Light Mode'}. Click to toggle.`}
      >
        <div className="flex items-center gap-2.5 text-xs font-bold text-gray-800 dark:text-gray-200">
          {isDark ? (
            <Moon className="w-4 h-4 text-indigo-400 shrink-0" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500 shrink-0" />
          )}
          <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
        </div>

        {/* Elegant Toggle Switch Pill */}
        <div className={`w-8 h-4.5 rounded-full transition-colors relative ${isDark ? 'bg-emerald-600' : 'bg-gray-300'}`}>
          <div
            className={`w-3.5 h-3.5 rounded-full bg-white shadow-xs absolute top-0.5 transition-transform duration-200 ${
              isDark ? 'translate-x-4' : 'translate-x-0.5'
            }`}
          />
        </div>
      </button>
    );
  }

  // Variant: Segmented Button Pill for Settings Page
  return (
    <div className={`inline-flex items-center p-1 rounded-xl bg-gray-100 dark:bg-[#181b20] border border-gray-200 dark:border-white/10 ${className}`}>
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          theme === 'light'
            ? 'bg-white text-emerald-800 shadow-xs dark:bg-[#242930] dark:text-emerald-400'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
        }`}
      >
        <Sun className="w-3.5 h-3.5 text-amber-500" />
        <span>Light Mode</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          theme === 'dark'
            ? 'bg-white text-emerald-800 shadow-xs dark:bg-[#242930] dark:text-emerald-400'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
        }`}
      >
        <Moon className="w-3.5 h-3.5 text-indigo-400" />
        <span>Dark Mode</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme('system')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          theme === 'system'
            ? 'bg-white text-emerald-800 shadow-xs dark:bg-[#242930] dark:text-emerald-400'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
        }`}
      >
        <Monitor className="w-3.5 h-3.5 text-gray-400" />
        <span>System</span>
      </button>
    </div>
  );
};

export default ThemeToggle;
