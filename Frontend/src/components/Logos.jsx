import React from 'react';
import KeralaGovImg from "../assets/images/Government-of-kerala.jpg";
import HarithaKarmaSenaImg from "../assets/images/harithaKarma-sena.jpg";
import wokersimg from "../assets/images/harithakarmasena-workers.jpg";
import ecomindlogo from "../assets/images/logo-ecomind.png";
import imgeco2 from "../assets/images/img22.jpg";
import signupimg from "../assets/images/signupimage.jpg";

// Government of Kerala Emblem Component using Government-of-kerala.jpg asset
export const KeralaGovLogo = ({ className = "h-14 w-auto" }) => (
  <div className={`flex items-center gap-2.5 ${className}`}>
    <img
      src={KeralaGovImg}
      alt="Government of Kerala Emblem"
      className="h-12 w-auto object-contain rounded-sm"
    />
    <div className="flex flex-col justify-center leading-tight">
      <span className="font-extrabold text-[13px] tracking-tight text-gray-800 uppercase">An Initiative of</span>
      <span className="font-extrabold text-[13px] tracking-tight text-gray-800 uppercase">Government of Kerala</span>
      <span className="text-[11px] font-medium text-gray-600">Local Self Government Department</span>
    </div>
  </div>
);

// Haritha Karma Sena Logo Component using harithaKarma-sena.jpg asset
export const HarithaKarmaSenaLogo = ({ className = "h-14" }) => (
  <div className={`flex items-center gap-2.5 ${className}`}>
    <img
      src={HarithaKarmaSenaImg}
      alt="Haritha Karma Sena Logo"
      className="h-12 w-auto object-contain rounded-sm"
    />
    <div className="flex flex-col leading-tight">
      <span className="font-extrabold text-[13px] tracking-wide text-green-900 uppercase">HARITHA KARMA SENA</span>
      <span className="text-[12px] font-bold text-emerald-700 font-serif">ഹരിത കർമ്മ സേന</span>
    </div>
  </div>
);

// EcoMind AI Logo
export const EcoMindLogo = () => (
  <div className="flex flex-col items-center justify-center text-center">
    <div className="flex items-center justify-center gap-3 sm:gap-3.5">
      <img
        src={ecomindlogo}
        alt="EcoMind AI Logo"
        className="w-12 h-12 sm:w-14 sm:h-14 object-contain shrink-0 drop-shadow-xs"
      />

      <div className="text-left flex flex-col justify-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#0d6e38] leading-none mb-1">
          EcoMind AI
        </h1>

        <p className="text-[11px] sm:text-xs font-semibold text-gray-700 leading-tight">
          AI-Powered Smart Recyclable Waste
        </p>

        <p className="text-[11px] sm:text-xs font-semibold text-gray-600 leading-tight">
          Collection & Management System
        </p>
      </div>
    </div>
  </div>
);

// Left Hero Illustration for Login (Haritha Karma Sena Workers in Green Landscape)
export const LoginHeroIllustration = () => (
  <div className="relative w-full h-full min-h-[360px] rounded-2xl overflow-hidden shadow-lg group bg-gradient-to-b from-emerald-50/90 via-green-50/50 to-emerald-100/70 border border-emerald-200/80 flex flex-col justify-between p-4 transition-all duration-300 hover:shadow-xl">
    <div className="w-full flex-1 min-h-[260px] overflow-hidden rounded-xl relative bg-emerald-900/5">
      <img
        src={wokersimg}
        alt="Clean & Green Kerala Mission"
        className="w-full h-full object-cover object-top rounded-xl shadow-xs group-hover:scale-105 transition-transform duration-500"
      />
    </div>

    <div className="mt-3.5 bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-emerald-200/80 shadow-sm flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs">
        🌱
      </div>
      <div>
        <h4 className="text-xs font-bold text-green-900 uppercase tracking-wide">Clean & Green Kerala Mission</h4>
        <p className="text-[11px] text-gray-600 font-medium leading-tight mt-0.5">Haritha Karma Sena Door-to-Door Waste Stream Management</p>
      </div>
    </div>
  </div>
);

// Left Hero Illustration for Sign Up
export const SignUpHeroIllustration = () => (
  <div className="relative w-full h-full min-h-[360px] rounded-2xl overflow-hidden shadow-lg group bg-gradient-to-b from-emerald-50/90 via-green-50/50 to-emerald-100/70 border border-emerald-200/80 flex flex-col justify-between p-4 transition-all duration-300 hover:shadow-xl">
    <div className="w-full flex-1 min-h-[260px] overflow-hidden rounded-xl relative bg-emerald-900/5">
      <img
        src={signupimg}
        alt="EcoMind Smart Recycling Network"
        className="w-full h-full object-cover object-top rounded-xl shadow-xs group-hover:scale-105 transition-transform duration-500"
      />
    </div>

    <div className="mt-3.5 bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-emerald-200/80 shadow-sm flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs">
        ♻️
      </div>
      <div>
        <h4 className="text-xs font-bold text-green-900 uppercase tracking-wide">EcoMind Smart Recycling Network</h4>
        <p className="text-[11px] text-gray-600 font-medium leading-tight mt-0.5">Empowering Sustainable Communities Across Kerala</p>
      </div>
    </div>
  </div>
);

