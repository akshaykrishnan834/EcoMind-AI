import React, { useState, useEffect } from "react";
import axios from "axios";

const PanchayatInfo = ({ initialEdit = false }) => {
    const [isEdit, setIsEdit] = useState(initialEdit);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    const [panchayat, setPanchayat] = useState({
        panchayatName: "",
        district: "",
        numberOfWards: "",
        state: "Kerala",
        status: "Active",
    });

    useEffect(() => {
        if (!initialEdit) {
            fetchPanchayatInfo();
        } else {
            setIsEdit(true);
        }
    }, [initialEdit]);

    const fetchPanchayatInfo = async () => {
        setLoading(true);
        try {
            const response = await axios.get("http://localhost:5214/api/Panchayat");
            const data = response.data;
            if (data && data.panchayatName) {
                setPanchayat({
                    panchayatName: data.panchayatName || "",
                    district: data.district || "",
                    numberOfWards: data.numberOfWards || "",
                    state: data.state || "Kerala",
                    status: data.status || "Active",
                });
                if (!initialEdit) setIsEdit(false);
            }
        } catch (error) {
            console.error("Error fetching panchayat info from DB:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setPanchayat((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleAddNew = () => {
        setPanchayat({
            panchayatName: "",
            district: "",
            numberOfWards: "",
            state: "Kerala",
            status: "Active",
        });
        setMessage(null);
        setIsEdit(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            await axios.post("http://localhost:5214/api/Panchayat", {
                panchayatName: panchayat.panchayatName,
                district: panchayat.district,
                numberOfWards: parseInt(panchayat.numberOfWards, 10) || 0,
            });

            setMessage({ type: "success", text: "New Panchayat Information saved to Database successfully!" });
            setIsEdit(false);
        } catch (error) {
            console.error("Error saving panchayat info to DB:", error);
            setMessage({ type: "error", text: "Failed to save Panchayat Information to DB. Please check backend connection." });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto p-12 text-center text-emerald-800 font-semibold">
                Loading Panchayat Information...
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-emerald-100/80 p-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-[#0a4d2c]">
                            {isEdit ? "Add / Edit Panchayat Information" : "Panchayat Information"}
                        </h1>
                        <p className="text-gray-500 mt-1 text-sm">
                            Manage and register Panchayat details for EcoMind AI system.
                        </p>
                    </div>

                    {!isEdit && (
                        <button
                            onClick={handleAddNew}
                            className="bg-[#0a4d2c] hover:bg-[#063820] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs cursor-pointer transition-colors"
                        >
                            + Add New Panchayat
                        </button>
                    )}
                </div>

                {message && (
                    <div className={`p-4 rounded-xl mb-6 text-sm font-semibold border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        {message.text}
                    </div>
                )}

                {isEdit ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Panchayat Name */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                                Panchayat Name
                            </label>
                            <input
                                type="text"
                                name="panchayatName"
                                value={panchayat.panchayatName}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-600 outline-none text-sm font-medium"
                                placeholder="Enter Panchayat Name (e.g. Athirampuzha)"
                                required
                            />
                        </div>

                        {/* District */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                                District
                            </label>
                            <input
                                type="text"
                                name="district"
                                value={panchayat.district}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-600 outline-none text-sm font-medium"
                                placeholder="Enter District (e.g. Kottayam)"
                                required
                            />
                        </div>

                        {/* Number of Wards */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                                Number of Wards
                            </label>
                            <input
                                type="number"
                                name="numberOfWards"
                                value={panchayat.numberOfWards}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-600 outline-none text-sm font-medium"
                                placeholder="Enter Number of Wards"
                                required
                            />
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
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                                Status
                            </label>
                            <select
                                name="status"
                                value={panchayat.status}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-emerald-600 outline-none"
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-[#0a4d2c] hover:bg-[#063820] text-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-sm cursor-pointer transition-colors disabled:opacity-50"
                            >
                                {saving ? "Saving to DB..." : "Save Panchayat"}
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
                    <div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100/80">
                            <div>
                                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                                    Panchayat Name
                                </h3>
                                <p className="font-bold text-lg text-gray-800 mt-1">
                                    {panchayat.panchayatName}
                                </p>
                            </div>

                            <div>
                                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                                    District
                                </h3>
                                <p className="font-bold text-lg text-gray-800 mt-1">
                                    {panchayat.district}
                                </p>
                            </div>

                            <div>
                                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                                    Number of Wards
                                </h3>
                                <p className="font-bold text-lg text-gray-800 mt-1">
                                    {panchayat.numberOfWards} Wards
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
                                <p className="font-bold text-lg text-emerald-700 mt-1">
                                    {panchayat.status}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mt-8">
                            <button
                                onClick={() => setIsEdit(true)}
                                className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-bold text-sm cursor-pointer transition-colors shadow-sm"
                            >
                                Edit Information
                            </button>

                            <button
                                onClick={handleAddNew}
                                className="bg-[#0a4d2c] hover:bg-[#063820] text-white px-6 py-3 rounded-xl font-bold text-sm cursor-pointer transition-colors shadow-sm"
                            >
                                + Add Another Panchayat
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PanchayatInfo;