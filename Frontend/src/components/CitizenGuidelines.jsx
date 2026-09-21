import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  Calendar,
  CreditCard,
  Phone,
  Mail,
  HelpCircle,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Package,
  Layers,
  Info,
  ChevronDown,
  ArrowRight,
  ExternalLink,
  Check
} from 'lucide-react';

const CitizenGuidelines = ({ citizenData, assignedWorker, setActiveTab }) => {
  const [activeCategory, setActiveCategory] = useState('all');

  const userObj = JSON.parse(localStorage.getItem('user') || '{}');
  const wardId = citizenData?.wardId || userObj.wardId || 'Ward 1';
  const panchayatName = citizenData?.panchayatName || userObj.panchayatName || 'Chirakkadavu';

  const workerName = assignedWorker?.fullName || 'Haritha Karma Sena Unit In-charge';
  const workerPhone = assignedWorker?.phoneNumber || '+91 98470 12345';

  const categories = [
    { id: 'all', label: 'All Guidelines' },
    { id: 'rules', label: 'HKS Collection Rules' },
    { id: 'eligible', label: 'Eligible Plastic' },
    { id: 'dates', label: 'Collection Dates' },
    { id: 'payment', label: 'Payment Info' },
    { id: 'contact', label: 'Contact & Support' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#0a4d2c] via-[#0f5b37] to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-emerald-200 text-xs font-semibold mb-2">
              <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
              <span>Haritha Karma Sena Citizen Resource Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Help & Guidelines
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium mt-1 max-w-xl">
              Official protocols for dry plastic segregation, monthly collection drive dates, user fee structure, and municipal helpline for{' '}
              <span className="font-extrabold text-white underline">{panchayatName}</span>.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3.5 py-1.5 bg-white/15 border border-white/20 text-white rounded-xl text-xs font-extrabold">
              LSGD Kerala Approved
            </span>
          </div>
        </div>
      </div>

      {/* Category Navigation Pills */}
      <div className="flex flex-wrap gap-2 bg-white p-3 rounded-2xl border border-emerald-100 shadow-2xs">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeCategory === cat.id
                ? 'bg-[#0a4d2c] text-white shadow-xs'
                : 'bg-emerald-50/50 hover:bg-emerald-100 text-gray-700'
              }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* SECTION 1: HKS COLLECTION RULES */}
      {(activeCategory === 'all' || activeCategory === 'rules') && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-emerald-100/80 space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-4 text-[#0a4d2c]">
            <ShieldCheck className="w-5 h-5 text-[#0a4d2c]" />
            <h2 className="text-lg font-extrabold text-gray-900">
              Haritha Karma Sena Collection Rules & Protocols
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 font-extrabold text-[#0a4d2c]">
                <span className="w-6 h-6 rounded-full bg-[#0a4d2c] text-white flex items-center justify-center text-xs">1</span>
                <span>Clean & Rinse Protocol</span>
              </div>
              <p className="text-gray-600 leading-relaxed pl-8">
                All plastic items containing liquids or food (milk pouches, oil packets, curd containers, soft drink bottles) must be cut open, rinsed with clean water, and dried. Contaminated plastic cannot be processed at the Material Collection Facility (MCF).
              </p>
            </div>

            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 font-extrabold text-[#0a4d2c]">
                <span className="w-6 h-6 rounded-full bg-[#0a4d2c] text-white flex items-center justify-center text-xs">2</span>
                <span>Monthly Limit (1 Pickup per Month)</span>
              </div>
              <p className="text-gray-600 leading-relaxed pl-8">
                Each registered household can submit <strong>one</strong> plastic waste pickup request per calendar month. Requests can be placed anytime before the collection drive window.
              </p>
            </div>

            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 font-extrabold text-[#0a4d2c]">
                <span className="w-6 h-6 rounded-full bg-[#0a4d2c] text-white flex items-center justify-center text-xs">3</span>
                <span>4-Digit Pickup Verification Code</span>
              </div>
              <p className="text-gray-600 leading-relaxed pl-8">
                When the Haritha Karma Sena worker arrives at your door, share your system-generated 4-digit pickup verification code with the worker. The worker will enter the code to verify the collection. Once the code is successfully verified, your pickup will be marked as completed and the collection record will be updated automatically.
              </p>
            </div>

            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 font-extrabold text-[#0a4d2c]">
                <span className="w-6 h-6 rounded-full bg-[#0a4d2c] text-white flex items-center justify-center text-xs">4</span>
                <span>Proper Storage & Packaging</span>
              </div>
              <p className="text-gray-600 leading-relaxed pl-8">
                Store cleaned plastic in dry, reusable gunny bags or sacks and keep them easily accessible near the gate or entryway on the confirmed collection date. If you are not at home, please ensure the plastic is safely placed at the designated collection point and accessible to the Haritha Karma Sena worker.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: ELIGIBLE PLASTIC (ACCEPTED VS REJECTED) */}
      {(activeCategory === 'all' || activeCategory === 'eligible') && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-emerald-100/80 space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-4 text-[#0a4d2c]">
            <Package className="w-5 h-5 text-[#0a4d2c]" />
            <h2 className="text-lg font-extrabold text-gray-900">
              Eligible Plastic vs Ineligible Waste
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Accepted Items Card */}
            <div className="p-5 bg-emerald-50/50 border-2 border-emerald-300 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-[#0a4d2c] pb-2 border-b border-emerald-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-extrabold">Eligible / Accepted Items (Clean & Dry)</h3>
              </div>

              <ul className="space-y-2 text-xs text-gray-700">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                  <span><strong>PET Bottles:</strong> Water, soft drinks, fruit juice, sanitizers (crushed & dry).</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                  <span><strong>Milk & Curd Covers:</strong> Cleaned, thoroughly rinsed with water, and air-dried.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                  <span><strong>Hard Plastics:</strong> Buckets, mugs, plastic basins, chairs, toys, crates.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                  <span><strong>HDPE / Containers:</strong> Shampoo, detergent, cooking oil pouches (thoroughly drained).</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                  <span><strong>Plastic Carry Bags:</strong> Clean grocery bags, shopping covers, bubble wrap.</span>
                </li>
              </ul>
            </div>

            {/* Ineligible Items Card */}
            <div className="p-5 bg-rose-50/50 border-2 border-rose-300 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-rose-800 pb-2 border-b border-rose-200">
                <XCircle className="w-5 h-5 text-rose-600" />
                <h3 className="text-sm font-extrabold">Ineligible / Prohibited Waste</h3>
              </div>

              <ul className="space-y-2 text-xs text-gray-700">
                <li className="flex items-start gap-2">
                  <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                  <span><strong>Food-Contaminated Plastic:</strong> Oily food wraps, unwashed biryani boxes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                  <span><strong>Medical & Clinical Waste:</strong> Syringes, medicine blister strips, IV bottles.</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                  <span><strong>Sanitary Waste:</strong> Diapers, sanitary napkins (must use incinerator/burial).</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                  <span><strong>Thermocol / Styrofoam:</strong> Handled separately during scheduled special drives.</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                  <span><strong>Wet Organic Waste:</strong> Vegetables, kitchen scraps, yard waste.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: COLLECTION DATES & TIMELINE */}
      {(activeCategory === 'all' || activeCategory === 'dates') && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-emerald-100/80 space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-4 text-[#0a4d2c]">
            <Calendar className="w-5 h-5 text-[#0a4d2c]" />
            <h2 className="text-lg font-extrabold text-gray-900">
              Monthly Collection Calendar & Schedule
            </h2>
          </div>

          <div className="p-4 bg-emerald-50/90 border border-emerald-300 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#0a4d2c] text-white rounded-xl shrink-0">
                <Calendar className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0a4d2c] block">
                  Designated Monthly Window
                </span>
                <span className="text-base font-extrabold text-[#0a4d2c]">
                  15th to 25th of Every Month
                </span>
              </div>
            </div>
            <span className="px-3.5 py-1.5 bg-[#0a4d2c] text-white text-xs font-bold rounded-xl shrink-0">
              Active in {wardId}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 border border-gray-200 rounded-2xl space-y-1 bg-gray-50/50">
              <span className="text-[10px] uppercase font-bold text-gray-500">Phase 1 (1st – 14th)</span>
              <h4 className="font-extrabold text-gray-900">Citizen Request Period</h4>
              <p className="text-gray-600 text-[11px] leading-relaxed">
                Citizens submit their monthly plastic pickup request via the EcoMind AI portal and clean recyclable plastic.
              </p>
            </div>

            <div className="p-4 border border-emerald-300 rounded-2xl space-y-1 bg-emerald-50/60">
              <span className="text-[10px] uppercase font-bold text-emerald-700">Phase 2 (15th – 25th)</span>
              <h4 className="font-extrabold text-[#0a4d2c]">Doorstep Collection Drive</h4>
              <p className="text-gray-600 text-[11px] leading-relaxed">
                Haritha Karma Sena workers conduct door-to-door waste pickups, verify codes, and update collection cards.
              </p>
            </div>

            <div className="p-4 border border-gray-200 rounded-2xl space-y-1 bg-gray-50/50">
              <span className="text-[10px] uppercase font-bold text-gray-500">Phase 3 (26th – End)</span>
              <h4 className="font-extrabold text-gray-900">MCF Sorting & Recycling</h4>
              <p className="text-gray-600 text-[11px] leading-relaxed">
                Collected plastics are baled at the Panchayat Material Collection Facility and transferred to Clean Kerala Company.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: PAYMENT INFORMATION */}
      {(activeCategory === 'all' || activeCategory === 'payment') && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-emerald-100/80 space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-4 text-[#0a4d2c]">
            <CreditCard className="w-5 h-5 text-[#0a4d2c]" />
            <h2 className="text-lg font-extrabold text-gray-900">
              User Fee Structure & Payment Guidelines
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 text-xs">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                <span className="font-extrabold text-[#0a4d2c] text-sm block">
                  Kerala LSGD Mandated Monthly User Fee
                </span>
                <p className="text-gray-600 leading-relaxed">
                  As per Government of Kerala Local Self Government Department (LSGD) notifications, households are required to pay a monthly user fee of <strong>₹50 to ₹70</strong>.
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <span className="px-2.5 py-1 bg-emerald-700 text-white font-extrabold rounded-lg text-xs">
                    ₹50 / Month (Households)
                  </span>
                  <span className="px-2.5 py-1 bg-white border border-emerald-300 text-[#0a4d2c] font-bold rounded-lg text-xs">
                    ₹100+ (Commercial)
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-gray-500 leading-relaxed">
                User fee payments directly support the Haritha Karma Sena members' remuneration and maintain local waste sorting machinery.
              </p>
            </div>

            <div className="p-4 border border-emerald-200 bg-white rounded-2xl space-y-3 text-xs shadow-2xs">
              <h4 className="font-extrabold text-gray-900">Accepted Payment Modes</h4>

              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Online via EcoMind AI Portal:</strong> Instant payment using UPI, GPay, PhonePe, Debit/Credit Card, or Net Banking.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Cash on Collection:</strong> Pay directly to authorized Haritha Karma Sena members upon waste collection.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Digital Receipts:</strong> An official digital LSGD receipt is automatically generated and available under "Collection Records".</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setActiveTab && setActiveTab('Monthly Payments')}
                  className="w-full py-2.5 bg-[#0a4d2c] hover:bg-emerald-800 text-white font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <CreditCard className="w-4 h-4 text-emerald-300" />
                  <span>Go to Monthly Payments</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: CONTACT & SUPPORT */}
      {(activeCategory === 'all' || activeCategory === 'contact') && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-emerald-100/80 space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-4 text-[#0a4d2c]">
            <Phone className="w-5 h-5 text-[#0a4d2c]" />
            <h2 className="text-lg font-extrabold text-gray-900">
              Ward Support & Official Helplines
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Assigned Worker Contact */}
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-2">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Assigned Ward Team</span>
              <h4 className="text-sm font-extrabold text-gray-900">{workerName}</h4>
              <p className="text-gray-500">In-charge for Doorstep Plastic Waste Collection in {wardId}</p>
              <div className="pt-1">
                <a
                  href={`tel:${workerPhone}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0a4d2c] text-white font-extrabold rounded-xl hover:bg-emerald-800 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call {workerPhone}</span>
                </a>
              </div>
            </div>

            {/* Panchayat Office Contact */}
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-2">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Local Body Headquarters</span>
              <h4 className="text-sm font-extrabold text-gray-900">{panchayatName} Grama Panchayat</h4>
              <p className="text-gray-500">Ponkunnam, Kottayam District, Kerala - 686506</p>
              <div className="pt-1 flex flex-wrap gap-2">
                <a
                  href="tel:04828221376"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-300 text-[#0a4d2c] font-extrabold rounded-xl hover:bg-emerald-50"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>04828-221376</span>
                </a>
                <a
                  href="mailto:chirakkadavugpktm@gmail.com"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-300 text-[#0a4d2c] font-extrabold rounded-xl hover:bg-emerald-50"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email Panchayat</span>
                </a>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-600 flex items-center justify-between">
            <span>Haritha Keralam Mission State Toll-Free Support:</span>
            <span className="font-extrabold text-[#0a4d2c]">1800-425-1044</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitizenGuidelines;
