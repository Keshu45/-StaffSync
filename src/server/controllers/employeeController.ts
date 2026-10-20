import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { dataStore } from '../data/dataStore.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export async function getAllEmployees(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { department, status, search, page = '1', limit = '50' } = req.query;
    const isHR = req.user?.role === 'HR';

    const employees = await dataStore.getEmployees({
      department: department as string,
      status: status as string,
      search: search as string,
    });

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const total = employees.length;
    const paginated = employees.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    // Mask salary for non-HR
    const sanitized = paginated.map(emp => {
      const copy = { ...emp };
      if (!isHR) {
        delete copy.salary;
      }
      return copy;
    });

    res.status(200).json({
      success: true,
      data: sanitized,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch employees.', error: err.message });
  }
}

export async function getEmployeeById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const isHR = req.user?.role === 'HR';
    const isSelf = req.user?.employeeId === id;

    const employee = await dataStore.getEmployeeById(id);
    if (!employee) {
      res.status(404).json({ success: false, message: 'Employee not found.' });
      return;
    }

    const copy = { ...employee };
    // Salary only visible to HR or the employee themselves if needed (HR rule: restricted to authorized users)
    if (!isHR) {
      delete copy.salary;
    }

    res.status(200).json({ success: true, data: copy });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve employee.', error: err.message });
  }
}

export async function createEmployee(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      department,
      designation,
      dateOfJoining,
      employmentStatus = 'Active',
      managerId,
      salary = 60000,
      address = '',
      role = 'EMPLOYEE', // Can be EMPLOYEE or MANAGER when created by HR
    } = req.body;

    if (!firstName || !lastName || !email || !department || !designation) {
      res.status(400).json({
        success: false,
        message: 'First name, last name, email, department, and designation are required.',
      });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await dataStore.findUserByEmail(cleanEmail);
    if (existing) {
      res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }

    const allEmps = await dataStore.getEmployees();
    const nextNum = 1000 + allEmps.length + 1;
    const employeeId = `EMP-${nextNum}`;
    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    const rawPassword = password && String(password).trim().length >= 6 ? String(password).trim() : 'StaffSync@2025';
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const newUser = await dataStore.createUser({
      name: fullName,
      email: cleanEmail,
      passwordHash,
      role: role === 'MANAGER' ? 'MANAGER' : 'EMPLOYEE',
      employeeId,
      isActive: employmentStatus !== 'Terminated',
    });

    const newEmp = await dataStore.createEmployee({
      employeeId,
      userId: String(newUser._id),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: cleanEmail,
      phone: phone?.trim() || '+1 (555) 000-0000',
      department: department.trim(),
      designation: designation.trim(),
      dateOfJoining: dateOfJoining || new Date().toISOString().split('T')[0],
      employmentStatus,
      managerId: managerId || null,
      salary: Number(salary) || 60000,
      address: address.trim(),
      profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanEmail}`,
    });

    await dataStore.logAudit(
      'EMPLOYEE_CREATED',
      req.user!.userId,
      req.user!.name,
      'Employee',
      employeeId,
      `Created ${fullName} (${designation}, ${department})`
    );

    res.status(201).json({
      success: true,
      message: `Employee ${fullName} created successfully with ID ${employeeId}. Login password: ${rawPassword}`,
      data: newEmp,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to create employee.', error: err.message });
  }
}

export async function updateEmployee(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const isHR = req.user?.role === 'HR';
    const isSelf = req.user?.employeeId === id;

    const existing = await dataStore.getEmployeeById(id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Employee not found.' });
      return;
    }

    // Role security: Employees can only edit their own personal contact details
    if (!isHR && !isSelf) {
      res.status(403).json({ success: false, message: 'You are not authorized to update this employee.' });
      return;
    }

    let updates: any = {};

    if (isHR) {
      const {
        firstName,
        lastName,
        email,
        password,
        phone,
        department,
        designation,
        dateOfJoining,
        employmentStatus,
        managerId,
        salary,
        address,
        profileImage,
      } = req.body;

      const cleanEmail = email ? email.toLowerCase().trim() : undefined;

      updates = {
        ...(firstName ? { firstName: firstName.trim() } : {}),
        ...(lastName ? { lastName: lastName.trim() } : {}),
        ...(cleanEmail ? { email: cleanEmail } : {}),
        ...(phone ? { phone: phone.trim() } : {}),
        ...(department ? { department: department.trim() } : {}),
        ...(designation ? { designation: designation.trim() } : {}),
        ...(dateOfJoining ? { dateOfJoining } : {}),
        ...(employmentStatus ? { employmentStatus } : {}),
        ...(managerId !== undefined ? { managerId } : {}),
        ...(salary !== undefined ? { salary: Number(salary) } : {}),
        ...(address !== undefined ? { address: address.trim() } : {}),
        ...(profileImage ? { profileImage } : {}),
      };

      const userUpdates: any = {};
      if (firstName || lastName) {
        userUpdates.name = `${updates.firstName || existing.firstName} ${updates.lastName || existing.lastName}`;
      }
      if (cleanEmail) {
        userUpdates.email = cleanEmail;
      }
      if (employmentStatus) {
        userUpdates.isActive = employmentStatus !== 'Terminated';
      }
      if (password && String(password).trim().length >= 6) {
        userUpdates.passwordHash = await bcrypt.hash(String(password).trim(), 10);
      }

      if (Object.keys(userUpdates).length > 0) {
        await dataStore.updateUser(String(existing.userId), userUpdates);
      }
    } else {
      // Non-HR (Self) can only update contact fields
      const { phone, address, profileImage } = req.body;
      updates = {
        ...(phone ? { phone: phone.trim() } : {}),
        ...(address !== undefined ? { address: address.trim() } : {}),
        ...(profileImage ? { profileImage } : {}),
      };
    }

    const updated = await dataStore.updateEmployee(id, updates);

    await dataStore.logAudit(
      'EMPLOYEE_UPDATED',
      req.user!.userId,
      req.user!.name,
      'Employee',
      id,
      `Updated employee fields: ${Object.keys(updates).join(', ')}`
    );

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully.',
      data: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to update employee.', error: err.message });
  }
}

export async function updateEmployeeStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { employmentStatus } = req.body;

    if (!employmentStatus || !['Active', 'On Leave', 'Terminated', 'Probation'].includes(employmentStatus)) {
      res.status(400).json({
        success: false,
        message: 'Valid employment status is required (Active, On Leave, Terminated, Probation).',
      });
      return;
    }

    const employee = await dataStore.getEmployeeById(id);
    if (!employee) {
      res.status(404).json({ success: false, message: 'Employee not found.' });
      return;
    }

    const updated = await dataStore.updateEmployee(id, { employmentStatus });
    await dataStore.updateUser(String(employee.userId), {
      isActive: employmentStatus !== 'Terminated',
    });

    await dataStore.logAudit(
      'EMPLOYEE_STATUS_CHANGED',
      req.user!.userId,
      req.user!.name,
      'Employee',
      id,
      `Status changed to ${employmentStatus}`
    );

    res.status(200).json({
      success: true,
      message: `Employee status successfully updated to ${employmentStatus}.`,
      data: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to update status.', error: err.message });
  }
}

export async function getEmployeeAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const records = await dataStore.getAttendanceRecords({ employeeId: id });
    res.status(200).json({ success: true, data: records });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch attendance.', error: err.message });
  }
}

export async function getEmployeeLeaves(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const records = await dataStore.getLeaves({ employeeId: id });
    res.status(200).json({ success: true, data: records });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch leaves.', error: err.message });
  }
}
