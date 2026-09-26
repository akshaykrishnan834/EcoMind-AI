import React from 'react';
import {
  Sun,
  Moon,
  Monitor,
  Check,
  Sparkles,
  Sliders,
  Bell,
  Volume2,
  Shield,
  Eye,
  Smartphone,
  CheckCircle2
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const CitizenSettings = ({ citizenData, setActiveTab }) => {
  const { theme, setTheme, isDark, toggleTheme } = useTheme();

  const themeOptions = [
    {
      id: 'light',
      title: 'Light (Enterprise White)',
      desc: 'Clean white background with dark slate typography and subtle EcoMind green accents. Modern enterprise SaaS design.',
      icon: Sun,
      iconColor: 'text-amber-500',
      badge: 'Crisp & Clean',
      previewBg: 'bg-slate-50 border-gray-200',
      previewCard: 'bg-white border-gray-200 text-slate-800'
    },
    {
      id: 'dark',
      title: 'Dark (Deep Charcoal)',
      desc: 'Deep charcoal surfaces with soft white text and subtle borders inspired by Instagram & Facebook dark modes.',
      icon: Moon,
      iconColor: 'text-indigo-400',
      badge: 'Modern Charcoal',
      previewBg: 'bg-[#121417] border-white/10',
      previewCard: 'bg-[#1f2329] border-white/10 text-slate-100'
    },
    {
      id: 'system',
      title: 'System Synchronized',
      desc: 'Automatically matches your device or operating system appearance settings.',
      icon: Monitor,
      iconColor: 'text-emerald-500',
      badge: 'Auto Sync',
      previewBg: 'bg-gradient-to-r from-slate-50 to-[#121417] border-gray-300 dark:border-white/10',
      previewCard: 'bg-white/90 dark:bg-[#1f2329]/90 border-emerald-500/30 text-slate-800 dark:text-slate-100'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0a4d2c] via-[#0f5b37] to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
              <Sliders className="w-3.5 h-3.5 text-emerald-300" />
              <span>Appearance & Display</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Theme & Display Settings</h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-xl">
              Customize how EcoMind AI looks on your device. Choose between our signature White Mode, sleek Dark Mode, or auto-sync with system preferences.
            </p>
          </div>

          <button
            onClick={toggleTheme}
            className="self-start sm:self-center px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm shrink-0"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-indigo-200" />}
            <span>Quick Toggle: {isDark ? 'White Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      </div>

      {/* Theme Mode Selector Section */}
      <div className="bg-white dark:bg-[#14231b] rounded-3xl border border-emerald-100 dark:border-emerald-900/60 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="border-b border-gray-100 dark:border-emerald-900/40 pb-4">
          <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <span>Theme Selection</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Select your preferred visual mode. Changes take effect instantly and persist across all sessions.
          </p>
        </div>

        {/* 3 Theme Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {themeOptions.map((opt) => {
            const isSelected = theme === opt.id;
            const Icon = opt.icon;

            return (
              <div
                key={opt.id}
                onClick={() => setTheme(opt.id)}
                className={`relative rounded-2xl p-5 border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 shadow-md ring-2 ring-emerald-500/20'
                    : 'border-gray-200 dark:border-emerald-900/60 hover:border-emerald-300 dark:hover:border-emerald-700 bg-white dark:bg-[#162920]'
                }`}
              >
                {/* Header of card */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#1f382a] border border-gray-200 dark:border-emerald-800 flex items-center justify-center shadow-2xs">
                      <Icon className={`w-5 h-5 ${opt.iconColor}`} />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-emerald-900/60 text-gray-600 dark:text-emerald-300">
                        {opt.badge}
                      </span>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">{opt.title}</h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed mt-1">
                      {opt.desc}
                    </p>
                  </div>
                </div>

                {/* Visual miniature preview */}
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-emerald-900/40">
                  <div className={`p-2 rounded-xl border ${opt.previewBg} space-y-1.5`}>
                    <div className="flex items-center justify-between text-[9px] font-bold text-gray-500 px-1">
                      <span>Header</span>
                      <span>Card</span>
                    </div>
                    <div className={`p-2 rounded-lg border text-[10px] font-bold flex items-center justify-between ${opt.previewCard}`}>
                      <span>EcoMind AI</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Current Active Theme Status Bar */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-extrabold text-[#0a4d2c] dark:text-emerald-300 block">
                Active Theme: {isDark ? 'Dark Mode' : 'White (Light) Mode'}
              </span>
              <span className="text-[11px] text-gray-600 dark:text-gray-400">
                Mode selection is applied immediately to all dashboards, tables, maps, and AI chatbot screens.
              </span>
            </div>
          </div>

          <div className="shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-white dark:bg-[#1a3325] text-[#0a4d2c] dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Synced & Saved
            </span>
          </div>
        </div>
      </div>

      {/* Accessibility & Interface Preferences */}
      <div className="bg-white dark:bg-[#14231b] rounded-3xl border border-emerald-100 dark:border-emerald-900/60 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="border-b border-gray-100 dark:border-emerald-900/40 pb-3">
          <h2 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-600" />
            <span>Display & Accessibility</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl border border-gray-200 dark:border-emerald-900/60 bg-gray-50/50 dark:bg-[#162720] flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-bold text-gray-900 dark:text-white block">High Contrast Mode</span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">Increases table border visibility</span>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold text-[10px]">
              Active
            </span>
          </div>

          <div className="p-4 rounded-2xl border border-gray-200 dark:border-emerald-900/60 bg-gray-50/50 dark:bg-[#162720] flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-bold text-gray-900 dark:text-white block">Animations & Transitions</span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">Smooth theme and drawer animations</span>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold text-[10px]">
              Enabled
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenSettings;
