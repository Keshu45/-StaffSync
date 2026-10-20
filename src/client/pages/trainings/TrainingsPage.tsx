import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { trainingService } from '../../services/api.js';
import { Training } from '../../types/index.js';
import { Badge } from '../../components/common/Badge.js';
import { Modal } from '../../components/common/Modal.js';
import { DateRangeDisplay } from '../../components/common/DateRangeDisplay.js';
import { getIsoDate } from '../../utils/date.js';
import {
  GraduationCap,
  PlusCircle,
  Users,
  Calendar,
  User,
  MapPin,
  CheckCircle2,
  XCircle,
  Eye,
  Award,
} from 'lucide-react';

export function TrainingsPage() {
  const { user } = useAuth();
  const role = user?.role || 'EMPLOYEE';
  const isHR = role === 'HR';
  const isManager = role === 'MANAGER';
  const canManage = isHR || isManager;

  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [trainer, setTrainer] = useState('');
  const [category, setCategory] = useState('Engineering & Cloud');
  const [startDate, setStartDate] = useState(getIsoDate(7));
  const [endDate, setEndDate] = useState(getIsoDate(9));
  const [capacity, setCapacity] = useState(20);
  const [locationOrUrl, setLocationOrUrl] = useState('Tech Lab A & Google Meet');
  const [targetAudience, setTargetAudience] = useState('All Departments');

  // Enrolled Participants Modal
  const [participantsModalOpen, setParticipantsModalOpen] = useState(false);
  const [selectedEnrollments, setSelectedEnrollments] = useState<any>(null);

  const fetchTrainings = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await trainingService.getAll();
      if (res.success) {
        setTrainings(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainings();
  }, []);

  const handleEnroll = async (id: string) => {
    setActionLoading(true);
    try {
      await trainingService.enroll(id);
      await fetchTrainings(false);
    } catch (err: any) {
      alert(err.message || 'Enrollment failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelEnrollment = async (id: string) => {
    if (!confirm('Are you sure you want to withdraw from this training session?')) return;
    setActionLoading(true);
    try {
      await trainingService.cancelEnrollment(id);
      await fetchTrainings(false);
    } catch (err: any) {
      alert(err.message || 'Failed to withdraw');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await trainingService.create({
        title: title.trim(),
        description: description.trim(),
        trainer: trainer.trim(),
        category,
        startDate,
        endDate,
        capacity: Number(capacity),
        locationOrUrl,
        targetAudience,
      });
      setCreateModalOpen(false);
      setTitle('');
      setDescription('');
      setTrainer('');
      await fetchTrainings(false);
    } catch (err: any) {
      alert(err.message || 'Failed to schedule training');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewParticipants = async (id: string) => {
    try {
      const res = await trainingService.getEnrollments(id);
      if (res.success) {
        setSelectedEnrollments(res);
        setParticipantsModalOpen(true);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to fetch enrollments');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            Training & Professional Development
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Upskill, attend technical workshops, and track professional certifications
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm shadow-indigo-600/30 transition self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            Schedule Workshop
          </button>
        )}
      </div>

      {/* Grid of Trainings */}
      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : trainings.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-400">
          No training programs scheduled yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trainings.map(t => {
            const seatsLeft = t.seatsRemaining ?? (t.capacity - t.enrolledEmployees.length);
            const isFull = seatsLeft <= 0;
            const pct = Math.min(100, Math.round((t.enrolledEmployees.length / t.capacity) * 100));

            return (
              <div
                key={t._id}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                      {t.category}
                    </span>
                    <Badge status={t.status} />
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {t.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-3 leading-relaxed">
                    {t.description}
                  </p>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Trainer: <strong className="text-slate-700 dark:text-slate-300">{t.trainer}</strong></span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                      <DateRangeDisplay startDate={t.startDate} endDate={t.endDate} />
                    </div>
                    {t.locationOrUrl && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{t.locationOrUrl}</span>
                      </div>
                    )}
                  </div>

                  {/* Capacity Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500 mb-1">
                      <span>Enrollment</span>
                      <span className={isFull ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}>
                        {t.enrolledEmployees.length} / {t.capacity} filled ({seatsLeft} left)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          isFull ? 'bg-rose-500' : pct > 75 ? 'bg-amber-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  {canManage && (
                    <button
                      onClick={() => handleViewParticipants(t._id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Roster ({t.enrolledEmployees.length})
                    </button>
                  )}

                  {t.isEnrolled ? (
                    <button
                      disabled={actionLoading}
                      onClick={() => handleCancelEnrollment(t._id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 font-semibold text-xs transition ml-auto flex items-center gap-1 border border-slate-200 dark:border-slate-700"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Enrolled (Withdraw)
                    </button>
                  ) : isFull ? (
                    <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-semibold ml-auto">
                      Session Full
                    </span>
                  ) : (
                    <button
                      disabled={actionLoading}
                      onClick={() => handleEnroll(t._id)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition ml-auto flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Enroll Now
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Training Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Schedule New Training Workshop"
        subtitle="Offer career development workshops to employees"
        maxWidth="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Program Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Next.js 15 & High-Scale Node Architecture"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Trainer / Instructor *
              </label>
              <input
                type="text"
                required
                value={trainer}
                onChange={e => setTrainer(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Engineering & Cloud">Engineering & Cloud</option>
                <option value="Design & UX">Design & UX</option>
                <option value="Leadership & HR">Leadership & HR</option>
                <option value="Finance & Compliance">Finance & Compliance</option>
                <option value="Productivity">Productivity</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">End Date *</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Max Capacity *</label>
              <input
                type="number"
                min={1}
                required
                value={capacity}
                onChange={e => setCapacity(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Location or Meeting Link</label>
            <input
              type="text"
              value={locationOrUrl}
              onChange={e => setLocationOrUrl(e.target.value)}
              placeholder="e.g. Executive Boardroom / Google Meet link"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description *</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Syllabus, topics covered, and key takeaways..."
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition disabled:opacity-50"
            >
              {actionLoading ? 'Scheduling...' : 'Schedule Workshop'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Participants Roster Modal */}
      <Modal
        isOpen={participantsModalOpen}
        onClose={() => setParticipantsModalOpen(false)}
        title={selectedEnrollments?.trainingTitle || 'Training Enrollment Roster'}
        subtitle={`Enrolled: ${selectedEnrollments?.enrolledCount || 0} / ${selectedEnrollments?.capacity || 0} participants`}
        maxWidth="md"
      >
        <div className="space-y-3">
          {selectedEnrollments?.enrolledEmployees?.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">No employees enrolled yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
              {selectedEnrollments?.enrolledEmployees?.map((emp: any) => (
                <div key={emp.employeeId} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{emp.name}</p>
                    <p className="text-[11px] text-slate-400">{emp.designation} · {emp.department}</p>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">{emp.employeeId}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setParticipantsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
