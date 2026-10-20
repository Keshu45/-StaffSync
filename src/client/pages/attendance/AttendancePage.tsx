import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { attendanceService } from '../../services/api.js';
import { Badge } from '../../components/common/Badge.js';
import { getIsoDate, formatDateDMY } from '../../utils/date.js';
import {
  CalendarCheck,
  Clock,
  LogIn,
  LogOut,
  Calendar,
  Filter,
  CheckCircle2,
  Users,
  Search,
} from 'lucide-react';

export function AttendancePage() {
  const { user } = useAuth();
  const role = user?.role || 'EMPLOYEE';

  const [date, setDate] = useState(getIsoDate(0));
  const [department, setDepartment] = useState('All');
  const [status, setStatus] = useState('All');
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});

  // Employee specific
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [clockLoading, setClockLoading] = useState(false);

  const fetchAttendance = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      if (role === 'HR') {
        const res = await attendanceService.getOrgAttendance({
          date,
          department: department === 'All' ? undefined : department,
          status: status === 'All' ? undefined : status,
        });
        if (res.success) {
          setRecords(res.data);
          setStats({
            total: res.total,
            present: res.presentCount,
            absent: res.absentCount,
            leave: res.leaveCount,
          });
        }
      } else if (role === 'MANAGER') {
        const res = await attendanceService.getTeamAttendance(date);
        if (res.success) {
          setRecords(res.data);
          setStats({
            total: res.totalTeam,
            present: res.presentCount,
            absent: res.absentCount,
            leave: res.leaveCount,
          });
        }
      } else {
        const res = await attendanceService.getMyAttendance();
        if (res.success) {
          setRecords(res.records);
          setTodayRecord(res.today);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [date, department, status, role]);

  const handleCheckIn = async () => {
    setClockLoading(true);
    try {
      await attendanceService.checkIn(notes || 'Regular Check-In');
      setNotes('');
      await fetchAttendance(false);
    } catch (err: any) {
      alert(err.message || 'Check-in failed');
    } finally {
      setClockLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setClockLoading(true);
    try {
      await attendanceService.checkOut();
      await fetchAttendance(false);
    } catch (err: any) {
      alert(err.message || 'Check-out failed');
    } finally {
      setClockLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-emerald-600" />
            {role === 'HR'
              ? 'Organization Attendance Monitor'
              : role === 'MANAGER'
              ? 'Team Attendance Tracking'
              : 'My Attendance & Work Hours'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {role === 'EMPLOYEE'
              ? 'Clock in/out daily and monitor your completed working minutes'
              : 'Monitor attendance, arrival times, and presence compliance'}
          </p>
        </div>

        {/* Date Selector for HR and Managers */}
        {role !== 'EMPLOYEE' && (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        )}
      </div>

      {/* Employee Clock In/Out Terminal (Shown for Employees) */}
      {role === 'EMPLOYEE' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Today's Presence Status</span>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {todayRecord?.checkIn
                  ? `Checked In at ${new Date(todayRecord.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Not Checked In Yet'}
              </span>
              <Badge status={todayRecord?.status || (todayRecord?.checkIn ? 'Present' : 'Absent')} />
            </div>
            {todayRecord?.checkOut && (
              <p className="text-xs text-slate-500">
                Checked out at {new Date(todayRecord.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({Math.floor(todayRecord.totalWorkingMinutes / 60)}h {todayRecord.totalWorkingMinutes % 60}m worked)
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {!todayRecord?.checkIn ? (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Notes (optional)..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-hidden w-full sm:w-44"
                />
                <button
                  disabled={clockLoading}
                  onClick={handleCheckIn}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition whitespace-nowrap disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4" />
                  Clock In
                </button>
              </div>
            ) : !todayRecord?.checkOut ? (
              <button
                disabled={clockLoading}
                onClick={handleCheckOut}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                Clock Out
              </button>
            ) : (
              <div className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-900">
                <CheckCircle2 className="w-4 h-4" />
                Shift Complete
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary Chips for HR / Managers */}
      {role !== 'EMPLOYEE' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Headcount</span>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{stats.total || 0}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4">
            <span className="text-[11px] font-semibold text-emerald-600 uppercase">Present</span>
            <p className="text-xl font-bold text-emerald-600 mt-0.5">{stats.present || 0}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4">
            <span className="text-[11px] font-semibold text-amber-600 uppercase">On Leave</span>
            <p className="text-xl font-bold text-amber-600 mt-0.5">{stats.leave || 0}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4">
            <span className="text-[11px] font-semibold text-rose-600 uppercase">Absent</span>
            <p className="text-xl font-bold text-rose-600 mt-0.5">{stats.absent || 0}</p>
          </div>
        </div>
      )}

      {/* HR Filter Bar */}
      {role === 'HR' && (
        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={department}
              onChange={e => setDepartment(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white outline-hidden"
            >
              <option value="All">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Marketing & Design">Marketing & Design</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Finance">Finance</option>
            </select>
          </div>

          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white outline-hidden"
          >
            <option value="All">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Leave">Leave</option>
            <option value="Half Day">Half Day</option>
          </select>
        </div>
      )}

      {/* Attendance Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No attendance records found for this selection.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  {role !== 'EMPLOYEE' && <th className="py-3.5 px-4">Employee</th>}
                  <th className="py-3.5 px-4">Work Date</th>
                  <th className="py-3.5 px-4">Check-In</th>
                  <th className="py-3.5 px-4">Check-Out</th>
                  <th className="py-3.5 px-4">Working Time</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {records.map((r: any, idx: number) => (
                  <tr key={r._id || idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    
                    {role !== 'EMPLOYEE' && (
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900 dark:text-white">{r.name || r.employeeId}</p>
                        <p className="text-[10px] text-slate-400">{r.designation} · {r.department}</p>
                      </td>
                    )}

                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                      {formatDateDMY(r.attendanceDate || date)}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {r.totalWorkingMinutes ? `${Math.floor(r.totalWorkingMinutes / 60)}h ${r.totalWorkingMinutes % 60}m` : '-'}
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge status={r.status || 'Absent'} />
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 italic text-[11px] max-w-xs truncate">
                      {r.notes || '-'}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
