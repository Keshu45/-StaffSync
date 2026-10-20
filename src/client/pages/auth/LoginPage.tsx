import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { Building2, Eye, EyeOff, ShieldCheck, Users, Briefcase, Lock, Mail, ArrowRight, Sun, Moon } from 'lucide-react';

interface LoginPageProps {
  onSwitchToRegister: () => void;
}

export function LoginPage({ onSwitchToRegister }: LoginPageProps) {
  const { login, demoLogin, error, clearError, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (e) {
      // error handled in context
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoClick = async (role: 'HR' | 'MANAGER' | 'EMPLOYEE') => {
    setSubmitting(true);
    try {
      await demoLogin(role);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-100 via-slate-50 to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-8 relative">
        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="absolute top-6 right-6 p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
        </button>
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white shadow-lg shadow-indigo-500/30 mb-3">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Sign In to StaffSync
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Modern Human Resource Management Solution
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 space-y-2">
            <div className="flex items-start justify-between">
              <span className="font-medium leading-relaxed">{error}</span>
              <button onClick={clearError} className="ml-2 font-bold hover:opacity-80 text-sm leading-none">×</button>
            </div>
            {error.toLowerCase().includes('no account found') && (
              <button
                type="button"
                onClick={() => {
                  clearError();
                  onSwitchToRegister();
                }}
                className="inline-flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Create a new account with this email →
              </button>
            )}
          </div>
        )}

        {/* Quick Demo Login Preset Bar */}
        <div className="mb-5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 text-center">
            ⚡ Quick 1-Click Instant Login
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={submitting || isLoading}
              onClick={() => handleDemoClick('HR')}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-center hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition shadow-2xs group"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-600 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold">HR Admin</span>
              <span className="text-[9px] text-slate-400 truncate max-w-full">hr@staffsync.com</span>
            </button>

            <button
              type="button"
              disabled={submitting || isLoading}
              onClick={() => handleDemoClick('MANAGER')}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800/80 text-purple-700 dark:text-purple-300 text-center hover:bg-purple-50 dark:hover:bg-purple-950/40 transition shadow-2xs group"
            >
              <Users className="w-4 h-4 text-purple-600 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold">Manager</span>
              <span className="text-[9px] text-slate-400 truncate max-w-full">alex.morgan@...</span>
            </button>

            <button
              type="button"
              disabled={submitting || isLoading}
              onClick={() => handleDemoClick('EMPLOYEE')}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-white dark:bg-slate-800 border border-sky-200 dark:border-sky-800/80 text-sky-700 dark:text-sky-300 text-center hover:bg-sky-50 dark:hover:bg-sky-950/40 transition shadow-2xs group"
            >
              <Briefcase className="w-4 h-4 text-sky-600 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold">Employee</span>
              <span className="text-[9px] text-slate-400 truncate max-w-full">john.doe@...</span>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
            <span className="bg-white dark:bg-slate-900 px-3 text-slate-400">or sign in with email</span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-hidden transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-hidden transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || isLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs tracking-wide shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {submitting ? 'Authenticating...' : 'Sign In to Workspace'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer */}
        <div className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">
          Using your own email?{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
          >
            Register employee account
          </button>
        </div>

      </div>
    </div>
  );
}
