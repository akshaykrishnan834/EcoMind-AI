import React from 'react';
import { KeralaGovLogo, HarithaKarmaSenaLogo, EcoMindLogo } from './Logos';

export const Header = () => {
  return (
    <header className="w-full bg-white border-b border-emerald-100/80 py-3.5 px-4 sm:px-6 lg:px-8 shadow-xs sticky top-0 z-30">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Kerala Government Emblem */}
        <div className="flex items-center">
          <KeralaGovLogo />
        </div>

        {/* Center: EcoMind AI Branding */}
        <div className="flex flex-col items-center justify-center text-center">
          <EcoMindLogo />
        </div>

        {/* Right: Haritha Karma Sena Logo */}
        <div className="flex items-center justify-end">
          <HarithaKarmaSenaLogo />
        </div>
      </div>
    </header>
  );
};

export default Header;
