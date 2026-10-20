import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { dataStore } from '../data/dataStore.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export async function getAllManagers(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const allUsers = dataStore.users.filter(u => u.role === 'MANAGER' || u.role === 'HR');
    const allEmployees = await dataStore.getEmployees();

    const managerList = allEmployees
      .filter(emp => {
        const u = allUsers.find(user => String(user._id) === String(emp.userId));
        return u && (u.role === 'MANAGER' || u.role === 'HR');
      })
      .map(mgr => {
        const teamMembers = allEmployees.filter(e => e.managerId === mgr.employeeId || e.managerId === mgr._id);
        return {
          ...mgr,
          teamCount: teamMembers.length,
          teamMembers: teamMembers.map(m => ({
            _id: m._id,
            employeeId: m.employeeId,
            name: `${m.firstName} ${m.lastName}`,
            designation: m.designation,
            department: m.department,
            email: m.email,
          })),
        };
      });

    res.status(200).json({ success: true, data: managerList });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch managers.', error: err.message });
  }
}

export async function createManager(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { firstName, lastName, email, phone, department, designation, salary = 95000 } = req.body;

    if (!firstName || !lastName || !email || !department) {
      res.status(400).json({ success: false, message: 'First name, last name, email, and department are required.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await dataStore.findUserByEmail(cleanEmail);
    if (existing) {
      res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }

    const allEmps = await dataStore.getEmployees();
    const employeeId = `EMP-${1000 + allEmps.length + 1}`;
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const passwordHash = await bcrypt.hash('StaffSync@2025', 10);

    const newUser = await dataStore.createUser({
      name: fullName,
      email: cleanEmail,
      passwordHash,
      role: 'MANAGER',
      employeeId,
      isActive: true,
    });

    const newMgr = await dataStore.createEmployee({
      employeeId,
      userId: String(newUser._id),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: cleanEmail,
      phone: phone?.trim() || '+1 (555) 000-0000',
      department: department.trim(),
      designation: designation?.trim() || 'Team Lead / Manager',
      dateOfJoining: new Date().toISOString().split('T')[0],
      employmentStatus: 'Active',
      managerId: null,
      salary: Number(salary),
      address: '',
      profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanEmail}`,
    });

    await dataStore.logAudit(
      'MANAGER_CREATED',
      req.user!.userId,
      req.user!.name,
      'Manager',
      employeeId,
      `Created Manager ${fullName}`
    );

    res.status(201).json({
      success: true,
      message: `Manager ${fullName} created successfully. Default password is StaffSync@2025.`,
      data: newMgr,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to create manager.', error: err.message });
  }
}

export async function getManagerTeam(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const isHR = req.user?.role === 'HR';
    const isThisManager = req.user?.employeeId === id;

    if (!isHR && !isThisManager) {
      res.status(403).json({ success: false, message: 'Not authorized to view this team.' });
      return;
    }

    const allEmps = await dataStore.getEmployees();
    const manager = await dataStore.getEmployeeById(id);
    if (!manager) {
      res.status(404).json({ success: false, message: 'Manager not found.' });
      return;
    }

    const team = allEmps.filter(e => e.managerId === manager.employeeId || e.managerId === manager._id);

    // Filter salary unless HR
    const sanitizedTeam = team.map(m => {
      const copy = { ...m };
      if (!isHR) delete copy.salary;
      return copy;
    });

    res.status(200).json({
      success: true,
      manager: {
        _id: manager._id,
        employeeId: manager.employeeId,
        name: `${manager.firstName} ${manager.lastName}`,
        department: manager.department,
        designation: manager.designation,
      },
      team: sanitizedTeam,
      count: sanitizedTeam.length,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch team.', error: err.message });
  }
}

export async function assignTeamMembers(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params; // manager employeeId or _id
    const { employeeIds } = req.body; // array of employee IDs to assign

    if (!Array.isArray(employeeIds)) {
      res.status(400).json({ success: false, message: 'employeeIds array is required.' });
      return;
    }

    const manager = await dataStore.getEmployeeById(id);
    if (!manager) {
      res.status(404).json({ success: false, message: 'Manager not found.' });
      return;
    }

    for (const empId of employeeIds) {
      await dataStore.updateEmployee(empId, { managerId: manager.employeeId });
    }

    await dataStore.logAudit(
      'TEAM_ASSIGNED',
      req.user!.userId,
      req.user!.name,
      'Manager',
      id,
      `Assigned ${employeeIds.length} members to manager ${manager.firstName} ${manager.lastName}`
    );

    res.status(200).json({
      success: true,
      message: `Successfully assigned ${employeeIds.length} employee(s) to ${manager.firstName} ${manager.lastName}.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to assign team members.', error: err.message });
  }
}
