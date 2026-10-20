import React from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  CalendarCheck,
  FileClock,
  Megaphone,
  GraduationCap,
  BarChart3,
  UserCircle,
  X,
  Layers,
  Sun,
  Moon,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Sidebar({ isOpen, onClose, activeTab, setActiveTab }: SidebarProps) {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const role = user?.role || 'EMPLOYEE';

  const navItems = [
    // Common
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['HR', 'MANAGER', 'EMPLOYEE'] },

    // HR Exclusive
    { id: 'employees', label: 'Employee Directory', icon: Users, roles: ['HR'] },
    { id: 'managers', label: 'Managers & Teams', icon: UserCheck, roles: ['HR'] },
    { id: 'attendance_org', label: 'Org Attendance', icon: CalendarCheck, roles: ['HR'] },
    { id: 'leaves_admin', label: 'Leave Management', icon: FileClock, roles: ['HR'] },

    // Manager Exclusive
    { id: 'team', label: 'My Team', icon: Users, roles: ['MANAGER'] },
    { id: 'attendance_team', label: 'Team Attendance', icon: CalendarCheck, roles: ['MANAGER'] },
    { id: 'leaves_manager', label: 'Team Leaves', icon: FileClock, roles: ['MANAGER'] },

    // Employee Exclusive
    { id: 'attendance_emp', label: 'My Attendance', icon: CalendarCheck, roles: ['EMPLOYEE'] },
    { id: 'leaves_emp', label: 'My Leave Requests', icon: FileClock, roles: ['EMPLOYEE'] },

    // Shared Features
    { id: 'trainings', label: 'Training Programs', icon: GraduationCap, roles: ['HR', 'MANAGER', 'EMPLOYEE'] },
    { id: 'announcements', label: 'Announcements', icon: Megaphone, roles: ['HR', 'MANAGER', 'EMPLOYEE'] },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, roles: ['HR', 'MANAGER'] },
    { id: 'profile', label: 'My Profile', icon: UserCircle, roles: ['HR', 'MANAGER', 'EMPLOYEE'] },
  ];

  const allowedNav = navItems.filter(item => item.roles.includes(role));

  const handleSelect = (id: string) => {
    setActiveTab(id);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Content */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
      >
        {/* Top Header */}
        <div className="h-16 px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <span className="font-bold text-base text-slate-900 dark:text-white tracking-tight">StaffSync</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {role} Workspace
          </div>

          {allowedNav.map(item => {
            const Icon = item.icon;
            // Match generalized tabs if IDs have role suffixes
            const isSelected = activeTab === item.id || 
              (activeTab === 'attendance' && (item.id === 'attendance_org' || item.id === 'attendance_team' || item.id === 'attendance_emp')) ||
              (activeTab === 'leaves' && (item.id === 'leaves_admin' || item.id === 'leaves_manager' || item.id === 'leaves_emp'));

            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Theme & Footer info */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Theme</span>
            <div className="flex items-center p-1 rounded-xl bg-slate-200/80 dark:bg-slate-800 border border-slate-300/60 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  theme === 'light'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Switch to Light Mode"
              >
                <Sun className="w-3 h-3" />
                Light
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-900 text-indigo-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Switch to Dark Mode"
              >
                <Moon className="w-3 h-3" />
                Dark
              </button>
            </div>
          </div>

          <div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500">
              StaffSync HRMS v1.0.0
            </div>
            <div className="text-[10px] text-slate-400/80 dark:text-slate-600">
              MERN Architecture · Secure JWT
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
