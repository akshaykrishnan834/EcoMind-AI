import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  UserCheck,
  Smartphone,
  Check,
  History,
  Receipt,
  Sparkles,
  Printer,
  Gift,
  Leaf,
  Coins,
  ArrowRight,
  Info,
  Tag
} from 'lucide-react';
import {
  getCitizenPayments,
  createRazorpayOrder,
  verifyRazorpayPayment,
  processWorkerPayment,
  redeemPoints
} from '../services/paymentService';
import { getCitizenByEmail } from '../services/citizenService';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Helper to dynamically load Razorpay Checkout SDK script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const MonthlyPaymentSection = ({ citizenData }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPaymentForModal, setSelectedPaymentForModal] = useState(null);
  const [selectedMode, setSelectedMode] = useState('Online'); // 'Online' or 'Pay Through Worker'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [redemptionFeedback, setRedemptionFeedback] = useState(null);

  // Available points state (default 17 for demo if not yet recorded)
  const [ecoPoints, setEcoPoints] = useState(
    citizenData?.ecoPoints !== undefined && citizenData?.ecoPoints !== null ? citizenData.ecoPoints : 17
  );
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const userObj = JSON.parse(localStorage.getItem('user') || '{}');
  const citizenId = citizenData?.citizenId || citizenData?.id || citizenData?._id || userObj.citizenId || 'CIT001';
  const citizenName = citizenData?.fullName || userObj.fullName || 'Citizen';
  const houseNumber = citizenData?.houseNumber || userObj.houseNumber || 'N/A';
  const wardId = citizenData?.wardId || userObj.wardId || 'Ward 1';
  const userEmail = citizenData?.email || userObj.email || '';

  // Synchronize ecoPoints whenever citizenData prop updates
  useEffect(() => {
    if (citizenData?.ecoPoints !== undefined && citizenData?.ecoPoints !== null) {
      setEcoPoints(citizenData.ecoPoints);
    }
  }, [citizenData?.ecoPoints]);

  const loadPayments = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getCitizenPayments(citizenId);
      setPayments(data || []);
      // Refresh citizen profile points if email is available
      if (userEmail) {
        const freshProfile = await getCitizenByEmail(userEmail).catch(() => null);
        if (freshProfile && freshProfile.ecoPoints !== undefined) {
          setEcoPoints(freshProfile.ecoPoints);
        }
      }
    } catch (err) {
      console.error('Error loading monthly payments:', err);
      setError('Could not load monthly payments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (citizenId) {
      loadPayments();
    }
  }, [citizenId]);

  const currentDate = new Date();
  const currentMonthNum = currentDate.getMonth() + 1;
  const currentYearNum = currentDate.getFullYear();
  const currentMonthName = MONTH_NAMES[currentDate.getMonth()];

  // Find current month's payment record
  const currentPayment = payments.find(p => p.year === currentYearNum && p.month === currentMonthNum) || {
    citizenId,
    month: currentMonthNum,
    year: currentYearNum,
    baseAmount: 50,
    discountAmount: 0,
    pointsRedeemed: 0,
    amount: 50,
    status: 'Unpaid',
    paymentMethod: null
  };

  const isCurrentPaid = (currentPayment.status || '').toLowerCase() === 'paid';

  // Identify previous unpaid months (Pending Dues)
  const pendingDues = payments.filter(p => {
    const isPast = p.year < currentYearNum || (p.year === currentYearNum && p.month < currentMonthNum);
    return isPast && (p.status || '').toLowerCase() !== 'paid';
  });

  const handleOpenPayModal = (paymentTarget) => {
    setSuccessMessage('');
    setError('');
    setRedemptionFeedback(null);
    setSelectedPaymentForModal(paymentTarget);
    setIsModalOpen(true);
  };

  // EXPLICIT REDEEM ACTION: Points only become a discount when user explicitly clicks Redeem
  const handleRedeemPoints = async (targetPayment) => {
    if (!targetPayment) return;

    if (ecoPoints < 10) {
      setError(`Insufficient points. You need at least 10 points to redeem a discount (Available: ${ecoPoints}).`);
      return;
    }

    if (targetPayment.pointsRedeemed > 0 || targetPayment.discountAmount > 0) {
      setError('Points have already been redeemed for this month. The same points cannot be redeemed twice.');
      return;
    }

    setIsRedeeming(true);
    setError('');
    try {
      const res = await redeemPoints({
        citizenId,
        month: targetPayment.month,
        year: targetPayment.year,
        pointsToRedeem: 10
      });

      if (res.success) {
        // Deduct points from live balance and show remaining points
        setEcoPoints(res.remainingPoints);
        
        // Update payment record in local state
        const updatedPayment = {
          ...targetPayment,
          baseAmount: res.baseAmount || 50,
          discountAmount: res.discountAmount || 10,
          pointsRedeemed: res.pointsRedeemed || 10,
          amount: res.netAmount || 40
        };

        setPayments(prev =>
          prev.map(p => (p.year === targetPayment.year && p.month === targetPayment.month ? updatedPayment : p))
        );

        if (selectedPaymentForModal && selectedPaymentForModal.month === targetPayment.month && selectedPaymentForModal.year === targetPayment.year) {
          setSelectedPaymentForModal(updatedPayment);
        }

        setRedemptionFeedback({
          month: targetPayment.month,
          year: targetPayment.year,
          pointsRedeemed: res.pointsRedeemed,
          remainingPoints: res.remainingPoints,
          discountAmount: res.discountAmount,
          netAmount: res.netAmount
        });

        setSuccessMessage(`10 Points Redeemed! 20% Discount Applied. Remaining Points: ${res.remainingPoints}`);
      } else {
        setError(res.message || 'Could not redeem points. Please try again.');
      }
    } catch (err) {
      console.error('Error redeeming points:', err);
      setError(err.response?.data?.message || 'Points redemption failed. Please try again.');
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedPaymentForModal) return;

    setIsSubmitting(true);
    setError('');
    try {
      const targetMonthName = MONTH_NAMES[selectedPaymentForModal.month - 1];
      const hasDiscount = (selectedPaymentForModal.discountAmount && selectedPaymentForModal.discountAmount > 0) ||
                          (selectedPaymentForModal.pointsRedeemed && selectedPaymentForModal.pointsRedeemed > 0) ||
                          selectedPaymentForModal.amount === 40;

      if (selectedMode === 'Online') {
        // Step 1: Load Razorpay Checkout SDK
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          setError('Razorpay SDK failed to load. Please check your internet connection.');
          setIsSubmitting(false);
          return;
        }

        // Step 2: Create Razorpay Order from backend (uses already-redeemed discount if citizen clicked Redeem)
        const orderData = await createRazorpayOrder({
          citizenId,
          month: selectedPaymentForModal.month,
          year: selectedPaymentForModal.year,
          applyEcoDiscount: hasDiscount
        });

        // Step 3: Launch Razorpay Checkout Modal
        const options = {
          key: orderData.keyId,
          amount: orderData.amount, // in paise (₹4000 if redeemed, ₹5000 if not redeemed)
          currency: orderData.currency || 'INR',
          name: 'Haritha Karma Sena',
          description: `User Fee (${targetMonthName} ${selectedPaymentForModal.year}) ${hasDiscount ? '[20% Discount]' : ''}`,
          order_id: orderData.razorpayOrderId,
          handler: async function (response) {
            setIsSubmitting(true);
            try {
              // Step 4: Verify signature on ASP.NET Core backend
              const verifyResult = await verifyRazorpayPayment({
                citizenId,
                month: selectedPaymentForModal.month,
                year: selectedPaymentForModal.year,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              });

              if (verifyResult.success) {
                const discountNote = hasDiscount ? ' (20% Discount Applied: Paid ₹40)' : ' (Paid ₹50)';
                setSuccessMessage(`Payment successful & verified! Fee for ${targetMonthName} ${selectedPaymentForModal.year} marked as Paid.${discountNote}`);
                setIsModalOpen(false);
                setSelectedPaymentForModal(null);
                await loadPayments();
              } else {
                setError(verifyResult.message || 'Razorpay payment signature verification failed.');
              }
            } catch (verErr) {
              console.error('Verification Error:', verErr);
              setError(verErr.response?.data?.message || 'Payment verification failed on server.');
            } finally {
              setIsSubmitting(false);
            }
          },
          prefill: {
            name: citizenName,
            email: userObj.email || '',
            contact: userObj.phoneNumber || ''
          },
          theme: {
            color: '#0a4d2c'
          },
          modal: {
            ondismiss: function () {
              setIsSubmitting(false);
            }
          }
        };

        const razorpayInstance = new window.Razorpay(options);
        razorpayInstance.on('payment.failed', function (resp) {
          console.error('Razorpay payment failed:', resp.error);
          setError(`Payment failed: ${resp.error.description || 'Transaction declined'}`);
          setIsSubmitting(false);
        });
        razorpayInstance.open();

      } else {
        // Option 2: Pay Through Worker
        await processWorkerPayment({
          citizenId,
          month: selectedPaymentForModal.month,
          year: selectedPaymentForModal.year,
          applyEcoDiscount: hasDiscount
        });

        const discountNote = hasDiscount ? ' (20% Discount Applied: Handover ₹40 cash)' : ' (Handover ₹50 cash)';
        setSuccessMessage(`Handover confirmed! Haritha Karma Sena fee for ${targetMonthName} ${selectedPaymentForModal.year} marked as Paid.${discountNote}`);
        setIsModalOpen(false);
        setSelectedPaymentForModal(null);
        await loadPayments();
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Payment initialization failed:', err);
      setError(err.response?.data?.message || 'Payment processing failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-[#0a4d2c] via-[#0f5b37] to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-emerald-200 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>Government of Kerala • Haritha Karma Sena Monthly User Fee</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Monthly Fee Payment & Redeem Points
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 font-medium max-w-xl">
            Official monthly user fee of ₹50 for doorstep waste collection in {wardId}. Redeem your points to get an instant 20% discount.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Total Available Points Pill */}
          <div className="px-4 py-2.5 bg-emerald-950/80 border border-emerald-400/40 rounded-2xl flex items-center gap-3 shadow-inner">
            <div className="p-2 bg-amber-400 text-amber-950 rounded-xl font-black">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block">Available Points</span>
              <span className="text-lg font-black text-white flex items-center gap-1.5">
                {ecoPoints} <span className="text-xs font-semibold text-emerald-200">Points</span>
              </span>
            </div>
          </div>

          <button
            onClick={loadPayments}
            disabled={loading}
            className="px-4 py-2.5 bg-emerald-900/80 hover:bg-emerald-950 border border-emerald-400/40 text-emerald-200 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer self-stretch sm:self-auto justify-center"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* CLEAR POINTS & REDEMPTION RULES CARD */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 rounded-3xl p-6 border-2 border-emerald-200/80 shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#0a4d2c] text-white rounded-2xl shadow-sm shrink-0 mt-0.5">
              <Sparkles className="w-6 h-6 text-emerald-300" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-emerald-950">
                  Earn & Redeem Points for 20% Fee Discount
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-200 text-emerald-900 border border-emerald-300">
                  Loyalty Rule
                </span>
              </div>
              <p className="text-xs text-emerald-800 font-medium max-w-2xl leading-relaxed">
                • Users earn redeem points like <strong>2, 5, 10</strong> for completed doorstep plastic waste pickups.<br />
                • Points do <strong>NOT</strong> automatically become a discount.<br />
                • Only when you click the <strong>Redeem</strong> button, <strong>10 Points</strong> are redeemed for a <strong>20% discount (₹10 OFF)</strong>.<br />
                • If you don't click Redeem, your points remain untouched.
              </p>
            </div>
          </div>

          {/* Quick Balance Status Box */}
          <div className="shrink-0 flex items-center gap-4 bg-white/95 backdrop-blur-xs p-4 rounded-2xl border border-emerald-200 shadow-xs self-stretch md:self-auto justify-between">
            <div>
              <span className="text-[10px] uppercase font-extrabold text-gray-500 block">Available Points</span>
              <span className="text-2xl font-black text-[#0a4d2c] flex items-center gap-1.5">
                <Coins className="w-5 h-5 text-amber-500" />
                {ecoPoints}
              </span>
            </div>
            <div className="h-9 w-px bg-emerald-200" />
            <div className="text-right">
              <span className="text-[10px] uppercase font-extrabold text-gray-500 block">Redemption Cost</span>
              <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-300 inline-block">
                10 Points = ₹10 OFF
              </span>
            </div>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-2xl text-emerald-900 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-bold">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-700 font-bold underline cursor-pointer">Dismiss</button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={loadPayments} className="underline font-bold cursor-pointer">Retry</button>
        </div>
      )}

      {/* PREVIOUS UNPAID MONTHS (PENDING DUES) SECTION */}
      {pendingDues.length > 0 && (
        <div className="bg-gradient-to-r from-rose-50 to-amber-50 rounded-3xl p-6 sm:p-8 border-2 border-rose-300 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-rose-200/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-500 text-white rounded-2xl shadow-xs">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-rose-950 flex items-center gap-2">
                  <span>Pending Dues ({pendingDues.length})</span>
                </h3>
                <p className="text-xs text-rose-800 font-medium">
                  Previous unpaid monthly fees must be cleared.
                </p>
              </div>
            </div>

            <span className="px-3.5 py-1.5 bg-rose-600 text-white font-extrabold text-xs rounded-full shadow-xs">
              Total Due: ₹{pendingDues.reduce((acc, cur) => acc + (cur.amount || 50), 0)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {pendingDues.map((p) => {
              const mName = MONTH_NAMES[p.month - 1];
              const isRedeemed = (p.discountAmount && p.discountAmount > 0) || (p.pointsRedeemed && p.pointsRedeemed > 0) || p.amount === 40;

              return (
                <div key={`${p.year}-${p.month}`} className="bg-white rounded-2xl p-5 border-2 border-rose-200 shadow-sm space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Previous Month</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 border border-rose-300 text-rose-800">
                        Pending Due
                      </span>
                    </div>
                    <h4 className="text-lg font-black text-gray-900">{mName} {p.year}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-[#0a4d2c]">Fee: ₹{p.amount || 50}.00</span>
                      {isRedeemed && (
                        <span className="text-[10px] line-through text-gray-400">₹50.00</span>
                      )}
                    </div>

                    {isRedeemed ? (
                      <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] font-bold text-emerald-800 space-y-0.5">
                        <div className="flex items-center gap-1 text-emerald-900">
                          <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                          <span>10 Points Redeemed</span>
                        </div>
                        <div className="text-emerald-700">20% Discount Applied (Pay ₹40.00)</div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-gray-500 font-medium">Available: {ecoPoints} pts</span>
                        <button
                          onClick={() => handleRedeemPoints(p)}
                          disabled={isRedeeming || ecoPoints < 10}
                          className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                            ecoPoints >= 10
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <Gift className="w-3 h-3" />
                          <span>{isRedeeming ? 'Redeeming...' : 'Redeem 10 Pts'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleOpenPayModal(p)}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4 text-white" />
                    <span>Pay Due (₹{p.amount || 50})</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CURRENT MONTH PAYMENT CARD */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-800/30 shadow-lg space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-100 pb-5">
          <div className="space-y-1">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest block">
              Current Month Payment
            </span>
            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <span>{currentMonthName} {currentYearNum}</span>
            </h2>
            <p className="text-xs text-gray-500 font-medium">
              Citizen ID: <strong className="text-gray-800 font-bold">{citizenId}</strong> • House No: <strong className="text-gray-800 font-bold">{houseNumber}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border flex items-center gap-1.5 ${
              isCurrentPaid
                ? 'bg-emerald-100 border-emerald-400 text-[#0a4d2c]'
                : 'bg-amber-100 border-amber-400 text-amber-900'
            }`}>
              {isCurrentPaid ? <Check className="w-4 h-4 text-[#0a4d2c] stroke-[3]" /> : <Clock className="w-4 h-4 text-amber-700" />}
              <span>{isCurrentPaid ? 'Paid' : 'Unpaid'}</span>
            </span>
          </div>
        </div>

        {/* Current Month Fee & Explicit Redemption Row */}
        <div className="bg-[#f2faf5] rounded-2xl p-6 border-2 border-emerald-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 flex-1">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
              Doorstep Waste Collection Fee
            </span>
            
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-black text-[#0a4d2c] tracking-tight">
                Monthly Fee: ₹{currentPayment.amount || 50}.00
              </span>
              {((currentPayment.discountAmount && currentPayment.discountAmount > 0) || currentPayment.amount === 40) && (
                <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-extrabold shadow-2xs">
                  20% Discount Applied (₹10 OFF)
                </span>
              )}
            </div>

            {/* Points & Redemption Action block on card if unpaid */}
            {!isCurrentPaid && (
              <div className="pt-2">
                {(currentPayment.pointsRedeemed > 0 || currentPayment.discountAmount > 0 || currentPayment.amount === 40) ? (
                  <div className="p-3 bg-white rounded-xl border border-emerald-300 text-xs font-bold text-emerald-900 flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1 text-emerald-700">
                      <Check className="w-4 h-4 stroke-[3]" />
                      <strong>10 Points Redeemed</strong>
                    </span>
                    <span className="text-emerald-800">• Discount Applied (-₹10.00)</span>
                    <span className="text-[#0a4d2c]">• Remaining Points: <strong>{ecoPoints}</strong></span>
                  </div>
                ) : (
                  <div className="p-3 bg-white rounded-xl border border-emerald-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="font-extrabold text-gray-900 flex items-center gap-1.5">
                        <Gift className="w-4 h-4 text-amber-500" />
                        <span>Available Points: <strong>{ecoPoints}</strong></span>
                      </div>
                      <p className="text-[11px] text-gray-500">
                        Click Redeem to apply 20% discount (10 pts = ₹10 off)
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRedeemPoints(currentPayment)}
                      disabled={isRedeeming || ecoPoints < 10}
                      className={`px-4 py-2 font-extrabold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
                        ecoPoints >= 10
                          ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Gift className="w-3.5 h-3.5 text-emerald-300" />
                      <span>{isRedeeming ? 'Redeeming...' : 'Redeem'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            <p className="text-xs text-gray-500 font-medium">
              Official doorstep collection user fee prescribed by Local Self Government Dept (LSGD Kerala).
            </p>
          </div>

          <div className="shrink-0 flex flex-col items-stretch sm:items-end gap-2">
            {isCurrentPaid ? (
              <div className="space-y-2 text-right">
                <div className="px-6 py-3 bg-[#0a4d2c] text-white rounded-2xl font-black text-sm shadow-md flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                  <span>Paid • ₹{currentPayment.amount || 50}</span>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <p className="text-[11px] text-emerald-800 font-semibold">
                    {currentPayment.paymentMethod || 'Online'} • {currentPayment.paidAt ? new Date(currentPayment.paidAt).toLocaleDateString('en-GB') : ''}
                  </p>
                  <button
                    onClick={() => setSelectedReceipt(currentPayment)}
                    className="text-[11px] font-bold text-emerald-800 underline hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                  >
                    <Receipt className="w-3 h-3" />
                    <span>View Receipt</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => handleOpenPayModal(currentPayment)}
                className="px-8 py-3.5 bg-[#0a4d2c] hover:bg-emerald-900 text-white font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
              >
                <CreditCard className="w-5 h-5 text-emerald-300" />
                <span>PAY ₹{currentPayment.amount || 50}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PAYMENT HISTORY TABLE SECTION */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-800/20 shadow-md space-y-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-100 text-[#0a4d2c] rounded-xl font-bold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">Payment History & Dues</h3>
              <p className="text-xs text-gray-500 font-medium">All monthly user fee records and official receipts</p>
            </div>
          </div>

          <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-[#0a4d2c] rounded-full border border-emerald-200">
            {payments.length} Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-emerald-50 text-emerald-950 border-b-2 border-emerald-200">
                <th className="py-3 px-4 font-extrabold">Month & Year</th>
                <th className="py-3 px-4 font-extrabold">Fee & Discount</th>
                <th className="py-3 px-4 font-extrabold">Status</th>
                <th className="py-3 px-4 font-extrabold">Payment Method</th>
                <th className="py-3 px-4 font-extrabold">Date Paid</th>
                <th className="py-3 px-4 font-extrabold">Transaction ID</th>
                <th className="py-3 px-4 font-extrabold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
              {payments.map((p) => {
                const monthName = MONTH_NAMES[p.month - 1] || `Month ${p.month}`;
                const isPaid = (p.status || '').toLowerCase() === 'paid';
                const isPast = p.year < currentYearNum || (p.year === currentYearNum && p.month < currentMonthNum);
                const hasDiscount = (p.discountAmount && p.discountAmount > 0) || (p.pointsRedeemed && p.pointsRedeemed > 0) || p.amount === 40;

                return (
                  <tr key={`${p.year}-${p.month}`} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="py-3 px-4 font-extrabold text-[#0a4d2c]">
                      {monthName} {p.year}
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-900">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-[#0a4d2c]">₹{p.amount || (hasDiscount ? 40 : 50)}.00</span>
                          {hasDiscount && (
                            <span className="text-[10px] text-gray-400 line-through">₹50.00</span>
                          )}
                        </div>
                        {hasDiscount && (
                          <span className="text-[9px] font-extrabold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-300 w-fit mt-0.5">
                            20% OFF (10 pts)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-[#0a4d2c] font-black text-[11px] rounded-full border border-emerald-300">
                          <Check className="w-3 h-3 text-[#0a4d2c] stroke-[3]" />
                          Paid ✓
                        </span>
                      ) : isPast ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-100 text-rose-800 font-bold text-[11px] rounded-full border border-rose-300">
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          Pending Due
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-900 font-bold text-[11px] rounded-full border border-amber-300">
                          <Clock className="w-3 h-3 text-amber-700" />
                          Unpaid
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-800">
                      {isPaid ? (p.paymentMethod || 'Online') : '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-mono text-[11px]">
                      {p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-GB') : '-'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-gray-600 truncate max-w-[120px]" title={p.razorpayPaymentId || p.transactionId || ''}>
                      {p.razorpayPaymentId || p.transactionId || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isPaid ? (
                        <button
                          onClick={() => setSelectedReceipt(p)}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-[#0a4d2c] border border-emerald-300 font-bold text-[11px] rounded-lg transition-all inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <Receipt className="w-3 h-3" />
                          <span>Receipt</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenPayModal(p)}
                          className={`px-3 py-1.5 text-white font-extrabold text-[11px] rounded-lg transition-all cursor-pointer shadow-2xs ${
                            isPast ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[#0a4d2c] hover:bg-emerald-900'
                          }`}
                        >
                          {isPast ? 'Pay Now' : 'PAY'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CHECKOUT MODAL WITH EXPLICIT REDEEM FEATURE */}
      {isModalOpen && selectedPaymentForModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl border-2 border-emerald-800/30 relative">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-800 block">
                  Haritha Karma Sena Checkout
                </span>
                <h3 className="text-xl font-black text-gray-900">
                  {MONTH_NAMES[selectedPaymentForModal.month - 1]} {selectedPaymentForModal.year} Fee
                </h3>
              </div>
              <button
                onClick={() => { setIsModalOpen(false); setSelectedPaymentForModal(null); }}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* REDEEM POINTS SECTION IN MODAL */}
            {(() => {
              const isAlreadyRedeemed = (selectedPaymentForModal.discountAmount && selectedPaymentForModal.discountAmount > 0) ||
                                        (selectedPaymentForModal.pointsRedeemed && selectedPaymentForModal.pointsRedeemed > 0) ||
                                        selectedPaymentForModal.amount === 40;

              return (
                <div className="p-4 rounded-2xl border-2 border-emerald-300 bg-emerald-50/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-[#0a4d2c] text-white rounded-lg">
                        <Gift className="w-4 h-4 text-emerald-300" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-emerald-950">Green Eco-Points</h4>
                        <span className="text-[11px] text-emerald-700 font-semibold">
                          Available Points: <strong>{ecoPoints}</strong>
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-900 border border-emerald-300">
                      10 Pts = 20% OFF
                    </span>
                  </div>

                  {/* Explicit Redeem Button / Redeemed Confirmation */}
                  {isAlreadyRedeemed ? (
                    <div className="p-3 bg-white rounded-xl border border-emerald-400 space-y-1 shadow-2xs">
                      <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs">
                        <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                        <span>10 Points Redeemed</span>
                      </div>
                      <div className="text-[11px] font-bold text-emerald-700">
                        Discount Applied: 20% OFF (-₹10.00)
                      </div>
                      <div className="text-[11px] font-semibold text-gray-600">
                        Remaining Points: <strong className="text-[#0a4d2c]">{ecoPoints}</strong>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-xs font-extrabold text-gray-900 block">
                            Available Points: {ecoPoints}
                          </span>
                          <span className="text-[11px] text-gray-500 font-medium block">
                            Points do NOT automatically become a discount.
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRedeemPoints(selectedPaymentForModal)}
                          disabled={isRedeeming || ecoPoints < 10}
                          className={`px-4 py-2 font-extrabold text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                            ecoPoints >= 10
                              ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <Gift className="w-3.5 h-3.5 text-emerald-300" />
                          <span>{isRedeeming ? 'Redeeming...' : 'Redeem'}</span>
                        </button>
                      </div>

                      {ecoPoints < 10 && (
                        <p className="text-[10px] text-amber-700 font-semibold bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                          Need at least 10 points to redeem a 20% discount (You have {ecoPoints} pts).
                        </p>
                      )}
                    </div>
                  )}

                  {/* Fee Breakdown */}
                  <div className="pt-2 border-t border-emerald-200 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-gray-600">
                      <span>Standard Monthly Fee:</span>
                      <span className="font-semibold">₹50.00</span>
                    </div>
                    {isAlreadyRedeemed && (
                      <div className="flex items-center justify-between text-emerald-700 font-bold">
                        <span>20% Discount (10 Points Redeemed):</span>
                        <span>-₹10.00</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1 border-t border-dashed border-emerald-300 text-sm font-black text-[#0a4d2c]">
                      <span>Amount Payable:</span>
                      <span className="text-lg">₹{(selectedPaymentForModal.amount || 50)}.00</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Payment Modes Selection Options */}
            <div className="space-y-2.5">
              <label className="text-xs font-extrabold text-gray-700 block">Choose Payment Method:</label>
              
              {/* Option 1: Pay Online via Razorpay */}
              <div
                onClick={() => setSelectedMode('Online')}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3.5 ${
                  selectedMode === 'Online'
                    ? 'border-[#0a4d2c] bg-emerald-50/80 shadow-sm'
                    : 'border-gray-200 hover:border-emerald-300 bg-white'
                }`}
              >
                <div className={`p-2.5 rounded-xl ${selectedMode === 'Online' ? 'bg-[#0a4d2c] text-white' : 'bg-gray-100 text-gray-600'}`}>
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-xs sm:text-sm text-gray-900">Pay Online</h4>
                    <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 text-[10px] font-black rounded">
                      Razorpay
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium">Instant pay with UPI, GPay, PhonePe, Cards, Net Banking</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedMode === 'Online' ? 'border-[#0a4d2c] bg-[#0a4d2c]' : 'border-gray-300'}`}>
                  {selectedMode === 'Online' && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </div>
              </div>

              {/* Option 2: Pay Through Worker */}
              <div
                onClick={() => setSelectedMode('Pay Through Worker')}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3.5 ${
                  selectedMode === 'Pay Through Worker'
                    ? 'border-[#0a4d2c] bg-emerald-50/80 shadow-sm'
                    : 'border-gray-200 hover:border-emerald-300 bg-white'
                }`}
              >
                <div className={`p-2.5 rounded-xl ${selectedMode === 'Pay Through Worker' ? 'bg-[#0a4d2c] text-white' : 'bg-gray-100 text-gray-600'}`}>
                  <UserCheck className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-extrabold text-xs sm:text-sm text-gray-900">Pay Through Worker</h4>
                  <p className="text-[11px] text-gray-500 font-medium">
                    Handover cash (₹{(selectedPaymentForModal.amount || 50)}.00) directly to Haritha Karma Sena worker
                  </p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedMode === 'Pay Through Worker' ? 'border-[#0a4d2c] bg-[#0a4d2c]' : 'border-gray-300'}`}>
                  {selectedMode === 'Pay Through Worker' && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => { setIsModalOpen(false); setSelectedPaymentForModal(null); }}
                className="w-1/2 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={isSubmitting}
                className="w-1/2 py-3 bg-[#0a4d2c] hover:bg-emerald-900 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Pay ₹{(selectedPaymentForModal.amount || 50)}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OFFICIAL RECEIPT MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border-2 border-emerald-800/30 relative print:m-0 print:border-none print:shadow-none">
            {/* Header */}
            <div className="flex items-start justify-between border-b-2 border-emerald-700/20 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[#0a4d2c]">
                  <Leaf className="w-5 h-5 fill-emerald-600 text-emerald-600" />
                  <span className="text-xs font-black uppercase tracking-wider">Government of Kerala • LSGD</span>
                </div>
                <h3 className="text-xl font-black text-gray-900">Haritha Karma Sena User Fee</h3>
                <span className="text-[11px] font-bold text-gray-500 block">Official Electronic Payment Receipt</span>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold flex items-center justify-center transition-colors cursor-pointer print:hidden"
              >
                ✕
              </button>
            </div>

            {/* Receipt Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 text-xs">
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-bold block">Receipt No</span>
                <span className="font-extrabold text-[#0a4d2c] font-mono">{selectedReceipt.paymentId || `PAY-${selectedReceipt.year}${selectedReceipt.month}-${citizenId}`}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-bold block">Billing Period</span>
                <span className="font-extrabold text-gray-900">{MONTH_NAMES[selectedReceipt.month - 1]} {selectedReceipt.year}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-bold block">Citizen Name & ID</span>
                <span className="font-extrabold text-gray-900">{citizenName} ({citizenId})</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-bold block">Ward & House No</span>
                <span className="font-extrabold text-gray-900">{wardId} • #{houseNumber}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-bold block">Payment Mode</span>
                <span className="font-extrabold text-gray-900">{selectedReceipt.paymentMethod || 'Online'}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-bold block">Date of Payment</span>
                <span className="font-extrabold text-gray-900 font-mono">
                  {selectedReceipt.paidAt ? new Date(selectedReceipt.paidAt).toLocaleString('en-GB') : new Date().toLocaleDateString('en-GB')}
                </span>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-gray-100 font-bold text-gray-700">
                  <tr>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-2.5 px-3">
                      Doorstep Waste Collection Fee ({MONTH_NAMES[selectedReceipt.month - 1]} {selectedReceipt.year})
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold">₹{selectedReceipt.baseAmount || 50}.00</td>
                  </tr>
                  {(selectedReceipt.discountAmount > 0 || selectedReceipt.pointsRedeemed > 0 || selectedReceipt.amount === 40) && (
                    <tr className="bg-emerald-50/60 text-emerald-900">
                      <td className="py-2 px-3 font-semibold">
                        20% Eco-Points Green Discount (10 Points Redeemed)
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700">-₹10.00</td>
                    </tr>
                  )}
                  <tr className="bg-gray-50 font-black text-sm">
                    <td className="py-3 px-3 text-[#0a4d2c]">Total Paid (INR)</td>
                    <td className="py-3 px-3 text-right text-[#0a4d2c]">
                      ₹{selectedReceipt.amount || ((selectedReceipt.discountAmount > 0 || selectedReceipt.amount === 40) ? 40 : 50)}.00
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Transaction Reference */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-[11px] text-gray-600 space-y-1">
              <div className="flex items-center justify-between">
                <span>Transaction Ref / Order:</span>
                <span className="font-mono text-gray-800 font-bold truncate max-w-[200px]">
                  {selectedReceipt.razorpayPaymentId || selectedReceipt.transactionId || 'OFFICIAL-CASH-REC'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Status:</span>
                <span className="font-bold text-emerald-700">PAID & VERIFIED ✓</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2 print:hidden">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="w-1/2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="w-1/2 py-2.5 bg-[#0a4d2c] hover:bg-emerald-900 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyPaymentSection;
