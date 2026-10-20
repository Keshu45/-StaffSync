import React, { useEffect, useState } from 'react';
import { dashboardService, leaveService } from '../../services/api.js';
import { StatCard } from '../../components/common/StatCard.js';
import { Badge } from '../../components/common/Badge.js';
import { Modal } from '../../components/common/Modal.js';
import { DateRangeDisplay } from '../../components/common/DateRangeDisplay.js';
import {
  Users,
  CalendarCheck,
  Clock,
  FileClock,
  CheckCircle2,
  XCircle,
  GraduationCap,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface ManagerDashboardProps {
  onNavigate: (tab: string) => void;
}

export function ManagerDashboard({ onNavigate }: ManagerDashboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Rejection modal
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      const res = await dashboardService.getManager();
      if (res.success) {
        setData(res);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleApprove = async (leaveId: string) => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await leaveService.approve(leaveId, 'Approved by Team Manager');
      setSuccessMsg('Leave request approved successfully!');
      setTimeout(() => setSuccessMsg(null), 3500);
      await fetchDashboard();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to approve leave request.');
      setTimeout(() => setErrorMsg(null), 5000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!selectedLeave || !rejectComment.trim()) return;
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await leaveService.reject(selectedLeave._id, rejectComment.trim());
      setSelectedLeave(null);
      setRejectComment('');
      setSuccessMsg('Leave request rejected.');
      setTimeout(() => setSuccessMsg(null), 3500);
      await fetchDashboard();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reject leave request.');
      setTimeout(() => setErrorMsg(null), 5000);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const teamAttendance = data?.teamAttendance || [];
  const pendingRequests = data?.pendingRequests || [];
  const managedTrainings = data?.managedTrainings || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-lg">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-purple-300">
            Manager Control Hub
          </span>
          <h1 className="text-2xl font-bold tracking-tight mt-1">
            Team Supervision & Approvals
          </h1>
          <p className="text-xs text-purple-200 mt-1 max-w-xl">
            Monitor daily team presence, review pending leave applications, and organize team skill training workshops.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('attendance_team')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-purple-950 font-semibold text-xs hover:bg-purple-50 transition shadow-sm"
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            Team Attendance
          </button>
          <button
            onClick={() => onNavigate('trainings')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-700/80 hover:bg-purple-700 text-white font-semibold text-xs border border-purple-500/40 transition"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Schedule Workshop
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-rose-600" />
          {errorMsg}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Direct Reports"
          value={stats.teamSize || 0}
          subtitle="Assigned engineers & staff"
          icon={Users}
          colorScheme="purple"
        />
        <StatCard
          title="Present Today"
          value={stats.presentToday || 0}
          subtitle={`${stats.absentToday || 0} absent today`}
          icon={CalendarCheck}
          colorScheme="emerald"
        />
        <StatCard
          title="On Leave Today"
          value={stats.onLeaveToday || 0}
          subtitle="Approved vacations & sick"
          icon={Clock}
          colorScheme="amber"
        />
        <StatCard
          title="Pending Requests"
          value={stats.pendingLeavesCount || 0}
          subtitle="Awaiting your approval"
          icon={FileClock}
          colorScheme="rose"
        />
      </div>

      {/* 2-Column Layout: Pending Leave Approvals & Today's Attendance Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pending Leave Requests requiring Manager Review */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Pending Team Leave Applications</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Review, approve, or reject team requests</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              {pendingRequests.length} pending
            </span>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {pendingRequests.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                All team leave requests have been reviewed! 🎉
              </div>
            ) : (
              pendingRequests.map((leave: any) => (
                <div key={leave._id} className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col gap-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-xs text-slate-900 dark:text-white">{leave.employeeName}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {leave.leaveType} · <span className="font-semibold text-indigo-600 dark:text-indigo-400">{leave.numberOfDays} Day(s)</span>
                      </p>
                    </div>
                    <Badge status={leave.status} />
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
                    <p className="font-medium text-slate-400 dark:text-slate-500 text-[10px] uppercase">Reason:</p>
                    "{leave.reason}"
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <DateRangeDisplay startDate={leave.startDate} endDate={leave.endDate} />
                    <div className="flex items-center gap-2">
                      <button
                        disabled={actionLoading}
                        onClick={() => handleApprove(leave._id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1 shadow-xs transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve
                      </button>
                      <button
                        disabled={actionLoading}
                        onClick={() => setSelectedLeave(leave)}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 font-semibold text-xs flex items-center gap-1 border border-rose-200 dark:border-rose-900 transition"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Today's Team Attendance Roster */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Today's Team Check-In Status</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Live check-in & clock activity</p>
            </div>
            <button
              onClick={() => onNavigate('attendance_team')}
              className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
            >
              Full log <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {teamAttendance.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10">No direct reports assigned yet.</p>
            ) : (
              teamAttendance.map((emp: any) => (
                <div key={emp.employeeId} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold flex items-center justify-center text-xs">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{emp.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{emp.designation}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {emp.checkIn ? new Date(emp.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No check-in'}
                    </span>
                    <Badge status={emp.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Reject Reason Modal */}
      <Modal
        isOpen={!!selectedLeave}
        onClose={() => {
          setSelectedLeave(null);
          setRejectComment('');
        }}
        title="Reject Leave Request"
        subtitle="Please provide a mandatory reason for declining this request."
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Rejecting request for <span className="font-bold">{selectedLeave?.employeeName}</span> ({selectedLeave?.leaveType}).
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Rejection Reason *
            </label>
            <textarea
              rows={3}
              required
              value={rejectComment}
              onChange={e => setRejectComment(e.target.value)}
              placeholder="e.g. Critical release scheduled for these dates; please coordinate coverage..."
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setSelectedLeave(null)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              disabled={!rejectComment.trim() || actionLoading}
              onClick={handleRejectConfirm}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition disabled:opacity-50"
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
