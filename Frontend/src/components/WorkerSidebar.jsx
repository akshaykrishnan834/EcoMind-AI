import React, { useState } from 'react';
import {
  LayoutGrid,
  LogOut,
  ChevronRight,
  Menu,
  X,
  User,
  Users,
  Truck,
  History,
  Bell,
  IndianRupee,
  MapPin,
  BarChart3,
  Map as MapIcon,
  Leaf,
  Route,
  MessageSquare
} from 'lucide-react';

const WorkerSidebar = ({
  activeItem = 'Dashboard',
  setActiveItem,
  onLogout,
  isOpen = false,
  onClose,
  isCollapsed: controlledIsCollapsed,
  onToggleCollapse
}) => {
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(false);
  const isCollapsed = controlledIsCollapsed !== undefined ? controlledIsCollapsed : internalIsCollapsed;
  const toggleCollapse = onToggleCollapse || (() => setInternalIsCollapsed(!internalIsCollapsed));

  const userObj = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = userObj.fullName || localStorage.getItem('userName') || 'Worker';

  const menuItems = [
    { id: 'Dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'Smart Collection', label: 'Smart Collection', icon: Route, badge: 'AI' },
    { id: 'Collection Map', label: 'Collection Map', icon: MapIcon },
    { id: 'Pickup Requests', label: 'Plastic Pickups', icon: Truck },
    { id: 'Messages', label: 'Citizen Chat', icon: MessageSquare },
    { id: 'Collection History', label: 'Collection History', icon: History },
    { id: 'Notifications', label: 'Notifications', icon: Bell },
    { id: 'Payment Collection', label: 'Payment Collection', icon: IndianRupee, badge: '₹' },
    { id: 'My Location', label: 'My Location / Zone', icon: MapPin },
    { id: 'Assigned Citizens', label: 'Ward Citizens', icon: Users },

  ];

  const handleItemClick = (item) => {
    if (setActiveItem) {
      setActiveItem(item.id);
    }
    if (onClose && window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`${isCollapsed ? 'w-20' : 'w-[260px]'
          } bg-white dark:bg-[#181b20] border-r border-gray-200/80 dark:border-white/10 text-gray-800 dark:text-gray-100 flex flex-col justify-between shrink-0 h-full overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'fixed inset-y-0 left-0 z-50' : 'hidden lg:flex'
          }`}
      >
        {/* Top Fixed Section: Worker Profile & Menu Toggle in One Line */}
        <div className="shrink-0 px-2.5 pt-3 pb-2 bg-white dark:bg-[#181b20]">
          <div
            className={`w-full bg-gray-50/80 dark:bg-[#20252b]/80 border border-gray-200/70 dark:border-white/5 rounded-2xl ${
              isCollapsed ? 'p-1.5 flex flex-col items-center gap-2' : 'p-2 flex items-center justify-between gap-2'
            } transition-all`}
          >
            {/* User Info (Avatar + Worker Name) */}
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5 min-w-0 flex-1'}`}>
              <div className="relative shrink-0">
                <div className="w-8.5 h-8.5 rounded-full bg-[#0a4d2c] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {userName[0] ? userName[0].toUpperCase() : <User className="w-4 h-4 text-white" />}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#65a30d] text-white flex items-center justify-center border-2 border-white dark:border-[#16271e] shadow-xs">
                  <Leaf className="w-1.5 h-1.5 fill-current text-white" />
                </div>
              </div>

              {!isCollapsed && (
                <div className="min-w-0 text-left">
                  <p className="text-[13px] font-bold text-gray-900 dark:text-gray-100 truncate leading-tight">
                    {userName}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 truncate">
                      Haritha Karma Sena
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Three Bars Collapse / Close Toggle */}
            <div className="flex items-center shrink-0">
              <button
                onClick={toggleCollapse}
                className="hidden lg:flex items-center justify-center p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-white/5 text-[#064e3b] dark:text-emerald-400 transition-colors cursor-pointer"
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <Menu className="w-4 h-4 text-[#064e3b] dark:text-emerald-400" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 lg:hidden shrink-0"
                title="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Middle Section: Navigation Items */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar px-2.5 py-2 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id || activeItem === item.label;

            return (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => handleItemClick(item)}
                  className={`w-full relative flex items-center ${isCollapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-1.5'
                    } rounded-xl transition-all duration-200 cursor-pointer overflow-hidden ${isActive
                      ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-xs font-bold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#20252b] hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  <div
                    className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5 min-w-0'
                      } relative z-10`}
                  >
                    {isActive ? (
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0">
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:bg-emerald-100/80 dark:group-hover:bg-emerald-500/20 transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                    )}

                    {!isCollapsed && (
                      <span
                        className={`text-[12.5px] font-semibold truncate ${isActive
                          ? 'text-white font-bold'
                          : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'
                          }`}
                      >
                        {item.label}
                      </span>
                    )}
                  </div>

                  {!isCollapsed && (
                    <div className="flex items-center gap-1.5 relative z-10 shrink-0 ml-1">
                      {item.badge && !isActive && (
                        <span className="w-5 h-5 rounded-full bg-emerald-100/80 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold flex items-center justify-center shadow-2xs">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight
                        className={`w-3.5 h-3.5 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                          }`}
                      />
                    </div>
                  )}
                </button>

                {/* Collapsed Mode Floating Tooltip */}
                {isCollapsed && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50 whitespace-nowrap">
                    {item.label}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Fixed Bottom Section: Scenic Card & Log Out Button */}
        <div className="shrink-0 px-3 pt-2 pb-3 space-y-2 bg-white dark:bg-[#181b20]">
          {/* Compact Scenic Card */}
          {!isCollapsed && (
            <div className="relative rounded-2xl bg-gradient-to-b from-[#eaf6ee] via-[#dff2e5] to-[#cfe6d6] dark:from-[#162a1f] dark:via-[#13231a] dark:to-[#0f1b14] p-3 overflow-hidden">
              <div className="flex items-center gap-2 relative z-10">
                <div className="w-7 h-7 rounded-full bg-[#d2ebd7] dark:bg-[#1f3a2b] flex items-center justify-center text-[#065f46] dark:text-emerald-400 shrink-0">
                  <Leaf className="w-3.5 h-3.5 fill-current" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[11.5px] font-bold text-[#064e3b] dark:text-emerald-300 leading-tight">
                    Together for a Cleaner Tomorrow
                  </h4>
                  <p className="text-[9.5px] font-medium text-emerald-800/80 dark:text-emerald-400/80 mt-0.5">
                    Reduce • Reuse • Recycle
                  </p>
                </div>
              </div>

              {/* Compact Kerala Backwaters Vector Silhouette */}
              <div className="relative -mx-3 -mb-3 mt-1.5 overflow-hidden select-none pointer-events-none opacity-80 dark:opacity-40">
                <svg
                  viewBox="0 0 320 52"
                  className="w-full h-auto block"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M0 38 Q 65 24 135 32 T 265 28 T 320 30 L 320 52 L 0 52 Z"
                    fill="#9ecaa6"
                    fillOpacity="0.4"
                  />
                  <g fill="#77b083" fillOpacity="0.65">
                    <polygon points="34,36 50,28 66,36" />
                    <rect x="38" y="36" width="24" height="8" rx="1" />

                    <path d="M22 44 Q 24 32 20 22 Q 19 20 23 21 Q 26 32 25 44 Z" />
                    <path d="M21 21 C 15 16 5 18 1 22 C 7 21 15 20 21 21 Z" />
                    <path d="M21 21 C 16 12 8 10 3 14 C 10 14 16 16 21 21 Z" />
                    <path d="M21 21 C 22 9 29 9 33 13 C 29 14 25 16 21 21 Z" />
                    <path d="M21 21 C 26 14 37 15 41 19 C 34 20 27 21 21 21 Z" />

                    <path d="M298 44 Q 295 32 299 22 Q 301 20 297 21 Q 293 32 295 44 Z" />
                    <path d="M298 22 C 291 16 282 18 278 22 C 284 22 292 21 298 22 Z" />
                    <path d="M298 22 C 294 13 286 12 281 15 C 288 15 294 17 298 22 Z" />
                    <path d="M298 22 C 300 10 307 11 311 14 C 307 15 303 17 298 22 Z" />
                  </g>

                  <path
                    d="M0 43 Q 90 42 180 44 T 320 43 L 320 52 L 0 52 Z"
                    fill="#629e6e"
                    fillOpacity="0.45"
                  />

                  <g fill="#2d6439" fillOpacity="0.85">
                    <path d="M215 46 C 220 47 248 48 262 46 C 265 45 264 44 261 44 C 247 46 223 46 216 44 C 214 44 213 45 215 46 Z" />
                    <circle cx="250" cy="41" r="1.6" />
                    <path d="M248 43 L 252 43 L 251 46 L 247 46 Z" />
                    <line
                      x1="252"
                      y1="42"
                      x2="257"
                      y2="48"
                      stroke="#2d6439"
                      strokeWidth="0.9"
                      strokeLinecap="round"
                    />
                  </g>

                  <line
                    x1="150"
                    y1="47"
                    x2="190"
                    y2="47"
                    stroke="#a0cea8"
                    strokeWidth="0.8"
                    strokeLinecap="round"
                    strokeOpacity="0.8"
                  />
                  <line
                    x1="225"
                    y1="48"
                    x2="252"
                    y2="48"
                    stroke="#a0cea8"
                    strokeWidth="0.8"
                    strokeLinecap="round"
                    strokeOpacity="0.8"
                  />
                </svg>
              </div>
            </div>
          )}

          {/* Log Out Button */}
          <button
            onClick={onLogout}
            className={`w-full rounded-xl bg-gray-50 hover:bg-red-50 dark:bg-[#20252b] dark:hover:bg-red-950/30 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 border border-gray-200/70 dark:border-white/5 font-bold text-xs ${isCollapsed ? 'py-2.5 px-2 justify-center' : 'py-2.5 px-3 justify-center gap-2'
              } flex items-center transition-all cursor-pointer group`}
            title="Log Out"
          >
            <LogOut className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400 group-hover:-translate-x-0.5 transition-transform shrink-0" />
            {!isCollapsed && <span>Log Out</span>}
          </button>

          {/* Collapsed Mode Floating Tooltip */}
          {isCollapsed && (
            <div className="absolute left-full bottom-3 ml-3 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50 whitespace-nowrap">
              Log Out
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default WorkerSidebar;
