import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/role.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { dataStore } from '../data/dataStore.js';

// Controllers
import * as authCtrl from '../controllers/authController.js';
import * as empCtrl from '../controllers/employeeController.js';
import * as mgrCtrl from '../controllers/managerController.js';
import * as attCtrl from '../controllers/attendanceController.js';
import * as leaveCtrl from '../controllers/leaveController.js';
import * as annCtrl from '../controllers/announcementController.js';
import * as trnCtrl from '../controllers/trainingController.js';
import * as notifCtrl from '../controllers/notificationController.js';
import * as dashCtrl from '../controllers/dashboardController.js';
import * as rptCtrl from '../controllers/reportController.js';

const router = Router();

// ==========================================
// 1. System Health Check
// ==========================================
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'StaffSync HRMS API',
    database: {
      connectedToAtlas: dataStore.isConnectedToAtlas,
      storeEngine: dataStore.isConnectedToAtlas ? 'MongoDB Atlas' : 'Resilient In-Memory DataStore',
      usersCount: dataStore.users.length,
      employeesCount: dataStore.employees.length,
    },
  });
});

// ==========================================
// 2. Authentication Routes
// ==========================================
router.post('/auth/register', authRateLimiter(20, 60000), authCtrl.register);
router.post('/auth/login', authRateLimiter(30, 60000), authCtrl.login);
router.post('/auth/logout', authCtrl.logout);
router.get('/auth/me', authenticate, authCtrl.getMe);
router.post('/auth/change-password', authenticate, authCtrl.changePassword);

// ==========================================
// 3. Employee Management Routes
// ==========================================
router.get('/employees', authenticate, empCtrl.getAllEmployees);
router.post('/employees', authenticate, authorizeRoles('HR'), empCtrl.createEmployee);
router.get('/employees/:id', authenticate, empCtrl.getEmployeeById);
router.put('/employees/:id', authenticate, empCtrl.updateEmployee);
router.patch('/employees/:id/status', authenticate, authorizeRoles('HR'), empCtrl.updateEmployeeStatus);
router.get('/employees/:id/attendance', authenticate, empCtrl.getEmployeeAttendance);
router.get('/employees/:id/leaves', authenticate, empCtrl.getEmployeeLeaves);

// ==========================================
// 4. Manager Management Routes
// ==========================================
router.get('/managers', authenticate, authorizeRoles('HR', 'MANAGER'), mgrCtrl.getAllManagers);
router.post('/managers', authenticate, authorizeRoles('HR'), mgrCtrl.createManager);
router.get('/managers/:id/team', authenticate, authorizeRoles('HR', 'MANAGER'), mgrCtrl.getManagerTeam);
router.post('/managers/:id/assignments', authenticate, authorizeRoles('HR'), mgrCtrl.assignTeamMembers);

// ==========================================
// 5. Attendance Routes
// ==========================================
router.post('/attendance/check-in', authenticate, attCtrl.checkIn);
router.post('/attendance/check-out', authenticate, attCtrl.checkOut);
router.get('/attendance/me', authenticate, attCtrl.getMyAttendance);
router.get('/attendance/team', authenticate, authorizeRoles('MANAGER', 'HR'), attCtrl.getTeamAttendance);
router.get('/attendance', authenticate, authorizeRoles('HR'), attCtrl.getOrgAttendance);

// ==========================================
// 6. Leave Management Routes
// ==========================================
router.post('/leaves', authenticate, leaveCtrl.applyLeave);
router.get('/leaves/me', authenticate, leaveCtrl.getMyLeaves);
router.get('/leaves', authenticate, leaveCtrl.getAllLeaves);
router.get('/leaves/:id', authenticate, leaveCtrl.getLeaveById);
router.patch('/leaves/:id/approve', authenticate, authorizeRoles('HR', 'MANAGER'), leaveCtrl.approveLeave);
router.patch('/leaves/:id/reject', authenticate, authorizeRoles('HR', 'MANAGER'), leaveCtrl.rejectLeave);
router.patch('/leaves/:id/cancel', authenticate, leaveCtrl.cancelLeave);

// ==========================================
// 7. Announcement Routes
// ==========================================
router.get('/announcements', authenticate, annCtrl.getAllAnnouncements);
router.post('/announcements', authenticate, authorizeRoles('HR'), annCtrl.createAnnouncement);
router.get('/announcements/:id', authenticate, annCtrl.getAnnouncementById);
router.put('/announcements/:id', authenticate, authorizeRoles('HR'), annCtrl.updateAnnouncement);
router.patch('/announcements/:id/archive', authenticate, authorizeRoles('HR'), annCtrl.archiveAnnouncement);
router.delete('/announcements/:id', authenticate, authorizeRoles('HR'), annCtrl.deleteAnnouncement);

// ==========================================
// 8. Training Routes
// ==========================================
router.get('/trainings', authenticate, trnCtrl.getAllTrainings);
router.post('/trainings', authenticate, authorizeRoles('HR', 'MANAGER'), trnCtrl.createTraining);
router.get('/trainings/:id', authenticate, trnCtrl.getTrainingById);
router.put('/trainings/:id', authenticate, authorizeRoles('HR', 'MANAGER'), trnCtrl.updateTraining);
router.post('/trainings/:id/enroll', authenticate, trnCtrl.enrollTraining);
router.delete('/trainings/:id/enroll', authenticate, trnCtrl.cancelEnrollment);
router.get('/trainings/:id/enrollments', authenticate, authorizeRoles('HR', 'MANAGER'), trnCtrl.getTrainingEnrollments);

// ==========================================
// 9. Notification Routes
// ==========================================
router.get('/notifications', authenticate, notifCtrl.getNotifications);
router.patch('/notifications/:id/read', authenticate, notifCtrl.markNotificationRead);
router.patch('/notifications/read-all', authenticate, notifCtrl.markAllNotificationsRead);

// ==========================================
// 10. Dashboard Routes
// ==========================================
router.get('/dashboard/hr', authenticate, authorizeRoles('HR'), dashCtrl.getHRDashboard);
router.get('/dashboard/manager', authenticate, authorizeRoles('MANAGER', 'HR'), dashCtrl.getManagerDashboard);
router.get('/dashboard/employee', authenticate, dashCtrl.getEmployeeDashboard);

// ==========================================
// 11. Reports Routes
// ==========================================
router.get('/reports/attendance', authenticate, authorizeRoles('HR', 'MANAGER'), rptCtrl.getAttendanceReport);
router.get('/reports/leaves', authenticate, authorizeRoles('HR', 'MANAGER'), rptCtrl.getLeaveReport);
router.get('/reports/employees', authenticate, authorizeRoles('HR'), rptCtrl.getEmployeeReport);

export default router;
