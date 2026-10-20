import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { config } from '../config/env.js';
import {
  initialUsers,
  initialEmployees,
  initialAttendance,
  initialLeaves,
  initialAnnouncements,
  initialTrainings,
  initialNotifications,
} from './seedData.js';
import { UserModel, IUser } from '../models/User.js';
import { EmployeeModel, IEmployee } from '../models/Employee.js';
import { AttendanceModel, IAttendance } from '../models/Attendance.js';
import { LeaveModel, ILeave } from '../models/Leave.js';
import { AnnouncementModel, IAnnouncement } from '../models/Announcement.js';
import { TrainingModel, ITraining } from '../models/Training.js';
import { NotificationModel, INotification } from '../models/Notification.js';
import { AuditLogModel, IAuditLog } from '../models/AuditLog.js';

const DB_FILE_PATH = path.resolve(process.cwd(), '.staffsync_db.json');

class DataStore {
  public isConnectedToAtlas: boolean = false;
  
  // In-memory collections matching Mongoose interfaces
  public users: any[] = [];
  public employees: any[] = [];
  public attendance: any[] = [];
  public leaves: any[] = [];
  public announcements: any[] = [];
  public trainings: any[] = [];
  public notifications: any[] = [];
  public auditLogs: any[] = [];

  constructor() {
    this.seedInMemory();
  }

  private seedInMemory() {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        this.users = Array.isArray(parsed.users) && parsed.users.length > 0 ? parsed.users : JSON.parse(JSON.stringify(initialUsers));
        this.employees = Array.isArray(parsed.employees) && parsed.employees.length > 0 ? parsed.employees : JSON.parse(JSON.stringify(initialEmployees));
        this.attendance = Array.isArray(parsed.attendance) ? parsed.attendance : JSON.parse(JSON.stringify(initialAttendance));
        this.leaves = Array.isArray(parsed.leaves) ? parsed.leaves : JSON.parse(JSON.stringify(initialLeaves));
        this.announcements = Array.isArray(parsed.announcements) ? parsed.announcements : JSON.parse(JSON.stringify(initialAnnouncements));
        this.trainings = Array.isArray(parsed.trainings) ? parsed.trainings : JSON.parse(JSON.stringify(initialTrainings));
        this.notifications = Array.isArray(parsed.notifications) ? parsed.notifications : JSON.parse(JSON.stringify(initialNotifications));
        this.auditLogs = Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [];

        // Ensure all seed users exist
        for (const seedUser of initialUsers) {
          if (!this.users.some(u => u.email.toLowerCase() === seedUser.email.toLowerCase())) {
            this.users.push(JSON.parse(JSON.stringify(seedUser)));
          }
        }
        for (const seedEmp of initialEmployees) {
          if (!this.employees.some(e => e.employeeId === seedEmp.employeeId)) {
            this.employees.push(JSON.parse(JSON.stringify(seedEmp)));
          }
        }
        return;
      }
    } catch (err) {
      console.warn('[DataStore] Failed to load persisted store file, using fresh seed:', err);
    }

    this.users = JSON.parse(JSON.stringify(initialUsers));
    this.employees = JSON.parse(JSON.stringify(initialEmployees));
    this.attendance = JSON.parse(JSON.stringify(initialAttendance));
    this.leaves = JSON.parse(JSON.stringify(initialLeaves));
    this.announcements = JSON.parse(JSON.stringify(initialAnnouncements));
    this.trainings = JSON.parse(JSON.stringify(initialTrainings));
    this.notifications = JSON.parse(JSON.stringify(initialNotifications));
    this.auditLogs = [];
    this.persistToDisk();
  }

  public persistToDisk() {
    try {
      const payload = {
        users: this.users,
        employees: this.employees,
        attendance: this.attendance,
        leaves: this.leaves,
        announcements: this.announcements,
        trainings: this.trainings,
        notifications: this.notifications,
        auditLogs: this.auditLogs,
      };
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DataStore] Error persisting to disk:', err);
    }
  }

  public async init() {
    if (config.mongodbUri) {
      try {
        console.log('[Database] Connecting to MongoDB compass..');
        await mongoose.connect(config.mongodbUri);
        this.isConnectedToAtlas = true;
        console.log('[Database] Connected to MongoDB compass successfully.');
        await this.syncMongooseSeed();
      } catch (err: any) {
        console.warn('[Database] MongoDB compass connection error:', err.message);
        console.warn('[Database] Falling back seamlessly to resilient persistent store.');
        this.isConnectedToAtlas = false;
      }
    } else {
      console.log('[Database] Running with persistent local store.');
    }
  }

  private async syncMongooseSeed() {
    try {
      const userCount = await UserModel.countDocuments();
      if (userCount === 0) {
        console.log('[Database] Migrating current application records into MongoDB compass...');
        const usersToSeed = this.users && this.users.length > 0 ? this.users : initialUsers;
        const employeesToSeed = this.employees && this.employees.length > 0 ? this.employees : initialEmployees;
        const attendanceToSeed = this.attendance && this.attendance.length > 0 ? this.attendance : initialAttendance;
        const leavesToSeed = this.leaves && this.leaves.length > 0 ? this.leaves : initialLeaves;
        const announcementsToSeed = this.announcements && this.announcements.length > 0 ? this.announcements : initialAnnouncements;
        const trainingsToSeed = this.trainings && this.trainings.length > 0 ? this.trainings : initialTrainings;
        const notificationsToSeed = this.notifications && this.notifications.length > 0 ? this.notifications : initialNotifications;
        const auditLogsToSeed = this.auditLogs && this.auditLogs.length > 0 ? this.auditLogs : [];

        await UserModel.insertMany(usersToSeed);
        await EmployeeModel.insertMany(employeesToSeed);
        await AttendanceModel.insertMany(attendanceToSeed);
        await LeaveModel.insertMany(leavesToSeed);
        await AnnouncementModel.insertMany(announcementsToSeed);
        await TrainingModel.insertMany(trainingsToSeed);
        await NotificationModel.insertMany(notificationsToSeed);
        if (auditLogsToSeed.length > 0) {
          await AuditLogModel.insertMany(auditLogsToSeed);
        }
        console.log('[Database] All records successfully migrated to MongoDB compass!');
      } else {
        console.log(`[Database] MongoDB compass connected. Detected ${userCount} existing users.`);
      }
    } catch (err: any) {
      console.error('[Database] Failed to seed/migrate data to MongoDB:', err.message);
    }
  }

  // --- Audit Log Utility ---
  public async logAudit(action: string, performedBy: string, performedByName: string, targetEntity: string, targetId?: string, details: string = '') {
    const logData = {
      _id: `aud_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      action,
      performedBy,
      performedByName,
      targetEntity,
      targetId: targetId || null,
      details,
      createdAt: new Date(),
    };

    if (this.isConnectedToAtlas) {
      try {
        await AuditLogModel.create(logData);
      } catch (e) {
        console.error('Audit log failed:', e);
      }
    }
    this.auditLogs.unshift(logData);
    this.persistToDisk();
  }

  // --- User Queries ---
  public async findUserByEmail(email: string): Promise<any | null> {
    const cleanEmail = email.toLowerCase().trim();
    if (this.isConnectedToAtlas) {
      const u = await UserModel.findOne({ email: cleanEmail });
      return u ? u.toObject() : null;
    }
    return this.users.find(u => u.email.toLowerCase() === cleanEmail) || null;
  }

  public async findUserById(id: string): Promise<any | null> {
    if (this.isConnectedToAtlas) {
      const u = await UserModel.findById(id);
      return u ? u.toObject() : null;
    }
    return this.users.find(u => String(u._id) === String(id)) || null;
  }

  public async createUser(userData: any): Promise<any> {
    const cleanEmail = userData.email.toLowerCase().trim();
    if (this.isConnectedToAtlas) {
      const u = await UserModel.create({ ...userData, email: cleanEmail });
      return u.toObject();
    }
    const newUser = {
      ...userData,
      _id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      email: cleanEmail,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(newUser);
    this.persistToDisk();
    return newUser;
  }

  public async updateUser(id: string, updateData: any): Promise<any | null> {
    if (this.isConnectedToAtlas) {
      const u = await UserModel.findByIdAndUpdate(id, updateData, { returnDocument: 'after' });
      return u ? u.toObject() : null;
    }
    const idx = this.users.findIndex(u => String(u._id) === String(id));
    if (idx === -1) return null;
    this.users[idx] = { ...this.users[idx], ...updateData, updatedAt: new Date() };
    this.persistToDisk();
    return this.users[idx];
  }

  // --- Employee Queries ---
  public async getEmployees(filter: { department?: string; status?: string; search?: string } = {}): Promise<any[]> {
    if (this.isConnectedToAtlas) {
      const query: any = {};
      if (filter.department && filter.department !== 'All') query.department = filter.department;
      if (filter.status && filter.status !== 'All') query.employmentStatus = filter.status;
      if (filter.search) {
        const regex = new RegExp(filter.search, 'i');
        query.$or = [{ firstName: regex }, { lastName: regex }, { email: regex }, { employeeId: regex }, { department: regex }];
      }
      const emps = await EmployeeModel.find(query).sort({ createdAt: -1 });
      return emps.map(e => e.toObject());
    }

    let list = [...this.employees];
    if (filter.department && filter.department !== 'All') {
      list = list.filter(e => e.department.toLowerCase() === filter.department?.toLowerCase());
    }
    if (filter.status && filter.status !== 'All') {
      list = list.filter(e => e.employmentStatus.toLowerCase() === filter.status?.toLowerCase());
    }
    if (filter.search) {
      const s = filter.search.toLowerCase();
      list = list.filter(e =>
        e.firstName.toLowerCase().includes(s) ||
        e.lastName.toLowerCase().includes(s) ||
        e.email.toLowerCase().includes(s) ||
        e.employeeId.toLowerCase().includes(s) ||
        e.department.toLowerCase().includes(s) ||
        e.designation.toLowerCase().includes(s)
      );
    }
    return list;
  }

  public async getEmployeeById(id: string): Promise<any | null> {
    if (this.isConnectedToAtlas) {
      const emp = await EmployeeModel.findOne({
        $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { employeeId: id }, { userId: id }]
      });
      return emp ? emp.toObject() : null;
    }
    return this.employees.find(e => e._id === id || e.employeeId === id || e.userId === id) || null;
  }

  public async createEmployee(empData: any): Promise<any> {
    if (this.isConnectedToAtlas) {
      const e = await EmployeeModel.create(empData);
      return e.toObject();
    }
    const newEmp = {
      ...empData,
      _id: `emp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.employees.push(newEmp);
    this.persistToDisk();
    return newEmp;
  }

  public async updateEmployee(id: string, updateData: any): Promise<any | null> {
    if (this.isConnectedToAtlas) {
      const e = await EmployeeModel.findOneAndUpdate(
        { $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { employeeId: id }] },
        updateData,
        { returnDocument: 'after' }
      );
      return e ? e.toObject() : null;
    }
    const idx = this.employees.findIndex(e => e._id === id || e.employeeId === id);
    if (idx === -1) return null;
    this.employees[idx] = { ...this.employees[idx], ...updateData, updatedAt: new Date() };
    this.persistToDisk();
    return this.employees[idx];
  }

  // --- Attendance Queries ---
  public async getAttendanceRecords(filter: { employeeId?: string; date?: string; status?: string } = {}): Promise<any[]> {
    if (this.isConnectedToAtlas) {
      const query: any = {};
      if (filter.employeeId) query.employeeId = filter.employeeId;
      if (filter.date) query.attendanceDate = filter.date;
      if (filter.status && filter.status !== 'All') query.status = filter.status;
      const recs = await AttendanceModel.find(query).sort({ attendanceDate: -1, createdAt: -1 });
      return recs.map(r => r.toObject());
    }

    let list = [...this.attendance];
    if (filter.employeeId) list = list.filter(a => a.employeeId === filter.employeeId);
    if (filter.date) list = list.filter(a => a.attendanceDate === filter.date);
    if (filter.status && filter.status !== 'All') list = list.filter(a => a.status === filter.status);
    return list.sort((a, b) => new Date(b.attendanceDate).getTime() - new Date(a.attendanceDate).getTime());
  }

  public async getAttendanceForDate(employeeId: string, date: string): Promise<any | null> {
    if (this.isConnectedToAtlas) {
      const rec = await AttendanceModel.findOne({ employeeId, attendanceDate: date });
      return rec ? rec.toObject() : null;
    }
    return this.attendance.find(a => a.employeeId === employeeId && a.attendanceDate === date) || null;
  }

  public async createOrUpdateAttendance(record: any): Promise<any> {
    if (this.isConnectedToAtlas) {
      const rec = await AttendanceModel.findOneAndUpdate(
        { employeeId: record.employeeId, attendanceDate: record.attendanceDate },
        record,
        { upsert: true, new: true }
      );
      return rec.toObject();
    }
    const idx = this.attendance.findIndex(
      a => a.employeeId === record.employeeId && a.attendanceDate === record.attendanceDate
    );
    if (idx !== -1) {
      this.attendance[idx] = { ...this.attendance[idx], ...record, updatedAt: new Date() };
      this.persistToDisk();
      return this.attendance[idx];
    }
    const newRecord = {
      ...record,
      _id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.attendance.push(newRecord);
    this.persistToDisk();
    return newRecord;
  }

  // --- Leave Queries ---
  public async getLeaves(filter: { employeeId?: string; status?: string; employeeIds?: string[] } = {}): Promise<any[]> {
    if (this.isConnectedToAtlas) {
      const query: any = {};
      if (filter.employeeId) query.employeeId = filter.employeeId;
      if (filter.employeeIds && filter.employeeIds.length > 0) query.employeeId = { $in: filter.employeeIds };
      if (filter.status && filter.status !== 'All') query.status = filter.status;
      const recs = await LeaveModel.find(query).sort({ createdAt: -1 });
      return recs.map(r => r.toObject());
    }

    let list = [...this.leaves];
    if (filter.employeeId) list = list.filter(l => l.employeeId === filter.employeeId);
    if (filter.employeeIds && filter.employeeIds.length > 0) {
      list = list.filter(l => filter.employeeIds!.includes(l.employeeId));
    }
    if (filter.status && filter.status !== 'All') list = list.filter(l => l.status === filter.status);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async getLeaveById(id: string): Promise<any | null> {
    if (this.isConnectedToAtlas) {
      const l = await LeaveModel.findById(id);
      return l ? l.toObject() : null;
    }
    return this.leaves.find(l => l._id === id) || null;
  }

  public async createLeave(leaveData: any): Promise<any> {
    // Validate the incoming payload before attempting to save it.
    if (!leaveData || typeof leaveData !== 'object' || Array.isArray(leaveData)) {
      throw new Error('Invalid leave data: expected an object.');
    }

    // Remove client-provided _id so null/empty IDs cannot override generation.
    const { _id: suppliedId, ...leaveFields } = leaveData;

    if (this.isConnectedToAtlas) {
      try {
        // Respect a String _id schema if this model explicitly uses one;
        // otherwise use MongoDB/Mongoose's normal ObjectId type.
        const idPath = LeaveModel.schema.path('_id');
        const generatedId = idPath?.instance === 'String'
          ? `lev_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
          : new mongoose.Types.ObjectId();

        const leaveDoc = new LeaveModel({
          ...leaveFields,
          _id: generatedId,
        });

        if (leaveDoc._id == null || String(leaveDoc._id).trim() === '') {
          throw new Error('Leave document has no _id after model construction.');
        }

        await leaveDoc.save();
        return leaveDoc.toObject();
      } catch (error) {
        console.error('[DataStore] Failed to create leave in MongoDB:', error);
        throw error;
      }
    }

    const localId =
      typeof suppliedId === 'string' && suppliedId.trim()
        ? suppliedId.trim()
        : `lev_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    const persistedLeave = {
      ...leaveFields,
      _id: localId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.leaves.push(persistedLeave);
    this.persistToDisk();
    return persistedLeave;
  }

  public async updateLeave(id: string, updateData: any): Promise<any | null> {
    if (this.isConnectedToAtlas) {
      const l = await LeaveModel.findByIdAndUpdate(id, updateData, { returnDocument: 'after'  });
      return l ? l.toObject() : null;
    }
    const idx = this.leaves.findIndex(l => l._id === id);
    if (idx === -1) return null;
    this.leaves[idx] = { ...this.leaves[idx], ...updateData, updatedAt: new Date() };
    this.persistToDisk();
    return this.leaves[idx];
  }

  // --- Announcement Queries ---
  public async getAnnouncements(audience?: string): Promise<any[]> {
    if (this.isConnectedToAtlas) {
      const query: any = { isArchived: false };
      if (audience && audience !== 'All') {
        query.$or = [{ audience: 'All' }, { audience }];
      }
      const recs = await AnnouncementModel.find(query).sort({ publishedAt: -1, createdAt: -1 });
      return recs.map(r => r.toObject());
    }

    let list = this.announcements.filter(a => !a.isArchived);
    if (audience && audience !== 'All') {
      list = list.filter(a => a.audience === 'All' || a.audience === audience);
    }
    return list.sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime());
  }

  public async createAnnouncement(data: any): Promise<any> {
    if (this.isConnectedToAtlas) {
      const a = await AnnouncementModel.create(data);
      return a.toObject();
    }
    const newAnn = {
      ...data,
      _id: `ann_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.announcements.unshift(newAnn);
    this.persistToDisk();
    return newAnn;
  }

  public async updateAnnouncement(id: string, data: any): Promise<any | null> {
    if (this.isConnectedToAtlas) {
      const a = await AnnouncementModel.findByIdAndUpdate(id, data, { returnDocument: 'after' });
      return a ? a.toObject() : null;
    }
    const idx = this.announcements.findIndex(a => a._id === id);
    if (idx === -1) return null;
    this.announcements[idx] = { ...this.announcements[idx], ...data, updatedAt: new Date() };
    this.persistToDisk();
    return this.announcements[idx];
  }

  public async deleteAnnouncement(id: string): Promise<boolean> {
    if (this.isConnectedToAtlas) {
      const res = await AnnouncementModel.findByIdAndDelete(id);
      return !!res;
    }
    const idx = this.announcements.findIndex(a => a._id === id);
    if (idx === -1) return false;
    this.announcements.splice(idx, 1);
    this.persistToDisk();
    return true;
  }

  // --- Training Queries ---
  public async getTrainings(): Promise<any[]> {
    if (this.isConnectedToAtlas) {
      const trns = await TrainingModel.find().sort({ startDate: 1 });
      return trns.map(t => t.toObject());
    }
    return [...this.trainings].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }

  public async getTrainingById(id: string): Promise<any | null> {
    if (this.isConnectedToAtlas) {
      const t = await TrainingModel.findById(id);
      return t ? t.toObject() : null;
    }
    return this.trainings.find(t => t._id === id) || null;
  }

  public async createTraining(data: any): Promise<any> {
    const newTraining = {
      ...data,
      _id: data._id ?? `trn_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    };
    if (this.isConnectedToAtlas) {
      const t = await TrainingModel.create(newTraining);
      return t.toObject();
    }
    const newTrn = {
      ...newTraining,
      enrolledEmployees: newTraining.enrolledEmployees || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.trainings.push(newTrn);
    this.persistToDisk();
    return newTrn;
  }

  public async updateTraining(id: string, data: any): Promise<any | null> {
    if (this.isConnectedToAtlas) {
      const t = await TrainingModel.findByIdAndUpdate(id, data, { returnDocument: 'after' });
      return t ? t.toObject() : null;
    }
    const idx = this.trainings.findIndex(t => t._id === id);
    if (idx === -1) return null;
    this.trainings[idx] = { ...this.trainings[idx], ...data, updatedAt: new Date() };
    this.persistToDisk();
    return this.trainings[idx];
  }

  // --- Notification Queries ---
  public async getNotifications(recipientId: string): Promise<any[]> {
    if (this.isConnectedToAtlas) {
      const notifs = await NotificationModel.find({
        $or: [{ recipientId }, { recipientId: 'ALL' }]
      }).sort({ createdAt: -1 }).limit(30);
      return notifs.map(n => n.toObject());
    }
    return this.notifications
      .filter(n => n.recipientId === recipientId || n.recipientId === 'ALL')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async createNotification(data: any): Promise<any> {
    const newNotification = {
      ...data,
      _id: data._id ?? `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    };
    if (this.isConnectedToAtlas) {
      const n = await NotificationModel.create(newNotification);
      return n.toObject();
    }
    const newNotif = {
      ...newNotification,
      isRead: false,
      readAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.notifications.unshift(newNotif);
    this.persistToDisk();
    return newNotif;
  }

  public async markNotificationRead(id: string): Promise<any | null> {
    if (this.isConnectedToAtlas) {
      const n = await NotificationModel.findByIdAndUpdate(id, { isRead: true, readAt: new Date() }, { returnDocument: 'after' });
      return n ? n.toObject() : null;
    }
    const n = this.notifications.find(item => item._id === id);
    if (n) {
      n.isRead = true;
      n.readAt = new Date();
      this.persistToDisk();
    }
    return n || null;
  }

  public async markAllNotificationsRead(recipientId: string): Promise<number> {
    if (this.isConnectedToAtlas) {
      const res = await NotificationModel.updateMany(
        { $or: [{ recipientId }, { recipientId: 'ALL' }], isRead: false },
        { isRead: true, readAt: new Date() }
      );
      return res.modifiedCount;
    }
    let count = 0;
    for (const n of this.notifications) {
      if ((n.recipientId === recipientId || n.recipientId === 'ALL') && !n.isRead) {
        n.isRead = true;
        n.readAt = new Date();
        count++;
      }
    }
    if (count > 0) this.persistToDisk();
    return count;
  }
}

export const dataStore = new DataStore();
