import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  HardHat,
  Truck,
  CreditCard,
  BarChart2,
  MapPin,
  Brain,
  Megaphone,
  Settings,
  FileText,
  HelpCircle,
  LogOut,
  ChevronRight,
  ChevronDown,
  Leaf,
  X,
  User
} from 'lucide-react';

const AdminSidebar = ({ activeItem = 'Dashboard', setActiveItem, onLogout, isOpen = false, onClose }) => {
  const [openSubmenu, setOpenSubmenu] = useState(null);

  const menuItems = [
    { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
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
      setOpenSubmenu(openSubmenu === item.id ? null : item.id);
    }
    if (setActiveItem) {
      setActiveItem(item.id);
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
        className={`w-64 bg-white text-gray-800 flex flex-col justify-between border-r border-emerald-100/80 shadow-xs shrink-0 min-h-[calc(100vh-115px)] ${isOpen ? 'fixed inset-y-0 left-0 z-50' : 'hidden lg:flex'
          }`}
      >
        {/* Top Header & Profile Section */}
        <div className="p-4 border-b border-emerald-100/80 bg-emerald-50/50">

          {/* Mobile Close Button */}
          <div className="flex justify-end lg:hidden mb-2">
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-emerald-100 text-gray-500 hover:text-emerald-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Administrator Profile */}
          <div className="flex items-center gap-3">

            <div className="w-12 h-12 rounded-full bg-[#0a4d2c] flex items-center justify-center shadow-md">
              <User className="w-6 h-6 text-white" />
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-wider text-[#0a4d2c] font-bold">
                Administrator
              </p>

              <h2 className="text-sm font-bold text-gray-800">
                Admin Panel
              </h2>
            </div>

          </div>

        </div>

        {/* Navigation Items List */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            const isSubmenuOpen = openSubmenu === item.id;

            return (
              <div key={item.id} className="space-y-1">
                <button
                  onClick={() => handleItemClick(item)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${isActive
                    ? 'bg-[#0a4d2c] text-white font-semibold shadow-sm border-l-4 border-emerald-400'
                    : 'text-gray-700 hover:bg-emerald-50/80 hover:text-[#0a4d2c]'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${isActive ? 'text-emerald-300' : 'text-emerald-700 group-hover:text-[#0a4d2c]'
                        }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.hasSubmenu && (
                    <div className={isActive ? 'text-emerald-200' : 'text-gray-400'}>
                      {isSubmenuOpen ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </div>
                  )}
                </button>

                {/* Submenu items if expanded */}
                {item.hasSubmenu && isSubmenuOpen && (
                  <div className="pl-9 pr-2 py-1 space-y-1 animate-slide-up bg-emerald-50/50 rounded-lg my-1 border border-emerald-100/60">
                    {item.subItems.map((sub, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveItem && setActiveItem(`${item.id} > ${sub}`)}
                        className="w-full text-left py-1.5 px-2 rounded-md text-[11px] text-gray-600 hover:text-[#0a4d2c] hover:bg-emerald-100/60 font-medium transition-colors"
                      >
                        • {sub}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {/* Log Out Button */}
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-200/80 text-xs font-semibold text-[#0a4d2c] hover:text-emerald-950 transition-all cursor-pointer shadow-2xs group mt-4"
          >
            <LogOut className="w-3.5 h-3.5 text-emerald-700 group-hover:text-[#0a4d2c] transition-colors" />
            <span>Log Out</span>
          </button>
        </nav>

      </aside>
    </>
  );
};

export default AdminSidebar;
