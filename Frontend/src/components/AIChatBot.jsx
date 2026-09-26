import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  RotateCcw,
  Copy,
  Check,
  HelpCircle,
  ShieldCheck,
  AlertCircle,
  Truck,
  Calendar,
  CreditCard,
  KeyRound,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Clock,
  Maximize2,
  X,
  CheckCircle2
} from 'lucide-react';
import { sendChatMessage } from '../services/aiService';
import { getCitizenPayments } from '../services/paymentService';

const AIChatBot = ({
  citizenData,
  monthlyStatusData,
  realRequests = [],
  assignedWorker,
  setActiveTab,
  isFloating = false,
  onClose,
  onExpandFull
}) => {
  const userObj = JSON.parse(localStorage.getItem('user') || '{}');
  const citizenName = citizenData?.fullName || userObj.fullName || 'Citizen';
  const citizenId = citizenData?.citizenId || citizenData?.id || citizenData?._id || userObj.citizenId || 'CIT001';
  const houseName = citizenData?.houseName || userObj.houseName || '';
  const houseNumber = citizenData?.houseNumber || userObj.houseNumber || 'N/A';
  const wardId = citizenData?.wardId || userObj.wardId || 'Ward 1';
  const panchayatName = citizenData?.panchayatName || userObj.panchayatName || 'Chirakkadavu';

  // Worker Info
  const senaWorkerName = assignedWorker?.fullName || 'Haritha Karma Sena Unit In-charge';
  const senaWorkerPhone = assignedWorker?.phoneNumber || '+91 98470 12345';

  // Real-time payments / dues state
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      if (!citizenId) return;
      try {
        setLoadingPayments(true);
        const data = await getCitizenPayments(citizenId);
        setPayments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.warn("Could not fetch payments for AI context:", err);
      } finally {
        setLoadingPayments(false);
      }
    };

    fetchPayments();
  }, [citizenId]);

  // Derived Pickup Request & Schedule info
  const currentRequest = monthlyStatusData?.request || realRequests.find(
    (r) =>
      (r.status || '').toLowerCase() === 'pending' ||
      (r.status || '').toLowerCase() === 'scheduled' ||
      (r.status || '').toLowerCase() === 'completed' ||
      (r.status || '').toLowerCase() === 'collected'
  );

  const requestStatus = (currentRequest?.status || 'No active request').toLowerCase();
  const isCompleted = requestStatus === 'completed' || requestStatus === 'collected';
  const isScheduled = requestStatus === 'scheduled' || requestStatus === 'accepted';
  const isPending = requestStatus === 'pending';

  const scheduledDateFormatted = currentRequest?.collectionDate
    ? new Date(currentRequest.collectionDate).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : '15th – 25th window (awaiting schedule)';

  const collectedDateFormatted = currentRequest?.collectedAt
    ? new Date(currentRequest.collectedAt).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : currentRequest?.collectionDate
      ? new Date(currentRequest.collectionDate).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
      : 'Not yet collected';

  // Derived Dues info
  const currentDate = new Date();
  const currentMonthNum = currentDate.getMonth() + 1;
  const currentYearNum = currentDate.getFullYear();
  const currentMonthName = currentDate.toLocaleString('default', { month: 'long' });

  const currentPayment = payments.find(p => p.year === currentYearNum && p.month === currentMonthNum);
  const isCurrentPaid = (currentPayment?.status || '').toLowerCase() === 'paid';
  const pendingPastDues = payments.filter(p => {
    const isPast = p.year < currentYearNum || (p.year === currentYearNum && p.month < currentMonthNum);
    return isPast && (p.status || '').toLowerCase() !== 'paid';
  });

  const totalDueAmount = (isCurrentPaid ? 0 : 50) + (pendingPastDues.length * 50);

  // Build Real-Time Context string for Gemini AI
  const citizenContext = useMemo(() => {
    const pastMonthsText = pendingPastDues.length > 0
      ? pendingPastDues.map(p => `Month ${p.month}/${p.year}`).join(', ')
      : 'None (all past months cleared)';

    return `[REAL-TIME CITIZEN PROFILE & LIVE ACCOUNT DATA]
Resident Name: ${citizenName} (Citizen ID: ${citizenId})
Household Residence: House No. ${houseNumber} ${houseName ? `(${houseName})` : ''}, Ward: ${wardId}, Local Body: ${panchayatName} Grama Panchayat
Account Verification: ${citizenData?.isVerified || citizenData?.status === 'Verified' ? 'Verified Citizen' : 'Pending Verification'}

LIVE PICKUP REQUEST & SCHEDULE UPDATES:
- Current Month Request: ${currentRequest ? `Request ID: ${currentRequest.requestId || 'REQ-ACTIVE'}` : 'No active request submitted for this calendar month'}
- Request Status: ${currentRequest ? currentRequest.status : 'None'}
- Scheduled Collection Date: ${scheduledDateFormatted}
- Handover / Collected Date: ${collectedDateFormatted}
- 4-Digit Pickup Verification Code: ${currentRequest?.verificationCode || 'Not generated yet'} (Status: ${isCompleted ? 'Code verified by worker upon pickup completion' : 'Active - citizen must provide this 4-digit code to the visiting Haritha Karma Sena worker upon collection'})
- Assigned Haritha Karma Sena Team: ${senaWorkerName} (Phone: ${senaWorkerPhone})
- Waste Category: ${currentRequest?.overallCategory || 'Recyclable Plastic'}
- Monthly Collection Result Rule: If a calendar month has passed and the scheduled pickup was not completed/collected, it is marked as "Failed". If completed and verified with code, it is marked as "Success". Active current month pickups are "In Progress".

LIVE MONTHLY USER FEE & PAYMENT DUES UPDATES:
- Current Month (${currentMonthName} ${currentYearNum}): ${isCurrentPaid ? 'PAID (₹50 paid)' : 'UNPAID (₹50 due)'}
- Overdue Past Unpaid Months: ${pastMonthsText}
- Total Outstanding Dues: ₹${totalDueAmount} (${isCurrentPaid && pendingPastDues.length === 0 ? 'All fees up to date' : `Needs payment of ₹${totalDueAmount}`})
- Payment Methods: Online via EcoMind AI / Mittu ("Monthly Payments" tab using UPI/QR/Cards) or Cash to Haritha Karma Sena worker upon pickup with instant digital receipt.`;
  }, [
    citizenName,
    citizenId,
    houseNumber,
    houseName,
    wardId,
    panchayatName,
    citizenData,
    currentRequest,
    scheduledDateFormatted,
    collectedDateFormatted,
    isCompleted,
    senaWorkerName,
    senaWorkerPhone,
    currentMonthName,
    currentYearNum,
    isCurrentPaid,
    pendingPastDues,
    totalDueAmount
  ]);

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello ${citizenName}! 👋 I am **Mittu**, your smart AI assistant for waste collection, pickup schedules, and dues analysis in **${panchayatName} (${wardId})**.\n\nI can analyze your **live collection schedule**, **pickup request updates**, and **payment dues**, or answer any questions about Haritha Karma Sena recycling rules!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMessageId = `user-${Date.now()}`;
    const newMessages = [
      ...messages,
      {
        id: userMessageId,
        sender: 'user',
        text: query,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];

    setMessages(newMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      const responseData = await sendChatMessage(query, citizenContext);
      const aiReply = responseData?.response || "I received your query, but could not retrieve an analysis. Please try asking again.";

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: aiReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      console.error("AI Chat error:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "I'm sorry, Mittu is currently unable to reach the service. Please verify your connection or try again shortly.";

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: errorMessage,
          isError: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyText = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'ai',
        text: `Chat reset. Ask Mittu to analyze your schedule updates, dues, or pickup request status!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Markdown parsing for bold, bullet points, headers
  const renderFormattedText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();

      // Horizontal dividers
      if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
        return <hr key={idx} className="my-2 border-emerald-100" />;
      }

      // Heading ### or ## or #
      if (trimmed.startsWith('### ') || trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
        const headingText = trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '');
        return (
          <h4 key={idx} className="font-extrabold text-[#0a4d2c] text-sm pt-2.5 pb-1 border-b border-emerald-100 tracking-tight">
            {headingText}
          </h4>
        );
      }

      // Bullet items (with optional leading indentation)
      const isBullet = /^\s*(\*|-|\d+\.)\s+/.test(line);
      const isIndented = /^\s{3,}/.test(line);
      const cleanLine = isBullet ? line.replace(/^\s*(\*|-|\d+\.)\s+/, '') : line;

      // Handle bold **text**
      const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
      const parsed = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="font-extrabold text-gray-900">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      if (isBullet) {
        return (
          <div key={idx} className={`flex items-start gap-2 ${isIndented ? 'pl-6 my-0.5 text-gray-600' : 'pl-2 my-1 text-gray-800'}`}>
            <span className="text-emerald-600 font-bold shrink-0 mt-0.5">•</span>
            <span className="leading-relaxed">{parsed}</span>
          </div>
        );
      }

      return (
        <p key={idx} className={trimmed === '' ? 'h-2' : 'my-1 text-gray-800 leading-relaxed'}>
          {parsed}
        </p>
      );
    });
  };

  const quickAnalysisPrompts = [
    {
      label: "⚡ Analyse Full Account",
      prompt: "Please give me a complete analysis of my schedule updates, dues, and pickup request updates."
    },
    {
      label: "📅 Upcoming Pickup Date",
      prompt: "What is my upcoming collection date and is the pickup scheduled or completed?"
    },
    {
      label: "💰 Check Pending Dues",
      prompt: "Do I have any pending monthly user fee dues, and what is the total amount due?"
    },
    {
      label: "📦 Pickup Request Status",
      prompt: "What is the latest update on my monthly plastic pickup request and verification code?"
    },
    {
      label: "👤 Assigned Team Info",
      prompt: "Who is the Haritha Karma Sena worker assigned to my ward, and how can I contact them?"
    },
    {
      label: "♻ Eligible Plastics",
      prompt: "What plastic items are accepted for recycling by Haritha Karma Sena?"
    }
  ];

  return (
    <div className={`flex flex-col ${isFloating ? 'h-full w-full' : 'max-w-5xl mx-auto h-[calc(100vh-140px)] min-h-[600px]'} bg-white rounded-3xl border border-emerald-100/90 shadow-xl overflow-hidden animate-fadeIn`}>
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-[#07361f] via-[#0a4d2c] to-[#0f5b37] px-4 sm:px-6 py-3.5 text-white flex items-center justify-between shadow-md shrink-0 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute right-0 top-0 w-48 h-48 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-emerald-400 to-teal-300 p-0.5 shadow-md shadow-emerald-950/40">
              <div className="w-full h-full bg-[#07361f] rounded-[14px] flex items-center justify-center">
                <Bot className="w-5 h-5 text-emerald-300" />
              </div>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 border-2 border-[#0a4d2c]" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-white">
                Mittu AI Assistant
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/25 text-emerald-200 border border-emerald-400/30 backdrop-blur-xs">
                <Sparkles className="w-2.5 h-2.5 text-emerald-300" /> Live AI
              </span>
            </div>
            <p className="text-[11px] text-emerald-100/80 font-medium">
              Live Analysis • {wardId}, {panchayatName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 relative z-10">
          {onExpandFull && (
            <button
              onClick={onExpandFull}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-100 hover:text-white transition-all cursor-pointer"
              title="Expand to Full Page"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleClearChat}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-100 hover:text-white transition-all cursor-pointer"
            title="Reset conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          {isFloating && onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/30 text-emerald-100 hover:text-white transition-all cursor-pointer"
              title="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Real-time Account Status Strip */}
      <div className="bg-gradient-to-r from-emerald-50/95 via-teal-50/50 to-emerald-50/95 border-b border-emerald-100/90 px-3.5 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0 backdrop-blur-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Schedule Status Badge Button */}
          <button
            onClick={() => handleSendMessage("Analyse my collection schedule and upcoming pickup date.")}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-emerald-50 border border-emerald-200/90 rounded-xl text-[11px] font-semibold text-gray-800 transition-all cursor-pointer shadow-2xs hover:shadow-xs hover:border-emerald-400 group"
            title="Click to ask Mittu about your schedule"
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
            <span>
              Schedule:{' '}
              <strong className="font-extrabold text-[#0a4d2c]">
                {isCompleted ? 'Completed' : isScheduled ? 'Scheduled' : '15th–25th'}
              </strong>
            </span>
          </button>

          {/* Pickup Request Badge Button */}
          <button
            onClick={() => handleSendMessage("Give me the latest update on my plastic pickup request.")}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-emerald-50 border border-emerald-200/90 rounded-xl text-[11px] font-semibold text-gray-800 transition-all cursor-pointer shadow-2xs hover:shadow-xs hover:border-emerald-400 group"
            title="Click to ask Mittu about your request"
          >
            <Truck className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
            <span>
              Request:{' '}
              <strong className="font-extrabold text-[#0a4d2c] capitalize">
                {currentRequest ? currentRequest.status : 'None'}
              </strong>
            </span>
          </button>

          {/* Dues Badge Button */}
          <button
            onClick={() => handleSendMessage("Analyse my monthly payment status and pending dues.")}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer shadow-2xs hover:shadow-xs group ${
              totalDueAmount === 0
                ? 'bg-emerald-100/90 border border-emerald-300 text-[#0a4d2c] hover:bg-emerald-200/80'
                : 'bg-amber-100/90 border border-amber-300 text-amber-900 hover:bg-amber-200/80'
            }`}
            title="Click to ask Mittu about your dues"
          >
            <CreditCard className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span>
              Dues:{' '}
              <strong className="font-extrabold">
                {totalDueAmount === 0 ? '₹0 Cleared' : `₹${totalDueAmount} Due`}
              </strong>
            </span>
          </button>
        </div>

        {/* 1-Click Analyse Account Button */}
        <button
          onClick={() => handleSendMessage("Please give me a complete analysis of my schedule updates, dues, and pickup request updates.")}
          className="px-3 py-1.5 bg-gradient-to-r from-[#0a4d2c] to-emerald-700 hover:from-emerald-900 hover:to-emerald-800 text-white font-extrabold text-[11px] rounded-xl transition-all shadow-xs hover:shadow flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
          <span>Analyse Account</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-gradient-to-b from-[#f8fbf9] to-[#f3f8f5] custom-scrollbar">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 sm:gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0a4d2c] to-emerald-700 text-emerald-200 flex items-center justify-center shrink-0 shadow-xs mt-1 border border-emerald-500/30">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-3.5 sm:p-4 text-xs leading-relaxed shadow-xs transition-all ${
                isUser
                  ? 'bg-gradient-to-r from-[#0a4d2c] to-[#0f5b37] text-white rounded-tr-xs shadow-emerald-900/10'
                  : msg.isError
                    ? 'bg-rose-50 border border-rose-200 text-rose-900 rounded-tl-xs'
                    : 'bg-white border border-emerald-100/90 text-gray-800 rounded-tl-xs shadow-[0_2px_8px_rgba(0,0,0,0.03)]'
              }`}>
                {/* Message Content */}
                <div className="space-y-1">
                  {isUser ? (
                    <p className="whitespace-pre-wrap font-medium">{msg.text}</p>
                  ) : (
                    <div>{renderFormattedText(msg.text)}</div>
                  )}
                </div>

                {/* Footer metadata */}
                <div className={`flex items-center justify-between gap-3 pt-2 mt-1.5 border-t ${
                  isUser ? 'border-emerald-800/60 text-emerald-200/80' : 'border-gray-100 text-gray-400'
                } text-[10px]`}>
                  <span>{msg.timestamp}</span>

                  {!isUser && !msg.isError && (
                    <button
                      onClick={() => handleCopyText(msg.id, msg.text)}
                      className="hover:text-emerald-700 transition-colors flex items-center gap-1 cursor-pointer font-medium"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600 font-bold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 text-[#0a4d2c] border border-emerald-200 flex items-center justify-center shrink-0 shadow-xs mt-1 font-extrabold text-xs">
                  {citizenName[0]?.toUpperCase() || <User className="w-4 h-4" />}
                </div>
              )}
            </div>
          );
        })}

        {/* AI Typing Indicator */}
        {isLoading && (
          <div className="flex gap-2.5 sm:gap-3 justify-start items-center">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0a4d2c] to-emerald-700 text-emerald-200 flex items-center justify-center shrink-0 shadow-xs border border-emerald-500/30">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="bg-white border border-emerald-200/90 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs flex items-center gap-2.5">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs font-semibold text-emerald-900">
                Mittu is analyzing live data...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggested Queries Bar - Spacious & Modern without EmoRobot */}
      <div className="px-3.5 sm:px-4 py-2.5 bg-white border-t border-emerald-100/90 shrink-0">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#0a4d2c]">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Suggested Queries for Mittu</span>
          </div>
          <span className="text-[10px] text-gray-400 font-medium hidden sm:inline">Tap to ask instantly</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {quickAnalysisPrompts.map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendMessage(item.prompt)}
              disabled={isLoading}
              className="text-[11px] font-medium bg-emerald-50/70 hover:bg-emerald-600 text-gray-700 hover:text-white border border-emerald-200/80 hover:border-emerald-600 px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 whitespace-nowrap shrink-0"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Message Input Bar */}
      <div className="p-3 sm:p-4 bg-white/95 border-t border-gray-100 shrink-0 space-y-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="Ask Mittu: 'Analyse schedule updates', 'Check dues', 'Verification code'..."
              className="w-full bg-gray-50/80 hover:bg-white focus:bg-white border border-gray-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 rounded-2xl py-2.5 sm:py-3 pl-4 pr-4 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all shadow-inner"
            />
          </div>

          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-[#0a4d2c] to-emerald-700 hover:from-emerald-900 hover:to-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Ask Mittu</span>
          </button>
        </form>

        <div className="flex items-center justify-between text-[10px] text-gray-400 px-1 font-medium">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Analyzes live collection, pickup requests & dues
          </span>
          <span>EcoMind AI • Haritha Karma Sena</span>
        </div>
      </div>
    </div>
  );
};

export default AIChatBot;
