import React from 'react';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Building2,
  CheckCircle2,
  MapPin,
  BadgeCheck,
  Edit3,
  Award,
  Hash,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';

const WorkerProfile = ({
  profile = {},
  wardDetails = null,
  onOpenEditModal = () => {},
}) => {
  const workerId = profile.email ? `HKS-${profile.email.split('@')[0].toUpperCase()}` : 'HKS-W01';
  const panchayatName = wardDetails?.panchayatName || 'Chirakkadavu';
  const wardName = wardDetails?.wardName ? `${wardDetails.wardName} (${wardDetails.wardId})` : profile.wardId || 'Ward 1';

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      {/* Glassmorphic Profile Banner */}
      <div className="bg-gradient-to-r from-[#0a4d2c] via-[#0f5b37] to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white/10 border-4 border-white/20 flex items-center justify-center text-3xl font-extrabold shadow-inner shrink-0 backdrop-blur-md text-emerald-200">
              {profile.fullName && profile.fullName[0] ? profile.fullName[0].toUpperCase() : <User className="w-12 h-12" />}
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold">
                <BadgeCheck className="w-4 h-4 text-emerald-300" />
                <span>Haritha Karma Sena Field Worker</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {profile.fullName || 'Worker'}
              </h1>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm text-emerald-100/90 font-medium">
                <span>Panchayat: <strong className="text-white font-bold">{panchayatName}</strong></span>
                <span>•</span>
                <span>Assigned Ward: <strong className="text-white font-bold underline">{wardName}</strong></span>
              </div>

              <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <span className="inline-flex items-center gap-1.5 text-xs bg-white/15 px-3 py-1 rounded-full text-emerald-100 font-semibold border border-white/20">
                  <Hash className="w-3.5 h-3.5 text-emerald-300" /> Worker ID: {workerId}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-500/20 px-3 py-1 rounded-full text-emerald-200 font-semibold border border-emerald-400/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> Active Service Status
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenEditModal}
            className="py-3 px-6 bg-white text-[#0a4d2c] hover:bg-emerald-50 font-extrabold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Profile Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal & Identification Details */}
        <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-[#0a4d2c]">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-gray-900">Personal & Contact Info</h2>
                <p className="text-xs text-gray-500">Official field worker profile details</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenEditModal}
              className="text-xs font-bold text-[#0a4d2c] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </button>
          </div>

          <div className="space-y-3 pt-1">
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Worker Name</label>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">{profile.fullName || 'N/A'}</p>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Worker Identification ID</label>
              <div className="flex items-center gap-2 mt-0.5">
                <Hash className="w-4 h-4 text-emerald-600 shrink-0" />
                <p className="text-sm font-bold text-emerald-900 font-mono">{workerId}</p>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Phone / Mobile Number</label>
              <div className="flex items-center gap-2 mt-0.5">
                <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                <p className="text-sm font-bold text-[#0a4d2c]">{profile.phone || 'N/A'}</p>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Official Email Address</label>
              <div className="flex items-center gap-2 mt-0.5">
                <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                <p className="text-sm font-semibold text-gray-800">{profile.email || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Panchayat, Ward & Duty Scope */}
        <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-[#0a4d2c]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-gray-900">Jurisdiction & Deployment</h2>
              <p className="text-xs text-gray-500">Government service assignment</p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Assigned Panchayat</label>
              <div className="flex items-center gap-2 mt-0.5">
                <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <p className="text-sm font-bold text-gray-900">{panchayatName} Grama Panchayat</p>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Assigned Ward</label>
              <div className="flex items-center gap-2 mt-0.5">
                <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                <p className="text-sm font-bold text-emerald-950">{wardName}</p>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Boundary Delimitation</label>
              <div className="flex items-center gap-2 mt-0.5">
                <Layers className="w-4 h-4 text-emerald-600 shrink-0" />
                <p className="text-xs font-semibold text-gray-700">
                  {wardDetails?.boundary?.length
                    ? `Official Polygon Active (${wardDetails.boundary.length} GPS Coordinates)`
                    : 'Digital Boundary Mapping Synchronized'}
                </p>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Department / Unit</label>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">
                Local Self Government Department (LSGD), Govt. of Kerala
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerProfile;
