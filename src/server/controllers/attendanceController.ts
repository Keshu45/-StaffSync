import { Response } from 'express';
import { dataStore } from '../data/dataStore.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { getIsoDate } from '../data/seedData.js';

export async function checkIn(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const employeeId = req.user?.employeeId;
    if (!employeeId) {
      res.status(400).json({ success: false, message: 'No employee profile linked to this account.' });
      return;
    }

    const today = getIsoDate(0);
    const existing = await dataStore.getAttendanceForDate(employeeId, today);

    if (existing && existing.checkIn) {
      res.status(400).json({
        success: false,
        message: `You have already checked in today at ${new Date(existing.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        data: existing,
      });
      return;
    }

    const now = new Date().toISOString();
    const notes = req.body.notes || 'Normal check-in';

    const record = await dataStore.createOrUpdateAttendance({
      employeeId,
      attendanceDate: today,
      checkIn: now,
      checkOut: null,
      status: 'Present',
      totalWorkingMinutes: 0,
      notes,
    });

    await dataStore.logAudit(
      'ATTENDANCE_CHECKIN',
      req.user!.userId,
      req.user!.name,
      'Attendance',
      record._id,
      `Check-in recorded for date ${today}`
    );

    res.status(200).json({
      success: true,
      message: 'Checked in successfully! Have a productive workday.',
      data: record,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Check-in failed.', error: err.message });
  }
}

export async function checkOut(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const employeeId = req.user?.employeeId;
    if (!employeeId) {
      res.status(400).json({ success: false, message: 'No employee profile linked to this account.' });
      return;
    }

    const today = getIsoDate(0);
    const existing = await dataStore.getAttendanceForDate(employeeId, today);

    if (!existing || !existing.checkIn) {
      res.status(400).json({
        success: false,
        message: 'Cannot check out before checking in. Please check in first.',
      });
      return;
    }

    if (existing.checkOut) {
      res.status(400).json({
        success: false,
        message: `You have already checked out today at ${new Date(existing.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        data: existing,
      });
      return;
    }

    const checkOutTime = new Date();
    const checkInTime = new Date(existing.checkIn);
    const diffMs = checkOutTime.getTime() - checkInTime.getTime();
    const totalWorkingMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)));

    const record = await dataStore.createOrUpdateAttendance({
      ...existing,
      checkOut: checkOutTime.toISOString(),
      totalWorkingMinutes,
      status: totalWorkingMinutes >= 240 ? 'Present' : 'Half Day',
    });

    await dataStore.logAudit(
      'ATTENDANCE_CHECKOUT',
      req.user!.userId,
      req.user!.name,
      'Attendance',
      record._id,
      `Check-out recorded (${totalWorkingMinutes} minutes worked)`
    );

    res.status(200).json({
      success: true,
      message: `Checked out successfully! Total working time: ${Math.floor(totalWorkingMinutes / 60)}h ${totalWorkingMinutes % 60}m.`,
      data: record,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Check-out failed.', error: err.message });
  }
}

export async function getMyAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const employeeId = req.user?.employeeId;
    if (!employeeId) {
      res.status(400).json({ success: false, message: 'No employee profile found.' });
      return;
    }

    const records = await dataStore.getAttendanceRecords({ employeeId });
    const today = getIsoDate(0);
    const todayRecord = records.find(r => r.attendanceDate === today) || null;

    res.status(200).json({
      success: true,
      today: todayRecord,
      records,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch your attendance records.', error: err.message });
  }
}

export async function getTeamAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const allEmps = await dataStore.getEmployees();
    const managerEmp = await dataStore.getEmployeeById(req.user?.employeeId || req.user?.userId || '');
    const validMgrIds = new Set([
      managerEmp?.employeeId?.toLowerCase(),
      managerEmp?._id?.toString()?.toLowerCase(),
      managerEmp?.userId?.toString()?.toLowerCase(),
      req.user?.employeeId?.toLowerCase(),
      req.user?.userId?.toLowerCase(),
    ].filter(Boolean));

    const teamMembers = allEmps.filter(e => {
      if (managerEmp && e.employeeId === managerEmp.employeeId) return false;
      if (e.managerId && validMgrIds.has(String(e.managerId).toLowerCase())) return true;
      if (managerEmp?.department && e.department && e.department.toLowerCase() === managerEmp.department.toLowerCase()) return true;
      return false;
    });
    const teamEmpIds = teamMembers.map(m => m.employeeId);

    const { date } = req.query;
    const targetDate = (date as string) || getIsoDate(0);

    const allRecords = await dataStore.getAttendanceRecords({ date: targetDate });

    // Join with team member details
    const teamAttendance = teamMembers.map(member => {
      const record = allRecords.find(r => r.employeeId === member.employeeId);
      return {
        employeeId: member.employeeId,
        name: `${member.firstName} ${member.lastName}`,
        designation: member.designation,
        department: member.department,
        status: record ? record.status : 'Absent',
        checkIn: record?.checkIn || null,
        checkOut: record?.checkOut || null,
        totalWorkingMinutes: record?.totalWorkingMinutes || 0,
        notes: record?.notes || '',
      };
    });

    res.status(200).json({
      success: true,
      date: targetDate,
      totalTeam: teamMembers.length,
      presentCount: teamAttendance.filter(t => t.status === 'Present').length,
      leaveCount: teamAttendance.filter(t => t.status === 'Leave').length,
      absentCount: teamAttendance.filter(t => t.status === 'Absent').length,
      data: teamAttendance,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch team attendance.', error: err.message });
  }
}

export async function getOrgAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { date, department, status } = req.query;
    const targetDate = (date as string) || getIsoDate(0);

    const allEmps = await dataStore.getEmployees({ department: department as string });
    const allRecords = await dataStore.getAttendanceRecords({ date: targetDate });

    let result = allEmps.map(emp => {
      const record = allRecords.find(r => r.employeeId === emp.employeeId);
      return {
        _id: record?._id || `temp_${emp.employeeId}`,
        employeeId: emp.employeeId,
        name: `${emp.firstName} ${emp.lastName}`,
        email: emp.email,
        department: emp.department,
        designation: emp.designation,
        attendanceDate: targetDate,
        status: record ? record.status : 'Absent',
        checkIn: record?.checkIn || null,
        checkOut: record?.checkOut || null,
        totalWorkingMinutes: record?.totalWorkingMinutes || 0,
        notes: record?.notes || '',
      };
    });

    if (status && status !== 'All') {
      result = result.filter(r => r.status === status);
    }

    res.status(200).json({
      success: true,
      date: targetDate,
      total: result.length,
      presentCount: result.filter(r => r.status === 'Present').length,
      leaveCount: result.filter(r => r.status === 'Leave').length,
      absentCount: result.filter(r => r.status === 'Absent').length,
      data: result,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch organization attendance.', error: err.message });
  }
}
