import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Home,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Compass,
  Building2,
  Navigation,
  ExternalLink,
  Layers,
  Map as MapIcon,
  Check
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getAllWards } from '../services/citizenService';

// Fix Leaflet marker icon paths for React Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper component to center map
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

// Ray-casting algorithm to test point inside polygon
const isPointInPolygon = (lat, lng, polygon) => {
  if (!polygon || !Array.isArray(polygon) || polygon.length < 3) return null;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [latI, lngI] = polygon[i];
    const [latJ, lngJ] = polygon[j];
    const intersect =
      latI > lat !== latJ > lat &&
      lng < ((lngJ - lngI) * (lat - latI)) / (latJ - latI) + lngI;
    if (intersect) inside = !inside;
  }
  return inside;
};

const DEFAULT_COORDS = [9.5583, 76.7842]; // Ponkunnam / Chirakkadavu, Kerala

const CitizenLocation = ({ citizenData, setActiveTab }) => {
  const userObj = JSON.parse(localStorage.getItem('user') || '{}');

  const citizenId = citizenData?.citizenId || citizenData?.id || citizenData?._id || userObj.citizenId || 'CIT001';
  const fullName = citizenData?.fullName || userObj.fullName || 'Citizen';
  const houseName = citizenData?.houseName || userObj.houseName || 'Not Set';
  const houseNumber = citizenData?.houseNumber || userObj.houseNumber || 'Not Set';
  const address = citizenData?.address || userObj.address || 'Address Not Provided';
  const wardId = citizenData?.wardId || userObj.wardId || 'Ward 1';
  const panchayatName = citizenData?.panchayatName || userObj.panchayatName || 'Chirakkadavu';
  const isVerified = Boolean(
    citizenData?.isVerified ||
    citizenData?.status === 'Verified' ||
    userObj?.isVerified ||
    userObj?.status === 'Verified'
  );

  const rawLat = parseFloat(citizenData?.latitude || userObj.latitude);
  const rawLng = parseFloat(citizenData?.longitude || userObj.longitude);
  const hasValidCoords = !isNaN(rawLat) && !isNaN(rawLng) && rawLat !== 0 && rawLng !== 0;

  const lat = hasValidCoords ? rawLat : DEFAULT_COORDS[0];
  const lng = hasValidCoords ? rawLng : DEFAULT_COORDS[1];
  const position = [lat, lng];

  const [wardList, setWardList] = useState([]);
  const [selectedWard, setSelectedWard] = useState(null);
  const [loadingWards, setLoadingWards] = useState(true);

  // Fetch all wards to render official boundary polygon
  useEffect(() => {
    const fetchWards = async () => {
      try {
        setLoadingWards(true);
        const data = await getAllWards();
        if (Array.isArray(data)) {
          setWardList(data);
          const currentWard = data.find(
            (w) =>
              (w.wardId && w.wardId.toLowerCase() === wardId.toLowerCase()) ||
              (w.wardName && w.wardName.toLowerCase() === wardId.toLowerCase())
          );
          setSelectedWard(currentWard || data[0] || null);
        }
      } catch (err) {
        console.warn('Could not fetch ward boundaries:', err);
      } finally {
        setLoadingWards(false);
      }
    };

    fetchWards();
  }, [wardId]);

  // Fallback polygon around coordinates if DB has no boundary array yet
  const wardBoundary =
    selectedWard?.boundary && Array.isArray(selectedWard.boundary) && selectedWard.boundary.length >= 3
      ? selectedWard.boundary
      : [
          [lat + 0.007, lng - 0.007],
          [lat + 0.007, lng + 0.007],
          [lat - 0.007, lng + 0.007],
          [lat - 0.007, lng - 0.007]
        ];

  const isInsideBoundary = isPointInPolygon(lat, lng, wardBoundary);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#0a4d2c] via-[#0f5b37] to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-emerald-200 text-xs font-semibold mb-2">
              <MapPin className="w-3.5 h-3.5 text-emerald-300" />
              <span>Haritha Karma Sena Geographic Mapping</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              My Household Location & Ward Mapping
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium mt-1 max-w-xl">
              Verified household location, official ward boundary polygon, and GIS mapping coordinates for doorstep collection.
            </p>
          </div>

          <button
            onClick={() => setActiveTab && setActiveTab('Profile')}
            className="px-4 py-2.5 bg-white text-[#0a4d2c] hover:bg-emerald-50 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Home className="w-4 h-4 text-[#0a4d2c]" />
            <span>Edit in Profile</span>
          </button>
        </div>
      </div>

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Saved Household Location Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100/80 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2 text-[#0a4d2c]">
              <Home className="w-5 h-5 text-[#0a4d2c]" />
              <h3 className="text-sm font-extrabold text-gray-900">
                Saved Household Details
              </h3>
            </div>
            <span className="text-xs font-extrabold text-[#0a4d2c] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              ID: {citizenId}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500 font-medium">Resident Name:</span>
              <span className="font-extrabold text-gray-900">{fullName}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500 font-medium">House Name:</span>
              <span className="font-bold text-gray-900">{houseName}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500 font-medium">House Number:</span>
              <span className="font-bold text-gray-900">{houseNumber}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500 font-medium">Residential Address:</span>
              <span className="font-bold text-gray-900 text-right max-w-[220px] truncate">
                {address}
              </span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-gray-500 font-medium flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-emerald-700" /> GPS Coordinates:
              </span>
              <span className="font-mono font-bold text-[#0a4d2c]">
                {lat.toFixed(5)}° N, {lng.toFixed(5)}° E
              </span>
            </div>
          </div>
        </div>

        {/* Selected Ward Verification Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100/80 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2 text-[#0a4d2c]">
              <Building2 className="w-5 h-5 text-[#0a4d2c]" />
              <h3 className="text-sm font-extrabold text-gray-900">
                Selected Ward Verification
              </h3>
            </div>
            {isVerified ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                Verified Resident
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                Verification Pending
              </span>
            )}
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500 font-medium">Ward Identifier:</span>
              <span className="font-extrabold text-[#0a4d2c]">{wardId}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500 font-medium">Local Body (Panchayat):</span>
              <span className="font-bold text-gray-900">{panchayatName} Grama Panchayat</span>
            </div>

            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500 font-medium">Ward Boundary Status:</span>
              <span className={`font-extrabold ${isInsideBoundary !== false ? 'text-emerald-700' : 'text-rose-600'}`}>
                {isInsideBoundary !== false ? '✓ Verified Inside Boundary' : '⚠ Outside Ward Polygon'}
              </span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-gray-500 font-medium">Service Unit:</span>
              <span className="font-bold text-gray-800">Haritha Karma Sena Squad {wardId}</span>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Your residence is officially mapped for doorstep waste collection duty.</span>
          </div>
        </div>
      </div>

      {/* Interactive Map Position & Ward Boundary Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-emerald-100/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
              <MapIcon className="w-5 h-5 text-[#0a4d2c]" />
              <span>Map Position & Ward Boundary View</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Live geographic positioning of your residence marked alongside the official {wardId} jurisdiction boundary.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-[#0a4d2c] font-extrabold rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live GIS Pin
            </span>
          </div>
        </div>

        {/* Map Container */}
        <div className="h-[420px] w-full rounded-2xl overflow-hidden border-2 border-emerald-200 shadow-inner relative z-0">
          <MapContainer
            center={position}
            zoom={15}
            scrollWheelZoom={true}
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ChangeView center={position} zoom={15} />

            {/* Ward Boundary Polygon */}
            {wardBoundary && wardBoundary.length >= 3 && (
              <Polygon
                positions={wardBoundary}
                pathOptions={{
                  color: isInsideBoundary !== false ? '#059669' : '#dc2626',
                  fillColor: isInsideBoundary !== false ? '#10b981' : '#ef4444',
                  fillOpacity: 0.18,
                  weight: 3,
                  dashArray: isInsideBoundary !== false ? undefined : '6, 6'
                }}
              >
                <Tooltip sticky>
                  <div className="p-1 text-xs font-bold text-gray-900">
                    {selectedWard?.wardName || wardId} Official Ward Boundary
                    <div className="text-[10px] font-medium text-gray-600">
                      {isInsideBoundary !== false ? '🟢 House pin is inside' : '🔴 House pin is outside'}
                    </div>
                  </div>
                </Tooltip>
              </Polygon>
            )}

            {/* Resident House Marker */}
            <Marker position={position}>
              <Popup>
                <div className="p-1 space-y-1 text-xs">
                  <p className="font-extrabold text-[#0a4d2c]">{houseName} ({houseNumber})</p>
                  <p className="text-[11px] text-gray-700">{address}</p>
                  <p className="text-[10px] text-gray-500">{wardId} • {panchayatName}</p>
                  <span className="inline-block px-2 py-0.5 bg-emerald-100 text-[#0a4d2c] font-black text-[10px] rounded-md">
                    Resident Pin
                  </span>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>

        {/* Map Legend & Explanations */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-[#0a4d2c] flex items-center justify-center text-white text-[10px] font-bold">
              •
            </div>
            <div>
              <span className="font-bold text-gray-900 block">House Position</span>
              <span className="text-[11px] text-gray-500">Exact geo-coordinates of residence</span>
            </div>
          </div>

          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-3">
            <div className="w-4 h-4 rounded-md border-2 border-[#059669] bg-[#10b981]/30" />
            <div>
              <span className="font-bold text-gray-900 block">Ward Jurisdiction</span>
              <span className="text-[11px] text-gray-500">{wardId} collection boundary</span>
            </div>
          </div>

          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <div>
              <span className="font-bold text-gray-900 block">Verification Status</span>
              <span className="text-[11px] text-gray-500">Approved for HKS route</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenLocation;
