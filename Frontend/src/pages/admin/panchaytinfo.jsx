import React, { useState, useEffect } from "react";
import axios from "axios";
import { MapPin, Building2, Layers, Plus, Trash2, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";

const PanchayatInfo = ({ initialEdit = false }) => {
    const [isEdit, setIsEdit] = useState(initialEdit);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    const [panchayat, setPanchayat] = useState({
        panchayatName: "",
        district: "",
        numberOfWards: "1",
        state: "Kerala",
        status: "Active",
    });

    const [wardsList, setWardsList] = useState([
        { wardId: "W001", wardName: "", status: "Active" }
    ]);
    const [existingWards, setExistingWards] = useState([]);

    useEffect(() => {
        if (!initialEdit) {
            fetchPanchayatInfo();
        } else {
            setIsEdit(true);
            updateWardListLength(1);
        }
    }, [initialEdit]);

    const fetchPanchayatInfo = async () => {
        setLoading(true);
        try {
            const response = await axios.get("http://localhost:5214/api/Panchayat");
            const data = response.data;
            if (data && data.panchayatName) {
                const count = data.numberOfWards || 0;
                setPanchayat({
                    panchayatName: data.panchayatName || "",
                    district: data.district || "",
                    numberOfWards: count.toString(),
                    state: data.state || "Kerala",
                    status: data.status || "Active",
                });
                if (!initialEdit) setIsEdit(false);

                fetchWards(data.panchayatName);
            }
        } catch (error) {
            console.error("Error fetching panchayat info from DB:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchWards = async (pName) => {
        try {
            const res = await axios.get("http://localhost:5214/api/Ward");
            const allWards = res.data || [];
            const filtered = allWards.filter(w => (w.panchayatName || w.panchayat || "").toLowerCase() === (pName || "").toLowerCase());
            setExistingWards(filtered);
        } catch (err) {
            console.error("Error fetching wards:", err);
        }
    };

    const updateWardListLength = (count) => {
        const num = Math.max(1, parseInt(count, 10) || 1);
        setWardsList((prev) => {
            const newArr = [...prev];
            if (num > newArr.length) {
                for (let i = newArr.length; i < num; i++) {
                    const idNum = (i + 1).toString().padStart(3, "0");
                    newArr.push({ wardId: `W${idNum}`, wardName: "", status: "Active" });
                }
            } else if (num < newArr.length) {
                newArr.splice(num);
            }
            return newArr;
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setPanchayat((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (name === "numberOfWards") {
            const count = parseInt(value, 10);
            if (!isNaN(count) && count >= 0) {
                updateWardListLength(count);
            }
        }
    };

    const handleWardChange = (index, field, value) => {
        setWardsList((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const handleAddWardRow = () => {
        const newCount = wardsList.length + 1;
        setPanchayat((prev) => ({ ...prev, numberOfWards: newCount.toString() }));
        updateWardListLength(newCount);
    };

    const handleRemoveWardRow = (index) => {
        if (wardsList.length <= 1) return;
        setWardsList((prev) => {
            const updated = prev.filter((_, idx) => idx !== index);
            setPanchayat((p) => ({ ...p, numberOfWards: updated.length.toString() }));
            return updated;
        });
    };

    const handleAddNew = () => {
        setPanchayat({
            panchayatName: "",
            district: "",
            numberOfWards: "1",
            state: "Kerala",
            status: "Active",
        });
        setWardsList([{ wardId: "W001", wardName: "", status: "Active" }]);
        setMessage(null);
        setIsEdit(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        const invalidWard = wardsList.find(w => !w.wardName.trim());
        if (invalidWard) {
            setMessage({ type: "error", text: "Please enter Ward Names for all wards before saving." });
            setSaving(false);
            return;
        }

        try {
            await axios.post("http://localhost:5214/api/Panchayat", {
                panchayatName: panchayat.panchayatName,
                district: panchayat.district,
                numberOfWards: parseInt(panchayat.numberOfWards, 10) || wardsList.length,
                wards: wardsList
            });

            setMessage({ type: "success", text: "Panchayat Information and Ward details saved successfully!" });
            setIsEdit(false);
            fetchPanchayatInfo();
        } catch (error) {
            console.error("Error saving panchayat info to DB:", error);
            setMessage({ type: "error", text: "Failed to save Panchayat Information. Please check backend connection." });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto p-12 text-center text-emerald-800 font-semibold flex items-center justify-center gap-3">
                <div className="w-6 h-6 border-2 border-emerald-800 border-t-transparent rounded-full animate-spin"></div>
                Loading Panchayat Information...
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl shadow-xs border border-emerald-100/80 p-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-[#0a4d2c] flex items-center gap-3">
                            <Building2 className="w-8 h-8 text-[#0a4d2c]" />
                            {isEdit ? "Add / Edit Panchayat & Ward Details" : "Panchayat Information"}
                        </h1>
                        <p className="text-gray-500 mt-1 text-sm">
                            Manage Panchayat registration and configure its Ward details for EcoMind AI.
                        </p>
                    </div>

                    {!isEdit && (
                        <button
                            onClick={handleAddNew}
                            className="bg-[#0a4d2c] hover:bg-[#063820] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs cursor-pointer transition-colors flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add New Panchayat</span>
                        </button>
                    )}
                </div>

                {message && (
                    <div className={`p-4 rounded-xl mb-6 text-sm font-semibold border flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
                        <span>{message.text}</span>
                    </div>
                )}

                {isEdit ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Section 1: Panchayat Basic Details */}
                        <div className="bg-emerald-50/40 p-6 rounded-2xl border border-emerald-100/80 space-y-5">
                            <h2 className="text-sm font-bold text-[#0a4d2c] uppercase tracking-wider flex items-center gap-2 border-b border-emerald-200/60 pb-3">
                                <ShieldCheck className="w-4 h-4" />
                                1. Panchayat Details
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Panchayat Name */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                                        Panchayat Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="panchayatName"
                                        value={panchayat.panchayatName}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-600 outline-none text-sm font-medium bg-white"
                                        placeholder="Enter Panchayat Name (e.g. Athirampuzha)"
                                        required
                                    />
                                </div>

                                {/* District */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                                        District <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="district"
                                        value={panchayat.district}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-600 outline-none text-sm font-medium bg-white"
                                        placeholder="Enter District (e.g. Kottayam)"
                                        required
                                    />
                                </div>

                                {/* Number of Wards */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                                        Number of Wards <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="numberOfWards"
                                        min="1"
                                        max="50"
                                        value={panchayat.numberOfWards}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-600 outline-none text-sm font-medium bg-white"
                                        placeholder="Enter Number of Wards"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Ward fields below will update dynamically based on this number.
                                    </p>
                                </div>

                                {/* State */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                                        State
                                    </label>
                                    <input
                                        type="text"
                                        value={panchayat.state}
                                        disabled
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-100 text-sm font-medium text-gray-600 cursor-not-allowed"
                                    />
                                </div>

                                {/* Status */}
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                                        Status
                                    </label>
                                    <select
                                        name="status"
                                        value={panchayat.status}
                                        onChange={handleChange}
                                        className="w-full md:w-1/2 border border-gray-300 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-emerald-600 outline-none bg-white"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Ward Names & Information */}
                        <div className="bg-emerald-50/40 p-6 rounded-2xl border border-emerald-100/80 space-y-5">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-emerald-200/60 pb-3">
                                <div>
                                    <h2 className="text-sm font-bold text-[#0a4d2c] uppercase tracking-wider flex items-center gap-2">
                                        <Layers className="w-4 h-4" />
                                        2. Ward Names & Details ({wardsList.length} Wards)
                                    </h2>
                                    <p className="text-xs text-gray-600 mt-0.5">
                                        Enter names for each Ward belonging to {panchayat.panchayatName || "this Panchayat"}.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleAddWardRow}
                                    className="bg-emerald-100 hover:bg-emerald-200 text-[#0a4d2c] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add Ward Row</span>
                                </button>
                            </div>

                            <div className="space-y-3">
                                {wardsList.map((ward, index) => (
                                    <div
                                        key={index}
                                        className="bg-white p-4 rounded-xl border border-emerald-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shadow-2xs"
                                    >
                                        <div className="w-full sm:w-28 shrink-0">
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                                Ward ID
                                            </label>
                                            <input
                                                type="text"
                                                value={ward.wardId}
                                                onChange={(e) => handleWardChange(index, "wardId", e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-50 focus:ring-2 focus:ring-emerald-500 outline-none"
                                                placeholder="e.g. W001"
                                                required
                                            />
                                        </div>

                                        <div className="flex-1">
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                                Ward Name #{index + 1} <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={ward.wardName}
                                                onChange={(e) => handleWardChange(index, "wardName", e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                                                placeholder={`Enter Ward Name (e.g. Ward ${index + 1} / Green Valley)`}
                                                required
                                            />
                                        </div>

                                        {wardsList.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveWardRow(index)}
                                                className="sm:self-end text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                                title="Remove this ward"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Form Submit & Cancel Actions */}
                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-[#0a4d2c] hover:bg-[#063820] text-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-sm cursor-pointer transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                <span>{saving ? "Saving Panchayat & Wards to DB..." : "Save Panchayat & Wards"}</span>
                            </button>

                            {panchayat.panchayatName && (
                                <button
                                    type="button"
                                    onClick={() => setIsEdit(false)}
                                    className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3.5 rounded-xl font-semibold text-sm cursor-pointer transition-colors"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                ) : (
                    <div className="space-y-8">
                        {/* Display Panchayat Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100/80">
                            <div>
                                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                                    Panchayat Name
                                </h3>
                                <p className="font-bold text-xl text-gray-900 mt-1">
                                    {panchayat.panchayatName || "N/A"}
                                </p>
                            </div>

                            <div>
                                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                                    District
                                </h3>
                                <p className="font-bold text-xl text-gray-900 mt-1">
                                    {panchayat.district || "N/A"}
                                </p>
                            </div>

                            <div>
                                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                                    Number of Wards
                                </h3>
                                <p className="font-bold text-xl text-emerald-900 mt-1">
                                    {panchayat.numberOfWards} Wards Registered
                                </p>
                            </div>

                            <div>
                                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                                    State
                                </h3>
                                <p className="font-bold text-lg text-gray-800 mt-1">
                                    {panchayat.state}
                                </p>
                            </div>

                            <div>
                                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                                    Status
                                </h3>
                                <p className="font-bold text-lg text-emerald-700 mt-1 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    {panchayat.status}
                                </p>
                            </div>
                        </div>

                        {/* Display Registered Wards List for this Panchayat */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-[#0a4d2c]" />
                                    Registered Wards ({existingWards.length})
                                </h3>
                            </div>

                            {existingWards.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {existingWards.map((w, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs hover:border-emerald-300 transition-colors flex items-center justify-between"
                                        >
                                            <div>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                                                    {w.wardId || `WARD-${idx + 1}`}
                                                </span>
                                                <h4 className="font-bold text-gray-800 text-sm mt-1">
                                                    {w.wardName}
                                                </h4>
                                            </div>
                                            <span className="text-xs text-emerald-700 font-semibold px-2 py-1 bg-emerald-50 rounded-lg">
                                                {w.status || "Active"}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-6 text-center text-sm text-gray-500 bg-gray-50 rounded-xl border border-gray-200">
                                    No wards registered yet for this Panchayat. Click <strong>Edit Information & Wards</strong> to add ward names.
                                </div>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                            <button
                                onClick={() => {
                                    if (existingWards.length > 0) {
                                        setWardsList(existingWards.map(w => ({
                                            wardId: w.wardId || "",
                                            wardName: w.wardName || "",
                                            status: w.status || "Active"
                                        })));
                                    } else {
                                        updateWardListLength(parseInt(panchayat.numberOfWards, 10) || 1);
                                    }
                                    setIsEdit(true);
                                }}
                                className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-bold text-sm cursor-pointer transition-colors shadow-xs"
                            >
                                Edit Information & Wards
                            </button>

                            <button
                                onClick={handleAddNew}
                                className="bg-[#0a4d2c] hover:bg-[#063820] text-white px-6 py-3 rounded-xl font-bold text-sm cursor-pointer transition-colors shadow-xs flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add Another Panchayat</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PanchayatInfo;