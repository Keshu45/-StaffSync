import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { notificationService } from '../../services/api.js';
import { NotificationItem, UserRole } from '../../types/index.js';
import { 
  Bell, 
  Sun, 
  Moon, 
  User as UserIcon, 
  LogOut, 
  ShieldCheck, 
  Users, 
  Briefcase, 
  ChevronDown, 
  CheckCheck,
  Building2,
  Menu
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Navbar({ onToggleSidebar, setActiveTab }: NavbarProps) {
  const { user, employee, logout, demoLogin } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    try {
      const res = await notificationService.getAll();
      if (res.success) {
        setNotifications(res.data);
        setUnreadCount(res.unreadCount);
      }
    } catch (e) {
      // ignore in navbar background
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [user]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifMenu(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) {
        setShowRoleSwitcher(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      try {
        await notificationService.markRead(notif._id);
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (e) {
        console.error(e);
      }
    }
    // Route to corresponding tab if applicable
    if (notif.type === 'Leave') setActiveTab('leaves');
    if (notif.type === 'Attendance') setActiveTab('attendance');
    if (notif.type === 'Announcement') setActiveTab('announcements');
    if (notif.type === 'Training') setActiveTab('trainings');
    setShowNotifMenu(false);
  };

  const handleSwitchRole = async (targetRole: UserRole) => {
    setShowRoleSwitcher(false);
    await demoLogin(targetRole);
    setActiveTab('dashboard');
  };

  const roleLabel = {
    HR: 'HR Administrator',
    MANAGER: 'Team Manager',
    EMPLOYEE: 'Employee',
  }[user?.role || 'EMPLOYEE'];

  const roleBadgeStyle = {
    HR: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    MANAGER: 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    EMPLOYEE: 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  }[user?.role || 'EMPLOYEE'];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        
        {/* Left: Mobile menu toggle + Logo */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-400 dark:to-blue-400 bg-clip-text text-transparent">
                StaffSync
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                HRMS
              </span>
            </div>
          </div>
        </div>

        {/* Center/Right: Role Switcher & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          
          {/* Quick Demo Role Switcher */}
          <div className="relative" ref={roleRef}>
            <button
              onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-2xs hover:opacity-90 transition ${roleBadgeStyle}`}
              title="Click to quickly switch roles for testing"
            >
              <span className="w-2 h-2 rounded-full bg-current"></span>
              <span className="hidden sm:inline">{roleLabel}</span>
              <span className="sm:hidden font-mono uppercase text-[10px]">{user?.role || 'ROLE'}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {showRoleSwitcher && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Demo Role Switcher
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    Test the system as different roles:
                  </p>
                </div>

                <button
                  onClick={() => handleSwitchRole('HR')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition ${user?.role === 'HR' ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}
                >
                  <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold">HR Administrator</p>
                    <p className="text-[10px] text-slate-400">Full system & organization control</p>
                  </div>
                </button>

                <button
                  onClick={() => handleSwitchRole('MANAGER')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition ${user?.role === 'MANAGER' ? 'font-bold text-purple-600 dark:text-purple-400' : 'text-slate-700 dark:text-slate-300'}`}
                >
                  <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold">Engineering Manager</p>
                    <p className="text-[10px] text-slate-400">Team leaves, attendance & training</p>
                  </div>
                </button>

                <button
                  onClick={() => handleSwitchRole('EMPLOYEE')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition ${user?.role === 'EMPLOYEE' ? 'font-bold text-sky-600 dark:text-sky-400' : 'text-slate-700 dark:text-slate-300'}`}
                >
                  <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold">Senior Employee</p>
                    <p className="text-[10px] text-slate-400">Check-in, leave application & profile</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={`Current theme: ${theme.toUpperCase()} Mode. Click to switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode.`}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline text-[11px] font-semibold text-slate-200">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline text-[11px] font-semibold text-slate-700">Dark</span>
              </>
            )}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900 dark:text-white">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.slice(0, 8).map(n => (
                      <div
                        key={n._id}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition ${!n.isRead ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs ${!n.isRead ? 'font-semibold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                            {n.title}
                          </p>
                          {!n.isRead && <span className="w-2 h-2 rounded-full bg-indigo-600 mt-1 shrink-0"></span>}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                          {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar Dropdown */}
          <div className="relative shrink-0" ref={userRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
              aria-label="User Profile Menu"
            >
              {employee?.profileImage ? (
                <img
                  src={employee.profileImage}
                  alt={user?.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/20"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-semibold text-xs flex items-center justify-center">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
              <div className="hidden md:block text-left pr-1">
                <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">{user?.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{user?.employeeId || user?.email}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">{user?.name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">{roleLabel}</p>
                </div>

                <button
                  onClick={() => {
                    setActiveTab('profile');
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-left"
                >
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  My Profile & Settings
                </button>

                <button
                  onClick={() => toggleTheme()}
                  className="w-full flex items-center justify-between px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-left"
                >
                  <span className="flex items-center gap-2.5">
                    {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                    Appearance Mode
                  </span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {theme === 'dark' ? 'Dark' : 'Light'}
                  </span>
                </button>

                <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>

                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition text-left font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
