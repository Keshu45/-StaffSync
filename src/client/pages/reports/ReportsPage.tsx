import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { reportService } from '../../services/api.js';
import { Badge } from '../../components/common/Badge.js';
import { getIsoDate } from '../../utils/date.js';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  FileSpreadsheet,
  Users,
  CalendarCheck,
  FileClock,
} from 'lucide-react';

export function ReportsPage() {
  const { user } = useAuth();
  const isHR = user?.role === 'HR';

  const [reportType, setReportType] = useState<'attendance' | 'leaves' | 'employees'>('attendance');
  const [startDate, setStartDate] = useState(getIsoDate(-30));
  const [endDate, setEndDate] = useState(getIsoDate(0));
  const [department, setDepartment] = useState('All');

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    try {
      setLoading(true);
      if (reportType === 'attendance') {
        const res = await reportService.getAttendance({
          startDate,
          endDate,
          department: department === 'All' ? undefined : department,
        });
        if (res.success) setData(res.data);
      } else if (reportType === 'leaves') {
        const res = await reportService.getLeaves();
        if (res.success) {
          let list = res.data;
          if (department !== 'All') {
            list = list.filter((l: any) => l.department === department);
          }
          setData(list);
        }
      } else if (reportType === 'employees') {
        const res = await reportService.getEmployees();
        if (res.success) {
          let list = res.data;
          if (department !== 'All') {
            list = list.filter((e: any) => e.department === department);
          }
          setData(list);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, startDate, endDate, department]);

  const exportCSV = () => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header];
        const escaped = ('' + (val ?? '')).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    const csvData = csvRows.join('\n');
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `StaffSync_${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            HR Analytics & Reporting Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Generate and export workforce compliance, attendance, and leave logs
          </p>
        </div>

        <button
          onClick={exportCSV}
          disabled={data.length === 0 || loading}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm shadow-emerald-600/30 transition self-start sm:self-auto disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Export to CSV
        </button>
      </div>

      {/* Report Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => setReportType('attendance')}
          className={`p-4 rounded-2xl border text-left transition ${
            reportType === 'attendance'
              ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-xs mb-1">
            <CalendarCheck className="w-4 h-4 text-indigo-600" />
            Attendance Compliance
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Work hours, check-in timestamps, and presence audit
          </p>
        </button>

        <button
          onClick={() => setReportType('leaves')}
          className={`p-4 rounded-2xl border text-left transition ${
            reportType === 'leaves'
              ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-xs mb-1">
            <FileClock className="w-4 h-4 text-indigo-600" />
            Leave Statistics
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Vacation requests, approval logs, and leave durations
          </p>
        </button>

        {isHR && (
          <button
            onClick={() => setReportType('employees')}
            className={`p-4 rounded-2xl border text-left transition ${
              reportType === 'employees'
                ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200 shadow-xs'
                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-xs mb-1">
              <Users className="w-4 h-4 text-indigo-600" />
              Employee Directory
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Department headcount, status, and compensation
            </p>
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-wrap items-center gap-4 text-xs">
        {reportType === 'attendance' && (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={department}
            onChange={e => setDepartment(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden"
          >
            <option value="All">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Marketing & Design">Marketing & Design</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Finance">Finance</option>
          </select>
        </div>

        <span className="ml-auto font-semibold text-slate-500">
          Showing {data.length} records
        </span>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No records found for the selected report filters.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/90 backdrop-blur-xs z-10">
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  {Object.keys(data[0]).map(key => (
                    <th key={key} className="py-3 px-4 capitalize">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {data.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    {Object.keys(row).map(key => {
                      const val = row[key];
                      const isStatus = key.toLowerCase().includes('status');
                      return (
                        <td key={key} className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                          {isStatus && typeof val === 'string' ? (
                            <Badge status={val} />
                          ) : typeof val === 'number' && key.toLowerCase().includes('salary') ? (
                            `$${val.toLocaleString()}`
                          ) : (
                            val ?? '-'
                          )}
                        </td>
                      );
                    })}
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
