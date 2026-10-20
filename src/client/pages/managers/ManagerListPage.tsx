import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { managerService, employeeService } from '../../services/api.js';
import { Modal } from '../../components/common/Modal.js';
import {
  UserCheck,
  Users,
  Building,
  UserPlus,
  ShieldCheck,
  ArrowRight,
  Check,
} from 'lucide-react';

export function ManagerListPage() {
  const { user } = useAuth();
  const isHR = user?.role === 'HR';

  const [managers, setManagers] = useState<any[]>([]);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Assignment Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState<any>(null);
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);

  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const [mgrRes, empRes] = await Promise.all([
        managerService.getAll(),
        employeeService.getAll(),
      ]);
      if (mgrRes.success) setManagers(mgrRes.data);
      if (empRes.success) setAllEmployees(empRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAssignModal = (mgr: any) => {
    setSelectedManager(mgr);
    // Pre-select current team
    const currentMemberIds = allEmployees
      .filter(e => e.managerId === mgr.employeeId)
      .map(e => e.employeeId);
    setSelectedEmpIds(currentMemberIds);
    setAssignModalOpen(true);
  };

  const handleToggleEmp = (empId: string) => {
    setSelectedEmpIds(prev =>
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };

  const handleSaveAssignments = async () => {
    if (!selectedManager) return;
    setAssigning(true);
    try {
      await managerService.assignTeam(selectedManager.employeeId, selectedEmpIds);
      setAssignModalOpen(false);
      await fetchData(false);
    } catch (err: any) {
      alert(err.message || 'Assignment failed');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-purple-600" />
            Manager & Team Supervision Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Overview of department leadership, team allocations, and supervisory reporting lines
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : managers.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-400">
          No managers found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {managers.map(mgr => (
            <div
              key={mgr.employeeId}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={mgr.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mgr.email}`}
                      alt={mgr.firstName}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-purple-500/20"
                    />
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {mgr.firstName} {mgr.lastName}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{mgr.designation}</p>
                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                        {mgr.department}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300">
                    {mgr.teamCount} Reports
                  </span>
                </div>

                {/* Team Roster Snippet */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Direct Reports:
                  </p>
                  {mgr.teamMembers && mgr.teamMembers.length > 0 ? (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {mgr.teamMembers.map((member: any) => (
                        <div key={member.employeeId} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{member.name}</p>
                            <p className="text-[10px] text-slate-400">{member.designation}</p>
                          </div>
                          <span className="font-mono text-[10px] text-slate-400">{member.employeeId}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic py-2">No team members assigned yet.</p>
                  )}
                </div>
              </div>

              {/* Action */}
              {isHR && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => openAssignModal(mgr)}
                    className="w-full py-2 px-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-semibold text-xs transition flex items-center justify-center gap-1.5 border border-purple-200 dark:border-purple-800"
                  >
                    <Users className="w-3.5 h-3.5" />
                    Assign / Reassign Team Members
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Assign Team Members Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title={`Assign Team Members to ${selectedManager?.firstName} ${selectedManager?.lastName}`}
        subtitle="Check the employees who report to this manager"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Selected: <span className="font-bold text-purple-600">{selectedEmpIds.length} employee(s)</span>
          </p>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-1">
            {allEmployees
              .filter(e => e.employeeId !== selectedManager?.employeeId)
              .map(emp => {
                const isSelected = selectedEmpIds.includes(emp.employeeId);
                return (
                  <div
                    key={emp.employeeId}
                    onClick={() => handleToggleEmp(emp.employeeId)}
                    className={`p-3 flex items-center justify-between cursor-pointer rounded-xl transition ${
                      isSelected ? 'bg-purple-50 dark:bg-purple-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-xs text-slate-900 dark:text-white">
                        {emp.firstName} {emp.lastName}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {emp.designation} · {emp.department} ({emp.employeeId})
                      </p>
                    </div>

                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition ${
                      isSelected
                        ? 'bg-purple-600 border-purple-600 text-white'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setAssignModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              disabled={assigning}
              onClick={handleSaveAssignments}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition disabled:opacity-50"
            >
              {assigning ? 'Saving...' : 'Save Team Assignments'}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
