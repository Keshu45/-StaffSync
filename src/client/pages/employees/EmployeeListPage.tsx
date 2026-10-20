import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { employeeService } from '../../services/api.js';
import { Employee } from '../../types/index.js';
import { Badge } from '../../components/common/Badge.js';
import { formatDateDMY } from '../../utils/date.js';
import { AddEditEmployeeModal } from './AddEditEmployeeModal.js';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Building,
  DollarSign,
  UserCheck,
} from 'lucide-react';

interface EmployeeListPageProps {
  onSelectEmployee?: (empId: string) => void;
}

export function EmployeeListPage({ onSelectEmployee }: EmployeeListPageProps) {
  const { user } = useAuth();
  const isHR = user?.role === 'HR';

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [status, setStatus] = useState('All');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const fetchEmployees = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await employeeService.getAll({
        department: department === 'All' ? undefined : department,
        status: status === 'All' ? undefined : status,
        search: search || undefined,
      });
      if (res.success) {
        setEmployees(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchEmployees();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, department, status]);

  const handleToggleStatus = async (emp: Employee) => {
    const newStatus = emp.employmentStatus === 'Active' ? 'Terminated' : 'Active';
    if (!confirm(`Are you sure you want to change ${emp.firstName}'s status to ${newStatus}?`)) return;

    try {
      await employeeService.updateStatus(emp.employeeId, newStatus);
      await fetchEmployees(false);
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Employee Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage organization members, assignments, roles, and profiles ({employees.length} records)
          </p>
        </div>

        {isHR && (
          <button
            onClick={() => {
              setEditingEmployee(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm shadow-indigo-600/30 transition self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            Add New Employee
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, employee ID, or title..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Department Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={department}
            onChange={e => setDepartment(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Marketing & Design">Marketing & Design</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Finance">Finance</option>
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Probation">Probation</option>
            <option value="On Leave">On Leave</option>
            <option value="Terminated">Terminated</option>
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : employees.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No employees match the selected search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Employee ID</th>
                  <th className="py-3.5 px-4">Department & Role</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Status</th>
                  {isHR && <th className="py-3.5 px-4">Salary</th>}
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {employees.map(emp => (
                  <tr key={emp.employeeId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    
                    {/* Employee Profile */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={emp.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.email}`}
                          alt={emp.firstName}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 ring-2 ring-indigo-500/10"
                        />
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {emp.firstName} {emp.lastName}
                          </p>
                          <p className="text-[11px] text-slate-400">Joined {formatDateDMY(emp.dateOfJoining)}</p>
                        </div>
                      </div>
                    </td>

                    {/* ID */}
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                      {emp.employeeId}
                    </td>

                    {/* Dept & Designation */}
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-800 dark:text-slate-200">{emp.designation}</p>
                      <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
                        {emp.department}
                      </span>
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-4">
                      <p className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {emp.email}
                      </p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {emp.phone}
                      </p>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <Badge status={emp.employmentStatus} />
                    </td>

                    {/* Salary (HR Only) */}
                    {isHR && (
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white font-mono">
                        ${emp.salary?.toLocaleString() || 'N/A'}
                      </td>
                    )}

                    {/* Action buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {onSelectEmployee && (
                          <button
                            onClick={() => onSelectEmployee(emp.employeeId)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
                            title="View Employee Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {isHR && (
                          <>
                            <button
                              onClick={() => {
                                setEditingEmployee(emp);
                                setModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
                              title="Edit Employee"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(emp)}
                              className={`p-1.5 rounded-lg transition ${
                                emp.employmentStatus === 'Active'
                                  ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                                  : 'text-emerald-500 hover:bg-emerald-50'
                              }`}
                              title={emp.employmentStatus === 'Active' ? 'Deactivate Employee' : 'Activate Employee'}
                            >
                              {emp.employmentStatus === 'Active' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            </button>
                          </>
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

      {/* Add / Edit Employee Modal */}
      <AddEditEmployeeModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingEmployee(null);
        }}
        onSaved={fetchEmployees}
        employeeToEdit={editingEmployee}
      />

    </div>
  );
}
