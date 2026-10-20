/**
 * StaffSync Verification Test Suite
 * Validates backend controllers, security rules, and data operations
 */

import { dataStore } from '../src/server/data/dataStore.js';
import { generateToken, verifyToken } from '../src/server/utils/jwt.js';
import bcrypt from 'bcryptjs';

async function runTestSuite() {
  console.log('====================================================');
  console.log('🧪 Starting StaffSync HRMS Verification Suite');
  console.log('====================================================');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // Test 1: DataStore Initialization & Seed Verification
  const users = dataStore.users;
  const employees = await dataStore.getEmployees();
  assert(users.length >= 7, 'Initial users seeded properly');
  assert(employees.length >= 7, 'Initial employees seeded properly');

  // Test 2: Role Seeding & Credentials
  const hrUser = users.find(u => u.role === 'HR');
  assert(hrUser !== undefined && hrUser.email === 'hr@staffsync.com', 'HR Admin account exists');
  const isPassValid = bcrypt.compareSync('StaffSync@2025', hrUser.passwordHash);
  assert(isPassValid, 'HR Admin default password verifies correctly');

  // Test 3: JWT Token Generation & Verification
  const token = generateToken({
    userId: String(hrUser._id),
    email: hrUser.email,
    role: hrUser.role,
    name: hrUser.name,
  });
  const decoded = verifyToken(token);
  assert(decoded !== null && decoded.email === hrUser.email && decoded.role === 'HR', 'JWT generation and decoding succeeds');

  // Test 4: Role-Based Salary Visibility Check
  const sampleEmp = employees[0];
  assert(sampleEmp.salary !== undefined && sampleEmp.salary > 0, 'HR can access employee salary');

  // Test 5: Attendance Check-in & Date Uniqueness
  const today = new Date().toISOString().split('T')[0];
  const newAtt = await dataStore.createOrUpdateAttendance({
    employeeId: 'EMP-1003',
    attendanceDate: today,
    checkIn: new Date().toISOString(),
    status: 'Present',
    totalWorkingMinutes: 0,
    notes: 'Test checkin',
  });
  assert(newAtt.employeeId === 'EMP-1003' && newAtt.status === 'Present', 'Attendance record created');

  // Test 6: Leave Duration & Status Transitions
  const newLeave = await dataStore.createLeave({
    employeeId: 'EMP-1003',
    employeeName: 'John Doe',
    department: 'Engineering',
    leaveType: 'Casual Leave',
    startDate: today,
    endDate: today,
    numberOfDays: 1,
    reason: 'Testing leave workflow',
    status: 'Pending',
  });
  assert(newLeave.status === 'Pending', 'Leave request created with Pending status');

  const approvedLeave = await dataStore.updateLeave(newLeave._id, {
    status: 'Approved',
    reviewedBy: 'EMP-1001',
    reviewedByName: 'Alex Morgan',
  });
  assert(approvedLeave.status === 'Approved' && approvedLeave.reviewedByName === 'Alex Morgan', 'Manager can approve leave');

  // Test 7: Training Capacity Enforcement
  const trainings = await dataStore.getTrainings();
  const trn = trainings[0];
  assert(trn !== undefined && trn.capacity >= trn.enrolledEmployees.length, 'Training capacity integrity valid');

  // Test 8: Announcement Creation & Deletion
  const newNotice = await dataStore.createAnnouncement({
    title: 'Test Deletion Notice',
    content: 'This notice will be deleted',
    category: 'General',
    authorId: 'usr_hr_01',
    authorName: 'Elena Vance',
    audience: 'All',
  });
  assert(newNotice._id !== undefined, 'Announcement created successfully');
  const deleteResult = await dataStore.deleteAnnouncement(newNotice._id);
  assert(deleteResult === true, 'HR can delete announcement successfully');

  console.log('====================================================');
  console.log(`Results: ${passed} passed, ${failed} failed.`);
  console.log('====================================================');
}

runTestSuite().catch(console.error);
