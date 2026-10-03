import axios from 'axios';

const API_URL = 'http://localhost:5214/api/PickupRequest';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Creates a new plastic waste pickup request
 * @param {Object} requestData - Pickup request payload matching CreatePickupRequestDto
 * @returns {Promise<Object>} Response containing requestId, status, and message
 */
export const createPickupRequest = async (requestData) => {
  const response = await axios.post(API_URL, requestData, {
    headers: getAuthHeaders()
  });
  return response.data;
};

/**
 * Checks if the citizen has submitted a pickup request for the current calendar month
 * @param {string} citizenId - The ID or email of the citizen
 * @returns {Promise<Object>} Object with { hasMonthlyRequest: boolean, request: Object }
 */
export const getMonthlyStatus = async (citizenId) => {
  if (!citizenId) return { hasMonthlyRequest: false, request: null };
  const response = await axios.get(`${API_URL}/citizen/${encodeURIComponent(citizenId)}/monthly-status`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

/**
 * Fetches all pickup requests submitted by a citizen
 * @param {string} citizenId - The ID of the citizen
 * @returns {Promise<Array>} List of pickup requests
 */
export const getCitizenRequests = async (citizenId) => {
  if (!citizenId) return [];
  const response = await axios.get(`${API_URL}/citizen/${encodeURIComponent(citizenId)}`, {
    headers: getAuthHeaders()
  });
  const data = response.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

/**
 * Admin fetches all pickup requests across all wards
 * @returns {Promise<Array>} List of all pickup requests
 */
export const getAllPickupRequests = async () => {
  const response = await axios.get(`${API_URL}/all`, {
    headers: getAuthHeaders()
  });
  const data = response.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

/**
 * Fetches all plastic pickup requests in a specific ward for workers (optionally filtered by workerId)
 * @param {string} wardId - Ward ID
 * @param {string} [workerId] - Optional Worker ID / Email
 * @returns {Promise<Array>} List of ward pickup requests
 */
export const getWardPickupRequests = async (wardId, workerId) => {
  if (!wardId && !workerId) return [];

  let response;
  if (wardId) {
    const params = workerId ? { workerId: workerId.trim() } : {};
    response = await axios.get(`${API_URL}/ward/${encodeURIComponent(wardId.trim())}`, {
      params,
      headers: getAuthHeaders()
    });
  } else {
    response = await axios.get(`${API_URL}/worker/${encodeURIComponent(workerId.trim())}`, {
      headers: getAuthHeaders()
    });
  }

  const data = response.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.requests)) return data.requests;
  return [];
};

/**
 * Worker fetches their assigned pickup requests across their duty ward
 * @param {string} workerId - Worker ID or Email
 * @returns {Promise<Array>} List of worker pickup requests
 */
export const getWorkerPickupRequests = async (workerId) => {
  if (!workerId) return [];
  const response = await axios.get(`${API_URL}/worker/${encodeURIComponent(workerId.trim())}`, {
    headers: getAuthHeaders()
  });
  const data = response.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.requests)) return data.requests;
  return [];
};

/**
 * Worker schedules & accepts a pickup request (Status: Scheduled, CollectionDate must be 20th-25th)
 * @param {string} requestId - Public request ID
 * @param {string} workerId - Worker ID
 * @param {string} collectionDate - ISO date string (YYYY-MM-DD) between 20th and 25th
 * @returns {Promise<Object>} Updated status response
 */
export const schedulePickupRequest = async (requestId, workerId, collectionDate) => {
  const response = await axios.put(`${API_URL}/${encodeURIComponent(requestId)}/schedule`, {
    workerId,
    collectionDate,
    scheduledDate: collectionDate
  }, {
    headers: getAuthHeaders()
  });
  return response.data;
};

/**
 * Worker marks a pickup request as collected/completed using citizen's 4-digit verification code
 * @param {string} requestId - Public request ID
 * @param {string} [workerId] - Optional Worker ID
 * @param {string} verificationCode - 4-digit verification code provided by citizen
 * @returns {Promise<Object>} Updated status response
 */
export const completePickupRequest = async (requestId, workerId, verificationCode) => {
  const response = await axios.put(`${API_URL}/${encodeURIComponent(requestId)}/complete`, {
    workerId,
    verificationCode
  }, {
    headers: getAuthHeaders()
  });
  return response.data;
};

/**
 * Submits a reason for a Due pickup request
 * @param {string} requestId - Public request ID
 * @param {string} reason - Reason why pickup was not completed
 * @param {string} [submittedBy] - Submitter name or role ("Citizen" / "Worker")
 * @returns {Promise<Object>} Updated status response
 */
export const submitDueReason = async (requestId, reason, submittedBy = 'Worker') => {
  const response = await axios.put(`${API_URL}/${encodeURIComponent(requestId)}/due-reason`, {
    reason,
    submittedBy
  }, {
    headers: getAuthHeaders()
  });
  return response.data;
};

/**
 * Admin reviews (approves or rejects) missed pickup reason
 * @param {string} requestId - Public request ID
 * @param {'Admin'} [approvedBy] - Role of approver ('Admin')
 * @param {'Approve'|'Reject'} [action] - Approval action
 * @returns {Promise<Object>} Response object
 */
export const approveDueReason = async (requestId, approvedBy = 'Admin', action = 'Approve') => {
  const response = await axios.put(`${API_URL}/${encodeURIComponent(requestId)}/approve-reason`, {
    approvedBy: 'Admin',
    action
  }, {
    headers: getAuthHeaders()
  });
  return response.data;
};

/**
 * Computes the assigned collection period based on request creation date:
 * - If a citizen creates a pickup request on or before the 25th, assign it to the current month's collection.
 * - If a citizen creates a pickup request after the 25th, automatically assign it to the NEXT month's collection.
 * Examples:
 * - October 24 -> October collection
 * - October 25 -> October collection
 * - October 26 -> November collection
 * - October 31 -> November collection
 * - November 25 -> November collection
 * - November 26 -> December collection
 * @param {string|Date} [requestedAt]
 * @returns {{ targetYear: number, targetMonth: number, targetMonthIndex: number, periodName: string, isNextMonth: boolean }}
 */
export const getAssignedCollectionPeriod = (requestedAt = null) => {
  const date = requestedAt ? new Date(requestedAt) : new Date();
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed (0 = Jan, 9 = Oct, 10 = Nov, 11 = Dec)
  const day = date.getDate();

  if (day <= 25) {
    // Current month's collection (1st to 25th)
    const targetDate = new Date(year, month, 1);
    const periodName = targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const targetMonthName = targetDate.toLocaleDateString('en-US', { month: 'long' });
    const currentMonthName = targetMonthName;
    return {
      targetYear: year,
      targetMonth: month + 1, // 1-indexed (1-12)
      targetMonthIndex: month,
      periodName,
      currentMonthName,
      targetMonthName,
      isNextMonth: false,
      headline: `Target Collection Period: ${periodName} (20th–25th)`,
      subtext: `You can submit your request now. Collection will be scheduled during the ${targetMonthName} 20–25 window.`
    };
  } else {
    // After 25th: automatically assign to NEXT month's collection window
    const currentDate = new Date(year, month, 1);
    const currentMonthName = currentDate.toLocaleDateString('en-US', { month: 'long' });
    const nextDate = new Date(year, month + 1, 1);
    const targetYear = nextDate.getFullYear();
    const targetMonthIndex = nextDate.getMonth();
    const targetMonthName = nextDate.toLocaleDateString('en-US', { month: 'long' });
    const periodName = nextDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return {
      targetYear,
      targetMonth: targetMonthIndex + 1,
      targetMonthIndex,
      periodName,
      currentMonthName,
      targetMonthName,
      isNextMonth: true,
      headline: `Target Collection Period: ${periodName} (20th–25th)`,
      subtext: `${currentMonthName}'s collection window has ended. New requests are assigned to ${targetMonthName}.`
    };
  }
};

/**
 * Returns the valid future date range for worker collection scheduling:
 * - Worker can only select a valid future date within the request's assigned collection month and the 20–25 collection period.
 * - Past dates must NEVER be allowed.
 * @param {Object} [request] - Pickup request object
 * @returns {{ minDate: string, maxDate: string, defaultDate: string, targetYear: number, targetMonth: number, periodName: string }}
 */
export const getValidCollectionDateRange = (request = null) => {
  const now = new Date();
  const todayYear = now.getFullYear();
  const todayMonth = now.getMonth(); // 0-indexed
  const todayDay = now.getDate();

  let targetYear;
  let targetMonthIndex;
  let periodName;

  if (request?.collectionYear && request?.collectionMonth) {
    targetYear = Number(request.collectionYear);
    targetMonthIndex = Number(request.collectionMonth) - 1;
    const targetDate = new Date(targetYear, targetMonthIndex, 1);
    periodName = request.collectionPeriodName || targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } else if (request?.requestedAt) {
    const period = getAssignedCollectionPeriod(request.requestedAt);
    targetYear = period.targetYear;
    targetMonthIndex = period.targetMonthIndex;
    periodName = period.periodName;
  } else {
    const period = getAssignedCollectionPeriod(new Date());
    targetYear = period.targetYear;
    targetMonthIndex = period.targetMonthIndex;
    periodName = period.periodName;
  }

  // The collection period is strictly from the 20th to 25th
  let startDay = 20;

  // Past dates must NEVER be allowed!
  // If target month is current month, and today is already >= 20th, past days in this month are barred
  if (targetYear === todayYear && targetMonthIndex === todayMonth && todayDay >= 20) {
    startDay = todayDay;
  }

  const pad = (n) => String(n).padStart(2, '0');
  const minDate = `${targetYear}-${pad(targetMonthIndex + 1)}-${pad(Math.min(startDay, 25))}`;
  const maxDate = `${targetYear}-${pad(targetMonthIndex + 1)}-25`;
  const defaultDate = minDate;

  return {
    minDate,
    maxDate,
    defaultDate,
    targetYear,
    targetMonth: targetMonthIndex + 1,
    periodName
  };
};

/**
 * Validates a selected scheduling date against the request's assigned collection period
 * @param {string} selectedDateStr - YYYY-MM-DD
 * @param {Object} [request] - The pickup request being scheduled
 * @returns {{ valid: boolean, error?: string }}
 */
export const validateScheduledDate = (selectedDateStr, request = null) => {
  if (!selectedDateStr) {
    return { valid: false, error: 'Please select a collection date.' };
  }

  const range = getValidCollectionDateRange(request);
  const selectedDate = parseLocalDateParts(selectedDateStr);
  if (!selectedDate) {
    return { valid: false, error: 'Invalid collection date format.' };
  }

  const today = getLocalTodayMidnight();

  // 1. Past dates must never be allowed
  if (selectedDate < today) {
    return { valid: false, error: 'Past dates must never be allowed. Please select a valid future date.' };
  }

  // 2. Must be within the request's assigned collection month
  const selYear = selectedDate.getFullYear();
  const selMonth = selectedDate.getMonth() + 1;
  const selDay = selectedDate.getDate();

  if (selYear !== range.targetYear || selMonth !== range.targetMonth) {
    return {
      valid: false,
      error: `Selected date must be within the request's assigned collection month (${range.periodName}). Selected date was ${selDay} ${selectedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}.`
    };
  }

  // 3. Must be between 20th and 25th
  if (selDay < 20 || selDay > 25) {
    return {
      valid: false,
      error: 'Worker collection date must be scheduled between the 20th and 25th of the collection period.'
    };
  }

  return { valid: true };
};

/**
 * Safely parses any date string into a local midnight Date object,
 * extracting calendar year/month/day without UTC midnight offsets.
 * @param {string|Date} dateInput
 * @returns {Date|null}
 */
export const parseLocalDateParts = (dateInput) => {
  if (!dateInput) return null;
  if (typeof dateInput === 'string') {
    const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1; // 0-indexed
      const day = parseInt(match[3], 10);
      return new Date(year, month, day);
    }
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

/**
 * Returns today at 00:00:00 in the user's local timezone
 * @returns {Date}
 */
export const getLocalTodayMidnight = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

/**
 * Safely formats a scheduled or completed collection date string
 * @param {string|Date} dateInput
 * @param {Object} [options]
 * @returns {string}
 */
export const formatPickupDate = (dateInput, options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) => {
  const d = parseLocalDateParts(dateInput);
  if (!d) return 'N/A';
  return d.toLocaleDateString('en-IN', options);
};

/**
 * Computes accurate pickup status lifecycle according to requirements:
 * Pending -> Scheduled -> Completed
 * If ScheduledDate passes without completion:
 * Due / Review Required -> Worker Reason -> Admin Approval -> Reschedule Unlocked -> Scheduled -> Completed
 *
 * @param {Object} req - Pickup request object
 * @returns {Object} Evaluated status metadata
 */
export const getPickupScheduleStatus = (req) => {
  if (!req) {
    return {
      status: 'None',
      label: 'No Active Request',
      badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
      isCompleted: false,
      isScheduled: false,
      isToday: false,
      isDue: false,
      isReasonSubmitted: false,
      isApprovedForReschedule: false,
      isRejected: false,
      isPending: false,
      step: 0
    };
  }

  const rawStatus = (req.status || '').toLowerCase();
  if (rawStatus === 'completed' || rawStatus === 'collected') {
    return {
      status: 'Completed',
      label: 'Completed',
      badgeClass: 'bg-emerald-100 text-[#0a4d2c] border-emerald-300',
      isCompleted: true,
      isScheduled: false,
      isToday: false,
      isDue: false,
      isReasonSubmitted: false,
      isApprovedForReschedule: false,
      isRejected: false,
      isPending: false,
      step: 4
    };
  }

  if (rawStatus === 'cancelled') {
    return {
      status: 'Cancelled',
      label: 'Cancelled',
      badgeClass: 'bg-gray-100 text-gray-700 border-gray-300',
      isCompleted: false,
      isScheduled: false,
      isToday: false,
      isDue: false,
      isReasonSubmitted: false,
      isApprovedForReschedule: false,
      isRejected: false,
      isPending: false,
      step: 0
    };
  }

  const scheduledDateObj = parseLocalDateParts(req.scheduledDate || req.collectionDate);
  const today = getLocalTodayMidnight();
  const schedTime = scheduledDateObj ? scheduledDateObj.getTime() : null;
  const todayTime = today.getTime();

  // If scheduled date has passed or status is due -> Due / Review Required
  const isDatePassed = schedTime !== null && todayTime > schedTime;
  const isDueState =
    isDatePassed ||
    rawStatus.includes('due') ||
    Boolean(req.dueReason && req.dueReason.trim()) ||
    req.dueStatus === 'Review Required' ||
    req.dueStatus === 'Reason Submitted' ||
    req.dueStatus === 'Approved for Reschedule' ||
    req.dueStatus === 'Rejected' ||
    (req.dueStatus && req.dueStatus.includes('Due'));

  if (isDueState) {
    const isApprovedForReschedule =
      req.adminApprovalStatus === 'Approved' ||
      req.dueStatus === 'Approved for Reschedule';

    const isRejected =
      req.adminApprovalStatus === 'Rejected' ||
      req.dueStatus === 'Rejected';

    const hasReason = Boolean(
      (req.dueReason && req.dueReason.trim()) ||
      req.dueStatus === 'Review Required' ||
      req.dueStatus === 'Reason Submitted' ||
      isApprovedForReschedule ||
      isRejected
    );

    let status = 'Due';
    let label = 'Due / Review Required';
    let badgeClass = 'bg-rose-100 text-rose-900 border-rose-300 font-extrabold';

    if (isApprovedForReschedule) {
      status = 'Approved for Reschedule';
      label = 'Approved for Reschedule';
      badgeClass = 'bg-teal-100 text-teal-900 border-teal-300 font-extrabold';
    } else if (isRejected) {
      status = 'Rejected';
      label = 'Reason Rejected (Locked)';
      badgeClass = 'bg-red-100 text-red-900 border-red-300 font-extrabold';
    } else if (hasReason) {
      status = 'Review Required';
      label = 'Due / Review Required';
      badgeClass = 'bg-purple-100 text-purple-900 border-purple-300 font-extrabold';
    }

    return {
      status,
      label,
      badgeClass,
      isDue: true,
      isReasonSubmitted: hasReason,
      isApprovedForReschedule,
      isRejected,
      isCompleted: false,
      isScheduled: false,
      isToday: false,
      isPending: false,
      dueReason: req.dueReason || '',
      dueReasonSubmittedAt: req.dueReasonSubmittedAt || null,
      dueReasonSubmittedBy: req.dueReasonSubmittedBy || null,
      adminApprovalStatus: req.adminApprovalStatus || null,
      adminApprovedAt: req.adminApprovedAt || null,
      scheduledDateObj: scheduledDateObj || null,
      step: 2
    };
  }

  if (!scheduledDateObj) {
    return {
      status: 'Pending',
      label: 'Pending Schedule',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
      isPending: true,
      isCompleted: false,
      isScheduled: false,
      isToday: false,
      isDue: false,
      isReasonSubmitted: false,
      isApprovedForReschedule: false,
      isRejected: false,
      scheduledDateObj: null,
      dueReason: '',
      citizenApprovalStatus: null,
      adminApprovalStatus: null,
      step: 1
    };
  }

  // If scheduled date is TODAY -> Pickup Today
  if (todayTime === schedTime) {
    return {
      status: 'Pickup Today',
      label: 'Pickup Today',
      badgeClass: 'bg-amber-500 text-white border-amber-600 shadow-sm animate-pulse font-extrabold',
      isToday: true,
      isScheduled: true,
      isDue: false,
      isReasonSubmitted: false,
      isApprovedForReschedule: false,
      isRejected: false,
      isCompleted: false,
      isPending: false,
      scheduledDateObj,
      step: 3
    };
  }

  // Scheduled date is upcoming in the future
  return {
    status: 'Scheduled',
    label: 'Scheduled',
    badgeClass: 'bg-[#0a4d2c] text-white border-emerald-800 font-extrabold',
    isScheduled: true,
    isToday: false,
    isDue: false,
    isReasonSubmitted: false,
    isApprovedForReschedule: false,
    isRejected: false,
    isCompleted: false,
    isPending: false,
    scheduledDateObj,
    step: 2
  };
};

export default {
  createPickupRequest,
  getMonthlyStatus,
  getCitizenRequests,
  getAllPickupRequests,
  getWardPickupRequests,
  getWorkerPickupRequests,
  schedulePickupRequest,
  completePickupRequest,
  submitDueReason,
  approveDueReason,
  parseLocalDateParts,
  getLocalTodayMidnight,
  formatPickupDate,
  getPickupScheduleStatus,
  getValidCollectionDateRange,
};

