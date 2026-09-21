import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MessageSquare,
  Send,
  User,
  Truck,
  Clock,
  Check,
  CheckCheck,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Calendar,
  Home,
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';
import { getMessages, sendMessage, markAsRead } from '../services/messageService';

const CitizenWorkerChat = ({
  currentUser = {},
  pickupRequests = [],
  assignedContact = null,
  initialRequestId = null,
  onBack = null
}) => {
  const isWorker = currentUser?.role?.toLowerCase() === 'worker';
  const isCitizen = !isWorker;

  // Filter valid requests that have an assigned ID
  const validRequests = useMemo(() => {
    return (pickupRequests || []).filter(r => r && (r.requestId || r.id));
  }, [pickupRequests]);

  // Selected conversation thread (Request ID)
  const [selectedRequestId, setSelectedRequestId] = useState(() => {
    if (initialRequestId) return initialRequestId;
    if (validRequests.length > 0) {
      return validRequests[0].requestId || validRequests[0].id;
    }
    return null;
  });

  // Keep selectedRequestId updated when validRequests load asynchronously
  useEffect(() => {
    if (initialRequestId) {
      setSelectedRequestId(initialRequestId);
    } else if (validRequests.length > 0) {
      const exists = validRequests.some(r => (r.requestId || r.id) === selectedRequestId);
      if (!exists || !selectedRequestId) {
        setSelectedRequestId(validRequests[0].requestId || validRequests[0].id);
      }
    }
  }, [validRequests, initialRequestId, selectedRequestId]);

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const messagesEndRef = useRef(null);
  const pollTimerRef = useRef(null);
  const inputRef = useRef(null);

  // Current active request object
  const activeRequest = useMemo(() => {
    if (!selectedRequestId) return validRequests[0] || null;
    return validRequests.find(r => (r.requestId || r.id) === selectedRequestId) || validRequests[0] || null;
  }, [validRequests, selectedRequestId]);

  // Auto-scroll to bottom of messages
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  };

  // Fetch messages for current active thread
  const fetchThreadMessages = async (showLoading = false) => {
    if (!selectedRequestId) return;
    if (showLoading) setLoadingMessages(true);
    setError('');

    try {
      const data = await getMessages(
        selectedRequestId,
        currentUser.id || currentUser.email,
        currentUser.role || (isWorker ? 'Worker' : 'Citizen')
      );
      setMessages(Array.isArray(data) ? data : []);

      // Mark as read in background
      markAsRead({
        requestId: selectedRequestId,
        userId: currentUser.id || currentUser.email
      });
    } catch (err) {
      console.warn('Error loading chat messages:', err);
      if (showLoading) {
        setError('Could not load messages. Please check your connection.');
      }
    } finally {
      if (showLoading) setLoadingMessages(false);
    }
  };

  // Initial load when selected request changes
  useEffect(() => {
    if (selectedRequestId) {
      fetchThreadMessages(true);
      setTimeout(() => scrollToBottom(false), 200);
    } else {
      setMessages([]);
    }
  }, [selectedRequestId]);

  // Scroll to bottom when messages count changes
  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length]);

  // Polling for live messages every 3.5 seconds
  useEffect(() => {
    if (!selectedRequestId) return;

    pollTimerRef.current = setInterval(() => {
      fetchThreadMessages(false);
    }, 3500);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [selectedRequestId, currentUser.id, currentUser.role]);

  // Send message handler
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const textToSend = inputText.trim();
    if (!textToSend || !selectedRequestId || sending) return;

    setSending(true);
    setError('');

    // Optimistic message update
    const tempMessage = {
      messageId: 'temp-' + Date.now(),
      pickupRequestId: selectedRequestId,
      senderId: currentUser.id || currentUser.email,
      senderType: currentUser.role || (isWorker ? 'Worker' : 'Citizen'),
      text: textToSend,
      createdAt: new Date().toISOString(),
      isRead: false
    };

    setMessages(prev => [...prev, tempMessage]);
    setInputText('');

    try {
      await sendMessage({
        requestId: selectedRequestId,
        senderId: currentUser.id || currentUser.email,
        senderRole: currentUser.role || (isWorker ? 'Worker' : 'Citizen'),
        message: textToSend
      });

      // Refetch messages to get server timestamp and DB ID
      fetchThreadMessages(false);
    } catch (err) {
      console.error('Send message failed:', err);
      setError('Message could not be sent. Please try again.');
      // Rollback optimistic message
      setMessages(prev => prev.filter(m => m.messageId !== tempMessage.messageId));
      setInputText(textToSend);
    } finally {
      setSending(false);
      if (inputRef.current) inputRef.current.focus();
    }
  };

  // Quick suggestion chips
  const quickSuggestions = isCitizen
    ? [
        "I have kept the waste bags at the front gate.",
        "What time will collection happen today?",
        "The gate is open, please collect.",
        "Can I request pickup for tomorrow?"
      ]
    : [
        "I am reaching your lane in 10 minutes.",
        "Please keep the segregated waste ready outside.",
        "I am at your doorstep now.",
        "Pickup completed, thank you!"
      ];

  // Format message time
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Partner display name & details
  const partnerInfo = useMemo(() => {
    if (!activeRequest) {
      return {
        name: isCitizen
          ? (assignedContact?.fullName || 'Assigned Worker')
          : (validRequests.length === 0 ? 'No Active Requests' : 'Citizen'),
        subtitle: isCitizen
          ? 'Haritha Karma Sena Unit'
          : (validRequests.length === 0 ? 'Waiting for ward pickup requests' : 'Ward Household')
      };
    }

    if (isCitizen) {
      return {
        name: activeRequest.workerName || assignedContact?.fullName || 'Haritha Karma Sena Worker',
        subtitle: `Assigned Worker • Ward ${activeRequest.wardId || 'Duty'}`
      };
    } else {
      const houseStr = activeRequest.houseNumber ? `House #${activeRequest.houseNumber}` : '';
      const nameStr = activeRequest.citizenName || activeRequest.fullName || 'Citizen';
      const idStr = activeRequest.requestId || activeRequest.id || '';
      return {
        name: `${nameStr} ${houseStr ? `(${houseStr})` : ''}`.trim(),
        subtitle: `Citizen • ${idStr ? `Req: ${idStr} • ` : ''}${activeRequest.status || 'Pending'}`
      };
    }
  }, [activeRequest, assignedContact, isCitizen, validRequests.length]);

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-140px)] min-h-[550px] flex flex-col bg-white dark:bg-[#14231b] rounded-3xl border border-emerald-100 dark:border-emerald-800/60 shadow-md overflow-hidden animate-fadeIn">
      
      {/* CHAT THREAD HEADER */}
      <div className="shrink-0 px-4 sm:px-6 py-3.5 border-b border-gray-100 dark:border-emerald-800/40 bg-white dark:bg-[#14231b] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-emerald-900/50 rounded-xl text-gray-500 dark:text-gray-400 transition cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0a4d2c] to-emerald-600 text-white font-black flex items-center justify-center text-sm shadow-xs shrink-0">
            {isCitizen ? <Truck className="w-5 h-5" /> : <User className="w-5 h-5" />}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-white truncate">
                {partnerInfo.name}
              </h3>

              {validRequests.length > 1 ? (
                <select
                  value={selectedRequestId || ''}
                  onChange={(e) => setSelectedRequestId(e.target.value)}
                  className="text-xs font-extrabold px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 focus:outline-none cursor-pointer max-w-[260px] truncate"
                  title="Switch pickup request"
                >
                  {validRequests.map((r) => {
                    const id = r.requestId || r.id;
                    const label = isWorker
                      ? `${r.citizenName || 'Citizen'} (House #${r.houseNumber || '—'}) • ${id}`
                      : `${id} ${r.houseNumber ? `(#${r.houseNumber})` : ''} • ${r.status || 'Pending'}`;
                    return (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              ) : (
                selectedRequestId && (
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                    {selectedRequestId}
                  </span>
                )
              )}
            </div>

            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
              {partnerInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right Header Action: Refresh Button Only */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => fetchThreadMessages(true)}
            className="p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-emerald-800 transition cursor-pointer"
            title="Refresh conversation"
          >
            <RefreshCw className={`w-4 h-4 ${loadingMessages ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* MESSAGES SCROLL AREA */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#f8faf9] dark:bg-[#0e1913]">
        {loadingMessages && messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-gray-400 font-bold space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
            <span>Loading conversation history...</span>
          </div>
        ) : validRequests.length === 0 ? (
          /* No Requests Found */
          <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-3xl bg-amber-100/70 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center shadow-xs">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-gray-800 dark:text-white">
                {isWorker ? 'No Pickup Requests In Your Ward' : 'No Active Pickup Request'}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                {isWorker
                  ? 'There are currently no pickup requests from citizens in your assigned ward. When a citizen requests plastic waste collection, their direct chat thread will appear here.'
                  : 'You have not submitted any plastic pickup requests yet. Please submit a pickup request from the dashboard to start direct coordination with your worker.'}
              </p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          /* Empty State */
          <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-3xl bg-emerald-100/70 dark:bg-emerald-900/40 text-[#0a4d2c] dark:text-emerald-300 flex items-center justify-center shadow-xs">
              <MessageSquare className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-gray-800 dark:text-white">
                Start Direct Doorstep Coordination
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Send messages directly to confirm collection times, door access, or landmark directions.
              </p>
            </div>

            {/* Quick suggestion prompt chips */}
            <div className="w-full pt-2 space-y-1.5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Quick Suggestions:
              </p>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {quickSuggestions.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInputText(prompt)}
                    className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-white dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-gray-700 dark:text-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-900 transition shadow-2xs cursor-pointer text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Message Bubbles */
          messages.map((msg, index) => {
            const isMyMessage =
              String(msg.senderId || '').trim().toLowerCase() === String(currentUser.id || currentUser.email || '').trim().toLowerCase() ||
              String(msg.senderType || '').trim().toLowerCase() === String(currentUser.role || '').trim().toLowerCase();

            return (
              <div
                key={msg.messageId || msg.id || index}
                className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[70%] p-3.5 rounded-2xl shadow-xs space-y-1 ${
                    isMyMessage
                      ? 'bg-gradient-to-r from-[#0a4d2c] to-emerald-700 text-white rounded-br-xs'
                      : 'bg-white dark:bg-[#1a2f24] text-gray-900 dark:text-white border border-gray-100 dark:border-emerald-800/60 rounded-bl-xs'
                  }`}
                >
                  {!isMyMessage && (
                    <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block pb-0.5">
                      {msg.senderType || 'Contact'}
                    </span>
                  )}

                  <p className="text-xs sm:text-[13px] leading-relaxed break-words font-medium">
                    {msg.text || msg.message}
                  </p>

                  <div
                    className={`flex items-center gap-1 text-[10px] font-semibold pt-1 ${
                      isMyMessage ? 'text-emerald-200 justify-end' : 'text-gray-400 justify-start'
                    }`}
                  >
                    <span>{formatTime(msg.createdAt)}</span>
                    {isMyMessage && (
                      <CheckCheck
                        className={`w-3.5 h-3.5 ${
                          msg.isRead ? 'text-emerald-300' : 'text-emerald-200/60'
                        }`}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="px-4 py-2 bg-rose-50 border-t border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
            {error}
          </span>
          <button
            onClick={() => fetchThreadMessages(true)}
            className="underline text-rose-800 font-bold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* MESSAGE INPUT BAR */}
      <div className="shrink-0 p-3 sm:p-4 bg-white dark:bg-[#14231b] border-t border-gray-100 dark:border-emerald-800/40">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={!selectedRequestId || sending}
            placeholder={
              !selectedRequestId
                ? (isWorker ? 'No pickup request selected...' : 'No active pickup request...')
                : 'Type a message to coordinate doorstep pickup...'
            }
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-gray-50 dark:bg-emerald-950/40 border border-gray-200 dark:border-emerald-800/60 rounded-2xl text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white dark:focus:bg-emerald-950 transition-all disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || !selectedRequestId || sending}
            className="p-3 bg-[#0a4d2c] hover:bg-[#063820] text-white rounded-2xl shadow-md transition disabled:opacity-40 cursor-pointer shrink-0"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default CitizenWorkerChat;
