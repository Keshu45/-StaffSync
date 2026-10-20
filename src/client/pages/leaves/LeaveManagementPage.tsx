import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { leaveService } from '../../services/api.js';
import { LeaveRequest } from '../../types/index.js';
import { Badge } from '../../components/common/Badge.js';
import { Modal } from '../../components/common/Modal.js';
import { DateRangeDisplay } from '../../components/common/DateRangeDisplay.js';
import { getIsoDate } from '../../utils/date.js';
import {
  FileClock,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Calendar,
  AlertCircle,
  Trash2,
  MessageSquare,
} from 'lucide-react';

export function LeaveManagementPage() {
  const { user } = useAuth();
  const role = user?.role || 'EMPLOYEE';
  const isHR = role === 'HR';
  const isManager = role === 'MANAGER';

  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');

  // Apply Modal
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [startDate, setStartDate] = useState(getIsoDate(1));
  const [endDate, setEndDate] = useState(getIsoDate(2));
  const [reason, setReason] = useState('');
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  // Reject Modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchLeaves = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = isHR || isManager ? await leaveService.getAll() : await leaveService.getMyLeaves();
      if (res.success) {
        setLeaves(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [role]);

  // Compute duration
  const startD = new Date(startDate);
  const endD = new Date(endDate);
  const computedDays = !isNaN(startD.getTime()) && !isNaN(endD.getTime()) && endD >= startD
    ? Math.round((endD.getTime() - startD.getTime()) / (1000 * 3600 * 24)) + 1
    : 0;

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (computedDays <= 0) {
      setApplyError('End date must be on or after start date.');
      return;
    }
    setApplying(true);
    setApplyError(null);
    try {
      await leaveService.apply({
        leaveType,
        startDate,
        endDate,
        reason: reason.trim(),
      });
      setApplyModalOpen(false);
      setReason('');
      await fetchLeaves(false);
    } catch (err: any) {
      setApplyError(err.message || 'Failed to submit leave application.');
    } finally {
      setApplying(false);
    }
  };

  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    setFeedbackMsg(null);
    try {
      await leaveService.approve(id, `Approved by ${user?.name}`);
      setFeedbackMsg({ text: 'Leave request approved successfully!' });
      setTimeout(() => setFeedbackMsg(null), 3500);
      await fetchLeaves(false);
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Approval failed.', isError: true });
      setTimeout(() => setFeedbackMsg(null), 5000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!selectedLeave || !rejectReason.trim()) return;
    setActionLoading(true);
    setFeedbackMsg(null);
    try {
      await leaveService.reject(selectedLeave._id, rejectReason.trim());
      setRejectModalOpen(false);
      setSelectedLeave(null);
      setRejectReason('');
      setFeedbackMsg({ text: 'Leave request has been declined.' });
      setTimeout(() => setFeedbackMsg(null), 3500);
      await fetchLeaves(false);
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Rejection failed.', isError: true });
      setTimeout(() => setFeedbackMsg(null), 5000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    setFeedbackMsg(null);
    try {
      await leaveService.cancel(id);
      setFeedbackMsg({ text: 'Leave request cancelled.' });
      setTimeout(() => setFeedbackMsg(null), 3000);
      await fetchLeaves(false);
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Cancellation failed.', isError: true });
    }
  };

  const filteredLeaves = leaves.filter(l => (activeTab === 'All' ? true : l.status === activeTab));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileClock className="w-5 h-5 text-amber-500" />
            {isHR ? 'Organization Leave Management' : isManager ? 'Team Leave Review Console' : 'My Leave Applications'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Submit leave requests, review workflow approvals, and monitor department balance trends
          </p>
        </div>

        <button
          onClick={() => {
            setApplyError(null);
            setApplyModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm shadow-indigo-600/30 transition self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Apply for Leave
        </button>
      </div>

      {/* Feedback Banner */}
      {feedbackMsg && (
        <div className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 transition ${
          feedbackMsg.isError
            ? 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300'
            : 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300'
        }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {feedbackMsg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {(['All', 'Pending', 'Approved', 'Rejected'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === tab
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab}
            <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-white/20">
              {tab === 'All' ? leaves.length : leaves.filter(l => l.status === tab).length}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No {activeTab.toLowerCase()} leave requests found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  {(isHR || isManager) && <th className="py-3.5 px-4">Applicant</th>}
                  <th className="py-3.5 px-4">Leave Type</th>
                  <th className="py-3.5 px-4">Dates</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Reason</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Review Details</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredLeaves.map(leave => (
                  <tr key={leave._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    
                    {(isHR || isManager) && (
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900 dark:text-white">{leave.employeeName || leave.employeeId}</p>
                        <p className="text-[10px] text-slate-400">{leave.department}</p>
                      </td>
                    )}

                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {leave.leaveType}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                      <DateRangeDisplay startDate={leave.startDate} endDate={leave.endDate} />
                    </td>

                    <td className="py-3.5 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                      {leave.numberOfDays} Day{leave.numberOfDays > 1 ? 's' : ''}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs text-slate-600 dark:text-slate-300 truncate">
                      "{leave.reason}"
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge status={leave.status} />
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                      {leave.reviewedByName ? (
                        <div>
                          <span className="font-medium">By {leave.reviewedByName}</span>
                          {leave.reviewComment && (
                            <p className="italic text-[10px] truncate max-w-xs">"{leave.reviewComment}"</p>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {(isHR || isManager) && leave.status === 'Pending' && (
                          <>
                            <button
                              disabled={actionLoading}
                              onClick={() => handleApprove(leave._id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shadow-2xs transition"
                            >
                              Approve
                            </button>
                            <button
                              disabled={actionLoading}
                              onClick={() => {
                                setSelectedLeave(leave);
                                setRejectReason('');
                                setRejectModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 font-semibold text-[11px] border border-rose-200 dark:border-rose-900 transition"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {role === 'EMPLOYEE' && leave.status === 'Pending' && (
                          <button
                            onClick={() => handleCancel(leave._id)}
                            className="px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[11px] font-semibold border border-rose-200 dark:border-rose-900 transition flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Apply Leave Modal */}
      <Modal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        title="Submit Leave Application"
        subtitle="Vacation, sick, casual, or earned leave request"
        maxWidth="md"
      >
        <form onSubmit={handleApplySubmit} className="space-y-4">
          {applyError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {applyError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Leave Category *
            </label>
            <select
              value={leaveType}
              onChange={e => setLeaveType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Casual Leave">Casual Leave</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Earned Leave">Earned Leave</option>
              <option value="Unpaid Leave">Unpaid Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                End Date *
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center justify-between">
            <span>Computed Leave Duration:</span>
            <span className="font-bold text-sm">{computedDays} Day(s)</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reason for Leave *
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="State the reason for this time-off request..."
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setApplyModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={applying || computedDays <= 0}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition disabled:opacity-50"
            >
              {applying ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Decline Leave Application"
        subtitle="A mandatory reason is required to reject this request"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Declining <span className="font-bold">{selectedLeave?.employeeName}</span>'s {selectedLeave?.leaveType} ({selectedLeave?.numberOfDays} days).
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Rejection Feedback / Justification *
            </label>
            <textarea
              rows={3}
              required
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Reason for declining..."
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setRejectModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              disabled={!rejectReason.trim() || actionLoading}
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
