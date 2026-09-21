import React, { useState, useMemo } from 'react';
import {
  Bell,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Truck,
  FileText,
  Clock,
  CheckCheck,
  Trash2,
  Filter,
  Info,
  ArrowRight,
  ShieldCheck,
  Megaphone
} from 'lucide-react';

const WorkerNotifications = ({ wardId, workerId, setActiveTab }) => {
  // Built-in field operational notification alerts
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      type: 'new_pickup',
      title: 'New Pickup Request Submitted',
      message: 'Citizen Akshay Krishnan (House 629, Cheruvally) submitted dry plastic collection request REQ793775.',
      time: '15 mins ago',
      category: 'Pickups',
      priority: 'high',
      read: false,
      requestId: 'REQ793775'
    },
    {
      id: 'notif-2',
      type: 'rescheduled',
      title: 'Collection Window Scheduled',
      message: 'Scheduled doorstep pickup for Ward 12 confirmed for Friday, Sep 18, 2026. Please prepare collection bags.',
      time: '2 hours ago',
      category: 'Schedule',
      priority: 'medium',
      read: false
    },
    {
      id: 'notif-3',
      type: 'instruction',
      title: 'Haritha Karma Sena Directive: Seasonal Plastics',
      message: 'LSGD circular: Ensure citizens have thoroughly cleaned and dried all milk packets and food wrappers before bundling.',
      time: '1 day ago',
      category: 'Instructions',
      priority: 'normal',
      read: true
    },
    {
      id: 'notif-4',
      type: 'alert',
      title: 'Previous Cycle Expired',
      message: 'Uncompleted collection request REQ514728 from August 2026 marked as Failed to Complete due to month transition.',
      time: '2 days ago',
      category: 'Alerts',
      priority: 'high',
      read: true
    },
    {
      id: 'notif-5',
      type: 'instruction',
      title: 'User Fee Collection Update',
      message: 'Monthly user fee of ₹50 can be verified directly via cash upon collection with instant digital receipt generation.',
      time: '3 days ago',
      category: 'Instructions',
      priority: 'normal',
      read: true
    }
  ]);

  const [selectedFilter, setSelectedFilter] = useState('All'); // 'All' | 'Unread' | 'Pickups' | 'Schedule' | 'Instructions'

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (selectedFilter === 'Unread') return !n.read;
      if (selectedFilter === 'Pickups') return n.category === 'Pickups';
      if (selectedFilter === 'Schedule') return n.category === 'Schedule';
      if (selectedFilter === 'Instructions') return n.category === 'Instructions';
      return true;
    });
  }, [notifications, selectedFilter]);

  const handleMarkAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDeleteNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'new_pickup':
        return <Truck className="w-5 h-5 text-emerald-600" />;
      case 'rescheduled':
        return <Calendar className="w-5 h-5 text-blue-600" />;
      case 'alert':
        return <AlertCircle className="w-5 h-5 text-rose-600" />;
      case 'instruction':
        return <Megaphone className="w-5 h-5 text-amber-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-[#0a4d2c] via-[#0f5b37] to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-emerald-200 text-xs font-semibold">
            <Bell className="w-3.5 h-3.5 text-emerald-300" />
            <span>Field Communications & Notifications</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400 text-amber-950">
                {unreadCount} New
              </span>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 font-medium max-w-xl">
            Live alerts for new pickup assignments, schedule changes, cancellations, and official collection instructions.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2.5 bg-white text-[#0a4d2c] hover:bg-emerald-50 font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0 self-start sm:self-center"
          >
            <CheckCheck className="w-4 h-4 text-[#0a4d2c]" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-emerald-100 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {['All', 'Unread', 'Pickups', 'Schedule', 'Instructions'].map((tab) => {
            const isActive = selectedFilter === tab;
            const count =
              tab === 'All'
                ? notifications.length
                : tab === 'Unread'
                ? unreadCount
                : notifications.filter((n) => n.category === tab).length;

            return (
              <button
                key={tab}
                onClick={() => setSelectedFilter(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#0a4d2c] text-white shadow-2xs'
                    : 'bg-gray-100 hover:bg-emerald-50 text-gray-700'
                }`}
              >
                <span>{tab}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <span className="text-xs text-gray-500 font-medium">
          Showing {filteredNotifications.length} alerts
        </span>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-emerald-100 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0a4d2c] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-800">All Caught Up!</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              No notifications matching your filter at the moment.
            </p>
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                !n.read
                  ? 'bg-emerald-50/70 border-emerald-300 shadow-xs'
                  : 'bg-white border-gray-200/80 hover:border-emerald-200'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className={`p-2.5 rounded-2xl shrink-0 mt-0.5 ${
                  n.type === 'new_pickup'
                    ? 'bg-emerald-100'
                    : n.type === 'rescheduled'
                    ? 'bg-blue-100'
                    : n.type === 'alert'
                    ? 'bg-rose-100'
                    : 'bg-amber-100'
                }`}>
                  {getIcon(n.type)}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-extrabold text-gray-900">{n.title}</h3>
                    {!n.read && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white">
                        NEW
                      </span>
                    )}
                    {n.priority === 'high' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        High Priority
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed max-w-2xl">{n.message}</p>
                  <div className="flex items-center gap-3 text-[11px] text-gray-400 font-medium pt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      {n.time}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-[#0a4d2c]">{n.category}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {n.type === 'new_pickup' && setActiveTab && (
                  <button
                    onClick={() => {
                      handleMarkAsRead(n.id);
                      setActiveTab('Pickup Requests');
                    }}
                    className="px-3 py-1.5 bg-[#0a4d2c] hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Pickups</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {!n.read && (
                  <button
                    onClick={() => handleMarkAsRead(n.id)}
                    className="p-1.5 text-gray-400 hover:text-emerald-800 hover:bg-emerald-100/50 rounded-lg transition-colors cursor-pointer"
                    title="Mark as read"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => handleDeleteNotification(n.id)}
                  className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Dismiss alert"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WorkerNotifications;
