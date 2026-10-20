/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ThemeProvider } from './client/context/ThemeContext.js';
import { AuthProvider, useAuth } from './client/context/AuthContext.js';
import { LoginPage } from './client/pages/auth/LoginPage.js';
import { RegisterPage } from './client/pages/auth/RegisterPage.js';
import { AppLayout } from './client/components/layout/AppLayout.js';
import { Building2 } from 'lucide-react';

function MainApp() {
  const { isAuthenticated, isLoading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 mb-4 animate-bounce">
          <Building2 className="w-6 h-6" />
        </div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loading StaffSync Workspace...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (authView === 'register') {
      return <RegisterPage onSwitchToLogin={() => setAuthView('login')} />;
    }
    return <LoginPage onSwitchToRegister={() => setAuthView('register')} />;
  }

  return <AppLayout />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
