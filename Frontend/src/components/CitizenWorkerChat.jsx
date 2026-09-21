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
  Search,
  Home,
  ArrowLeft,
  ShieldCheck,
  Phone,
  Tag,
  ChevronRight
} from 'lucide-react';
import {
  getConversation,
  getWorkerConversations,
  getCitizenConversation,
  sendMessage,
  markAsRead
} from '../services/messageService';

const CitizenWorkerChat = ({
  currentUser = {},
  wardCitizens = [],
  pickupRequests = [],
  assignedContact = null,
  initialCitizenId = null,
  onBack = null
}) => {
  const isWorker = currentUser?.role?.toLowerCase() === 'worker';
  const isCitizen = !isWorker;

  const currentUserId = currentUser.id || currentUser.email || '';
  const currentUserEmail = currentUser.email || '';

  // -------------------------------------------------------------
  // STATE MANAGEMENT
  // -------------------------------------------------------------
  // List of conversation summaries for Worker view
  const [conversationsList, setConversationsList] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Currently selected citizen for worker view
  const [selectedCitizen, setSelectedCitizen] = useState(null);

  // Active conversation object (contains Messages[])
  const [activeConversation, setActiveConversation] = useState(null);
  const [loadingChat, setLoadingChat] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // Mobile state for worker: toggle between citizen list and chat
  const [showMobileChat, setShowMobileChat] = useState(false);

  const messagesEndRef = useRef(null);
  const pollTimerRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  };

  // -------------------------------------------------------------
  // WORKER: LOAD ALL ASSIGNED CITIZENS & CONVERSATIONS
  // -------------------------------------------------------------
  const fetchWorkerConversationsList = async (showLoading = false) => {
    if (!isWorker || !currentUserId) return;
    if (showLoading) setLoadingConversations(true);

    try {
      const convs = await getWorkerConversations(currentUserId);
      const convList = Array.isArray(convs) ? convs : [];

      // Merge with wardCitizens to ensure every assigned citizen is listed
      const convMap = new Map();
      convList.forEach((c) => {
        const key = (c.citizenId || c.citizenEmail || '').toLowerCase();
        if (key) convMap.set(key, c);
      });

      const merged = [...convList];
      (wardCitizens || []).forEach((cit) => {
        const idKey = (cit.citizenId || '').toLowerCase();
        const emailKey = (cit.email || '').toLowerCase();
        const exists = (idKey && convMap.has(idKey)) || (emailKey && convMap.has(emailKey));

        if (!exists) {
          merged.push({
            conversationId: '',
            citizenId: cit.citizenId || cit.email || '',
            citizenName: cit.fullName || 'Citizen',
            houseNumber: cit.houseNumber || '',
            houseName: cit.houseName || '',
            citizenPhone: cit.phoneNumber || '',
            wardId: cit.wardId || '',
            workerId: currentUserId,
            lastMessageText: 'No messages yet',
            lastMessageAt: null,
            lastSenderRole: '',
            unreadCount: 0
          });
        }
      });

      setConversationsList(merged);

      // Auto-select first citizen if none selected
      if (!selectedCitizen && merged.length > 0) {
        if (initialCitizenId) {
          const match = merged.find(
            (c) =>
              (c.citizenId && c.citizenId.toLowerCase() === initialCitizenId.toLowerCase()) ||
              (c.citizenEmail && c.citizenEmail.toLowerCase() === initialCitizenId.toLowerCase())
          );
          setSelectedCitizen(match || merged[0]);
        } else {
          setSelectedCitizen(merged[0]);
        }
      }
    } catch (err) {
      console.warn('Error loading worker conversations list:', err);
    } finally {
      if (showLoading) setLoadingConversations(false);
    }
  };

  useEffect(() => {
    if (isWorker) {
      fetchWorkerConversationsList(true);
    }
  }, [isWorker, currentUserId, wardCitizens.length]);

  // -------------------------------------------------------------
  // LOAD ACTIVE CONVERSATION MESSAGES
  // -------------------------------------------------------------
  const loadConversationMessages = async (showLoading = false) => {
    if (showLoading) setLoadingChat(true);
    setError('');

    try {
      let conv = null;

      if (isCitizen) {
        // Citizen fetches their single chat with assigned worker
        const workerId = assignedContact?.email || assignedContact?.workerId || '';
        conv = await getCitizenConversation(currentUserId, workerId);
      } else if (isWorker && selectedCitizen) {
        // Worker fetches chat with selected citizen
        const citId = selectedCitizen.citizenId || selectedCitizen.citizenEmail || selectedCitizen.id || '';
        if (citId) {
          conv = await getConversation(citId, currentUserId);
        }
      }

      if (conv) {
        setActiveConversation(conv);

        // Mark as read in background
        const convId = conv.conversationId || conv.id;
        if (convId) {
          markAsRead({
            conversationId: convId,
            userId: currentUserId,
            userRole: isWorker ? 'Worker' : 'Citizen'
          });
        }
      }
    } catch (err) {
      console.warn('Error loading conversation:', err);
      if (showLoading) {
        setError('Could not load conversation history. Tap retry to reload.');
      }
    } finally {
      if (showLoading) setLoadingChat(false);
    }
  };

  // Trigger load when selected citizen changes (for worker) or on mount (for citizen)
  useEffect(() => {
    if (isCitizen) {
      loadConversationMessages(true);
    } else if (isWorker && selectedCitizen) {
      loadConversationMessages(true);
    }
  }, [isCitizen, isWorker, selectedCitizen?.citizenId, selectedCitizen?.id, assignedContact]);

  // Scroll to bottom when messages change
  useEffect(() => {
    const timer = setTimeout(() => scrollToBottom(false), 150);
    return () => clearTimeout(timer);
  }, [activeConversation?.messages?.length]);

  // Live polling every 3.5 seconds
  useEffect(() => {
    pollTimerRef.current = setInterval(() => {
      loadConversationMessages(false);
      if (isWorker) {
        fetchWorkerConversationsList(false);
      }
    }, 3500);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [isCitizen, isWorker, selectedCitizen, assignedContact, currentUserId]);

  // -------------------------------------------------------------
  // SEND MESSAGE HANDLER
  // -------------------------------------------------------------
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const textToSend = inputText.trim();
    if (!textToSend || sending) return;

    let targetCitizenId = '';
    let targetWorkerId = '';

    if (isCitizen) {
      targetCitizenId = currentUserId;
      targetWorkerId = assignedContact?.email || assignedContact?.workerId || activeConversation?.workerId || '';
    } else {
      targetCitizenId = selectedCitizen?.citizenId || selectedCitizen?.citizenEmail || activeConversation?.citizenId || '';
      targetWorkerId = currentUserId;
    }

    if (!targetCitizenId || !targetWorkerId) {
      setError('Cannot send message: Contact details are missing.');
      return;
    }

    // Resolve optional active pickup request context
    let activeRequestId = null;
    if (Array.isArray(pickupRequests) && pickupRequests.length > 0) {
      const activeReq = pickupRequests.find(
        (r) => r && (r.status === 'Pending' || r.status === 'Scheduled')
      );
      if (activeReq) {
        activeRequestId = activeReq.requestId || activeReq.id;
      }
    }

    setSending(true);
    setError('');

    // Optimistic UI message
    const tempMessage = {
      messageId: 'temp-' + Date.now(),
      senderId: currentUserId,
      senderType: isWorker ? 'Worker' : 'Citizen',
      text: textToSend,
      pickupRequestId: activeRequestId,
      createdAt: new Date().toISOString(),
      isRead: false
    };

    setActiveConversation((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: [...(prev.messages || []), tempMessage],
        lastMessageText: textToSend,
        lastMessageAt: tempMessage.createdAt
      };
    });
    setInputText('');

    try {
      await sendMessage({
        citizenId: targetCitizenId,
        workerId: targetWorkerId,
        senderId: currentUserId,
        senderRole: isWorker ? 'Worker' : 'Citizen',
        text: textToSend,
        pickupRequestId: activeRequestId,
        conversationId: activeConversation?.conversationId || activeConversation?.id
      });

      // Refetch live conversation to get server IDs and state
      loadConversationMessages(false);
      if (isWorker) fetchWorkerConversationsList(false);
    } catch (err) {
      console.error('Send message failed:', err);
      setError('Message could not be sent. Please try again.');
      // Rollback optimistic message
      setActiveConversation((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: (prev.messages || []).filter((m) => m.messageId !== tempMessage.messageId)
        };
      });
      setInputText(textToSend);
    } finally {
      setSending(false);
      if (inputRef.current) inputRef.current.focus();
    }
  };

  // Quick suggestions
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

  // Helper: Format message time
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Helper: Format list preview timestamp
  const formatListDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      if (isToday) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  // Filtered citizens for worker search
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversationsList;
    const q = searchQuery.toLowerCase().trim();
    return conversationsList.filter(
      (c) =>
        (c.citizenName && c.citizenName.toLowerCase().includes(q)) ||
        (c.houseNumber && c.houseNumber.toLowerCase().includes(q)) ||
        (c.citizenId && c.citizenId.toLowerCase().includes(q)) ||
        (c.citizenPhone && c.citizenPhone.includes(q))
    );
  }, [conversationsList, searchQuery]);

  // Active Partner Details
  const partnerInfo = useMemo(() => {
    if (isCitizen) {
      return {
        name: assignedContact?.fullName || activeConversation?.workerName || 'Haritha Karma Sena Worker',
        subtitle: `Haritha Karma Sena Unit • Ward ${assignedContact?.wardId || currentUser?.wardId || 'Duty'}`,
        phone: assignedContact?.phoneNumber || activeConversation?.workerPhone || '',
        badge: 'Assigned Worker'
      };
    } else {
      const name = selectedCitizen?.citizenName || activeConversation?.citizenName || 'Citizen';
      const house = selectedCitizen?.houseNumber || activeConversation?.houseNumber || '';
      const phone = selectedCitizen?.citizenPhone || activeConversation?.citizenPhone || '';
      const activeReq = selectedCitizen?.activePickupRequestId;
      return {
        name: `${name} ${house ? `(House #${house})` : ''}`.trim(),
        subtitle: `Citizen • Ward ${selectedCitizen?.wardId || 'Household'}${phone ? ` • ${phone}` : ''}`,
        phone,
        activeRequestId: activeReq,
        activeRequestStatus: selectedCitizen?.activePickupStatus || 'Pending',
        badge: 'Citizen Household'
      };
    }
  }, [isCitizen, assignedContact, selectedCitizen, activeConversation, currentUser?.wardId]);

  const messages = activeConversation?.messages || [];

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] min-h-[550px] flex bg-white dark:bg-[#14231b] rounded-3xl border border-emerald-100 dark:border-emerald-800/60 shadow-md overflow-hidden animate-fadeIn">

      {/* ============================================================ */}
      {/* WORKER LEFT SIDEBAR: CITIZEN CHAT LIST */}
      {/* ============================================================ */}
      {isWorker && (
        <aside
          className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-gray-100 dark:border-emerald-800/40 bg-gray-50/50 dark:bg-[#101c15] shrink-0 transition-all duration-300 ${
            showMobileChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* List Header */}
          <div className="p-4 border-b border-gray-100 dark:border-emerald-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0a4d2c] to-emerald-600 text-white flex items-center justify-center shadow-2xs">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-white leading-none">
                    Assigned Citizens
                  </h3>
                  <span className="text-[10px] font-bold text-gray-400">
                    {conversationsList.length} household{conversationsList.length === 1 ? '' : 's'} in ward
                  </span>
                </div>
              </div>

              <button
                onClick={() => fetchWorkerConversationsList(true)}
                className="p-1.5 rounded-lg hover:bg-gray-200/60 dark:hover:bg-emerald-900/60 text-gray-500 dark:text-gray-300 transition cursor-pointer"
                title="Refresh list"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingConversations ? 'animate-spin text-emerald-600' : ''}`} />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search citizen or house #..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-emerald-950/60 border border-gray-200 dark:border-emerald-800/60 rounded-xl text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Citizen Cards Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-emerald-900/30">
            {loadingConversations && conversationsList.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400 font-bold space-y-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-600 mx-auto" />
                <p>Loading assigned citizens...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400 font-medium">
                No citizens match your search.
              </div>
            ) : (
              filteredConversations.map((cit) => {
                const citId = cit.citizenId || cit.citizenEmail || cit.id;
                const isSelected =
                  selectedCitizen &&
                  (selectedCitizen.citizenId === cit.citizenId || selectedCitizen.id === cit.id);

                return (
                  <button
                    key={citId}
                    onClick={() => {
                      setSelectedCitizen(cit);
                      setShowMobileChat(true);
                    }}
                    className={`w-full text-left p-3.5 transition-colors cursor-pointer flex items-start gap-3 relative ${
                      isSelected
                        ? 'bg-emerald-50/90 dark:bg-emerald-950/70 border-l-4 border-emerald-600'
                        : 'hover:bg-white dark:hover:bg-emerald-950/30'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900 dark:to-emerald-800 text-emerald-800 dark:text-emerald-200 font-black flex items-center justify-center text-xs shrink-0 shadow-2xs">
                      {cit.houseNumber ? `#${cit.houseNumber}` : <Home className="w-4 h-4" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4 className="text-xs font-black text-gray-900 dark:text-white truncate">
                          {cit.citizenName || 'Citizen'}
                        </h4>
                        {cit.lastMessageAt && (
                          <span className="text-[10px] font-semibold text-gray-400 shrink-0">
                            {formatListDate(cit.lastMessageAt)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate font-medium">
                          {cit.lastMessageText || 'Tap to chat...'}
                        </p>

                        {/* Unread badge */}
                        {cit.unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[9.5px] font-black shrink-0 animate-pulse">
                            {cit.unreadCount}
                          </span>
                        )}
                      </div>

                      {/* Active pickup tag if any */}
                      {cit.activePickupRequestId && (
                        <div className="mt-1 flex items-center gap-1 text-[9.5px] font-bold text-amber-700 dark:text-amber-300">
                          <Tag className="w-2.5 h-2.5" />
                          <span>Pickup: {cit.activePickupRequestId}</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>
      )}

      {/* ============================================================ */}
      {/* MAIN CHAT CONVERSATION PANE */}
      {/* ============================================================ */}
      <main
        className={`flex-1 flex flex-col min-w-0 bg-white dark:bg-[#14231b] ${
          isWorker && !showMobileChat ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* CHAT HEADER */}
        <div className="shrink-0 px-4 sm:px-6 py-3.5 border-b border-gray-100 dark:border-emerald-800/40 bg-white dark:bg-[#14231b] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile back button for worker */}
            {isWorker && showMobileChat && (
              <button
                onClick={() => setShowMobileChat(false)}
                className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-emerald-900/50 rounded-xl text-gray-600 dark:text-gray-300 cursor-pointer"
                title="Back to list"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            {/* Optional dashboard onBack */}
            {!isWorker && onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 dark:hover:bg-emerald-900/50 rounded-xl text-gray-500 dark:text-gray-400 transition cursor-pointer"
                title="Back to Dashboard"
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

                <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                  {partnerInfo.badge}
                </span>

                {/* Active Pickup Request Context Pill */}
                {partnerInfo.activeRequestId && (
                  <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0 flex items-center gap-1">
                    <Tag className="w-2.5 h-2.5" />
                    <span>Req: {partnerInfo.activeRequestId} ({partnerInfo.activeRequestStatus})</span>
                  </span>
                )}
              </div>

              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                {partnerInfo.subtitle}
              </p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {partnerInfo.phone && (
              <a
                href={`tel:${partnerInfo.phone}`}
                className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition cursor-pointer"
                title={`Call ${partnerInfo.phone}`}
              >
                <Phone className="w-4 h-4" />
              </a>
            )}

            <button
              onClick={() => loadConversationMessages(true)}
              className="p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-emerald-800 transition cursor-pointer"
              title="Refresh conversation"
            >
              <RefreshCw className={`w-4 h-4 ${loadingChat ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* MESSAGES SCROLL AREA */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#f8faf9] dark:bg-[#0e1913]">
          {loadingChat && messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-gray-400 font-bold space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Loading conversation history...</span>
            </div>
          ) : messages.length === 0 ? (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4 max-w-md mx-auto">
              <div className="w-14 h-14 rounded-3xl bg-emerald-100/70 dark:bg-emerald-900/40 text-[#0a4d2c] dark:text-emerald-300 flex items-center justify-center shadow-xs">
                <MessageSquare className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-gray-800 dark:text-white">
                  Direct Citizen ↔ Worker Line
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {isWorker
                    ? `Coordinate doorstep plastic pickups and collection timing directly with ${partnerInfo.name}.`
                    : 'Communicate directly with your assigned Haritha Karma Sena worker for collection times, gate access, and queries.'}
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
                (msg.senderType && msg.senderType.toLowerCase() === (currentUser.role || '').toLowerCase()) ||
                String(msg.senderId || '').trim().toLowerCase() === String(currentUserId).trim().toLowerCase();

              return (
                <div
                  key={msg.messageId || index}
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
                      {msg.text}
                    </p>

                    {/* Optional Pickup Request Context Tag */}
                    {msg.pickupRequestId && (
                      <div className="pt-0.5">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md inline-flex items-center gap-1 ${
                            isMyMessage
                              ? 'bg-emerald-800/60 text-emerald-200'
                              : 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                          }`}
                        >
                          <Tag className="w-2.5 h-2.5" />
                          <span>Ref: {msg.pickupRequestId}</span>
                        </span>
                      </div>
                    )}

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
              onClick={() => loadConversationMessages(true)}
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
              disabled={sending}
              placeholder={`Type a message to coordinate doorstep pickup...`}
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-gray-50 dark:bg-emerald-950/40 border border-gray-200 dark:border-emerald-800/60 rounded-2xl text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white dark:focus:bg-emerald-950 transition-all"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || sending}
              className="p-3 bg-[#0a4d2c] hover:bg-[#063820] text-white rounded-2xl shadow-md transition disabled:opacity-40 cursor-pointer shrink-0"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CitizenWorkerChat;
