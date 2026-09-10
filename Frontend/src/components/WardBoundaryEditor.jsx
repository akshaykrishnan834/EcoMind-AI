import React, { useState, useEffect } from 'react';
import { X, Save, Undo, MapPin, Globe, Sparkles, CheckCircle2 } from 'lucide-react';
import { MapContainer, TileLayer, Polygon, Tooltip, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';

function MapClickHandler({ onMapClick }) {
    useMapEvents({
        click(e) {
            if (e.latlng) {
                onMapClick(e.latlng.lat, e.latlng.lng);
            }
        },
    });
    return null;
}

const DEFAULT_CENTER = [9.5583, 76.7842]; // Kerala Center

const WardBoundaryEditor = ({ ward, onClose, onSaved }) => {
    const [boundary, setBoundary] = useState(ward.boundary || []);
    const [loading, setLoading] = useState(false);
    const [fetchingOfficial, setFetchingOfficial] = useState(false);
    const [officialNotice, setOfficialNotice] = useState('');
    
    // Add point to polygon
    const handleMapClick = (lat, lng) => {
        setBoundary(prev => [...prev, [lat, lng]]);
        setOfficialNotice('');
    };

    const undoLastPoint = () => {
        setBoundary(prev => prev.slice(0, -1));
    };

    const clearAll = () => {
        setBoundary([]);
        setOfficialNotice('');
    };

    const fetchOfficialBoundary = async () => {
        setFetchingOfficial(true);
        setOfficialNotice('');
        try {
            const pName = ward.panchayatName || ward.panchayat || 'Chirakkadavu';
            const res = await axios.get(`http://localhost:5214/api/Ward/official-boundary`, {
                params: {
                    panchayatName: pName,
                    wardIdentifier: ward.wardId,
                    wardName: ward.wardName
                }
            });

            if (res.data && res.data.boundary && res.data.boundary.length >= 3) {
                setBoundary(res.data.boundary);
                setOfficialNotice(`Loaded official delimitation boundary (${res.data.boundary.length} coordinates from wardmap.ksmart.live)`);
            } else {
                setOfficialNotice('Official boundary not found on the portal for this ward.');
            }
        } catch (err) {
            console.error('Error fetching official boundary:', err);
            setOfficialNotice('Unable to reach Kerala Delimitation portal or ward not found.');
        } finally {
            setFetchingOfficial(false);
        }
    };

    const saveBoundary = async () => {
        if (boundary.length > 0 && boundary.length < 3) {
            alert("A polygon needs at least 3 points");
            return;
        }

        setLoading(true);
        try {
            await axios.put(`http://localhost:5214/api/Ward/${ward.wardId}/boundary`, boundary);
            onSaved();
            onClose();
        } catch (error) {
            console.error("Failed to save boundary", error);
            alert("Failed to save boundary");
        } finally {
            setLoading(false);
        }
    };

    const center = boundary.length > 0 ? boundary[0] : DEFAULT_CENTER;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col h-[85vh] overflow-hidden">
                <div className="flex justify-between items-center p-4 sm:p-5 border-b border-gray-200">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-gray-800">{ward.wardId}: {ward.wardName}</h2>
                            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                                {ward.panchayatName || "Chirakkadavu"}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Official Kerala Ward Delimitation Boundary (wardmap.ksmart.live)
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchOfficialBoundary}
                            disabled={fetchingOfficial}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                            title="Fetch official boundary polygon from Kerala Ward Delimitation Portal"
                        >
                            <Sparkles className={`w-3.5 h-3.5 ${fetchingOfficial ? 'animate-spin' : ''}`} />
                            <span>{fetchingOfficial ? "Fetching..." : "Auto-Fetch Official Boundary"}</span>
                        </button>

                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition cursor-pointer">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                {officialNotice && (
                    <div className={`px-4 py-2 text-xs font-semibold flex items-center gap-2 border-b ${
                        officialNotice.includes('Loaded') 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                        <Globe className="w-4 h-4 shrink-0 text-emerald-600" />
                        <span>{officialNotice}</span>
                    </div>
                )}
                
                <div className="flex-1 relative">
                    <MapContainer
                        center={center}
                        zoom={14}
                        className="w-full h-full z-0"
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; OpenStreetMap contributors'
                        />
                        <MapClickHandler onMapClick={handleMapClick} />
                        {boundary.length > 0 && (
                            <Polygon 
                                positions={boundary} 
                                pathOptions={{ color: '#0a4d2c', fillColor: '#0a4d2c', fillOpacity: 0.35, weight: 3 }} 
                            >
                                <Tooltip sticky>
                                    <div className="text-xs font-bold">
                                        <p>{ward.wardId} - {ward.wardName}</p>
                                        <p className="text-[10px] text-gray-500">{boundary.length} boundary points</p>
                                    </div>
                                </Tooltip>
                            </Polygon>
                        )}
                    </MapContainer>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500">
                            Points: <strong className="text-gray-800">{boundary.length}</strong>
                        </span>
                        <button 
                            onClick={undoLastPoint} 
                            disabled={boundary.length === 0}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                        >
                            Undo Point
                        </button>
                        <button 
                            onClick={clearAll} 
                            disabled={boundary.length === 0}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 cursor-pointer"
                        >
                            Clear
                        </button>
                    </div>
                    
                    <button 
                        onClick={saveBoundary}
                        disabled={loading || boundary.length < 3}
                        className="px-6 py-2 rounded-xl bg-[#0a4d2c] text-white text-sm font-semibold flex items-center gap-2 hover:bg-[#063820] transition shadow-xs cursor-pointer disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {loading ? 'Saving...' : 'Save Boundary'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WardBoundaryEditor;
