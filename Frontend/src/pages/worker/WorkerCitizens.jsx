import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  MapPin,
  Phone,
  Mail,
  Home,
  Building2,
  Award,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Map as MapIcon,
  X,
  Compass,
  UserCheck,
  ShieldAlert,
  LocateFixed
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getAllCitizens, getCitizensByWard } from '../../services/citizenService';
import { getAllWorkers } from '../../services/workerService';

// Fix Leaflet default icon paths in React Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper component to center map on coordinates
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

export const WorkerCitizens = () => {
  const userObj = JSON.parse(localStorage.getItem('user') || '{}');
  const workerEmail = userObj.email || localStorage.getItem('userEmail') || '';

  const [loading, setLoading] = useState(true);
  const [workerInfo, setWorkerInfo] = useState(null);
  const [assignedWard, setAssignedWard] = useState('');
  const [citizens, setCitizens] = useState([]);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('ALL'); // ALL, WITH_MAP, NO_MAP

  // Map Modal State
  const [selectedCitizenMap, setSelectedCitizenMap] = useState(null);

  useEffect(() => {
    const fetchWorkerAndWardCitizens = async () => {
      setLoading(true);
      try {
        // 1. Fetch workers to find assigned ward for logged-in worker
        let ward = userObj.wardId || '';
        let currentWorker = null;

        try {
          const workers = await getAllWorkers();
          if (Array.isArray(workers)) {
            currentWorker = workers.find(
              (w) => w.email && w.email.toLowerCase() === workerEmail.toLowerCase()
            );
            if (currentWorker && currentWorker.wardId) {
              ward = currentWorker.wardId;
            }
          }
        } catch (e) {
          console.warn("Could not fetch worker profile list:", e);
        }

        setWorkerInfo(currentWorker);
        setAssignedWard(ward);

        // 2. Fetch Citizens by Ward or All Citizens filtered by Ward
        let wardCitizensList = [];
        try {
          if (ward) {
            wardCitizensList = await getCitizensByWard(ward);
          }
        } catch (err) {
          console.warn("Ward citizen fetch failed, falling back to all citizens:", err);
        }

        if (!Array.isArray(wardCitizensList) || wardCitizensList.length === 0) {
          const allCitizens = await getAllCitizens();
          if (Array.isArray(allCitizens)) {
            if (ward) {
              const cleanWard = ward.trim().toLowerCase();
              wardCitizensList = allCitizens.filter(
                (c) => c.wardId && c.wardId.trim().toLowerCase() === cleanWard
              );
            } else {
              wardCitizensList = allCitizens;
            }
          }
        }

        setCitizens(wardCitizensList || []);
      } catch (err) {
        console.error("Error loading ward citizens:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkerAndWardCitizens();
  }, [workerEmail]);

  // Filter citizens based on search query and location filter
  const filteredCitizens = citizens.filter((citizen) => {
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = (citizen.fullName || '').toLowerCase().includes(q);
    const houseNoMatch = (citizen.houseNumber || '').toLowerCase().includes(q);
    const houseNameMatch = (citizen.houseName || '').toLowerCase().includes(q);
    const addressMatch = (citizen.address || '').toLowerCase().includes(q);
    const phoneMatch = (citizen.phoneNumber || '').toLowerCase().includes(q);
    const emailMatch = (citizen.email || '').toLowerCase().includes(q);
    const idMatch = (citizen.citizenId || '').toLowerCase().includes(q);

    const matchesSearch = !q || nameMatch || houseNoMatch || houseNameMatch || addressMatch || phoneMatch || emailMatch || idMatch;

    const hasMap = Boolean(citizen.latitude && citizen.longitude && (citizen.latitude !== 0 || citizen.longitude !== 0));
    let matchesLocation = true;
    if (locationFilter === 'WITH_MAP') {
      matchesLocation = hasMap;
    } else if (locationFilter === 'NO_MAP') {
      matchesLocation = !hasMap;
    }

    return matchesSearch && matchesLocation;
  });

  // Calculate statistics
  const totalCount = citizens.length;
  const completedProfilesCount = citizens.filter((c) => c.profileCompleted || (c.address && c.houseNumber)).length;
  const mapPinCount = citizens.filter((c) => c.latitude && c.longitude && (c.latitude !== 0 || c.longitude !== 0)).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
        <p className="text-sm font-medium">Loading ward citizens list...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-[#0a4d2c] via-[#0f5b37] to-emerald-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
                <Users className="w-6 h-6 text-emerald-300" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Ward Citizens Directory</h1>
            </div>

            <p className="text-emerald-100 text-xs sm:text-sm mt-1">
              Registered citizens in your assigned collection ward: <span className="font-bold underline text-white">{assignedWard || 'All Assigned Wards'}</span>
            </p>
          </div>

          <div className="bg-white/10 border border-white/20 px-4 py-2 rounded-2xl text-xs text-emerald-100 flex items-center gap-3 shrink-0">
            <Award className="w-5 h-5 text-emerald-300" />
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-200 block">Assigned Ward</span>
              <span className="text-sm font-extrabold text-white">{assignedWard || 'Unassigned'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Total Citizens</span>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">{totalCount}</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-700">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Complete Profiles</span>
            <p className="text-2xl font-extrabold text-emerald-700 mt-1">{completedProfilesCount}</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-700">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">GPS Map Location Set</span>
            <p className="text-2xl font-extrabold text-emerald-700 mt-1">{mapPinCount}</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-700">
            <LocateFixed className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search & Filtering Control Panel */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-emerald-100 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="w-full sm:w-auto flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4 text-emerald-700" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Citizen Name, House Number (e.g. 12/345), House Name, Address, or Mobile..."
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all shadow-2xs"
          />
        </div>

        {/* Filter Dropdown */}
        <div className="w-full sm:w-auto flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 shrink-0">Filter:</span>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2.5 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
          >
            <option value="ALL">All Ward Citizens ({citizens.length})</option>
            <option value="WITH_MAP">With GPS Map Pin ({mapPinCount})</option>
            <option value="NO_MAP">Without GPS Map Pin ({citizens.length - mapPinCount})</option>
          </select>
        </div>
      </div>

      {/* Citizens Horizontally Scrollable Table View */}
      {filteredCitizens.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-emerald-100 shadow-2xs space-y-3">
          <ShieldAlert className="w-12 h-12 text-emerald-600 mx-auto opacity-40" />
          <h3 className="text-base font-bold text-gray-800">No Citizens Found</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            {searchQuery
              ? `No citizens match your search query "${searchQuery}" in ${assignedWard || 'assigned ward'}.`
              : `No registered citizens found under ${assignedWard || 'your assigned ward'}.`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-emerald-800 text-white text-[11px] font-extrabold uppercase tracking-wider divide-x divide-emerald-700/60">
                  <th className="py-3.5 px-4">Citizen Name & ID</th>
                  <th className="py-3.5 px-4">House Number</th>
                  <th className="py-3.5 px-4">House Name</th>
                  <th className="py-3.5 px-4">Address</th>
                  <th className="py-3.5 px-4">Mobile Number</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Profile</th>
                  <th className="py-3.5 px-4">GPS Location</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-800">
                {filteredCitizens.map((citizen, idx) => {
                  const hasCoords = Boolean(
                    citizen.latitude && citizen.longitude && (citizen.latitude !== 0 || citizen.longitude !== 0)
                  );
                  const isProfileComplete = Boolean(
                    citizen.profileCompleted || (citizen.address && citizen.houseNumber)
                  );

                  return (
                    <tr
                      key={citizen.id || citizen.citizenId || idx}
                      className="hover:bg-emerald-50/60 transition-colors divide-x divide-gray-100"
                    >
                      {/* 1. Citizen Name & ID */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-900 font-extrabold flex items-center justify-center shrink-0">
                            {citizen.fullName ? citizen.fullName[0].toUpperCase() : 'C'}
                          </div>
                          <div>
                            <p className="font-extrabold text-gray-900 text-xs sm:text-sm">{citizen.fullName || 'Citizen'}</p>
                            <p className="text-[10px] font-mono font-bold text-emerald-800 mt-0.5">
                              ID: {citizen.citizenId || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 2. House Number */}
                      <td className="py-3.5 px-4 font-extrabold text-gray-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Home className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{citizen.houseNumber || 'N/A'}</span>
                        </div>
                      </td>

                      {/* 3. House Name */}
                      <td className="py-3.5 px-4 font-semibold text-gray-800 max-w-[150px] truncate">
                        {citizen.houseName || 'N/A'}
                      </td>

                      {/* 4. Address */}
                      <td className="py-3.5 px-4 max-w-[220px]">
                        <p className="line-clamp-2 text-gray-700">{citizen.address || 'No address registered.'}</p>
                      </td>

                      {/* 5. Mobile Number */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {citizen.phoneNumber ? (
                          <a
                            href={`tel:${citizen.phoneNumber}`}
                            className="font-bold text-emerald-800 hover:underline flex items-center gap-1.5"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{citizen.phoneNumber}</span>
                          </a>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>

                      {/* 6. Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {citizen.status || 'Active'}
                        </span>
                      </td>

                      {/* 7. Profile */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            isProfileComplete
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {isProfileComplete ? 'Complete' : 'Incomplete'}
                        </span>
                      </td>

                      {/* 8. GPS Location */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {hasCoords ? (
                          <div className="font-mono text-[11px] font-bold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block">
                            Lat: {citizen.latitude.toFixed(4)}, Lng: {citizen.longitude.toFixed(4)}
                          </div>
                        ) : (
                          <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            No GPS Pin
                          </span>
                        )}
                      </td>

                      {/* 9. Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {hasCoords ? (
                          <button
                            type="button"
                            onClick={() => setSelectedCitizenMap(citizen)}
                            className="px-3 py-1.5 bg-[#0a4d2c] hover:bg-[#063820] text-white font-bold text-[11px] rounded-xl shadow-2xs hover:shadow transition-all inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <MapIcon className="w-3.5 h-3.5 text-emerald-300" />
                            <span>View House Map</span>
                          </button>
                        ) : (
                          <button
                            disabled
                            className="px-3 py-1.5 bg-gray-100 text-gray-400 font-semibold text-[11px] rounded-xl cursor-not-allowed inline-flex items-center gap-1"
                          >
                            <MapIcon className="w-3.5 h-3.5" />
                            <span>No Map Pin</span>
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
      )}

      {/* Leaflet House Location Map Modal */}
      {selectedCitizenMap && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 relative border border-emerald-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 rounded-2xl text-emerald-800">
                  <MapIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">
                    House Location Pin - {selectedCitizenMap.fullName}
                  </h3>
                  <p className="text-xs text-gray-500">
                    House No: <span className="font-bold text-gray-800">{selectedCitizenMap.houseNumber || 'N/A'}</span> • Ward: <span className="font-bold text-gray-800">{selectedCitizenMap.wardId || assignedWard}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCitizenMap(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Address & Coordinates Info */}
            <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100 text-xs space-y-1.5">
              <p className="font-semibold text-gray-800 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>{selectedCitizenMap.address || 'Location Pin Details'}</span>
              </p>
              <div className="flex items-center gap-4 text-[11px] font-mono font-bold text-emerald-900 pt-1">
                <span>Lat: {selectedCitizenMap.latitude ? selectedCitizenMap.latitude.toFixed(6) : '0.000000'}</span>
                <span>Lng: {selectedCitizenMap.longitude ? selectedCitizenMap.longitude.toFixed(6) : '0.000000'}</span>
              </div>
            </div>

            {/* Leaflet Map Display */}
            <div className="h-[320px] w-full rounded-2xl overflow-hidden border border-emerald-200 shadow-inner relative z-0">
              <MapContainer
                center={[selectedCitizenMap.latitude, selectedCitizenMap.longitude]}
                zoom={16}
                scrollWheelZoom={true}
                className="h-full w-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <ChangeView center={[selectedCitizenMap.latitude, selectedCitizenMap.longitude]} zoom={16} />
                <Marker position={[selectedCitizenMap.latitude, selectedCitizenMap.longitude]}>
                  <Popup>
                    <div className="p-1 text-xs">
                      <p className="font-bold text-emerald-900">{selectedCitizenMap.fullName}</p>
                      <p className="text-gray-600 mt-0.5">House No: {selectedCitizenMap.houseNumber || 'N/A'}</p>
                      <p className="text-[10px] text-gray-400 truncate max-w-[180px]">{selectedCitizenMap.address}</p>
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-between border-t border-gray-100">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedCitizenMap.latitude},${selectedCitizenMap.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1.5"
              >
                <Compass className="w-4 h-4 text-emerald-600" />
                <span>Open in Google Maps Navigation</span>
              </a>

              <button
                type="button"
                onClick={() => setSelectedCitizenMap(null)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Close Map
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default WorkerCitizens;
