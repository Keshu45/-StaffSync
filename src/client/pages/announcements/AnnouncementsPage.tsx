import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { announcementService } from '../../services/api.js';
import { Announcement } from '../../types/index.js';
import { Badge } from '../../components/common/Badge.js';
import { Modal } from '../../components/common/Modal.js';
import { getIsoDate } from '../../utils/date.js';
import {
  Megaphone,
  PlusCircle,
  Archive,
  Trash2,
  Edit,
  Calendar,
  User,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Search,
} from 'lucide-react';

interface AnnouncementsPageProps {
  initialOpenPublish?: boolean;
}

export function AnnouncementsPage({ initialOpenPublish = false }: AnnouncementsPageProps) {
  const { user } = useAuth();
  const isHR = user?.role === 'HR';

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Publish / Edit Modal
  const [modalOpen, setModalOpen] = useState(initialOpenPublish);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'General' | 'Policy' | 'Holiday' | 'Event' | 'Health & Safety'>('General');
  const [audience, setAudience] = useState<'All' | 'HR' | 'Managers' | 'Employees'>('All');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [expiryDate, setExpiryDate] = useState(getIsoDate(30));
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirmation Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAnnouncements = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await announcementService.getAll();
      if (res.success) {
        setAnnouncements(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    if (initialOpenPublish) {
      openCreateModal();
    }
  }, [initialOpenPublish]);

  const openCreateModal = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setCategory('General');
    setAudience('All');
    setPriority('Medium');
    setExpiryDate(getIsoDate(30));
    setModalOpen(true);
  };

  const openEditModal = (item: Announcement) => {
    setEditingId(item._id);
    setTitle(item.title);
    setContent(item.content);
    setCategory(item.category);
    setAudience(item.audience);
    setPriority(item.priority);
    setExpiryDate(item.expiryDate || getIsoDate(30));
    setModalOpen(true);
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    try {
      if (editingId) {
        await announcementService.update(editingId, {
          title: title.trim(),
          content: content.trim(),
          category,
          audience,
          priority,
          expiryDate,
        });
        setFeedbackMsg({ text: 'Announcement updated successfully.', type: 'success' });
      } else {
        await announcementService.create({
          title: title.trim(),
          content: content.trim(),
          category,
          audience,
          priority,
          expiryDate,
        });
        setFeedbackMsg({ text: 'Announcement published successfully to staff.', type: 'success' });
      }
      setModalOpen(false);
      setTimeout(() => setFeedbackMsg(null), 4000);
      await fetchAnnouncements(false);
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Operation failed. Please check permissions.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (item: Announcement) => {
    setAnnouncementToDelete(item);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!announcementToDelete) return;
    setDeleting(true);
    try {
      await announcementService.delete(announcementToDelete._id);
      setDeleteModalOpen(false);
      setAnnouncementToDelete(null);
      setFeedbackMsg({ text: `Successfully deleted notice: "${announcementToDelete.title}"`, type: 'success' });
      setTimeout(() => setFeedbackMsg(null), 4000);
      await fetchAnnouncements(false);
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Failed to delete announcement.', type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await announcementService.archive(id);
      setFeedbackMsg({ text: 'Announcement moved to archives.', type: 'success' });
      setTimeout(() => setFeedbackMsg(null), 3000);
      await fetchAnnouncements(false);
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Failed to archive announcement.', type: 'error' });
    }
  };

  const filtered = announcements.filter(a => {
    const matchesCategory = categoryFilter === 'All' ? true : a.category === categoryFilter;
    const matchesSearch = searchQuery
      ? a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.category.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-indigo-600" />
            Company Announcements & Notices
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Official communications, policy updates, upcoming holidays, and corporate bulletins
          </p>
        </div>

        {isHR && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm shadow-indigo-600/30 transition self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            Publish New Notice
          </button>
        )}
      </div>

      {/* Feedback Alert */}
      {feedbackMsg && (
        <div className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 transition ${
          feedbackMsg.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
            : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
        }`}>
          <Sparkles className="w-4 h-4" />
          {feedbackMsg.text}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 shadow-xs">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['All', 'Policy', 'Holiday', 'Event', 'Health & Safety', 'General'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                categoryFilter === cat
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search notices..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Announcements Grid */}
      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-400">
          No announcements match your search or filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map(item => (
            <div
              key={item._id}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                    {item.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge status={item.priority} />
                    <span className="text-[10px] font-semibold text-slate-400">
                      Audience: {item.audience}
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed whitespace-pre-line">
                  {item.content}
                </p>
              </div>

              {/* Bottom Metadata & HR Actions */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[140px]">{item.authorName}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span>{new Date(item.publishedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  
                  {isHR && (
                    <div className="flex items-center gap-1 ml-2 border-l border-slate-200 dark:border-slate-700 pl-2">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
                        title="Edit Notice"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      
                      <button
                        onClick={() => handleArchive(item._id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition"
                        title="Archive Notice"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => confirmDelete(item)}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="Delete Notice Permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Publish & Edit Announcement Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Announcement' : 'Publish Official Announcement'}
        subtitle="Broadcast to the organization, management, or employee teams"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveAnnouncement} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Q4 Company All-Hands & Benefit Updates"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as any)}
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
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Audience</label>
              <select
                value={audience}
                onChange={e => setAudience(e.target.value as any)}
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
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
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
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Announcement details..."
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingId ? 'Update Notice' : 'Publish Notice'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setAnnouncementToDelete(null);
        }}
        title="Delete Announcement"
        subtitle="This action is permanent and cannot be undone"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-700 dark:text-rose-300">
              <p className="font-bold">Are you sure you want to permanently delete this notice?</p>
              <p className="mt-1">"{announcementToDelete?.title}"</p>
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
              onClick={handleDelete}
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
