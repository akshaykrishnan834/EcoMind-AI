import React, { useEffect, useState } from "react";
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
  AlertCircle
} from "lucide-react";
import { getAllUsers, deleteUser } from "../../services/userService";

const AllUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("All");

  // State for Delete Confirmation Modal
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: "", message: "" });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
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

  // Filter logic
  const filteredUsers = users.filter((user) => {
    const userName = user.fullName || user.name || "";
    const userPhone = user.phoneNumber || user.phone || "";
    const userEmail = user.email || "";

    const matchesSearch =
      searchQuery === "" ||
      userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      userPhone.includes(searchQuery);

    const matchesRole =
      selectedRole === "All" ||
      (user.role || "Citizen").toLowerCase() === selectedRole.toLowerCase();

    return matchesSearch && matchesRole;
  });

  const citizenCount = users.filter(
    (u) => (u.role || "Citizen").toLowerCase() === "citizen"
  ).length;

  const workerAdminCount = users.length - citizenCount;

  const getRoleBadgeStyle = (role) => {
    const r = (role || "Citizen").toLowerCase();
    if (r === "admin") {
      return "bg-amber-100 text-amber-900 border-amber-300";
    }
    if (r === "worker") {
      return "bg-blue-100 text-blue-900 border-blue-300";
    }
    return "bg-emerald-100 text-emerald-900 border-emerald-300";
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {notification.show && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between shadow-md transition-all animate-fade-in ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-3">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
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
      <div className="bg-white rounded-2xl p-6 border border-emerald-100/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#0a4d2c]" />
            Registered Users Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            View system users, inspect accounts, and remove user profiles when needed
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="p-2.5 rounded-lg border border-gray-200 hover:bg-emerald-50 text-gray-600 hover:text-[#0a4d2c] transition-colors cursor-pointer flex items-center gap-2 text-xs font-semibold disabled:opacity-50"
            title="Refresh Users List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
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
            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Total Accounts</p>
            <h3 className="text-2xl font-extrabold text-gray-800">{users.length}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-emerald-100/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 text-emerald-700 flex items-center justify-center font-bold">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Citizens</p>
            <h3 className="text-2xl font-extrabold text-emerald-800">{citizenCount}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-emerald-100/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Workers & Admins</p>
            <h3 className="text-2xl font-extrabold text-gray-800">{workerAdminCount}</h3>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl p-5 border border-emerald-100/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Name, Email, or Phone..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition-all"
            />
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-1.5 w-full md:w-auto justify-end">
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white cursor-pointer"
            >
              <option value="All">All Roles</option>
              <option value="Citizen">Citizen</option>
              <option value="Worker">Worker</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-200 rounded-xl overflow-hidden text-xs">
            <thead className="bg-[#0a4d2c] text-white">
              <tr>
                <th className="p-3.5 text-left font-bold uppercase tracking-wider">User Profile</th>
                <th className="p-3.5 text-left font-bold uppercase tracking-wider">Contact Info</th>
                <th className="p-3.5 text-left font-bold uppercase tracking-wider">Role</th>
                <th className="p-3.5 text-left font-bold uppercase tracking-wider">Joined Date</th>
                <th className="p-3.5 text-center font-bold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
                      <p className="font-semibold text-sm text-gray-700">Loading registered users...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const uid = user.id || user._id || Math.random().toString();
                  const name = user.fullName || user.name || "N/A";
                  const phone = user.phoneNumber || user.phone || "Not provided";
                  const email = user.email || "N/A";
                  const role = user.role || "Citizen";

                  return (
                    <tr
                      key={uid}
                      className="hover:bg-emerald-50/60 transition-colors"
                    >
                      <td className="p-3.5 font-bold text-gray-800">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#0a4d2c]/10 text-[#0a4d2c] flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-200">
                            {(name !== "N/A" ? name[0] : email[0] || "U").toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{name}</p>
                            <p className="text-[10px] text-gray-400 font-mono">
                              ID: {uid ? `${uid.substring(0, 10)}...` : "N/A"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 space-y-1">
                        <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                          <Mail className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>{email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500">
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

                      <td className="p-3.5 text-gray-500">
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

                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleDeleteClick(user)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 transition-all font-semibold text-xs cursor-pointer shadow-2xs"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Users className="w-8 h-8 text-emerald-300" />
                      <p className="font-semibold text-sm text-gray-700">No User Records Found</p>
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
      </div>

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-red-100 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center gap-3 text-red-600 border-b border-red-50 pb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Confirm User Deletion</h3>
                <p className="text-xs text-gray-500">This operation cannot be reverted.</p>
              </div>
            </div>

            <div className="bg-red-50/60 p-4 rounded-xl border border-red-100 text-xs space-y-2">
              <p className="text-gray-700">
                Are you sure you want to permanently delete the following user account?
              </p>
              <div className="bg-white p-3 rounded-lg border border-red-200/80 space-y-1">
                <p className="font-bold text-gray-900">
                  Name: <span className="font-normal">{userToDelete.fullName || userToDelete.name || "N/A"}</span>
                </p>
                <p className="font-bold text-gray-900">
                  Email: <span className="font-normal">{userToDelete.email}</span>
                </p>
                <p className="font-bold text-gray-900">
                  Role: <span className="font-normal">{userToDelete.role || "Citizen"}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
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