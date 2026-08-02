import React, { useState, useEffect } from "react";
import axios from "axios";

const AddWard = ({ onBack, onWardAdded }) => {
    const [wardId, setWardId] = useState("");
    const [wardName, setWardName] = useState("");
    const [panchayatName, setPanchayatName] = useState("");
    const [panchayats, setPanchayats] = useState([]);
    const [status, setStatus] = useState("Active");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchPanchayats();
    }, []);

    const fetchPanchayats = async () => {
        try {
            const res = await axios.get("http://localhost:5214/api/Panchayat");
            const data = Array.isArray(res.data) ? res.data : (res.data ? [res.data] : []);
            setPanchayats(data);
            if (data.length > 0 && data[0].panchayatName) {
                setPanchayatName(data[0].panchayatName);
            }
        } catch (error) {
            console.error("Error fetching panchayats:", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        try {
            await axios.post("http://localhost:5214/api/Ward", {
                wardId,
                wardName,
                panchayatName,
                status
            });
            setMessage({ type: "success", text: "Ward added successfully!" });
            setWardId("");
            setWardName("");
            if (onWardAdded) onWardAdded();
        } catch (error) {
            console.error("Error adding ward:", error);
            setMessage({ type: "error", text: "Failed to add ward. Please try again." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center py-4">
            <div className="bg-white rounded-2xl p-6 border border-emerald-100/80 shadow-xs max-w-2xl w-full mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Add New Ward</h2>
                        <p className="text-sm text-gray-500">Register a new Panchayat Ward in the system</p>
                    </div>
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="text-sm font-medium text-emerald-800 hover:text-emerald-950 cursor-pointer"
                        >
                            ← Back to Wards List
                        </button>
                    )}
                </div>

                {message && (
                    <div className={`p-3 rounded-lg mb-4 text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Panchayat Name</label>
                        {panchayats.length > 0 ? (
                            <select
                                value={panchayatName}
                                onChange={(e) => setPanchayatName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                required
                            >
                                {panchayats.map((p, idx) => (
                                    <option key={idx} value={p.panchayatName || p}>
                                        {p.panchayatName || p}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                required
                                value={panchayatName}
                                onChange={(e) => setPanchayatName(e.target.value)}
                                placeholder="e.g. Athirampuzha Panchayat"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Ward ID</label>
                        <input
                            type="text"
                            required
                            value={wardId}
                            onChange={(e) => setWardId(e.target.value)}
                            placeholder="e.g. WARD-01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Ward Name</label>
                        <input
                            type="text"
                            required
                            value={wardName}
                            onChange={(e) => setWardName(e.target.value)}
                            placeholder="e.g. Green Valley Ward"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#0a4d2c] hover:bg-[#063820] text-white py-2.5 rounded-lg font-semibold text-sm shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                        >
                            {loading ? "Adding Ward..." : "Save Ward"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddWard;
