import React, { useEffect, useState } from 'react';
import { dashboardService, announcementService } from '../../services/api.js';
import { StatCard } from '../../components/common/StatCard.js';
import { Badge } from '../../components/common/Badge.js';
import { Modal } from '../../components/common/Modal.js';
import { Announcement } from '../../types/index.js';
import {
  Users,
  UserCheck,
  CalendarCheck,
  Clock,
  FileClock,
  CheckCircle2,
  GraduationCap,
  Megaphone,
  UserPlus,
  PlusCircle,
  FileSpreadsheet,
  Activity,
  ArrowRight,
  Trash2,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

interface HRDashboardProps {
  onNavigate: (tab: string) => void;
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];

export function HRDashboard({ onNavigate }: HRDashboardProps) {
  const [data, setData] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // Publish Notice Modal
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeCategory, setNoticeCategory] = useState<'General' | 'Policy' | 'Holiday' | 'Event' | 'Health & Safety'>('General');
  const [noticeAudience, setNoticeAudience] = useState<'All' | 'HR' | 'Managers' | 'Employees'>('All');
  const [noticePriority, setNoticePriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [publishing, setPublishing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Delete Notice Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [dashRes, annRes] = await Promise.all([
        dashboardService.getHR(),
        announcementService.getAll(),
      ]);
      if (dashRes.success) {
        setData(dashRes);
      }
      if (annRes.success) {
        setAnnouncements(annRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handlePublishNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeContent.trim()) return;
    setPublishing(true);
    try {
      await announcementService.create({
        title: noticeTitle.trim(),
        content: noticeContent.trim(),
        category: noticeCategory,
        audience: noticeAudience,
        priority: noticePriority,
      });
      setPublishModalOpen(false);
      setNoticeTitle('');
      setNoticeContent('');
      setFeedback('Notice published successfully to organization.');
      setTimeout(() => setFeedback(null), 4000);
      const annRes = await announcementService.getAll();
      if (annRes.success) setAnnouncements(annRes.data);
    } catch (err: any) {
      setFeedback(err.message || 'Failed to publish notice');
    } finally {
      setPublishing(false);
    }
  };

  const handleDeleteNotice = async () => {
    if (!announcementToDelete) return;
    setDeleting(true);
    try {
      await announcementService.delete(announcementToDelete._id);
      setDeleteModalOpen(false);
      setAnnouncementToDelete(null);
      setFeedback(`Successfully deleted notice: "${announcementToDelete.title}"`);
      setTimeout(() => setFeedback(null), 4000);
      const annRes = await announcementService.getAll();
      if (annRes.success) setAnnouncements(annRes.data);
    } catch (err: any) {
      setFeedback(err.message || 'Failed to delete notice');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const charts = data?.charts || {};
  const recentActivities = data?.recentActivities || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 rounded-3xl p-6 text-white shadow-lg">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-indigo-300">
            Executive HR Console
          </span>
          <h1 className="text-2xl font-bold tracking-tight mt-1">
            Organization Overview & Analytics
          </h1>
          <p className="text-xs text-indigo-200 mt-1 max-w-xl">
            Real-time workforce intelligence, employee directory management, automated attendance monitoring, and leave approvals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('employees')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-indigo-950 font-semibold text-xs hover:bg-indigo-50 transition shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add Employee
          </button>
          <button
            onClick={() => setPublishModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-700/80 hover:bg-indigo-700 text-white font-semibold text-xs border border-indigo-500/40 transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Publish Notice
          </button>
          <button
            onClick={() => onNavigate('reports')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-700/80 hover:bg-indigo-700 text-white font-semibold text-xs border border-indigo-500/40 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export Reports
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 shrink-0" />
          {feedback}
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Employees"
          value={stats.activeEmployees || 0}
          subtitle={`Total staff: ${stats.totalEmployees || 0}`}
          icon={Users}
          colorScheme="indigo"
          trend={{ value: '100% active', isPositive: true }}
        />
        <StatCard
          title="Managers & Leads"
          value={stats.totalManagers || 0}
          subtitle="Supervising departments"
          icon={UserCheck}
          colorScheme="purple"
        />
        <StatCard
          title="Present Today"
          value={stats.presentToday || 0}
          subtitle={`${stats.absentToday || 0} absent today`}
          icon={CalendarCheck}
          colorScheme="emerald"
          trend={{ value: `${Math.round(((stats.presentToday || 0) / (stats.activeEmployees || 1)) * 100)}% attendance`, isPositive: true }}
        />
        <StatCard
          title="Pending Leaves"
          value={stats.pendingLeaves || 0}
          subtitle={`${stats.approvedLeaves || 0} approved total`}
          icon={FileClock}
          colorScheme="amber"
          trend={{ value: 'Action required', isPositive: false }}
        />
      </div>

      {/* Charts Section: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Attendance Trend Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">7-Day Attendance Trend</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Daily workforce presence breakdown</p>
            </div>
            <button
              onClick={() => onNavigate('attendance_org')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              View records <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.attendanceTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="absentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Area type="monotone" dataKey="present" stroke="#10b981" fillOpacity={1} fill="url(#presentGrad)" name="Present" />
                <Area type="monotone" dataKey="absent" stroke="#f43f5e" fillOpacity={1} fill="url(#absentGrad)" name="Absent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Distribution Pie Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Department Headcount</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Distribution across business units</p>
          </div>

          <div className="h-52 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.departmentDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {(charts.departmentDistribution || []).map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            {(charts.departmentDistribution || []).map((dept: any, i: number) => (
              <div key={dept.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                  <span className="text-slate-600 dark:text-slate-400 truncate">{dept.name}</span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-white">{dept.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Company Announcements & Notices Panel (Publish & Delete in HR Console) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Company Notices & Official Announcements</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Publish communications, manage policies, or remove outdated bulletins</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('announcements')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              All notices <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPublishModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Publish Notice
            </button>
          </div>
        </div>

        {announcements.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No notices currently published.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {announcements.slice(0, 3).map(item => (
              <div
                key={item._id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-100/70 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                      {item.category}
                    </span>
                    <Badge status={item.priority} />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{item.title}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{item.content}</p>
                </div>

                <div className="mt-4 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
                  <span>{new Date(item.publishedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                  <button
                    onClick={() => {
                      setAnnouncementToDelete(item);
                      setDeleteModalOpen(true);
                    }}
                    className="p-1 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition flex items-center gap-1 font-semibold"
                    title="Delete Notice"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Secondary Row: Training Capacity & Recent Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Training Programs Participation */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Training Enrollments vs Capacity</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Current active workshop participation</p>
            </div>
            <button
              onClick={() => onNavigate('trainings')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              All trainings <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.trainingParticipation || []} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="enrolled" fill="#6366f1" name="Enrolled Staff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="capacity" fill="#cbd5e1" name="Total Capacity" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Audit Activity Log */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">System Audit Trail</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Recent authenticated HR actions</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {recentActivities.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No audit logs recorded yet.</p>
            ) : (
              recentActivities.map((act: any) => (
                <div key={act._id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {act.action.replace(/_/g, ' ')}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{act.details}</p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                      By {act.performedByName}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Publish Notice Modal */}
      <Modal
        isOpen={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        title="Publish Official Announcement"
        subtitle="Broadcast to all employees or specific roles"
        maxWidth="lg"
      >
        <form onSubmit={handlePublishNotice} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notice Title *
            </label>
            <input
              type="text"
              required
              value={noticeTitle}
              onChange={e => setNoticeTitle(e.target.value)}
              placeholder="e.g. Annual Benefit Enrollment / Holiday Notice"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
              <select
                value={noticeCategory}
                onChange={e => setNoticeCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="General">General</option>
                <option value="Policy">Policy</option>
                <option value="Holiday">Holiday</option>
                <option value="Event">Event</option>
                <option value="Health & Safety">Health & Safety</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Audience</label>
              <select
                value={noticeAudience}
                onChange={e => setNoticeAudience(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All">All Company</option>
                <option value="Employees">Employees</option>
                <option value="Managers">Managers</option>
                <option value="HR">HR Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Priority</label>
              <select
                value={noticePriority}
                onChange={e => setNoticePriority(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High (Urgent)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Notice Content *</label>
            <textarea
              rows={4}
              required
              value={noticeContent}
              onChange={e => setNoticeContent(e.target.value)}
              placeholder="Provide notice details and guidelines..."
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setPublishModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={publishing}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition disabled:opacity-50"
            >
              {publishing ? 'Publishing...' : 'Publish Notice'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Notice Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setAnnouncementToDelete(null);
        }}
        title="Delete Notice"
        subtitle="This action will permanently delete this notice from the system."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-700 dark:text-rose-300">
              <p className="font-bold">Are you sure you want to permanently delete this notice?</p>
              <p className="mt-1 font-semibold">"{announcementToDelete?.title}"</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setDeleteModalOpen(false);
                setAnnouncementToDelete(null);
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={handleDeleteNotice}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Yes, Delete Permanently'}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
