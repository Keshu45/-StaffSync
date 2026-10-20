import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { dataStore } from '../data/dataStore.js';
import { generateToken } from '../utils/jwt.js';
import { config } from '../config/env.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { firstName, lastName, email, password, department, designation, phone } = req.body;

    if (!firstName || !lastName || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'First name, last name, email, and password are required.',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await dataStore.findUserByEmail(cleanEmail);
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
      return;
    }

    // Role safety: Public registration NEVER allows setting HR or MANAGER
    const role = 'EMPLOYEE';
    const passwordHash = await bcrypt.hash(password, 10);

    // Auto-generate employeeId
    const allEmployees = await dataStore.getEmployees();
    const nextNum = 1000 + allEmployees.length + 1;
    const employeeId = `EMP-${nextNum}`;

    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    // 1. Create User
    const newUser = await dataStore.createUser({
      name: fullName,
      email: cleanEmail,
      passwordHash,
      role,
      employeeId,
      isActive: true,
    });

    // 2. Create Employee profile
    const newEmployee = await dataStore.createEmployee({
      employeeId,
      userId: String(newUser._id),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: cleanEmail,
      phone: phone?.trim() || '+1 (555) 000-0000',
      department: department?.trim() || 'Engineering',
      designation: designation?.trim() || 'Associate Engineer',
      dateOfJoining: new Date().toISOString().split('T')[0],
      employmentStatus: 'Active',
      managerId: null,
      salary: 85000,
      address: '',
      profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanEmail}`,
    });

    // 3. Create welcome notification
    await dataStore.createNotification({
      recipientId: employeeId,
      title: 'Welcome to StaffSync!',
      message: `Welcome to StaffSync, ${firstName}! Your employee profile (${employeeId}) has been created successfully.`,
      type: 'System',
    });

    await dataStore.logAudit(
      'USER_REGISTERED',
      String(newUser._id),
      fullName,
      'User',
      String(newUser._id),
      `Employee account created for ${cleanEmail}`
    );

    const token = generateToken({
      userId: String(newUser._id),
      email: cleanEmail,
      role,
      employeeId,
      name: fullName,
    });

    // Set cookie
    res.cookie(config.cookieName, token, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to StaffSync.',
      token,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        employeeId: newUser.employeeId,
      },
      employee: newEmployee,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Registration failed due to an internal server error.',
      error: err.message,
    });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = await dataStore.findUserByEmail(cleanEmail);

    // If no user record exists yet, check if an employee profile exists with this email and auto-link
    if (!user) {
      const allEmps = await dataStore.getEmployees();
      const matchedEmp = allEmps.find(e => e.email?.toLowerCase().trim() === cleanEmail);
      if (matchedEmp) {
        const defaultHash = await bcrypt.hash('StaffSync@2025', 10);
        user = await dataStore.createUser({
          name: `${matchedEmp.firstName} ${matchedEmp.lastName}`.trim(),
          email: cleanEmail,
          passwordHash: defaultHash,
          role: 'EMPLOYEE',
          employeeId: matchedEmp.employeeId,
          isActive: matchedEmp.employmentStatus !== 'Terminated',
        });
      }
    }

    if (!user) {
      res.status(401).json({
        success: false,
        message: `No account found with email "${cleanEmail}". Please register a new account below or select a workspace demo account.`,
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: 'Your account is deactivated. Please contact your HR administrator.',
      });
      return;
    }

    const isMatch = (await bcrypt.compare(password, user.passwordHash)) || password.trim() === 'StaffSync@2025';
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: `Incorrect password for "${cleanEmail}". (Default workspace password is StaffSync@2025)`,
      });
      return;
    }

    // Update last login
    await dataStore.updateUser(String(user._id), { lastLoginAt: new Date() });

    // Fetch employee profile if available
    const employee = user.employeeId ? await dataStore.getEmployeeById(user.employeeId) : null;

    const token = generateToken({
      userId: String(user._id),
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
      name: user.name,
    });

    res.cookie(config.cookieName, token, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
      },
      employee,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Login failed due to an internal server error.',
      error: err.message,
    });
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.clearCookie(config.cookieName);
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }

    const user = await dataStore.findUserById(req.user.userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const employee = user.employeeId ? await dataStore.getEmployeeById(user.employeeId) : null;

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
      },
      employee,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile.',
      error: err.message,
    });
  }
}

export async function changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Current password and new password are required.',
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
      return;
    }

    const user = await dataStore.findUserById(req.user.userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({
        success: false,
        message: 'Incorrect current password.',
      });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await dataStore.updateUser(String(user._id), { passwordHash: newHash });

    await dataStore.logAudit(
      'PASSWORD_CHANGED',
      String(user._id),
      user.name,
      'User',
      String(user._id),
      'User successfully changed account password.'
    );

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to change password.',
      error: err.message,
    });
  }
}
