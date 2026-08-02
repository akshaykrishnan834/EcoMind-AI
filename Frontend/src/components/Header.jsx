import React from 'react';
import { KeralaGovLogo, HarithaKarmaSenaLogo, EcoMindLogo } from './Logos';

export const Header = () => {
  return (
    <header className="w-full bg-white border-b border-emerald-100/80 py-4 px-4 sm:px-6 lg:px-8 shadow-xs">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 items-center gap-4">
        {/* Left: Kerala Government Emblem */}
        <div className="flex items-center justify-center md:justify-start">
          <KeralaGovLogo />
        </div>

        {/* Center: EcoMind AI Branding & Pill Banner */}
        <div className="flex flex-col items-center justify-center text-center space-y-2.5">
          <EcoMindLogo />
          <div className="inline-flex items-center justify-center bg-[#0a4d2c] text-white px-6 py-1.5 rounded-full text-xs sm:text-sm font-semibold tracking-wide shadow-xs">
            <span>Together for a Cleaner Kerala</span>
          </div>
        </div>

        {/* Right: Haritha Karma Sena Logo */}
        <div className="flex items-center justify-center md:justify-end">
          <HarithaKarmaSenaLogo />
        </div>
      </div>
    </header>
  );
};

export default Header;
