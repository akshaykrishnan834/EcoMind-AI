import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  DollarSign,
  UserCheck,
  Smartphone,
  Landmark,
  Check,
  History,
  Receipt,
  Sparkles,
  ArrowRight,
  Printer,
  ShieldAlert
} from 'lucide-react';
import {
  getCitizenPayments,
  createRazorpayOrder,
  verifyRazorpayPayment,
  processWorkerPayment
} from '../services/paymentService';

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
  const [successMessage, setSuccessMessage] = useState('');

  const userObj = JSON.parse(localStorage.getItem('user') || '{}');
  const citizenId = citizenData?.citizenId || citizenData?.id || citizenData?._id || userObj.citizenId || 'CIT001';
  const citizenName = citizenData?.fullName || userObj.fullName || 'Citizen';
  const houseNumber = citizenData?.houseNumber || userObj.houseNumber || 'N/A';
  const wardId = citizenData?.wardId || userObj.wardId || 'Ward 1';

  const loadPayments = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getCitizenPayments(citizenId);
      setPayments(data || []);
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
    setSelectedPaymentForModal(paymentTarget);
    setIsModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedPaymentForModal) return;

    setIsSubmitting(true);
    setError('');
    try {
      const targetMonthName = MONTH_NAMES[selectedPaymentForModal.month - 1];

      if (selectedMode === 'Online') {
        // Step 1: Load Razorpay Checkout SDK
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          setError('Razorpay SDK failed to load. Please check your internet connection.');
          setIsSubmitting(false);
          return;
        }

        // Step 2: Create Razorpay Order from backend
        const orderData = await createRazorpayOrder({
          citizenId,
          month: selectedPaymentForModal.month,
          year: selectedPaymentForModal.year
        });

        // Step 3: Launch Razorpay Checkout Modal with Order ID
        const options = {
          key: orderData.keyId,
          amount: orderData.amount, // in paise
          currency: orderData.currency || 'INR',
          name: 'Haritha Karma Sena',
          description: `User Fee (${targetMonthName} ${selectedPaymentForModal.year})`,
          order_id: orderData.razorpayOrderId,
          handler: async function (response) {
            setIsSubmitting(true);
            try {
              // Step 4: Verify HMAC Signature on ASP.NET Core backend before marking as Paid
              const verifyResult = await verifyRazorpayPayment({
                citizenId,
                month: selectedPaymentForModal.month,
                year: selectedPaymentForModal.year,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              });

              if (verifyResult.success) {
                setSuccessMessage(`Payment successful & verified! Haritha Karma Sena fee for ${targetMonthName} ${selectedPaymentForModal.year} marked as Paid.`);
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
        // Pay Through Worker Option
        await processWorkerPayment({
          citizenId,
          month: selectedPaymentForModal.month,
          year: selectedPaymentForModal.year
        });

        setSuccessMessage(`Handover confirmed! Haritha Karma Sena fee for ${targetMonthName} ${selectedPaymentForModal.year} marked as Paid (Worker Collection).`);
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
            Monthly Fee Payment
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 font-medium max-w-xl">
            Mandatory monthly user fee payment of ₹50 for doorstep waste collection in {wardId}.
          </p>
        </div>

        <button
          onClick={loadPayments}
          disabled={loading}
          className="px-4 py-2.5 bg-emerald-900/80 hover:bg-emerald-950 border border-emerald-400/40 text-emerald-200 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 self-start md:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </button>
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
              Total Due: ₹{pendingDues.length * 50}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {pendingDues.map((p) => {
              const mName = MONTH_NAMES[p.month - 1];
              return (
                <div key={`${p.year}-${p.month}`} className="bg-white rounded-2xl p-5 border-2 border-rose-200 shadow-sm space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Previous Month</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 border border-rose-300 text-rose-800">
                        Pending Due
                      </span>
                    </div>
                    <h4 className="text-lg font-black text-gray-900">{mName} {p.year}</h4>
                    <p className="text-xs font-black text-[#0a4d2c]">Haritha Karma Sena Fee: ₹{p.amount || 50}</p>
                  </div>

                  <button
                    onClick={() => handleOpenPayModal(p)}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4 text-white" />
                    <span>Pay Now ₹{p.amount || 50}</span>
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

        {/* Fee Display & Pay Action */}
        <div className="bg-[#f2faf5] rounded-2xl p-6 border-2 border-emerald-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
              Service Fee Breakdown
            </span>
            <div className="text-2xl sm:text-3xl font-black text-[#0a4d2c] tracking-tight">
              Monthly Haritha Karma Sena Fee: ₹50
            </div>
            <p className="text-xs text-gray-600 font-medium max-w-lg">
              Official doorstep non-biodegradable waste collection user fee prescribed by Local Self Government Dept (LSGD).
            </p>
          </div>

          <div className="shrink-0 flex flex-col items-stretch sm:items-end gap-2">
            {isCurrentPaid ? (
              <div className="space-y-1 text-right">
                <div className="px-6 py-3 bg-[#0a4d2c] text-white rounded-2xl font-black text-sm shadow-md flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                  <span>Paid • ₹50</span>
                </div>
                <p className="text-[11px] text-emerald-800 font-semibold text-center sm:text-right">
                  Method: {currentPayment.paymentMethod || 'Online'} {currentPayment.paidAt ? `on ${new Date(currentPayment.paidAt).toLocaleDateString('en-GB')}` : ''}
                </p>
              </div>
            ) : (
              <button
                onClick={() => handleOpenPayModal(currentPayment)}
                className="px-8 py-3.5 bg-[#0a4d2c] hover:bg-emerald-900 text-white font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
              >
                <CreditCard className="w-5 h-5 text-emerald-300" />
                <span>PAY ₹50</span>
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
              <p className="text-xs text-gray-500 font-medium">All monthly user fee records and Razorpay payment receipts</p>
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
                <th className="py-3 px-4 font-extrabold">Monthly Fee</th>
                <th className="py-3 px-4 font-extrabold">Status</th>
                <th className="py-3 px-4 font-extrabold">Payment Method</th>
                <th className="py-3 px-4 font-extrabold">Date Paid</th>
                <th className="py-3 px-4 font-extrabold">Razorpay / Txn ID</th>
                <th className="py-3 px-4 font-extrabold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
              {payments.map((p) => {
                const monthName = MONTH_NAMES[p.month - 1] || `Month ${p.month}`;
                const isPaid = (p.status || '').toLowerCase() === 'paid';
                const isPast = p.year < currentYearNum || (p.year === currentYearNum && p.month < currentMonthNum);

                return (
                  <tr key={`${p.year}-${p.month}`} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="py-3 px-4 font-extrabold text-[#0a4d2c]">
                      {monthName} {p.year}
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-900">
                      ₹{p.amount || 50}
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
                    <td className="py-3 px-4">
                      {!isPaid && (
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

      {/* PAYMENT SELECTION MODAL */}
      {isModalOpen && selectedPaymentForModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border-2 border-emerald-800/30 relative">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-800 block">
                  Select Payment Option
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

            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 text-center">
              <span className="text-xs text-gray-500 font-bold uppercase block">Amount Payable</span>
              <span className="text-3xl font-black text-[#0a4d2c]">₹ {selectedPaymentForModal.amount || 50}.00</span>
              <span className="text-[11px] text-emerald-800 font-semibold block mt-0.5">Haritha Karma Sena Monthly User Fee</span>
            </div>

            {/* Payment Modes Selection Options */}
            <div className="space-y-3">
              <label className="text-xs font-extrabold text-gray-700 block">Choose Payment Method:</label>
              
              {/* Option 1: Pay Online via Razorpay */}
              <div
                onClick={() => setSelectedMode('Online')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                  selectedMode === 'Online'
                    ? 'border-[#0a4d2c] bg-emerald-50/80 shadow-sm'
                    : 'border-gray-200 hover:border-emerald-300 bg-white'
                }`}
              >
                <div className={`p-3 rounded-xl ${selectedMode === 'Online' ? 'bg-[#0a4d2c] text-white' : 'bg-gray-100 text-gray-600'}`}>
                  <Smartphone className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-sm text-gray-900">Pay Online</h4>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-black rounded-md">
                      Razorpay Secured
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium">Instant payment via UPI, Credit/Debit Card, Net Banking</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedMode === 'Online' ? 'border-[#0a4d2c] bg-[#0a4d2c]' : 'border-gray-300'}`}>
                  {selectedMode === 'Online' && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </div>
              </div>

              {/* Option 2: Pay Through Worker */}
              <div
                onClick={() => setSelectedMode('Pay Through Worker')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                  selectedMode === 'Pay Through Worker'
                    ? 'border-[#0a4d2c] bg-emerald-50/80 shadow-sm'
                    : 'border-gray-200 hover:border-emerald-300 bg-white'
                }`}
              >
                <div className={`p-3 rounded-xl ${selectedMode === 'Pay Through Worker' ? 'bg-[#0a4d2c] text-white' : 'bg-gray-100 text-gray-600'}`}>
                  <UserCheck className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-extrabold text-sm text-gray-900">Pay Through Worker</h4>
                  <p className="text-xs text-gray-500 font-medium">Handover ₹50 cash directly to Haritha Karma Sena field worker</p>
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
                    <span>{selectedMode === 'Online' ? 'Proceed to Razorpay' : 'Confirm Cash Pay'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyPaymentSection;
