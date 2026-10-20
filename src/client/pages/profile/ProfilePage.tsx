import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { employeeService, authService } from '../../services/api.js';
import { Badge } from '../../components/common/Badge.js';
import { formatDateDMY } from '../../utils/date.js';
import {
  UserCircle,
  Lock,
  Mail,
  Phone,
  MapPin,
  Building,
  Briefcase,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Shield,
  KeyRound,
  Sun,
  Moon,
  Palette,
} from 'lucide-react';

export function ProfilePage() {
  const { user, employee, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();

  // Contact form
  const [phone, setPhone] = useState(employee?.phone || '');
  const [address, setAddress] = useState(employee?.address || '');
  const [savingContact, setSavingContact] = useState(false);
  const [contactMsg, setContactMsg] = useState<string | null>(null);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;
    setSavingContact(true);
    setContactMsg(null);
    try {
      await employeeService.update(employee.employeeId, {
        phone: phone.trim(),
        address: address.trim(),
      });
      await refreshUser();
      setContactMsg('Profile contact information updated successfully.');
      setTimeout(() => setContactMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update contact info');
    } finally {
      setSavingContact(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);

    if (newPassword.length < 6) {
      setPwdMsg({ text: 'New password must be at least 6 characters long.', isError: true });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdMsg({ text: 'New password and confirmation do not match.', isError: true });
      return;
    }

    setSavingPwd(true);
    try {
      const res = await authService.changePassword({ currentPassword, newPassword });
      setPwdMsg({ text: res.message || 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwdMsg(null), 4000);
    } catch (err: any) {
      setPwdMsg({ text: err.message || 'Failed to change password.', isError: true });
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl">
      
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <UserCircle className="w-5 h-5 text-indigo-600" />
          Employee Profile & Security Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          View your organizational credentials and manage security authentication details
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={employee?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
            alt={user?.name}
            className="w-16 h-16 rounded-2xl object-cover ring-4 ring-indigo-500/20"
          />
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{user?.name}</h2>
              <Badge status={user?.role || 'EMPLOYEE'} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{employee?.designation || 'Staff Member'}</p>
            <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
              {employee?.department || 'Operations'} · <span className="font-mono">{user?.employeeId || 'ID-PENDING'}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:items-end text-xs text-slate-500 dark:text-slate-400 space-y-1">
          <span>Date of Joining: <strong className="text-slate-800 dark:text-slate-200">{formatDateDMY(employee?.dateOfJoining || '2024-01-01')}</strong></span>
          <span>Status: <Badge status={employee?.employmentStatus || 'Active'} /></span>
        </div>
      </div>

      {/* Appearance & Workspace Theme */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Workspace Appearance</h3>
            <p className="text-xs text-slate-400">Choose your preferred visual theme for StaffSync</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all ${
              theme === 'light'
                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <Sun className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Light Mode</span>
                {theme === 'light' && <span className="text-[10px] font-bold text-indigo-600">Active</span>}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Clean, high-contrast white and slate surfaces for daytime work.</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all ${
              theme === 'dark'
                ? 'border-indigo-500 bg-slate-800/90 ring-2 ring-indigo-500/30 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <div className="p-2.5 rounded-xl bg-slate-900 text-indigo-400 border border-slate-700">
              <Moon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Dark Mode</span>
                {theme === 'dark' && <span className="text-[10px] font-bold text-indigo-400">Active</span>}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Deep obsidian background reducing eye strain in low-light environments.</p>
            </div>
          </button>
        </div>
      </div>

      {/* 2 Column Settings: Contact Details & Password Change */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Contact Information */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Contact & Address</h3>
              <p className="text-xs text-slate-400">Keep your personal contact data up to date</p>
            </div>
          </div>

          {contactMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {contactMsg}
            </div>
          )}

          <form onSubmit={handleUpdateContact} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Work Email</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Residential Address</label>
              <textarea
                rows={2}
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Street address, city, state, zip"
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={savingContact}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-xs disabled:opacity-50"
            >
              {savingContact ? 'Saving...' : 'Save Contact Updates'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Security & Password</h3>
              <p className="text-xs text-slate-400">Update your access credential</p>
            </div>
          </div>

          {pwdMsg && (
            <div className={`mb-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              pwdMsg.isError
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
            }`}>
              {pwdMsg.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
              {pwdMsg.text}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Current Password *</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">New Password (min 6 chars) *</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Confirm New Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={savingPwd}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-xs transition shadow-xs disabled:opacity-50"
            >
              {savingPwd ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
