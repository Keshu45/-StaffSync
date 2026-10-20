import { Response } from 'express';
import { dataStore } from '../data/dataStore.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { getIsoDate } from '../data/seedData.js';

export async function getHRDashboard(_req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const today = getIsoDate(0);
    const allEmployees = await dataStore.getEmployees();
    const activeEmployees = allEmployees.filter(e => e.employmentStatus === 'Active');
    
    // Total managers
    const allUsers = dataStore.users;
    const managers = allUsers.filter(u => u.role === 'MANAGER');

    // Attendance today
    const todayRecords = await dataStore.getAttendanceRecords({ date: today });
    const presentToday = todayRecords.filter(r => r.status === 'Present').length;
    const onLeaveToday = todayRecords.filter(r => r.status === 'Leave').length;
    const absentToday = Math.max(0, activeEmployees.length - presentToday - onLeaveToday);

    // Leaves
    const allLeaves = await dataStore.getLeaves();
    const pendingLeaves = allLeaves.filter(l => l.status === 'Pending').length;
    const approvedLeaves = allLeaves.filter(l => l.status === 'Approved').length;

    // Trainings
    const allTrainings = await dataStore.getTrainings();
    const upcomingTrainings = allTrainings.filter(t => t.status === 'Upcoming').length;

    // Announcements
    const announcements = await dataStore.getAnnouncements();

    // 1. Department Distribution
    const deptMap: Record<string, number> = {};
    for (const emp of allEmployees) {
      deptMap[emp.department] = (deptMap[emp.department] || 0) + 1;
    }
    const departmentDistribution = Object.entries(deptMap).map(([name, value]) => ({
      name,
      value,
    }));

    // 2. 7-day Attendance Trend
    const attendanceTrend = [];
    for (let i = 6; i >= 0; i--) {
      const dateStr = getIsoDate(-i);
      const dayRecs = await dataStore.getAttendanceRecords({ date: dateStr });
      const pres = dayRecs.filter(r => r.status === 'Present').length;
      const lev = dayRecs.filter(r => r.status === 'Leave').length;
      const abs = Math.max(0, activeEmployees.length - pres - lev);
      
      const dayName = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
      attendanceTrend.push({
        date: dateStr,
        day: dayName,
        present: pres,
        leave: lev,
        absent: abs,
      });
    }

    // 3. Leave Distribution by Type
    const leaveTypeMap: Record<string, number> = {};
    for (const l of allLeaves) {
      leaveTypeMap[l.leaveType] = (leaveTypeMap[l.leaveType] || 0) + 1;
    }
    const leaveDistribution = Object.entries(leaveTypeMap).map(([name, value]) => ({
      name,
      value,
    }));

    // 4. Training participation
    const trainingParticipation = allTrainings.map(t => ({
      name: t.title.length > 20 ? t.title.substring(0, 18) + '...' : t.title,
      enrolled: t.enrolledEmployees.length,
      capacity: t.capacity,
    }));

    // 5. Recent HR Audits
    const recentActivities = dataStore.auditLogs.slice(0, 8);

    res.status(200).json({
      success: true,
      stats: {
        totalEmployees: allEmployees.length,
        activeEmployees: activeEmployees.length,
        totalManagers: managers.length,
        presentToday,
        absentToday,
        pendingLeaves,
        approvedLeaves,
        upcomingTrainings,
        totalAnnouncements: announcements.length,
      },
      charts: {
        departmentDistribution,
        attendanceTrend,
        leaveDistribution,
        trainingParticipation,
      },
      recentActivities,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to generate HR dashboard analytics.', error: err.message });
  }
}

export async function getManagerDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const managerEmpId = req.user?.employeeId;
    const today = getIsoDate(0);

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

    // Today's attendance for team
    const todayRecords = await dataStore.getAttendanceRecords({ date: today });
    const teamAttendance = teamMembers.map(m => {
      const rec = todayRecords.find(r => r.employeeId === m.employeeId);
      return {
        employeeId: m.employeeId,
        name: `${m.firstName} ${m.lastName}`,
        designation: m.designation,
        department: m.department,
        status: rec ? rec.status : 'Absent',
        checkIn: rec?.checkIn || null,
        checkOut: rec?.checkOut || null,
      };
    });

    const presentToday = teamAttendance.filter(t => t.status === 'Present').length;
    const absentToday = teamAttendance.filter(t => t.status === 'Absent').length;
    const onLeaveToday = teamAttendance.filter(t => t.status === 'Leave').length;

    // Team leaves
    const allLeaves = await dataStore.getLeaves();
    const teamLeaves = allLeaves.filter(l => teamEmpIds.includes(l.employeeId));
    const pendingRequests = teamLeaves.filter(l => l.status === 'Pending');

    // Trainings created by or relevant to manager
    const allTrainings = await dataStore.getTrainings();
    const myTrainings = allTrainings.filter(t => t.createdBy === req.user?.userId);

    res.status(200).json({
      success: true,
      stats: {
        teamSize: teamMembers.length,
        presentToday,
        absentToday,
        onLeaveToday,
        pendingLeavesCount: pendingRequests.length,
        managedTrainingsCount: myTrainings.length,
      },
      teamAttendance,
      pendingRequests,
      managedTrainings: myTrainings,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to generate Manager dashboard.', error: err.message });
  }
}

export async function getEmployeeDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const employeeId = req.user?.employeeId;
    if (!employeeId) {
      res.status(400).json({ success: false, message: 'No employee record found.' });
      return;
    }

    const today = getIsoDate(0);
    const todayAttendance = await dataStore.getAttendanceForDate(employeeId, today);

    // Recent leaves
    const myLeaves = await dataStore.getLeaves({ employeeId });
    const approvedLeaves = myLeaves.filter(l => l.status === 'Approved');
    const usedDays = approvedLeaves.reduce((acc, l) => acc + (l.numberOfDays || 0), 0);

    // Leave Balances (standard annual quota: 25 total)
    const leaveBalances = {
      totalQuota: 25,
      usedDays,
      remainingDays: Math.max(0, 25 - usedDays),
      casualLeave: { total: 10, used: approvedLeaves.filter(l => l.leaveType === 'Casual Leave').reduce((acc, l) => acc + l.numberOfDays, 0) },
      sickLeave: { total: 8, used: approvedLeaves.filter(l => l.leaveType === 'Sick Leave').reduce((acc, l) => acc + l.numberOfDays, 0) },
      earnedLeave: { total: 7, used: approvedLeaves.filter(l => l.leaveType === 'Earned Leave').reduce((acc, l) => acc + l.numberOfDays, 0) },
    };

    // Trainngs enrolled
    const allTrainings = await dataStore.getTrainings();
    const enrolledTrainings = allTrainings.filter(t => t.enrolledEmployees.includes(employeeId));

    // Recent announcements
    const announcements = await dataStore.getAnnouncements('Employees');

    res.status(200).json({
      success: true,
      todayAttendance,
      leaveBalances,
      recentLeaves: myLeaves.slice(0, 5),
      enrolledTrainings,
      announcements: announcements.slice(0, 3),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to generate Employee dashboard.', error: err.message });
  }
}
