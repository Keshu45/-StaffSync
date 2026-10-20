import { Response } from 'express';
import { dataStore } from '../data/dataStore.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export async function getAttendanceReport(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { startDate, endDate, department } = req.query;
    const allEmps = await dataStore.getEmployees({ department: department as string });
    const allRecords = await dataStore.getAttendanceRecords();

    let filtered = allRecords;
    if (startDate && endDate) {
      filtered = filtered.filter(r => r.attendanceDate >= (startDate as string) && r.attendanceDate <= (endDate as string));
    }

    const empMap = new Map(allEmps.map(e => [e.employeeId, e]));
    const reportData = filtered
      .filter(r => empMap.has(r.employeeId))
      .map(r => {
        const emp = empMap.get(r.employeeId)!;
        return {
          employeeId: r.employeeId,
          name: `${emp.firstName} ${emp.lastName}`,
          department: emp.department,
          designation: emp.designation,
          date: r.attendanceDate,
          checkIn: r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
          checkOut: r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
          status: r.status,
          workingMinutes: r.totalWorkingMinutes || 0,
          workingHours: ((r.totalWorkingMinutes || 0) / 60).toFixed(1),
        };
      });

    res.status(200).json({
      success: true,
      totalRecords: reportData.length,
      data: reportData,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to generate attendance report.', error: err.message });
  }
}

export async function getLeaveReport(_req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const allLeaves = await dataStore.getLeaves();
    const allEmps = await dataStore.getEmployees();
    const empMap = new Map(allEmps.map(e => [e.employeeId, e]));

    const reportData = allLeaves.map(l => {
      const emp = empMap.get(l.employeeId);
      return {
        id: l._id,
        employeeId: l.employeeId,
        name: l.employeeName || (emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown'),
        department: l.department || (emp ? emp.department : 'General'),
        leaveType: l.leaveType,
        startDate: l.startDate,
        endDate: l.endDate,
        days: l.numberOfDays,
        status: l.status,
        reason: l.reason,
        reviewedBy: l.reviewedByName || l.reviewedBy || '-',
        appliedAt: new Date(l.createdAt).toLocaleDateString(),
      };
    });

    res.status(200).json({
      success: true,
      totalLeaves: reportData.length,
      data: reportData,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to generate leave report.', error: err.message });
  }
}

export async function getEmployeeReport(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const isHR = req.user?.role === 'HR';
    const allEmps = await dataStore.getEmployees();

    const reportData = allEmps.map(e => {
      const copy: any = {
        employeeId: e.employeeId,
        name: `${e.firstName} ${e.lastName}`,
        email: e.email,
        phone: e.phone,
        department: e.department,
        designation: e.designation,
        dateOfJoining: e.dateOfJoining,
        status: e.employmentStatus,
      };
      if (isHR) {
        copy.salary = e.salary;
      }
      return copy;
    });

    res.status(200).json({
      success: true,
      totalEmployees: reportData.length,
      data: reportData,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to generate employee report.', error: err.message });
  }
}
