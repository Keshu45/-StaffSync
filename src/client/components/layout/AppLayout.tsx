import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { Navbar } from './Navbar.js';
import { Sidebar } from './Sidebar.js';

// Pages
import { HRDashboard } from '../../pages/dashboard/HRDashboard.js';
import { ManagerDashboard } from '../../pages/dashboard/ManagerDashboard.js';
import { EmployeeDashboard } from '../../pages/dashboard/EmployeeDashboard.js';
import { EmployeeListPage } from '../../pages/employees/EmployeeListPage.js';
import { ManagerListPage } from '../../pages/managers/ManagerListPage.js';
import { AttendancePage } from '../../pages/attendance/AttendancePage.js';
import { LeaveManagementPage } from '../../pages/leaves/LeaveManagementPage.js';
import { AnnouncementsPage } from '../../pages/announcements/AnnouncementsPage.js';
import { TrainingsPage } from '../../pages/trainings/TrainingsPage.js';
import { ReportsPage } from '../../pages/reports/ReportsPage.js';
import { ProfilePage } from '../../pages/profile/ProfilePage.js';

export function AppLayout() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const role = user?.role || 'EMPLOYEE';

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        if (role === 'HR') return <HRDashboard onNavigate={setActiveTab} />;
        if (role === 'MANAGER') return <ManagerDashboard onNavigate={setActiveTab} />;
        return <EmployeeDashboard onNavigate={setActiveTab} />;

      case 'employees':
        return <EmployeeListPage />;

      case 'managers':
      case 'team':
        return <ManagerListPage />;

      case 'attendance':
      case 'attendance_org':
      case 'attendance_team':
      case 'attendance_emp':
        return <AttendancePage />;

      case 'leaves':
      case 'leaves_admin':
      case 'leaves_manager':
      case 'leaves_emp':
        return <LeaveManagementPage />;

      case 'announcements':
        return <AnnouncementsPage key="announcements" />;

      case 'announcements_new':
        return <AnnouncementsPage key="announcements_new" initialOpenPublish={true} />;

      case 'trainings':
        return <TrainingsPage />;

      case 'reports':
        return <ReportsPage />;

      case 'profile':
        return <ProfilePage />;

      default:
        if (role === 'HR') return <HRDashboard onNavigate={setActiveTab} />;
        if (role === 'MANAGER') return <ManagerDashboard onNavigate={setActiveTab} />;
        return <EmployeeDashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className="flex-1 flex">
        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* Main Workspace Area */}
        <main className="flex-1 lg:pl-64 flex flex-col min-w-0 transition-all">
          <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
