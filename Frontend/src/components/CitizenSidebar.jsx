import React, { useState } from 'react';
import {
    LayoutDashboard,
    LogOut,
    ChevronRight,
    ChevronLeft,
    ChevronDown,
    Menu,
    X,
    User,
    MapPin,
    Truck
} from 'lucide-react';

const CitizenSidebar = ({
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

    const userObj = JSON.parse(localStorage.getItem('user') || '{}');
    const userName = userObj.fullName || localStorage.getItem('userName') || 'Citizen';

    const menuItems = [
        { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'Pickup Request', label: 'Pickup Request', icon: Truck },
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
                className={`${isCollapsed ? 'w-20' : 'w-64'
                    } bg-white text-gray-800 flex flex-col justify-between border-r border-emerald-100/80 shadow-xs shrink-0 h-full overflow-y-auto transition-all duration-300 ease-in-out ${isOpen ? 'fixed inset-y-0 left-0 z-50' : 'hidden lg:flex'
                    }`}
            >
                {/* Top Header & Profile Section */}
                <div className="p-4 border-b border-emerald-100/80 bg-emerald-50/50">
                    <div className="flex items-center justify-between gap-2">
                        {/* Citizen Profile (Clickable to view Profile) */}
                        <div
                            onClick={() => setActiveItem && setActiveItem('Profile')}
                            className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'gap-3'
                                } cursor-pointer hover:bg-emerald-100/70 p-1.5 -m-1.5 rounded-xl transition-all group`}
                            title="Click to view & edit Profile"
                        >
                            <div className="w-10 h-10 rounded-full bg-[#0a4d2c] flex items-center justify-center shadow-md text-white font-bold text-base shrink-0 group-hover:scale-105 transition-transform">
                                {userName[0] ? userName[0].toUpperCase() : <User className="w-5 h-5 text-white" />}
                            </div>

                            {!isCollapsed && (
                                <div className="overflow-hidden transition-all duration-200">
                                    <p className="text-xs font-bold text-gray-900 truncate max-w-[140px] group-hover:text-[#0a4d2c] transition-colors">
                                        {userName}
                                    </p>
                                    <h2 className="text-[11px] uppercase tracking-wider text-[#0a4d2c] font-bold truncate">
                                        Citizen Panel
                                    </h2>
                                </div>
                            )}
                        </div>

                        {/* 3-line Hamburger Menu Button */}
                        {!isCollapsed && (
                            <button
                                onClick={toggleCollapse}
                                className="hidden lg:flex items-center justify-center p-1.5 rounded-lg hover:bg-emerald-100/80 text-[#0a4d2c] transition-all cursor-pointer shrink-0"
                                title="Collapse sidebar"
                            >
                                <Menu className="w-5 h-5 text-[#0a4d2c]" />
                            </button>
                        )}

                        {/* Mobile Close Button */}
                        <button
                            onClick={onClose}
                            className="p-1 rounded-lg hover:bg-emerald-100 text-gray-500 hover:text-emerald-900 lg:hidden ml-auto shrink-0"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* 3-line Menu Button when collapsed on desktop */}
                    {isCollapsed && (
                        <div className="hidden lg:flex justify-center mt-2">
                            <button
                                onClick={toggleCollapse}
                                className="p-1.5 rounded-lg hover:bg-emerald-100/80 text-[#0a4d2c] transition-all cursor-pointer"
                                title="Expand sidebar"
                            >
                                <Menu className="w-5 h-5 text-[#0a4d2c]" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Navigation Items List */}
                <nav className={`flex-1 ${isCollapsed ? 'px-2' : 'pr-3 pl-1'} py-4 space-y-2 overflow-y-auto custom-scrollbar`}>
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeItem === item.id;
                        const isSubmenuOpen = openSubmenu === item.id;

                        return (
                            <div key={item.id} className="relative group">
                                <button
                                    onClick={() => handleItemClick(item)}
                                    className={`w-full flex items-center ${isCollapsed
                                        ? 'justify-center px-3 py-3 rounded-2xl'
                                        : 'justify-between pl-4 pr-3 py-2.5 rounded-r-full'
                                        } text-xs font-semibold transition-all duration-200 cursor-pointer ${isActive
                                            ? 'bg-[#0a4d2c] text-white shadow-sm'
                                            : 'text-gray-700 hover:bg-emerald-100/70 hover:text-[#0a4d2c]'
                                        }`}
                                >
                                    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3.5'}`}>
                                        <Icon
                                            className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-300' : 'text-emerald-700 group-hover:text-[#0a4d2c]'
                                                }`}
                                        />
                                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                                    </div>

                                    {!isCollapsed && item.hasSubmenu && (
                                        <div className={isActive ? 'text-emerald-200' : 'text-gray-400'}>
                                            {isSubmenuOpen ? (
                                                <ChevronDown className="w-3.5 h-3.5" />
                                            ) : (
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            )}
                                        </div>
                                    )}
                                </button>

                                {/* Collapsed Mode Floating Tooltip */}
                                {isCollapsed && (
                                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50 whitespace-nowrap">
                                        {item.label}
                                    </div>
                                )}

                                {/* Submenu items if expanded */}
                                {!isCollapsed && item.hasSubmenu && isSubmenuOpen && (
                                    <div className="ml-5 mt-1 pl-4 border-l-2 border-emerald-300 py-1 space-y-1 animate-slide-up">
                                        {item.subItems.map((sub, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setActiveItem && setActiveItem(`${item.id} > ${sub}`)}
                                                className={`w-full text-left py-1.5 px-3 rounded-r-full text-[11px] font-medium transition-all ${activeItem === `${item.id} > ${sub}` || activeItem === sub
                                                    ? 'bg-emerald-100 text-[#0a4d2c] font-bold'
                                                    : 'text-gray-600 hover:text-[#0a4d2c] hover:bg-emerald-50'
                                                    }`}
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
                    <div className="relative group pt-4">
                        <button
                            onClick={onLogout}
                            className={`w-full flex items-center ${isCollapsed
                                ? 'justify-center py-3 px-2 rounded-2xl'
                                : 'justify-center gap-2 py-2.5 px-4 rounded-r-full'
                                } bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 text-xs font-bold text-[#0a4d2c] transition-all cursor-pointer shadow-2xs group`}
                        >
                            <LogOut className="w-4 h-4 text-emerald-700 group-hover:text-[#0a4d2c] transition-colors shrink-0" />
                            {!isCollapsed && <span>Log Out</span>}
                        </button>
                        {isCollapsed && (
                            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50 whitespace-nowrap">
                                Log Out
                            </div>
                        )}
                    </div>
                </nav>
            </aside>
        </>
    );
};

export default CitizenSidebar;
