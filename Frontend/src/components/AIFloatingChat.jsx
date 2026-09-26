import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import AIChatBot from './AIChatBot';
import EmoRobot from './EmoRobot';

const AIFloatingChat = ({
  citizenData,
  monthlyStatusData,
  realRequests = [],
  assignedWorker,
  setActiveTab,
  onExpandFull
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Popup Window */}
      {isOpen && (
        <div className="mb-3 w-[92vw] sm:w-[450px] max-w-lg h-[580px] sm:h-[620px] shadow-2xl rounded-3xl overflow-hidden border border-emerald-100/90 bg-white animate-scaleUp">
          <AIChatBot
            citizenData={citizenData}
            monthlyStatusData={monthlyStatusData}
            realRequests={realRequests}
            assignedWorker={assignedWorker}
            setActiveTab={setActiveTab}
            isFloating={true}
            onClose={() => setIsOpen(false)}
            onExpandFull={onExpandFull ? () => {
              setIsOpen(false);
              onExpandFull();
            } : undefined}
          />
        </div>
      )}

      {/* Floating Animated EMO Robot Launcher */}
      {!isOpen && (
        <div className="relative group flex flex-col items-end">
          {/* Floating Compact Speech Bubble Tag */}
          <div className="mb-1.5 bg-[#0a4d2c]/95 text-white border border-emerald-400/50 text-[11px] font-bold px-3 py-1 rounded-xl shadow-lg flex items-center gap-1.5 group-hover:scale-105 transition-all duration-300 pointer-events-none backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="tracking-wide">Ask Mittu</span>
            <Sparkles className="w-3 h-3 text-emerald-300" />
            <div className="absolute -bottom-1 right-6 w-2 h-2 bg-[#0a4d2c] border-r border-b border-emerald-400/50 rotate-45" />
          </div>

          {/* Clickable Animated EMO Robot Trigger */}
          <button
            onClick={() => setIsOpen(true)}
            className="relative flex items-center justify-center p-1 cursor-pointer transition-all duration-300 transform hover:scale-110 active:scale-95 focus:outline-none filter drop-shadow-[0_8px_20px_rgba(5,150,105,0.4)]"
            title="Click to chat with Mittu AI"
          >
            {/* Ambient glowing radial blur */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/30 to-teal-400/30 rounded-full blur-xl -z-10 group-hover:blur-2xl transition-all" />

            <EmoRobot
              size="pet"
              pose="running"
              state="idle"
              interactive={false}
            />

            {/* Online Live Status Pulse */}
            <span className="absolute bottom-1 right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white shadow-xs" />
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AIFloatingChat;
