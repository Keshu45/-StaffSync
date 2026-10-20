import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal.js';
import { employeeService, managerService } from '../../services/api.js';

interface AddEditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  employeeToEdit?: any | null;
}

export function AddEditEmployeeModal({ isOpen, onClose, onSaved, employeeToEdit }: AddEditEmployeeModalProps) {
  const isEditing = !!employeeToEdit;

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    department: 'Engineering',
    designation: '',
    dateOfJoining: new Date().toISOString().split('T')[0],
    employmentStatus: 'Active',
    managerId: '',
    salary: 80000,
    address: '',
    role: 'EMPLOYEE',
  });

  const [managers, setManagers] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadManagers() {
      try {
        const res = await managerService.getAll();
        if (res.success) {
          setManagers(res.data);
        }
      } catch (e) {
        console.error(e);
      }
    }
    if (isOpen) {
      loadManagers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (employeeToEdit) {
      setFormData({
        firstName: employeeToEdit.firstName || '',
        lastName: employeeToEdit.lastName || '',
        email: employeeToEdit.email || '',
        password: '',
        phone: employeeToEdit.phone || '',
        department: employeeToEdit.department || 'Engineering',
        designation: employeeToEdit.designation || '',
        dateOfJoining: employeeToEdit.dateOfJoining || new Date().toISOString().split('T')[0],
        employmentStatus: employeeToEdit.employmentStatus || 'Active',
        managerId: employeeToEdit.managerId || '',
        salary: employeeToEdit.salary || 80000,
        address: employeeToEdit.address || '',
        role: 'EMPLOYEE',
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: 'StaffSync@2025',
        phone: '',
        department: 'Engineering',
        designation: '',
        dateOfJoining: new Date().toISOString().split('T')[0],
        employmentStatus: 'Active',
        managerId: '',
        salary: 80000,
        address: '',
        role: 'EMPLOYEE',
      });
    }
    setError(null);
  }, [employeeToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (isEditing) {
        await employeeService.update(employeeToEdit.employeeId, formData);
      } else {
        await employeeService.create(formData);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save employee.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Employee (${employeeToEdit.employeeId})` : 'Register New Employee'}
      subtitle="HR Administrator Employee Management"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">First Name *</label>
            <input
              type="text"
              name="firstName"
              required
              value={formData.firstName}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Last Name *</label>
            <input
              type="text"
              name="lastName"
              required
              value={formData.lastName}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Work Email *</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Department *</label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Engineering">Engineering</option>
              <option value="Marketing & Design">Marketing & Design</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Finance">Finance</option>
              <option value="Operations">Operations</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Job Designation *</label>
            <input
              type="text"
              name="designation"
              required
              value={formData.designation}
              onChange={handleChange}
              placeholder="e.g. Senior Software Engineer"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Assigned Manager</label>
            <select
              name="managerId"
              value={formData.managerId}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">None / Executive Level</option>
              {managers.map(mgr => (
                <option key={mgr.employeeId} value={mgr.employeeId}>
                  {mgr.firstName} {mgr.lastName} ({mgr.department})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Date of Joining</label>
            <input
              type="date"
              name="dateOfJoining"
              value={formData.dateOfJoining}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Employment Status</label>
            <select
              name="employmentStatus"
              value={formData.employmentStatus}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Active">Active</option>
              <option value="Probation">Probation</option>
              <option value="On Leave">On Leave</option>
              <option value="Terminated">Terminated</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Annual Salary ($ USD)</label>
            <input
              type="number"
              name="salary"
              value={formData.salary}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {!isEditing && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Account Role Access</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="EMPLOYEE">Standard Employee</option>
                <option value="MANAGER">Manager (Supervisory & Approvals)</option>
              </select>
            </div>
          )}

          <div className={isEditing ? 'col-span-2' : ''}>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isEditing ? 'Reset Login Password (Optional)' : 'Login Password *'}
            </label>
            <input
              type="text"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={isEditing ? 'Leave blank to keep existing password (or enter new)' : 'StaffSync@2025'}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Home / Office Address</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="123 Corporate Blvd, City, State"
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition disabled:opacity-50"
          >
            {submitting ? 'Saving...' : isEditing ? 'Update Employee' : 'Create Employee Record'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
