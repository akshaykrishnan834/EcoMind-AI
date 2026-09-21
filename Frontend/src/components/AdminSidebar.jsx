import React, { useState } from 'react';
import {
  LayoutGrid,
  Users,
  HardHat,
  MapPin,
  LogOut,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  User,
  Truck,
  Calendar,
  IndianRupee,
  BarChart3,
  Leaf
} from 'lucide-react';

const AdminSidebar = ({
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

  const [openSubmenu, setOpenSubmenu] = useState(null);

  const menuItems = [
    { id: 'Dashboard', label: 'Dashboard', icon: LayoutGrid },
    {
      id: 'Pickup Management',
      label: 'Pickup Management',
      icon: Truck
    },
    {
      id: 'Collection Schedule',
      label: 'Collection Schedule',
      icon: Calendar
    },
    {
      id: 'Payments',
      label: 'Payments',
      icon: IndianRupee,
      badge: '₹'
    },
    {
      id: 'Reports',
      label: 'Reports',
      icon: BarChart3
    },
    {
      id: 'Panchayat Desk',
      label: 'Panchayat Desk',
      icon: MapPin,
      hasSubmenu: true,
      subItems: ['Panchayt Info', 'All Wards']
    },
    {
      id: 'Worker Desk',
      label: 'Worker Desk',
      icon: HardHat,
      hasSubmenu: true,
      subItems: ['Worker Details', 'Create Worker Login']
    },
    {
      id: 'Users',
      label: 'Users',
      icon: Users
    }
  ];

  const handleItemClick = (item) => {
    if (item.hasSubmenu) {
      if (isCollapsed) {
        toggleCollapse();
      }
      setOpenSubmenu(openSubmenu === item.id ? null : item.id);
    }
    if (setActiveItem) {
      setActiveItem(item.id);
    }
    if (onClose && window.innerWidth < 1024 && !item.hasSubmenu) {
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
        className={`${
          isCollapsed ? 'w-20' : 'w-[260px]'
        } bg-white text-gray-800 flex flex-col justify-between border-r border-emerald-100/90 shadow-sm shrink-0 h-full overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'fixed inset-y-0 left-0 z-50' : 'hidden lg:flex'
        }`}
      >
        {/* Top Fixed Section: Collapse Button & Admin Profile */}
        <div className="shrink-0 px-3 pt-2.5 pb-2 space-y-2 border-b border-gray-100/60 bg-white">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            {!isCollapsed && (
              <span className="text-[10.5px] font-bold tracking-wider uppercase text-emerald-800/60 px-1">
                Admin Menu
              </span>
            )}
            <div className="flex items-center">
              <button
                onClick={toggleCollapse}
                className="hidden lg:flex items-center justify-center p-1.5 rounded-lg hover:bg-emerald-50 text-[#064e3b] transition-colors cursor-pointer"
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <Menu className="w-4 h-4 text-[#064e3b]" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 lg:hidden ml-auto shrink-0"
                title="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Admin Profile Card */}
          <div
            className={`w-full bg-[#f4f9f5] border border-emerald-100/70 rounded-xl ${
              isCollapsed ? 'p-1.5 flex justify-center' : 'p-2.5 flex items-center justify-between'
            } transition-all shadow-2xs`}
          >
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5 min-w-0'}`}>
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full bg-[#0a4d2c] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#65a30d] text-white flex items-center justify-center border border-white shadow-2xs">
                  <Leaf className="w-2 h-2 fill-current text-white" />
                </div>
              </div>

              {!isCollapsed && (
                <div className="min-w-0 text-left">
                  <p className="text-[13px] font-bold text-gray-900 truncate leading-tight">
                    Administrator
                  </p>
                  <p className="text-[11px] text-gray-500 font-medium leading-tight mt-0.5">
                    Admin Panel
                  </p>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-1" />
            )}
          </div>
        </div>

        {/* Scrollable Middle Section: Navigation Items */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar px-2.5 py-2 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeItem === item.id ||
              activeItem.startsWith(item.id) ||
              (item.id === 'Pickup Management' &&
                (activeItem === 'Pickup Requests' || activeItem === 'Waste Pickups'));
            const isSubmenuOpen = openSubmenu === item.id;

            return (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => handleItemClick(item)}
                  className={`w-full relative flex items-center ${
                    isCollapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-1.5'
                  } rounded-xl transition-all duration-200 cursor-pointer overflow-hidden ${
                    isActive
                      ? 'bg-gradient-to-r from-[#064e3b] via-[#06543f] to-[#047857] text-white shadow-sm'
                      : 'text-gray-800 hover:bg-emerald-50/70'
                  }`}
                >
                  {isActive && (
                    <div className="absolute right-5 -bottom-2 pointer-events-none opacity-20 text-emerald-200">
                      <svg
                        className="w-12 h-12 fill-current transform -rotate-12"
                        viewBox="0 0 24 24"
                      >
                        <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2-11 5-4 4-4 8-4 8s2-5 10-8Z" />
                      </svg>
                    </div>
                  )}

                  <div
                    className={`flex items-center ${
                      isCollapsed ? 'justify-center' : 'gap-2.5 min-w-0'
                    } relative z-10`}
                  >
                    {isActive ? (
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0">
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-[#e8f5ec] text-[#0a4d2c] flex items-center justify-center shrink-0 group-hover:bg-[#d8eedf] transition-colors">
                        <Icon className="w-4 h-4 text-[#0a4d2c]" />
                      </div>
                    )}

                    {!isCollapsed && (
                      <span
                        className={`text-[12.5px] font-semibold truncate ${
                          isActive
                            ? 'text-white font-bold'
                            : 'text-gray-800 group-hover:text-emerald-950'
                        }`}
                      >
                        {item.label}
                      </span>
                    )}
                  </div>

                  {!isCollapsed && (
                    <div className="flex items-center gap-1.5 relative z-10 shrink-0 ml-1">
                      {item.badge && !isActive && (
                        <span className="w-5 h-5 rounded-full bg-[#dcf2e3] text-[#065f46] text-[11px] font-bold flex items-center justify-center shadow-2xs">
                          {item.badge}
                        </span>
                      )}

                      {item.hasSubmenu ? (
                        isSubmenuOpen ? (
                          <ChevronDown
                            className={`w-3.5 h-3.5 ${
                              isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'
                            }`}
                          />
                        ) : (
                          <ChevronRight
                            className={`w-3.5 h-3.5 ${
                              isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'
                            }`}
                          />
                        )
                      ) : (
                        <ChevronRight
                          className={`w-3.5 h-3.5 ${
                            isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'
                          }`}
                        />
                      )}
                    </div>
                  )}
                </button>

                {/* Submenu for dropdown items */}
                {!isCollapsed && item.hasSubmenu && isSubmenuOpen && (
                  <div className="ml-5 mt-1 pl-3 border-l-2 border-emerald-300 py-1 space-y-1">
                    {item.subItems.map((sub, idx) => {
                      const isSubActive =
                        activeItem === `${item.id} > ${sub}` || activeItem === sub;
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            if (setActiveItem) setActiveItem(`${item.id} > ${sub}`);
                            if (onClose && window.innerWidth < 1024) onClose();
                          }}
                          className={`w-full text-left py-1 px-2.5 rounded-lg text-xs font-medium transition-all ${
                            isSubActive
                              ? 'bg-[#ebf6ed] text-[#0a4d2c] font-bold'
                              : 'text-gray-600 hover:text-[#0a4d2c] hover:bg-emerald-50'
                          }`}
                        >
                          • {sub}
                        </button>
                      );
                    })}
                  </div>
                )}

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
        <div className="shrink-0 px-3 pt-2 pb-2.5 space-y-2 border-t border-emerald-50 bg-white">
          {/* Compact Scenic Card */}
          {!isCollapsed && (
            <div className="relative rounded-xl bg-gradient-to-b from-[#eaf6ee] via-[#dff2e5] to-[#cfe6d6] border border-emerald-200/60 p-2.5 overflow-hidden shadow-2xs">
              <div className="flex items-center gap-2 relative z-10">
                <div className="w-7 h-7 rounded-full bg-[#d2ebd7] flex items-center justify-center text-[#065f46] shrink-0 shadow-2xs">
                  <Leaf className="w-3.5 h-3.5 fill-current text-[#065f46]" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[11.5px] font-bold text-[#064e3b] leading-tight">
                    Together for a Cleaner Tomorrow
                  </h4>
                  <p className="text-[9.5px] font-medium text-emerald-800/80 mt-0.5">
                    Reduce • Reuse • Recycle
                  </p>
                </div>
              </div>

              {/* Compact Kerala Backwaters Vector Silhouette */}
              <div className="relative -mx-2.5 -mb-2.5 mt-1 overflow-hidden select-none pointer-events-none">
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
            className={`w-full rounded-full border border-emerald-300/80 bg-[#f4faf6] hover:bg-emerald-100/70 text-[#064e3b] font-bold text-xs ${
              isCollapsed ? 'py-2.5 px-2 justify-center' : 'py-2 px-3 justify-center gap-2'
            } flex items-center transition-all cursor-pointer shadow-2xs group`}
            title="Log Out"
          >
            <LogOut className="w-3.5 h-3.5 text-[#064e3b] group-hover:-translate-x-0.5 transition-transform shrink-0" />
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

export default AdminSidebar;
