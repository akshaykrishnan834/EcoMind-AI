import React from 'react';
import { KeralaGovLogo, HarithaKarmaSenaLogo, EcoMindLogo } from './Logos';
import ThemeToggle from './ThemeToggle';

export const Header = () => {
  return (
    <header className="w-full bg-white dark:bg-[#111e17] border-b border-emerald-100/80 dark:border-emerald-900/60 py-3.5 px-4 sm:px-6 lg:px-8 shadow-xs sticky top-0 z-30 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Kerala Government Emblem */}
        <div className="flex items-center">
          <KeralaGovLogo />
        </div>

        {/* Center: EcoMind AI Branding */}
        <div className="flex flex-col items-center justify-center text-center">
          <EcoMindLogo />
        </div>

        {/* Right: Theme Mode Toggle & Haritha Karma Sena Logo */}
        <div className="flex items-center justify-end gap-3 sm:gap-4">
          <ThemeToggle variant="button" />
          <div className="h-6 w-px bg-gray-200 dark:bg-emerald-900/60 hidden sm:block" />
          <HarithaKarmaSenaLogo />
        </div>
      </div>
    </header>
  );
};

export default Header;
