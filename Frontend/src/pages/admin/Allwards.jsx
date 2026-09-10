import React, { useEffect, useState } from "react";
import axios from "axios";
import { Search, Filter, Plus, Building2, MapPin, CheckCircle2, RefreshCw, ChevronDown, Map as MapIcon, Globe, Sparkles } from "lucide-react";
import WardBoundaryEditor from "../../components/WardBoundaryEditor";

const Wards = ({ onAddWard }) => {
    const [wards, setWards] = useState([]);
    const [panchayats, setPanchayats] = useState([]);
    const [selectedPanchayat, setSelectedPanchayat] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState("");
    const [editingWard, setEditingWard] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        await Promise.all([fetchWards(), fetchPanchayats()]);
        setLoading(false);
    };

    const fetchWards = async () => {
        try {
            const response = await axios.get("http://localhost:5214/api/Ward");
            setWards(response.data || []);
        } catch (error) {
            console.error("Error fetching wards:", error);
        }
    };

    const fetchPanchayats = async () => {
        try {
            const response = await axios.get("http://localhost:5214/api/Panchayat");
            const data = Array.isArray(response.data) ? response.data : (response.data ? [response.data] : []);
            setPanchayats(data);
        } catch (error) {
            console.error("Error fetching panchayats:", error);
        }
    };

    const syncOfficialBoundaries = async () => {
        setSyncing(true);
        setSyncMessage("Syncing official boundaries with Kerala Ward Delimitation Portal...");
        try {
            let updatedCount = 0;
            const targetWards = selectedPanchayat === "All" 
                ? wards 
                : wards.filter(w => (w.panchayatName || w.panchayat || '').toLowerCase() === selectedPanchayat.toLowerCase());

            for (const w of targetWards) {
                const pName = w.panchayatName || w.panchayat || "Chirakkadavu";
                try {
                    const res = await axios.get("http://localhost:5214/api/Ward/official-boundary", {
                        params: {
                            panchayatName: pName,
                            wardIdentifier: w.wardId,
                            wardName: w.wardName
                        }
                    });

                    if (res.data && res.data.boundary && res.data.boundary.length >= 3) {
                        await axios.put(`http://localhost:5214/api/Ward/${w.wardId}/boundary`, res.data.boundary);
                        updatedCount++;
                    }
                } catch {
                    // skip unmatched ward safely
                }
            }

            setSyncMessage(`✓ Successfully synchronized ${updatedCount} official boundaries from Kerala Delimitation Portal!`);
            await fetchWards();
        } catch (err) {
            console.error("Sync error:", err);
            setSyncMessage("Failed to synchronize some boundaries from portal.");
        } finally {
            setSyncing(false);
            setTimeout(() => setSyncMessage(""), 6000);
        }
    };

    // Extract unique panchayat names with counts
    const panchayatList = Array.from(
        new Set([
            ...panchayats.map(p => (typeof p === 'string' ? p : p.panchayatName)).filter(Boolean),
            ...wards.map(w => w.panchayatName || w.panchayat).filter(Boolean)
        ])
    );

    // Count wards per panchayat
    const getPanchayatWardCount = (pName) => {
        if (pName === "All") return wards.length;
        return wards.filter(w => (w.panchayatName || w.panchayat || '').toLowerCase() === pName.toLowerCase()).length;
    };

    // Filter wards based on Panchayat Selection, Search Query, and Status Filter
    const filteredWards = wards.filter(ward => {
        const pName = ward.panchayatName || ward.panchayat || '';
        const matchesPanchayat = selectedPanchayat === "All" || pName.toLowerCase() === selectedPanchayat.toLowerCase();

        const matchesSearch = searchQuery === "" ||
            (ward.wardName && ward.wardName.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (ward.wardId && ward.wardId.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus = statusFilter === "All" || (ward.status || "Active").toLowerCase() === statusFilter.toLowerCase();

        return matchesPanchayat && matchesSearch && matchesStatus;
    });

    const activeWardsCount = filteredWards.filter(w => (w.status || 'Active').toLowerCase() === 'active').length;

    return (
        <div className="space-y-6">
            {/* Top Header & Actions Section */}
            <div className="bg-white rounded-2xl p-6 border border-emerald-100/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
                        <MapPin className="w-6 h-6 text-[#0a4d2c]" />
                        Panchayat Ward Management
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        View and manage wards assigned to each Panchayat
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={syncOfficialBoundaries}
                        disabled={syncing}
                        className="bg-emerald-50 hover:bg-emerald-100 text-[#0a4d2c] border border-emerald-300 px-4 py-2.5 rounded-lg font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        title="Auto-fetch and sync all official ward boundary polygons from Kerala Ward Delimitation Portal (wardmap.ksmart.live)"
                    >
                        <Globe className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                        <span>{syncing ? "Syncing..." : "Sync Kerala Boundaries"}</span>
                    </button>

                    <button
                        onClick={loadData}
                        className="p-2.5 rounded-lg border border-gray-200 hover:bg-emerald-50 text-gray-600 hover:text-[#0a4d2c] transition-colors cursor-pointer"
                        title="Refresh Wards Data"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>

                    <button
                        onClick={onAddWard}
                        className="bg-[#0a4d2c] hover:bg-[#063820] text-white px-5 py-2.5 rounded-lg font-semibold text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add New Ward</span>
                    </button>
                </div>
            </div>

            {syncMessage && (
                <div className={`p-4 rounded-xl text-xs font-bold border flex items-center gap-2 ${
                    syncMessage.includes('Successfully')
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                        : 'bg-blue-50 text-blue-900 border-blue-200'
                }`}>
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{syncMessage}</span>
                </div>
            )}

            {/* Primary Panchayat Selection Dropdown Card */}
            <div className="bg-white rounded-2xl p-5 border border-emerald-100/80 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-50/80 to-green-50/40 p-4 rounded-xl border border-emerald-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#0a4d2c] text-white flex items-center justify-center font-bold shadow-xs">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                            <label htmlFor="panchayat-select" className="block text-xs font-extrabold uppercase tracking-wider text-[#0a4d2c] mb-0.5">
                                Select Panchayat Dropdown:
                            </label>
                            <p className="text-xs text-gray-600">Choose a Panchayat from the dropdown to filter all ward details</p>
                        </div>
                    </div>

                    {/* Prominent Panchayat Dropdown */}
                    <div className="relative w-full sm:w-72">
                        <select
                            id="panchayat-select"
                            value={selectedPanchayat}
                            onChange={(e) => setSelectedPanchayat(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-emerald-300 rounded-xl text-sm font-bold text-gray-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none shadow-sm cursor-pointer appearance-none pr-10"
                        >
                            <option value="All">All Panchayats ({wards.length} Wards)</option>
                            {panchayatList.map((pName, idx) => (
                                <option key={idx} value={pName}>
                                    {pName} ({getPanchayatWardCount(pName)} Wards)
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-emerald-800 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>

                {/* Quick Panchayat Selector Pills */}
                <div className="pt-1">


                    <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">



                    </div>
                </div>
            </div>

            {/* Selected Panchayat Summary & Search Toolbar */}
            <div className="bg-white rounded-2xl p-5 border border-emerald-100/80 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
                    {/* Selected Panchayat Banner */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#0a4d2c] flex items-center justify-center font-bold">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-gray-800">
                                    {selectedPanchayat === "All" ? "All Panchayats Wards" : selectedPanchayat}
                                </h3>
                                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    Selected
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Showing {filteredWards.length} total wards ({activeWardsCount} Active)
                            </p>
                        </div>
                    </div>

                    {/* Controls: Search and Status Filter */}
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        {/* Search Bar */}
                        <div className="relative flex-1 md:w-64">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search Ward Name or ID..."
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50/50"
                            />
                        </div>

                        {/* Status Filter Dropdown */}
                        <div className="flex items-center gap-1.5">
                            <Filter className="w-3.5 h-3.5 text-gray-500" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white cursor-pointer"
                            >
                                <option value="All">All Statuses</option>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table View */}
                <div className="overflow-x-auto">
                    <table className="w-full border border-gray-200 rounded-xl overflow-hidden text-xs">
                        <thead className="bg-[#0a4d2c] text-white">
                            <tr>
                                <th className="p-3 text-left font-bold uppercase tracking-wider">Ward ID</th>
                                <th className="p-3 text-left font-bold uppercase tracking-wider">Ward Name</th>
                                <th className="p-3 text-left font-bold uppercase tracking-wider">Panchayat Name</th>
                                <th className="p-3 text-left font-bold uppercase tracking-wider">Status</th>
                                <th className="p-3 text-center font-bold uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {filteredWards.length > 0 ? (
                                filteredWards.map((ward, idx) => (
                                    <tr key={ward.id || ward.wardId || idx} className="hover:bg-emerald-50/60 transition-colors">
                                        <td className="p-3.5 font-bold text-gray-800">
                                            {ward.wardId}
                                        </td>
                                        <td className="p-3.5 font-semibold text-gray-700">
                                            {ward.wardName}
                                        </td>
                                        <td className="p-3.5 text-emerald-900 font-bold">
                                            <div className="flex items-center gap-1.5">
                                                <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                                                <span>{ward.panchayatName || ward.panchayat || "Default Panchayat"}</span>
                                            </div>
                                        </td>
                                        <td className="p-3.5">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${(ward.status || 'Active').toLowerCase() === 'active'
                                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                                : 'bg-gray-100 text-gray-700 border border-gray-300'
                                                }`}>
                                                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                                {ward.status || 'Active'}
                                            </span>
                                        </td>
                                        <td className="p-3.5 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {ward.boundary && ward.boundary.length >= 3 ? (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md" title={`${ward.boundary.length} boundary points from official delimitation data`}>
                                                        <Globe className="w-3 h-3 text-emerald-600" />
                                                        Boundary Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md">
                                                        No Boundary
                                                    </span>
                                                )}
                                                <button
                                                    onClick={() => setEditingWard(ward)}
                                                    className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-emerald-50 text-[#0a4d2c] border border-emerald-300 rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                                                >
                                                    <MapIcon className="w-3.5 h-3.5" />
                                                    <span>Map View</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center space-y-2">
                                            <Building2 className="w-8 h-8 text-emerald-300" />
                                            <p className="font-semibold text-sm text-gray-700">No Wards Found</p>
                                            <p className="text-xs text-gray-400">
                                                {selectedPanchayat === "All"
                                                    ? "No ward records available. Click 'Add New Ward' to add one."
                                                    : `No ward records assigned to "${selectedPanchayat}".`}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {editingWard && (
                <WardBoundaryEditor
                    ward={editingWard}
                    onClose={() => setEditingWard(null)}
                    onSaved={() => {
                        loadData();
                    }}
                />
            )}
        </div>
    );
};

export default Wards;