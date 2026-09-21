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

  // Variant: Quick icon button with dropdown
  if (variant === 'button') {
    return (
      <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#0a4d2c] border border-emerald-200/90 shadow-2xs transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer dark:bg-[#1b3126] dark:text-emerald-300 dark:border-emerald-800/80 dark:hover:bg-[#233e31]"
            title={isDark ? 'Switch to White (Light) Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 animate-spinSlow transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-[#0a4d2c] transition-transform" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center justify-center w-5 h-9 rounded-md text-gray-500 hover:text-[#0a4d2c] hover:bg-emerald-50/80 transition-colors cursor-pointer dark:text-gray-400 dark:hover:text-emerald-300 dark:hover:bg-[#1b3126]"
            title="Theme settings"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-white dark:bg-[#16251e] border border-emerald-100 dark:border-emerald-800/80 shadow-xl py-1.5 z-50 animate-fade-in text-xs">
            <div className="px-3 py-1.5 border-b border-gray-100 dark:border-emerald-900/60 font-extrabold text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-400">
              Theme Mode
            </div>

            <button
              type="button"
              onClick={() => {
                setTheme('light');
                setDropdownOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors cursor-pointer ${
                theme === 'light'
                  ? 'bg-emerald-50 text-[#0a4d2c] font-extrabold dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#1e342a]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>White (Light) Mode</span>
              </div>
              {theme === 'light' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setTheme('dark');
                setDropdownOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors cursor-pointer ${
                theme === 'dark'
                  ? 'bg-emerald-50 text-[#0a4d2c] font-extrabold dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#1e342a]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Dark Mode</span>
              </div>
              {theme === 'dark' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setTheme('system');
                setDropdownOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors cursor-pointer ${
                theme === 'system'
                  ? 'bg-emerald-50 text-[#0a4d2c] font-extrabold dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#1e342a]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Monitor className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                <span>System Match</span>
              </div>
              {theme === 'system' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Variant: Sidebar row item
  if (variant === 'sidebar') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`w-full flex items-center justify-between p-2 rounded-xl border border-emerald-200/80 dark:border-emerald-800/80 bg-emerald-50/60 dark:bg-[#162920] hover:bg-emerald-100/70 dark:hover:bg-[#1e372b] transition-all cursor-pointer ${className}`}
        title={`Currently ${isDark ? 'Dark Mode' : 'White (Light) Mode'}. Click to toggle.`}
      >
        <div className="flex items-center gap-2.5 text-xs font-bold text-gray-800 dark:text-gray-200">
          {isDark ? (
            <Moon className="w-4 h-4 text-indigo-400 shrink-0" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500 shrink-0" />
          )}
          <span>{isDark ? 'Dark Mode' : 'White Mode'}</span>
        </div>

        {/* Pill switch */}
        <div className={`w-8 h-4 rounded-full transition-colors relative ${isDark ? 'bg-emerald-600' : 'bg-gray-300'}`}>
          <div
            className={`w-3 h-3 rounded-full bg-white shadow-xs absolute top-0.5 transition-transform duration-200 ${
              isDark ? 'translate-x-4.5' : 'translate-x-0.5'
            }`}
          />
        </div>
      </button>
    );
  }

  // Variant: Segmented button pill for settings page
  return (
    <div className={`inline-flex items-center p-1 rounded-xl bg-gray-100 dark:bg-[#162720] border border-gray-200 dark:border-emerald-900/60 ${className}`}>
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          theme === 'light'
            ? 'bg-white text-[#0a4d2c] shadow-xs dark:bg-[#233d30] dark:text-emerald-200'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
        }`}
      >
        <Sun className="w-3.5 h-3.5 text-amber-500" />
        <span>White Mode</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          theme === 'dark'
            ? 'bg-white text-[#0a4d2c] shadow-xs dark:bg-[#233d30] dark:text-emerald-200'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
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
            ? 'bg-white text-[#0a4d2c] shadow-xs dark:bg-[#233d30] dark:text-emerald-200'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
        }`}
      >
        <Monitor className="w-3.5 h-3.5 text-gray-500" />
        <span>System</span>
      </button>
    </div>
  );
};

export default ThemeToggle;
