import React, { useEffect, useState, useMemo } from "react";
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Mail,
  Clock,
  Shield,
  UserCheck,
  X,
  AlertCircle,
  ShieldCheck,
  Building2,
  Home,
  MapPin,
  Check,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Sparkles
} from "lucide-react";
import { getAllUsers, deleteUser } from "../../services/userService";
import { getAllCitizens, verifyCitizen } from "../../services/citizenService";

const AllUsers = () => {
  const [users, setUsers] = useState([]);
  const [citizens, setCitizens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("All");
  const [selectedWard, setSelectedWard] = useState("All");
  const [selectedType, setSelectedType] = useState("All"); // 'All' | 'Household' | 'Commercial'

  // Sorting & Pagination State
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // State for Delete Confirmation Modal
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // State for Citizen Profile Verification Modal
  const [citizenToVerify, setCitizenToVerify] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const [notification, setNotification] = useState({ show: false, type: "", message: "" });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const [usersData, citizensData] = await Promise.all([
        getAllUsers().catch(() => []),
        getAllCitizens().catch(() => [])
      ]);
      setUsers(usersData || []);
      setCitizens(citizensData || []);
    } catch (error) {
      console.error("Error fetching users/citizens:", error);
      showNotification("error", "Failed to load users list.");
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: "", message: "" });
    }, 4000);
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    const targetId = userToDelete.id || userToDelete._id;

    if (!targetId) {
      showNotification("error", "Invalid user ID.");
      return;
    }

    setIsDeleting(true);
    try {
      await deleteUser(targetId);
      setUsers((prev) => prev.filter((u) => (u.id || u._id) !== targetId));
      showNotification(
        "success",
        `User "${userToDelete.fullName || userToDelete.name || userToDelete.email}" deleted successfully.`
      );
      setUserToDelete(null);
    } catch (error) {
      console.error("Error deleting user:", error);
      showNotification("error", "Failed to delete user. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper to find citizen record by user email
  const getCitizenForUser = (userEmail) => {
    if (!userEmail) return null;
    return citizens.find(
      (c) => (c.email || "").toLowerCase() === userEmail.toLowerCase()
    );
  };

  // Handle Verify Citizen Action
  const handleConfirmVerification = async (isApproved) => {
    if (!citizenToVerify) return;
    const cid = citizenToVerify.citizenId || citizenToVerify.id;
    if (!cid) {
      showNotification("error", "Invalid citizen record ID.");
      return;
    }

    setIsVerifying(true);
    try {
      const statusStr = isApproved ? "Verified" : "Rejected";
      await verifyCitizen(cid, isApproved, statusStr, "Admin");

      // Update state locally
      setCitizens((prev) =>
        prev.map((c) =>
          (c.citizenId || c.id) === cid
            ? { ...c, isVerified: isApproved, status: statusStr }
            : c
        )
      );

      showNotification(
        "success",
        `Citizen profile for "${citizenToVerify.fullName}" ${isApproved ? "verified & approved" : "rejected"} successfully.`
      );
      setCitizenToVerify(null);
    } catch (err) {
      console.error("Verification failed:", err);
      showNotification("error", "Failed to update citizen verification status.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Extract unique wards for dropdown
  const uniqueWards = useMemo(() => {
    return Array.from(
      new Set(citizens.map((c) => c.wardId).filter(Boolean))
    ).sort();
  }, [citizens]);

  // Commercial detection helper
  const commercialRegex = /(store|shop|mart|commercial|enterprise|hotel|bakery|restaurant|agency|trader|traders|hall|bhavan|office|complex|press|mill|hospital|clinic|school|college)/i;

  // Filter logic
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const userName = user.fullName || user.name || "";
      const userPhone = user.phoneNumber || user.phone || "";
      const userEmail = user.email || "";

      const citizenRec = getCitizenForUser(userEmail);
      const isCitizenRole = (user.role || "Citizen").toLowerCase() === "citizen";
      const isPendingVerif =
        isCitizenRole &&
        citizenRec &&
        citizenRec.profileCompleted &&
        !citizenRec.isVerified &&
        citizenRec.status !== "Verified";

      // Ward Filter
      if (selectedWard !== "All") {
        if (!citizenRec || citizenRec.wardId !== selectedWard) return false;
      }

      // User Type Filter
      if (selectedType !== "All") {
        if (!isCitizenRole) return false;
        const text = `${citizenRec?.houseName || ""} ${citizenRec?.address || ""} ${userName}`;
        const isCommercial = commercialRegex.test(text);
        if (selectedType === "Commercial" && !isCommercial) return false;
        if (selectedType === "Household" && isCommercial) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = userName.toLowerCase().includes(q);
        const matchEmail = userEmail.toLowerCase().includes(q);
        const matchPhone = userPhone.includes(q);
        const matchHouse = (citizenRec?.houseName || "").toLowerCase().includes(q) || (citizenRec?.houseNumber || "").toLowerCase().includes(q);
        const matchWard = (citizenRec?.wardId || "").toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchPhone && !matchHouse && !matchWard) return false;
      }

      // Role Filter
      if (selectedRole === "All") return true;
      if (selectedRole === "Pending Verification") return isPendingVerif;
      return (user.role || "Citizen").toLowerCase() === selectedRole.toLowerCase();
    });
  }, [users, citizens, searchQuery, selectedRole, selectedWard, selectedType]);

  // Sort logic
  const sortedUsers = useMemo(() => {
    const list = [...filteredUsers];
    list.sort((a, b) => {
      let valA = "";
      let valB = "";

      if (sortField === "name") {
        valA = (a.fullName || a.name || "").toLowerCase();
        valB = (b.fullName || b.name || "").toLowerCase();
      } else if (sortField === "email") {
        valA = (a.email || "").toLowerCase();
        valB = (b.email || "").toLowerCase();
      } else if (sortField === "role") {
        valA = (a.role || "Citizen").toLowerCase();
        valB = (b.role || "Citizen").toLowerCase();
      } else if (sortField === "date") {
        valA = new Date(a.createdAt || 0).getTime();
        valB = new Date(b.createdAt || 0).getTime();
      } else if (sortField === "status") {
        const cA = getCitizenForUser(a.email);
        const cB = getCitizenForUser(b.email);
        valA = cA?.status || "Incomplete";
        valB = cB?.status || "Incomplete";
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredUsers, sortField, sortDirection, citizens]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedRole, selectedWard, selectedType, sortField, sortDirection]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / pageSize));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedUsers.slice(start, start + pageSize);
  }, [sortedUsers, currentPage, pageSize]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const citizenCount = users.filter(
    (u) => (u.role || "Citizen").toLowerCase() === "citizen"
  ).length;

  const pendingCount = citizens.filter(
    (c) => c.profileCompleted && !c.isVerified && c.status !== "Verified"
  ).length;

  const workerAdminCount = users.length - citizenCount;

  const getRoleBadgeStyle = (role) => {
    const r = (role || "Citizen").toLowerCase();
    if (r === "admin") {
      return "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800";
    }
    if (r === "worker") {
      return "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800";
    }
    return "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800";
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Toast Notification Banner */}
      {notification.show && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between shadow-md transition-all animate-fade-in ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200"
              : "bg-red-50 border-red-200 text-red-800 dark:bg-rose-950 dark:border-rose-800 dark:text-rose-200"
          }`}
        >
          <div className="flex items-center gap-3">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-rose-400 shrink-0" />
            )}
            <span className="text-sm font-semibold">{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification({ show: false, type: "", message: "" })}
            className="p-1 hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-[#0a4d2c] via-[#0f5b37] to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-700/40">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-emerald-200 text-xs font-semibold mb-2 backdrop-blur-xs">
              <Shield className="w-3.5 h-3.5 text-emerald-300" />
              <span>Citizen Registry & LSGD KYC Administration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Registered Users & Profile Verification
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium mt-1 max-w-2xl">
              Manage system accounts, inspect citizen residential addresses & GPS coordinates, verify household profiles, and monitor user permissions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer flex items-center gap-2 text-xs font-bold disabled:opacity-50"
              title="Refresh Users List"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh Registry</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => setSelectedRole("All")}
          className={`bg-white dark:bg-[#14231b] rounded-2xl p-4 sm:p-5 border-2 transition-all cursor-pointer shadow-xs flex items-center gap-3 sm:gap-4 ${
            selectedRole === "All"
              ? "border-[#0a4d2c] shadow-md ring-2 ring-emerald-500/30"
              : "border-emerald-800/15 dark:border-emerald-700/30"
          }`}
        >
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#0a4d2c] dark:text-emerald-300 flex items-center justify-center font-bold shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">Total Accounts</p>
            <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{users.length}</h3>
          </div>
        </div>

        <div
          onClick={() => setSelectedRole("Citizen")}
          className={`bg-white dark:bg-[#14231b] rounded-2xl p-4 sm:p-5 border-2 transition-all cursor-pointer shadow-xs flex items-center gap-3 sm:gap-4 ${
            selectedRole === "Citizen"
              ? "border-[#0a4d2c] shadow-md ring-2 ring-emerald-500/30"
              : "border-emerald-800/15 dark:border-emerald-700/30"
          }`}
        >
          <div className="w-11 h-11 rounded-xl bg-green-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">Citizens</p>
            <h3 className="text-xl sm:text-2xl font-black text-[#0a4d2c] dark:text-emerald-400">{citizenCount}</h3>
          </div>
        </div>

        <div
          onClick={() => setSelectedRole("Pending Verification")}
          className={`bg-white dark:bg-[#14231b] rounded-2xl p-4 sm:p-5 border-2 transition-all cursor-pointer shadow-xs flex items-center gap-3 sm:gap-4 ${
            selectedRole === "Pending Verification"
              ? "border-amber-500 bg-amber-50/40 dark:bg-amber-950/40 ring-2 ring-amber-400/30 shadow-md"
              : "border-emerald-800/15 dark:border-emerald-700/30"
          }`}
        >
          <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold relative shrink-0">
            <ShieldCheck className="w-5 h-5" />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
            )}
          </div>
          <div>
            <p className="text-[10px] text-amber-900 dark:text-amber-400 uppercase tracking-wider font-bold">Pending KYC</p>
            <h3 className="text-xl sm:text-2xl font-black text-amber-900 dark:text-amber-200">{pendingCount}</h3>
          </div>
        </div>

        <div
          onClick={() => setSelectedRole("Worker")}
          className={`bg-white dark:bg-[#14231b] rounded-2xl p-4 sm:p-5 border-2 transition-all cursor-pointer shadow-xs flex items-center gap-3 sm:gap-4 ${
            selectedRole === "Worker"
              ? "border-blue-500 shadow-md ring-2 ring-blue-400/30"
              : "border-emerald-800/15 dark:border-emerald-700/30"
          }`}
        >
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">Workers & Admins</p>
            <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{workerAdminCount}</h3>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-[#14231b] rounded-3xl p-5 border-2 border-emerald-800/15 dark:border-emerald-700/30 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Citizen Name, Email, Phone, House Name/Number, Ward..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#0c1510] border border-gray-200 dark:border-emerald-800 rounded-2xl text-xs font-semibold text-gray-800 dark:text-white focus:outline-none focus:border-[#0a4d2c] transition-all"
            />
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Role Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="bg-gray-50 dark:bg-[#0c1510] border border-gray-200 dark:border-emerald-800 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 dark:text-white focus:outline-none focus:border-[#0a4d2c] cursor-pointer"
              >
                <option value="All">All Roles</option>
                <option value="Pending Verification">Pending Verification ({pendingCount})</option>
                <option value="Citizen">Citizen</option>
                <option value="Worker">Worker</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            {/* Ward Filter */}
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                className="bg-gray-50 dark:bg-[#0c1510] border border-gray-200 dark:border-emerald-800 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 dark:text-white focus:outline-none focus:border-[#0a4d2c] cursor-pointer"
              >
                <option value="All">All Wards ({uniqueWards.length})</option>
                {uniqueWards.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>

            {/* User Type Filter */}
            <div className="flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-gray-50 dark:bg-[#0c1510] border border-gray-200 dark:border-emerald-800 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 dark:text-white focus:outline-none focus:border-[#0a4d2c] cursor-pointer"
              >
                <option value="All">All Types</option>
                <option value="Household">Household (Residential)</option>
                <option value="Commercial">Commercial (Shops / Units)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-emerald-900/60">
          <span>
            Showing <strong>{Math.min(sortedUsers.length, (currentPage - 1) * pageSize + 1)}–{Math.min(sortedUsers.length, currentPage * pageSize)}</strong> of <strong>{sortedUsers.length}</strong> matching users (Total {users.length})
          </span>
          {(searchQuery || selectedRole !== "All" || selectedWard !== "All" || selectedType !== "All") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedRole("All");
                setSelectedWard("All");
                setSelectedType("All");
              }}
              className="text-xs font-bold text-[#0a4d2c] dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-emerald-900/60">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-emerald-50/60 dark:bg-emerald-950/50 text-gray-600 dark:text-gray-300 uppercase text-[10px] font-black tracking-wider border-b border-gray-100 dark:border-emerald-900/60">
                <th onClick={() => handleSort("name")} className="p-3.5 text-left cursor-pointer hover:text-[#0a4d2c]">
                  <div className="flex items-center gap-1.5">
                    <span>User Profile</span>
                    {sortField === "name" ? (sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-[#0a4d2c]" /> : <ArrowDown className="w-3 h-3 text-[#0a4d2c]" />) : <ArrowUpDown className="w-3 h-3 text-gray-400" />}
                  </div>
                </th>
                <th className="p-3.5 text-left">Contact Info</th>
                <th onClick={() => handleSort("role")} className="p-3.5 text-left cursor-pointer hover:text-[#0a4d2c]">
                  <div className="flex items-center gap-1.5">
                    <span>Role</span>
                    {sortField === "role" ? (sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-[#0a4d2c]" /> : <ArrowDown className="w-3 h-3 text-[#0a4d2c]" />) : <ArrowUpDown className="w-3 h-3 text-gray-400" />}
                  </div>
                </th>
                <th className="p-3.5 text-left">Ward / Residence</th>
                <th onClick={() => handleSort("status")} className="p-3.5 text-left cursor-pointer hover:text-[#0a4d2c]">
                  <div className="flex items-center gap-1.5">
                    <span>KYC Verification</span>
                    {sortField === "status" ? (sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-[#0a4d2c]" /> : <ArrowDown className="w-3 h-3 text-[#0a4d2c]" />) : <ArrowUpDown className="w-3 h-3 text-gray-400" />}
                  </div>
                </th>
                <th onClick={() => handleSort("date")} className="p-3.5 text-left cursor-pointer hover:text-[#0a4d2c]">
                  <div className="flex items-center gap-1.5">
                    <span>Joined Date</span>
                    {sortField === "date" ? (sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-[#0a4d2c]" /> : <ArrowDown className="w-3 h-3 text-[#0a4d2c]" />) : <ArrowUpDown className="w-3 h-3 text-gray-400" />}
                  </div>
                </th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-emerald-950 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
                      <p className="font-semibold text-sm text-gray-700 dark:text-gray-300">Loading registered users...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => {
                  const uid = user.id || user._id || Math.random().toString();
                  const name = user.fullName || user.name || "N/A";
                  const phone = user.phoneNumber || user.phone || "Not provided";
                  const email = user.email || "N/A";
                  const role = user.role || "Citizen";
                  const citizenRec = getCitizenForUser(email);
                  const isCitizen = role.toLowerCase() === "citizen";

                  const isVerified = Boolean(
                    citizenRec?.isVerified || citizenRec?.status === "Verified"
                  );

                  const profileCompleted = Boolean(citizenRec?.profileCompleted);
                  const isPending = isCitizen && profileCompleted && !isVerified;

                  // Check if commercial
                  const text = `${citizenRec?.houseName || ""} ${citizenRec?.address || ""} ${name}`;
                  const isCommercial = commercialRegex.test(text);

                  return (
                    <tr
                      key={uid}
                      className={`hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors ${
                        isPending ? "bg-amber-50/40 dark:bg-amber-950/20" : ""
                      }`}
                    >
                      <td className="p-3.5 font-bold text-gray-800 dark:text-white">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#0a4d2c]/10 dark:bg-emerald-950 text-[#0a4d2c] dark:text-emerald-300 flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-200 dark:border-emerald-800">
                            {(name !== "N/A" ? name[0] : email[0] || "U").toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                              <span>{name}</span>
                              {isCommercial && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                                  Commercial
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-gray-400 font-mono">
                              ID: {uid ? `${uid.substring(0, 10)}...` : "N/A"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 space-y-1">
                        <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 font-medium">
                          <Mail className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                          <span>{email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                          <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{phone}</span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${getRoleBadgeStyle(
                            role
                          )}`}
                        >
                          {role}
                        </span>
                      </td>

                      <td className="p-3.5">
                        {citizenRec ? (
                          <div className="space-y-0.5">
                            <span className="font-bold text-gray-800 dark:text-gray-200 block">
                              {citizenRec.wardId || "Ward Unassigned"}
                            </span>
                            <span className="text-[10.5px] text-gray-500 dark:text-gray-400 block truncate max-w-[140px]">
                              {citizenRec.houseName || "House"} • #{citizenRec.houseNumber || "N/A"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-[11px]">—</span>
                        )}
                      </td>

                      <td className="p-3.5">
                        {isCitizen ? (
                          isVerified ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              Verified
                            </span>
                          ) : profileCompleted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800 animate-pulse">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                              Pending KYC
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">
                              Incomplete
                            </span>
                          )
                        ) : (
                          <span className="text-gray-400 text-[11px]">—</span>
                        )}
                      </td>

                      <td className="p-3.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span>
                            {user.createdAt
                              ? new Date(user.createdAt).toLocaleDateString(undefined, {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric"
                                })
                              : "N/A"}
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          {isCitizen && citizenRec && (
                            <button
                              onClick={() => setCitizenToVerify(citizenRec)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                                isPending
                                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                                  : "bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100 text-[#0a4d2c] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                              }`}
                              title="Inspect & Verify Profile"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>{isPending ? "Verify" : "Inspect"}</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteClick(user)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 transition-all font-semibold text-xs cursor-pointer shadow-2xs"
                            title="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Users className="w-8 h-8 text-emerald-300" />
                      <p className="font-semibold text-sm text-gray-700 dark:text-gray-300">No User Records Found</p>
                      <p className="text-xs text-gray-400">
                        No users match your current search and filter parameters.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {sortedUsers.length > 0 && (
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-gray-50 dark:bg-[#0c1510] border border-gray-200 dark:border-emerald-800 rounded-lg px-2.5 py-1 text-xs font-bold text-gray-800 dark:text-white focus:outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-emerald-800 text-xs font-bold text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) pageNum = i + 1;
                else if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      currentPage === pageNum
                        ? "bg-[#0a4d2c] text-white shadow-xs"
                        : "border border-gray-200 dark:border-emerald-800 text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-emerald-800 text-xs font-bold text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Citizen Profile Verification Inspection Modal */}
      {citizenToVerify && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#14231b] rounded-3xl p-6 max-w-lg w-full border border-emerald-100 dark:border-emerald-800 shadow-2xl space-y-5 animate-scale-up">
            
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-emerald-900/60 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#0a4d2c] dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800 font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Admin Citizen Verification</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Inspect residence address details before approving profile.</p>
                </div>
              </div>
              <button
                onClick={() => setCitizenToVerify(null)}
                className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Citizen Details View */}
            <div className="bg-gray-50 dark:bg-[#0c1510] p-4 rounded-2xl border border-gray-200 dark:border-emerald-900/60 text-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-emerald-900/60">
                <span className="font-bold text-gray-900 dark:text-white text-sm">{citizenToVerify.fullName}</span>
                <span className="font-mono text-[11px] bg-emerald-100 dark:bg-emerald-950 text-[#0a4d2c] dark:text-emerald-300 px-2 py-0.5 rounded font-bold">
                  ID: {citizenToVerify.citizenId || 'N/A'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase block">Email Address</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{citizenToVerify.email}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase block">Phone Number</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{citizenToVerify.phoneNumber || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase block">House Name</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{citizenToVerify.houseName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase block">House Number</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{citizenToVerify.houseNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase block">Panchayat / Local Body</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{citizenToVerify.panchayatName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase block">Ward ID / Number</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{citizenToVerify.wardId || 'N/A'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200 dark:border-emerald-900/60">
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase block mb-1">Residential Address</span>
                <p className="bg-white dark:bg-[#14231b] p-2.5 rounded-xl border border-gray-200 dark:border-emerald-800 text-gray-800 dark:text-gray-200 whitespace-pre-line font-medium">
                  {citizenToVerify.address || 'No address provided.'}
                </p>
              </div>

              {citizenToVerify.latitude && citizenToVerify.longitude ? (
                <div className="text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 p-2 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between font-mono font-bold">
                  <span>GPS Location Coordinates</span>
                  <span>Lat: {citizenToVerify.latitude.toFixed(5)}, Lng: {citizenToVerify.longitude.toFixed(5)}</span>
                </div>
              ) : null}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleConfirmVerification(false)}
                disabled={isVerifying}
                className="px-4 py-2 rounded-xl border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Reject Profile
              </button>

              <button
                type="button"
                onClick={() => handleConfirmVerification(true)}
                disabled={isVerifying}
                className="px-5 py-2.5 rounded-xl bg-[#0a4d2c] hover:bg-[#063820] text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Approve & Verify Profile</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#14231b] rounded-3xl p-6 max-w-md w-full border border-red-100 dark:border-rose-900 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center gap-3 text-red-600 border-b border-red-50 dark:border-rose-950 pb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-rose-950 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Confirm User Deletion</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">This operation cannot be reverted.</p>
              </div>
            </div>

            <div className="bg-red-50/60 dark:bg-rose-950/40 p-4 rounded-xl border border-red-100 dark:border-rose-900 text-xs space-y-2">
              <p className="text-gray-700 dark:text-gray-300">
                Are you sure you want to permanently delete the following user account?
              </p>
              <div className="bg-white dark:bg-[#0c1510] p-3 rounded-lg border border-red-200/80 dark:border-rose-800 space-y-1">
                <p className="font-bold text-gray-900 dark:text-white">
                  Name: <span className="font-normal">{userToDelete.fullName || userToDelete.name || "N/A"}</span>
                </p>
                <p className="font-bold text-gray-900 dark:text-white">
                  Email: <span className="font-normal">{userToDelete.email}</span>
                </p>
                <p className="font-bold text-gray-900 dark:text-white">
                  Role: <span className="font-normal">{userToDelete.role || "Citizen"}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDeleteUser}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete User</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllUsers;