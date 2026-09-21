import React, { useState } from 'react';
import { Bot, X, Sparkles, Maximize2, MessageSquare } from 'lucide-react';
import AIChatBot from './AIChatBot';

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
        <div className="mb-4 w-[92vw] sm:w-[420px] max-w-lg shadow-2xl rounded-3xl overflow-hidden border-2 border-emerald-500/40 bg-white animate-scaleUp">
          <div className="flex items-center justify-between bg-[#0a4d2c] px-4 py-2 text-white border-b border-emerald-800">
            <span className="text-xs font-bold flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-emerald-300" />
              EcoMind AI Assistant
            </span>

            <div className="flex items-center gap-2">
              {onExpandFull && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onExpandFull();
                  }}
                  className="p-1 text-emerald-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  title="Open Fullscreen Page"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-emerald-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="h-[480px]">
            <AIChatBot
              citizenData={citizenData}
              monthlyStatusData={monthlyStatusData}
              realRequests={realRequests}
              assignedWorker={assignedWorker}
              setActiveTab={setActiveTab}
              isFloating={true}
              onClose={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Floating Trigger Bubble Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-[#0a4d2c] via-[#0f5b37] to-emerald-800 hover:from-emerald-800 hover:to-[#0a4d2c] text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border border-emerald-400/40"
          title="Chat with EcoMind AI"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-emerald-300 group-hover:rotate-12 transition-transform duration-300" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full" />
          </div>
          <span className="text-xs font-extrabold tracking-wide hidden sm:inline">Ask EcoMind AI</span>
          <span className="p-1 bg-white/15 rounded-full">
            <Sparkles className="w-3 h-3 text-emerald-200" />
          </span>
        </button>
      )}
    </div>
  );
};

export default AIFloatingChat;
