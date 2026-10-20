import { Response } from 'express';
import { dataStore } from '../data/dataStore.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export async function applyLeave(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const employeeId = req.user?.employeeId;
    if (!employeeId) {
      res.status(400).json({ success: false, message: 'No employee profile linked to this account.' });
      return;
    }

    const { leaveType, startDate, endDate, reason } = req.body;

    if (!leaveType || !startDate || !endDate || !reason) {
      res.status(400).json({
        success: false,
        message: 'Leave type, start date, end date, and reason are required.',
      });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({ success: false, message: 'Invalid start or end date format.' });
      return;
    }

    if (end < start) {
      res.status(400).json({ success: false, message: 'End date cannot be earlier than start date.' });
      return;
    }

    // Calculate number of working/calendar days inclusive
    const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;

    // Check for overlapping active leaves
    const existingLeaves = await dataStore.getLeaves({ employeeId });
    const hasOverlap = existingLeaves.some(l => {
      if (l.status === 'Cancelled' || l.status === 'Rejected') return false;
      const lStart = new Date(l.startDate);
      const lEnd = new Date(l.endDate);
      return start <= lEnd && end >= lStart;
    });

    if (hasOverlap) {
      res.status(400).json({
        success: false,
        message: 'You already have an active or approved leave application that overlaps with these dates.',
      });
      return;
    }

    const employee = await dataStore.getEmployeeById(employeeId);

    const newLeave = await dataStore.createLeave({
      employeeId,
      employeeName: employee ? `${employee.firstName} ${employee.lastName}` : req.user!.name,
      department: employee?.department || 'General',
      leaveType,
      startDate,
      endDate,
      numberOfDays: diffDays,
      reason: reason.trim(),
      status: 'Pending',
    });

    // Notify manager if assigned, otherwise notify HR
    const managerEmpId = employee?.managerId;
    if (managerEmpId) {
      await dataStore.createNotification({
        recipientId: managerEmpId,
        title: `New Leave Request from ${newLeave.employeeName}`,
        message: `${newLeave.employeeName} applied for ${diffDays} day(s) of ${leaveType} (${startDate} to ${endDate}).`,
        type: 'Leave',
        relatedEntityId: newLeave._id,
      });
    }

    await dataStore.logAudit(
      'LEAVE_APPLIED',
      req.user!.userId,
      req.user!.name,
      'Leave',
      newLeave._id,
      `Applied for ${diffDays} day(s) ${leaveType}`
    );

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully. Your manager has been notified.',
      data: newLeave,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to submit leave request.', error: err.message });
  }
}

export async function getMyLeaves(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const employeeId = req.user?.employeeId;
    if (!employeeId) {
      res.status(400).json({ success: false, message: 'No employee profile linked to this account.' });
      return;
    }

    const leaves = await dataStore.getLeaves({ employeeId });
    res.status(200).json({ success: true, data: leaves });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch leave history.', error: err.message });
  }
}

async function canManagerReviewEmployee(managerIdOrUserId: string | undefined, employeeId: string): Promise<boolean> {
  if (!managerIdOrUserId) return false;
  const managerEmp = await dataStore.getEmployeeById(managerIdOrUserId);
  const employee = await dataStore.getEmployeeById(employeeId);
  if (!employee) return false;

  const validManagerIdentifiers = new Set([
    managerEmp?.employeeId?.toLowerCase(),
    managerEmp?._id?.toString()?.toLowerCase(),
    managerEmp?.userId?.toString()?.toLowerCase(),
    managerIdOrUserId?.toLowerCase(),
  ].filter(Boolean));

  // Direct manager assignment
  if (employee.managerId && validManagerIdentifiers.has(String(employee.managerId).toLowerCase())) {
    return true;
  }

  // Department leadership fallback
  if (managerEmp?.department && employee.department && 
      managerEmp.department.toLowerCase() === employee.department.toLowerCase() &&
      managerEmp.employeeId !== employee.employeeId) {
    return true;
  }

  return false;
}

export async function getAllLeaves(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const isHR = req.user?.role === 'HR';
    const isManager = req.user?.role === 'MANAGER';
    const { status } = req.query;

    let leaves: any[] = [];

    if (isHR) {
      // HR can view all leaves
      leaves = await dataStore.getLeaves({ status: status as string });
    } else if (isManager) {
      // Manager can view only leaves from assigned team members or department
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
      leaves = await dataStore.getLeaves({
        employeeIds: teamEmpIds,
        status: status as string,
      });
    } else {
      // Regular employees can only see their own
      leaves = await dataStore.getLeaves({
        employeeId: req.user?.employeeId,
        status: status as string,
      });
    }

    res.status(200).json({
      success: true,
      total: leaves.length,
      pendingCount: leaves.filter(l => l.status === 'Pending').length,
      approvedCount: leaves.filter(l => l.status === 'Approved').length,
      rejectedCount: leaves.filter(l => l.status === 'Rejected').length,
      data: leaves,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch leaves.', error: err.message });
  }
}

export async function getLeaveById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const leave = await dataStore.getLeaveById(id);
    if (!leave) {
      res.status(404).json({ success: false, message: 'Leave request not found.' });
      return;
    }

    // Role safety check
    const isHR = req.user?.role === 'HR';
    const isSelf = req.user?.employeeId === leave.employeeId;
    if (!isHR && !isSelf && req.user?.role !== 'MANAGER') {
      res.status(403).json({ success: false, message: 'Not authorized to view this leave request.' });
      return;
    }

    res.status(200).json({ success: true, data: leave });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve leave.', error: err.message });
  }
}

export async function approveLeave(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { comment = 'Approved' } = req.body;

    const leave = await dataStore.getLeaveById(id);
    if (!leave) {
      res.status(404).json({ success: false, message: 'Leave request not found.' });
      return;
    }

    if (leave.status !== 'Pending') {
      res.status(400).json({
        success: false,
        message: `Cannot approve this leave because it is already ${leave.status}.`,
      });
      return;
    }

    // Authorization check: Managers can only approve their team members, HR can approve all
    const isHR = req.user?.role === 'HR';
    if (!isHR) {
      const allowed = await canManagerReviewEmployee(req.user?.employeeId || req.user?.userId, leave.employeeId);
      if (!allowed) {
        res.status(403).json({
          success: false,
          message: 'You can only review leave requests from your assigned team members.',
        });
        return;
      }
    }

    const updated = await dataStore.updateLeave(id, {
      status: 'Approved',
      reviewedBy: req.user?.employeeId || req.user?.userId,
      reviewedByName: req.user?.name,
      reviewComment: comment,
      reviewedAt: new Date(),
    });

    // Notify employee
    await dataStore.createNotification({
      recipientId: leave.employeeId,
      title: 'Leave Request Approved!',
      message: `Your ${leave.leaveType} (${leave.startDate} to ${leave.endDate}) has been approved by ${req.user!.name}.`,
      type: 'Leave',
      relatedEntityId: leave._id,
    });

    await dataStore.logAudit(
      'LEAVE_APPROVED',
      req.user!.userId,
      req.user!.name,
      'Leave',
      id,
      `Approved ${leave.numberOfDays} days for employee ${leave.employeeId}`
    );

    res.status(200).json({
      success: true,
      message: 'Leave request approved successfully.',
      data: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to approve leave.', error: err.message });
  }
}

export async function rejectLeave(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    if (!comment || comment.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'A rejection reason comment is required.',
      });
      return;
    }

    const leave = await dataStore.getLeaveById(id);
    if (!leave) {
      res.status(404).json({ success: false, message: 'Leave request not found.' });
      return;
    }

    if (leave.status !== 'Pending') {
      res.status(400).json({
        success: false,
        message: `Cannot reject this leave because it is already ${leave.status}.`,
      });
      return;
    }

    const isHR = req.user?.role === 'HR';
    if (!isHR) {
      const allowed = await canManagerReviewEmployee(req.user?.employeeId || req.user?.userId, leave.employeeId);
      if (!allowed) {
        res.status(403).json({
          success: false,
          message: 'You can only review leave requests from your assigned team members.',
        });
        return;
      }
    }

    const updated = await dataStore.updateLeave(id, {
      status: 'Rejected',
      reviewedBy: req.user?.employeeId || req.user?.userId,
      reviewedByName: req.user?.name,
      reviewComment: comment.trim(),
      reviewedAt: new Date(),
    });

    // Notify employee
    await dataStore.createNotification({
      recipientId: leave.employeeId,
      title: 'Leave Request Rejected',
      message: `Your ${leave.leaveType} (${leave.startDate} to ${leave.endDate}) was rejected. Reason: "${comment.trim()}"`,
      type: 'Leave',
      relatedEntityId: leave._id,
    });

    await dataStore.logAudit(
      'LEAVE_REJECTED',
      req.user!.userId,
      req.user!.name,
      'Leave',
      id,
      `Rejected leave for employee ${leave.employeeId}. Reason: ${comment.trim()}`
    );

    res.status(200).json({
      success: true,
      message: 'Leave request rejected.',
      data: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to reject leave.', error: err.message });
  }
}

export async function cancelLeave(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const leave = await dataStore.getLeaveById(id);

    if (!leave) {
      res.status(404).json({ success: false, message: 'Leave request not found.' });
      return;
    }

    const isSelf = req.user?.employeeId === leave.employeeId;
    const isHR = req.user?.role === 'HR';

    if (!isSelf && !isHR) {
      res.status(403).json({ success: false, message: 'You can only cancel your own leave requests.' });
      return;
    }

    if (leave.status !== 'Pending') {
      res.status(400).json({
        success: false,
        message: `Only pending leave requests can be cancelled. Current status is ${leave.status}.`,
      });
      return;
    }

    const updated = await dataStore.updateLeave(id, { status: 'Cancelled' });

    await dataStore.logAudit(
      'LEAVE_CANCELLED',
      req.user!.userId,
      req.user!.name,
      'Leave',
      id,
      `Cancelled leave request for dates ${leave.startDate} - ${leave.endDate}`
    );

    res.status(200).json({
      success: true,
      message: 'Leave request cancelled successfully.',
      data: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to cancel leave.', error: err.message });
  }
}
