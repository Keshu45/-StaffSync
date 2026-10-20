import React, { useEffect, useState } from 'react';
import { dashboardService, attendanceService } from '../../services/api.js';
import { Badge } from '../../components/common/Badge.js';
import { DateRangeDisplay } from '../../components/common/DateRangeDisplay.js';
import {
  Clock,
  CalendarCheck,
  FileClock,
  GraduationCap,
  Megaphone,
  LogIn,
  LogOut,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

interface EmployeeDashboardProps {
  onNavigate: (tab: string) => void;
}

export function EmployeeDashboard({ onNavigate }: EmployeeDashboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [clockActionLoading, setClockActionLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Keep live time updated
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await dashboardService.getEmployee();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleCheckIn = async () => {
    setClockActionLoading(true);
    try {
      const res = await attendanceService.checkIn('Web Portal Check-In');
      setMsg(res.message);
      setTimeout(() => setMsg(null), 4000);
      await fetchDashboard();
    } catch (err: any) {
      alert(err.message || 'Check-in failed');
    } finally {
      setClockActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setClockActionLoading(true);
    try {
      const res = await attendanceService.checkOut();
      setMsg(res.message);
      setTimeout(() => setMsg(null), 4000);
      await fetchDashboard();
    } catch (err: any) {
      alert(err.message || 'Check-out failed');
    } finally {
      setClockActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const todayAtt = data?.todayAttendance;
  const leaveBalances = data?.leaveBalances || {};
  const recentLeaves = data?.recentLeaves || [];
  const enrolledTrainings = data?.enrolledTrainings || [];
  const announcements = data?.announcements || [];

  const isCheckedIn = !!todayAtt?.checkIn;
  const isCheckedOut = !!todayAtt?.checkOut;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner & Live Clock-In Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Welcome & Info */}
        <div className="lg:col-span-2 bg-gradient-to-r from-blue-900 via-indigo-900 to-indigo-800 rounded-3xl p-6 text-white shadow-lg flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-sky-300">
              Employee Workspace
            </span>
            <h1 className="text-2xl font-bold tracking-tight mt-1">
              Welcome back to StaffSync
            </h1>
            <p className="text-xs text-sky-200 mt-1 max-w-lg">
              Manage your daily attendance, submit leave applications, browse career development training programs, and stay updated with company news.
            </p>
          </div>

          {msg && (
            <div className="mt-4 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold flex items-center gap-2 text-white">
              <Sparkles className="w-4 h-4 text-amber-300" />
              {msg}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('leaves_emp')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-indigo-950 font-semibold text-xs hover:bg-sky-50 transition shadow-sm"
            >
              <FileClock className="w-3.5 h-3.5" />
              Apply for Leave
            </button>
            <button
              onClick={() => onNavigate('trainings')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-700/70 hover:bg-indigo-700 text-white font-semibold text-xs border border-indigo-400/30 transition"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Browse Trainings
            </button>
            <button
              onClick={() => onNavigate('attendance_emp')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-700/70 hover:bg-indigo-700 text-white font-semibold text-xs border border-indigo-400/30 transition"
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              View Full Attendance History
            </button>
          </div>
        </div>

        {/* Live Clock-In / Out Terminal Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Attendance Clock</p>
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Active System
              </span>
            </div>

            {/* Time display */}
            <div className="text-center py-2">
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-mono">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>

            {/* Status Indicator */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs my-3 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Status Today:</span>
                <Badge status={todayAtt?.status || (isCheckedIn ? 'Present' : 'Not Checked In')} />
              </div>
              {isCheckedIn && (
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">Check-In Time:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {new Date(todayAtt.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
              {isCheckedOut && (
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">Check-Out Time:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {new Date(todayAtt.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2">
            {!isCheckedIn ? (
              <button
                disabled={clockActionLoading}
                onClick={handleCheckIn}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wide shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                Clock In for Today
              </button>
            ) : !isCheckedOut ? (
              <button
                disabled={clockActionLoading}
                onClick={handleCheckOut}
                className="w-full py-3 px-4 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs tracking-wide shadow-md shadow-amber-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                Clock Out for the Day
              </button>
            ) : (
              <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 text-xs text-center font-semibold flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Workday Finished ({Math.floor((todayAtt.totalWorkingMinutes || 0) / 60)}h {(todayAtt.totalWorkingMinutes || 0) % 60}m)
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Leave Balances Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Remaining Leave Quota</p>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {leaveBalances.remainingDays ?? 25} <span className="text-xs font-normal text-slate-400">/ 25 days</span>
          </p>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${Math.round(((leaveBalances.remainingDays || 25) / 25) * 100)}%` }}></div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Casual Leave</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {(leaveBalances.casualLeave?.total || 10) - (leaveBalances.casualLeave?.used || 0)}{' '}
            <span className="text-xs font-normal text-slate-400">days left</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{leaveBalances.casualLeave?.used || 0} used of 10</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Sick Leave</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {(leaveBalances.sickLeave?.total || 8) - (leaveBalances.sickLeave?.used || 0)}{' '}
            <span className="text-xs font-normal text-slate-400">days left</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{leaveBalances.sickLeave?.used || 0} used of 8</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Earned Leave</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {(leaveBalances.earnedLeave?.total || 7) - (leaveBalances.earnedLeave?.used || 0)}{' '}
            <span className="text-xs font-normal text-slate-400">days left</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{leaveBalances.earnedLeave?.used || 0} used of 7</p>
        </div>
      </div>

      {/* 2-Column: Recent Leaves & Enrolled Trainings + Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Leaves */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Leave Requests</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Your submitted applications</p>
            </div>
            <button
              onClick={() => onNavigate('leaves_emp')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              Apply or View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {recentLeaves.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No leave requests submitted yet.</p>
            ) : (
              recentLeaves.map((l: any) => (
                <div key={l._id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {l.leaveType} ({l.numberOfDays} days)
                    </p>
                    <div className="mt-1">
                      <DateRangeDisplay startDate={l.startDate} endDate={l.endDate} />
                    </div>
                    {l.reviewComment && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 italic">
                        Feedback: "{l.reviewComment}"
                      </p>
                    )}
                  </div>
                  <Badge status={l.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Enrolled Trainings & Announcements */}
        <div className="space-y-6">
          
          {/* Enrolled Training Sessions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">My Enrolled Trainings</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Workshops on your calendar</p>
              </div>
              <button
                onClick={() => onNavigate('trainings')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                Training Catalog <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {enrolledTrainings.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  You are not currently enrolled in any workshops.
                </p>
              ) : (
                enrolledTrainings.map((trn: any) => (
                  <div key={trn._id} className="p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/60 flex items-start justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{trn.title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Trainer: {trn.trainer} · Starts {trn.startDate}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                      Enrolled
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Company Notice Board */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notice Board</h3>
              <button
                onClick={() => onNavigate('announcements')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                All notices <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {announcements.slice(0, 2).map((a: any) => (
                <div key={a._id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
                  <p className="font-semibold text-slate-900 dark:text-white">{a.title}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{a.content}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
