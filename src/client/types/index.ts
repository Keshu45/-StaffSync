export type UserRole = 'HR' | 'MANAGER' | 'EMPLOYEE';
export type EmploymentStatus = 'Active' | 'On Leave' | 'Terminated' | 'Probation';
export type AttendanceStatus = 'Present' | 'Absent' | 'Half Day' | 'Leave';
export type LeaveType = 'Casual Leave' | 'Sick Leave' | 'Earned Leave' | 'Unpaid Leave';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
export type AnnouncementCategory = 'General' | 'Policy' | 'Holiday' | 'Event' | 'Health & Safety';
export type AnnouncementAudience = 'All' | 'HR' | 'Managers' | 'Employees';
export type TrainingStatus = 'Upcoming' | 'In Progress' | 'Completed' | 'Cancelled';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  employeeId?: string;
  isActive: boolean;
  lastLoginAt?: string;
}

export interface Employee {
  _id: string;
  employeeId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  dateOfJoining: string;
  employmentStatus: EmploymentStatus;
  managerId?: string | null;
  salary?: number;
  address?: string;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  _id: string;
  employeeId: string;
  name?: string;
  department?: string;
  designation?: string;
  attendanceDate: string;
  checkIn?: string | null;
  checkOut?: string | null;
  status: AttendanceStatus;
  totalWorkingMinutes: number;
  notes?: string;
}

export interface LeaveRequest {
  _id: string;
  employeeId: string;
  employeeName?: string;
  department?: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  numberOfDays: number;
  reason: string;
  status: LeaveStatus;
  reviewedBy?: string | null;
  reviewedByName?: string | null;
  reviewComment?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

export interface Announcement {
  _id: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  authorId: string;
  authorName: string;
  audience: AnnouncementAudience;
  priority: 'Low' | 'Medium' | 'High';
  publishedAt: string;
  expiryDate?: string | null;
  isPublished: boolean;
  isArchived: boolean;
  createdAt: string;
}

export interface Training {
  _id: string;
  title: string;
  description: string;
  trainer: string;
  category: string;
  startDate: string;
  endDate: string;
  capacity: number;
  enrolledEmployees: string[];
  enrolledCount?: number;
  seatsRemaining?: number;
  isEnrolled?: boolean;
  createdBy: string;
  createdByName?: string;
  targetAudience: string;
  status: TrainingStatus;
  locationOrUrl?: string;
  createdAt: string;
}

export interface NotificationItem {
  _id: string;
  recipientId: string;
  title: string;
  message: string;
  type: 'Leave' | 'Attendance' | 'Announcement' | 'Training' | 'System' | 'Profile';
  relatedEntityId?: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  action: string;
  performedBy: string;
  performedByName: string;
  targetEntity: string;
  targetId?: string;
  details: string;
  createdAt: string;
}
