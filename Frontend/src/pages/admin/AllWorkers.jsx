import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  Users, 
  Search, 
  Filter, 
  UserPlus, 
  RefreshCw, 
  CheckCircle2, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldCheck,
  Building2,
  Clock,
  Briefcase
} from "lucide-react";
import { getAllWorkers } from "../../services/workerService";

const AllWorkers = ({ onCreateWorkerClick }) => {
  const [workers, setWorkers] = useState([]);
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWard, setSelectedWard] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchWorkersList(), fetchWardsList()]);
    setLoading(false);
  };

  const fetchWorkersList = async () => {
    try {
      const data = await getAllWorkers();
      setWorkers(data || []);
    } catch (error) {
      console.error("Error fetching workers:", error);
    }
  };

  const fetchWardsList = async () => {
    try {
      const response = await axios.get("http://localhost:5214/api/Ward");
      setWards(response.data || []);
    } catch (error) {
      console.error("Error fetching wards:", error);
    }
  };

  // Helper to map WardId to Ward Name if applicable
  const getWardDisplayName = (wardId) => {
    if (!wardId) return "Unassigned";
    const foundWard = wards.find(
      (w) => (w.wardId && w.wardId.toString() === wardId.toString()) || (w.id && w.id.toString() === wardId.toString())
    );
    if (foundWard) {
      return `${foundWard.wardName} (${foundWard.wardId || 'Ward'})`;
    }
    return wardId;
  };

  // Unique Wards for filtering
  const wardOptions = Array.from(
    new Set([
      ...wards.map((w) => w.wardName || w.wardId).filter(Boolean),
      ...workers.map((w) => w.wardId).filter(Boolean),
    ])
  );

  // Filtered workers list
  const filteredWorkers = workers.filter((worker) => {
    const wardName = getWardDisplayName(worker.wardId);

    const matchesSearch =
      searchQuery === "" ||
      (worker.fullName && worker.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (worker.email && worker.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (worker.workerId && worker.workerId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (worker.phoneNumber && worker.phoneNumber.includes(searchQuery));

    const matchesWard =
      selectedWard === "All" ||
      (worker.wardId && worker.wardId.toString().toLowerCase() === selectedWard.toLowerCase()) ||
      wardName.toLowerCase().includes(selectedWard.toLowerCase());

    const matchesStatus =
      selectedStatus === "All" ||
      (worker.status || "Active").toLowerCase() === selectedStatus.toLowerCase();

    return matchesSearch && matchesWard && matchesStatus;
  });

  const activeCount = workers.filter(
    (w) => (w.status || "Active").toLowerCase() === "active"
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white rounded-2xl p-6 border border-emerald-100/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-[#0a4d2c]" />
            Haritha Karma Sena Worker Details
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            View, filter and manage registered workers and their login accounts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2.5 rounded-lg border border-gray-200 hover:bg-emerald-50 text-gray-600 hover:text-[#0a4d2c] transition-colors cursor-pointer"
            title="Refresh Workers List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={onCreateWorkerClick}
            className="bg-[#0a4d2c] hover:bg-[#063820] text-white px-5 py-2.5 rounded-lg font-semibold text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Worker Login</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-emerald-100/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#0a4d2c] flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Total Workers</p>
            <h3 className="text-2xl font-extrabold text-gray-800">{workers.length}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-emerald-100/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 text-emerald-700 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Active Workers</p>
            <h3 className="text-2xl font-extrabold text-emerald-800">{activeCount}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-emerald-100/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Active Wards Assigned</p>
            <h3 className="text-2xl font-extrabold text-gray-800">{wards.length}</h3>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl p-5 border border-emerald-100/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Worker Name, Email, or ID..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            {/* Ward Filter */}
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-gray-500" />
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white cursor-pointer"
              >
                <option value="All">All Wards</option>
                {wardOptions.map((w, idx) => (
                  <option key={idx} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-gray-500" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Worker Table */}
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-200 rounded-xl overflow-hidden text-xs">
            <thead className="bg-[#0a4d2c] text-white">
              <tr>
                <th className="p-3.5 text-left font-bold uppercase tracking-wider">Worker ID</th>
                <th className="p-3.5 text-left font-bold uppercase tracking-wider">Worker Name</th>
                <th className="p-3.5 text-left font-bold uppercase tracking-wider">Email & Phone</th>
                <th className="p-3.5 text-left font-bold uppercase tracking-wider">Assigned Ward</th>
                <th className="p-3.5 text-left font-bold uppercase tracking-wider">Status</th>
                <th className="p-3.5 text-left font-bold uppercase tracking-wider">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredWorkers.length > 0 ? (
                filteredWorkers.map((worker, idx) => (
                  <tr
                    key={worker.id || worker.workerId || idx}
                    className="hover:bg-emerald-50/60 transition-colors"
                  >
                    <td className="p-3.5 font-extrabold text-[#0a4d2c]">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <span>{worker.workerId || `WRK-${idx + 101}`}</span>
                      </div>
                    </td>

                    <td className="p-3.5 font-bold text-gray-800">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#0a4d2c] flex items-center justify-center font-bold text-xs shadow-xs">
                          {(worker.fullName || "W")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{worker.fullName}</p>
                          <p className="text-[10px] text-gray-400 font-normal">Haritha Karma Sena</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                        <Mail className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>{worker.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{worker.phoneNumber || "N/A"}</span>
                      </div>
                    </td>

                    <td className="p-3.5 text-gray-800 font-bold">
                      <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200 inline-block">
                        <Building2 className="w-3.5 h-3.5 text-emerald-700 inline" />
                        <span>{getWardDisplayName(worker.wardId)}</span>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          (worker.status || "Active").toLowerCase() === "active"
                            ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                            : "bg-gray-100 text-gray-700 border border-gray-300"
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                        {worker.status || "Active"}
                      </span>
                    </td>

                    <td className="p-3.5 text-gray-500">
                      <div className="flex items-center gap-1 text-[11px]">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span>
                          {worker.createdAt
                            ? new Date(worker.createdAt).toLocaleDateString()
                            : "Recent"}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Users className="w-8 h-8 text-emerald-300" />
                      <p className="font-semibold text-sm text-gray-700">No Worker Records Found</p>
                      <p className="text-xs text-gray-400">
                        No workers match your current search and filter criteria.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AllWorkers;
