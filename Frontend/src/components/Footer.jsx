import React from 'react';
import { ShieldCheck, Leaf, Users, Cpu } from 'lucide-react';
import { HarithaKarmaSenaLogo } from './Logos';
import HarithaKarmaSenaImg from '../assets/images/harithaKarma-sena.jpg';


export const FeaturesBar = () => {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 my-6">
      <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Feature 1 */}
          <div className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-emerald-100/80 shadow-xs hover:border-emerald-300 transition-colors">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#0f5b37] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900">Secure & Reliable</h4>
              <p className="text-[11px] text-gray-500 font-medium">Your data is safe with us</p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-emerald-100/80 shadow-xs hover:border-emerald-300 transition-colors">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#0f5b37] flex items-center justify-center shrink-0">
              <Leaf className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900">Eco-Friendly</h4>
              <p className="text-[11px] text-gray-500 font-medium">Working for a better tomorrow</p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-emerald-100/80 shadow-xs hover:border-emerald-300 transition-colors">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#0f5b37] flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900">For Haritha Karma Sena</h4>
              <p className="text-[11px] text-gray-500 font-medium">Empowering our green warriors</p>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-emerald-100/80 shadow-xs hover:border-emerald-300 transition-colors">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#0f5b37] flex items-center justify-center shrink-0">
              <Cpu className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900">AI-Powered</h4>
              <p className="text-[11px] text-gray-500 font-medium">Smart technology for smart solutions</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export const QuoteBar = () => {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 my-6">
      <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">


        <div className="hidden md:block w-px h-10 bg-emerald-200"></div>

        {/* Center/Right Quote */}
        <div className="flex justify-center items-center gap-2 w-full">
          <span className="text-center flex-1 text-emerald-950 font-semibold text-sm sm:text-base italic">
            "Let's work together for a cleaner and greener Kerala for future generations."
          </span>
        </div>

      </div>
    </div>
  );
};

export const Footer = ({ onOpenPrivacy, onOpenTerms }) => {
  return (
    <footer className="w-full bg-[#0a4d2c] text-white text-xs py-4 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">

        <div>
          <span>© 2026 EcoMind AI </span>
        </div>

        <div className="flex items-center gap-1.5 font-medium text-emerald-100">
          <span>Developed for Assist Haritha Karma Sena</span>
          <span className="text-emerald-300">🌿</span>
        </div>

        <div className="flex items-center gap-4 text-emerald-200">
          <button
            onClick={onOpenPrivacy}
            className="hover:text-white transition-colors focus:outline-none"
          >
            Privacy Policy
          </button>
          <span>|</span>
          <button
            onClick={onOpenTerms}
            className="hover:text-white transition-colors focus:outline-none"
          >
            Terms of Service
          </button>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
