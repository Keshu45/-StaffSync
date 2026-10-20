# StaffSync — Modern Human Resource Management Solution (HRMS)

[![MERN Stack](https://img.shields.io/badge/Stack-MERN-blue.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6.svg)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS%204.0-38B2AC.svg)](https://tailwindcss.com)
[![Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)]()

StaffSync is a full-stack, enterprise-grade Human Resource Management System (HRMS) built using the MERN stack (MongoDB, Express, React, Node.js) with TypeScript, Tailwind CSS, and JSON Web Token (JWT) authentication. It centralizes employee directory administration, daily attendance logging, multi-level leave approvals, organization-wide announcements, professional training workshops, in-app notifications, and downloadable CSV analytics.

---

## 1. Project Introduction

In modern workplaces, human resource operations require coordination across distributed teams, departments, and leadership tiers. StaffSync automates redundant administrative workflows and bridges communication between employees, managers, and HR executives through a responsive, role-based dashboard.

StaffSync is architected to be both an interview-ready showcase of modern full-stack web engineering and a functional system suitable for enterprise deployments and academic capstone demonstrations.

---

## 2. Problem Statement

Traditional HR tracking suffers from:
- **Disparate paper or spreadsheet records**, leading to lost attendance logs and conflicting leave quotas.
- **Slow approval loops**, where leave requests linger without notification or transparency.
- **Siloed company news**, where urgent policy notices and training opportunities fail to reach employees.
- **Unauthorized data access**, where sensitive payroll or employee records are exposed to unauthorized colleagues.

StaffSync addresses these challenges with centralized persistence, role-based access control (RBAC), and automated workflows.

---

## 3. Project Objectives

- **Automate Attendance & Hours:** Live digital clock-in/out with automated working minutes calculation and daily duplicate prevention.
- **Streamline Leave Lifecycle:** Self-service leave applications with date-range validation, overlap prevention, and single-click manager review.
- **Enforce Role-Based Authorization:** Strict boundary enforcement across HR Administrators, Team Managers, and Standard Employees.
- **Empower Workforce Development:** Capacity-capped training workshops with atomic employee enrollment and waitlist safeguards.
- **Provide Actionable Intelligence:** Interactive Recharts analytics, 7-day presence curves, department headcount breakdowns, and CSV export capabilities.

---

## 4. User Roles & Permission Matrix

| Feature / Action | HR Administrator (`HR`) | Team Manager (`MANAGER`) | Employee (`EMPLOYEE`) |
| :--- | :---: | :---: | :---: |
| **System Dashboard** | Full Org Analytics & Audits | Team Presence & Approvals | Personal Quotas & Clock |
| **Employee Directory** | Full CRUD & Status Toggle | View Assigned Team | View Own Profile |
| **Salary Data Access** | View & Update | Restricted (Masked) | Restricted (Masked) |
| **Daily Attendance** | Org-wide Filter & Date Log | Team Attendance | Clock In / Out (Today) |
| **Leave Approval** | Approve / Reject All Org | Approve / Reject Direct Reports | Submit / Cancel Own Pending |
| **Announcements** | Create, Edit, Archive | View Relevant Notices | View Relevant Notices |
| **Training Programs** | Create, Edit, View Rosters | Create Team Trainings | Browse & Self-Enroll |
| **CSV Export** | Attendance & Headcount | Team Reports | Restricted |

---

## 5. Technology Stack

### Frontend
- **React 19 / 18:** Functional components, custom hooks, and context state management.
- **Vite:** High-speed development server and optimized rollup bundling.
- **TypeScript:** Strict type contracts and compile-time verification.
- **Tailwind CSS 4:** Utility-first responsive design, dark/light theme persistence.
- **Recharts:** Interactive SVG charts (Area, Pie, Bar graphs).
- **Lucide React:** Consistent iconography.

### Backend
- **Node.js & Express.js:** RESTful API server with asynchronous request pipelines.
- **MongoDB & Mongoose ODM:** Schema validation, relationships, unique indexes, and document queries.
- **Dual-Mode Persistence:** Seamlessly connects to MongoDB Atlas in production or initializes a resilient seeded in-memory document store in local/container environments.
- **Authentication & Security:** bcryptjs password hashing, JWT signed sessions, HttpOnly cookies, CORS headers, and IP rate limiting.

---

## 6. Project Directory Structure

```text
StaffSync/
├── .env.example              # Documented environment variables
├── index.html                # Entry HTML with meta & fonts
├── metadata.json             # Applet manifest & capability definitions
├── package.json              # Root dependencies & build scripts
├── render.yaml               # Render backend deployment blueprint
├── vercel.json               # Vercel SPA routing rules
├── vite.config.ts            # Vite bundler configuration
├── server.ts                 # Full-stack Express server mounting Vite & /api
├── tests/
│   └── runTests.ts           # Automated backend test suite
└── src/
    ├── App.tsx               # Root React entry with Context providers
    ├── main.tsx              # DOM mounting
    ├── index.css             # Tailwind base styles and scrollbars
    ├── server/
    │   ├── config/           # env.ts loader
    │   ├── controllers/      # auth, employee, manager, attendance, leave, training, dashboard, reports
    │   ├── data/             # dataStore.ts (Mongoose + in-memory fallback), seedData.ts
    │   ├── middleware/       # auth.ts, role.ts, errorHandler.ts, rateLimiter.ts
    │   ├── models/           # User, Employee, Attendance, Leave, Announcement, Training, Notification, AuditLog
    │   ├── routes/           # api.ts master REST router
    │   └── utils/            # jwt.ts token utilities
    └── client/
        ├── components/
        │   ├── common/       # Badge, Modal, StatCard
        │   └── layout/       # Navbar, Sidebar, AppLayout
        ├── context/          # AuthContext, ThemeContext
        ├── pages/
        │   ├── auth/         # LoginPage, RegisterPage
        │   ├── dashboard/    # HRDashboard, ManagerDashboard, EmployeeDashboard
        │   ├── employees/    # EmployeeListPage, AddEditEmployeeModal
        │   ├── managers/     # ManagerListPage
        │   ├── attendance/   # AttendancePage
        │   ├── leaves/       # LeaveManagementPage
        │   ├── announcements/# AnnouncementsPage
        │   ├── trainings/    # TrainingsPage
        │   ├── reports/      # ReportsPage (with CSV export)
        │   └── profile/      # ProfilePage (contact info & password change)
        ├── services/         # api.ts HTTP client
        ├── types/            # TypeScript data interfaces
        └── utils/            # date.ts formatting helpers
```

---

## 7. REST API Endpoints

### Authentication
- `POST /api/auth/register` — Register a standard employee account (safeguarded against role tampering).
- `POST /api/auth/login` — Authenticate credentials, set HttpOnly cookie, and issue JWT.
- `POST /api/auth/logout` — Clear session cookie.
- `GET /api/auth/me` — Retrieve active authenticated user profile.
- `POST /api/auth/change-password` — Verify current password and hash new password.

### Employees & Managers
- `GET /api/employees` — Paginated directory (salary masked for non-HR).
- `POST /api/employees` — Create employee and linked user record [HR Only].
- `PUT /api/employees/:id` — Update personal or employment fields.
- `PATCH /api/employees/:id/status` — Activate or deactivate employee [HR Only].
- `GET /api/managers` — List department managers and direct report counts.
- `POST /api/managers/:id/assignments` — Reassign team members to a manager [HR Only].

### Attendance & Leaves
- `POST /api/attendance/check-in` — Record daily check-in timestamp.
- `POST /api/attendance/check-out` — Record check-out and compute total working minutes.
- `GET /api/attendance/me` — Personal attendance history.
- `GET /api/attendance/team` — Team attendance for date [Manager/HR].
- `GET /api/attendance` — Organization-wide attendance [HR Only].
- `POST /api/leaves` — Submit leave request with duration calculation.
- `PATCH /api/leaves/:id/approve` — Approve request and notify employee.
- `PATCH /api/leaves/:id/reject` — Reject request with mandatory reason.
- `PATCH /api/leaves/:id/cancel` — Cancel pending request [Employee].

### Trainings, Announcements & Reports
- `GET /api/trainings` — List upcoming workshops with seats remaining.
- `POST /api/trainings/:id/enroll` — Atomic enrollment with capacity enforcement.
- `GET /api/announcements` — Filtered company notices.
- `GET /api/reports/attendance` — Date-range attendance analytics (CSV ready).
- `GET /api/reports/leaves` — Leave distribution and status counts.
- `GET /api/health` — System status, database engine, and connection telemetry.

---

## 8. Default Pre-Seeded Demonstration Accounts

For convenient evaluation, interview demonstrations, and grading, StaffSync includes preset accounts:

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **HR Administrator** | Elena Vance | `hr@staffsync.com` | `StaffSync@2025` |
| **Engineering Manager** | Alex Morgan | `alex.morgan@staffsync.com` | `StaffSync@2025` |
| **Marketing Manager** | Sarah Jenkins | `sarah.jenkins@staffsync.com` | `StaffSync@2025` |
| **Senior Frontend Dev** | John Doe | `john.doe@staffsync.com` | `StaffSync@2025` |
| **DevOps Specialist** | Emily Watson | `emily.watson@staffsync.com` | `StaffSync@2025` |
| **UI/UX Designer** | Michael Chen | `michael.chen@staffsync.com` | `StaffSync@2025` |

> 💡 **Quick 1-Click Evaluation:** On the login screen, click any of the **"Quick Demo Login"** buttons (HR Admin, Manager, Employee) to authenticate instantly!

---

## 9. Local Installation & Setup

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)
- (Optional) MongoDB Atlas account or local mongod instance

### Steps
1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/staffsync-hrms.git
   cd staffsync-hrms
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   *Note: If `MONGODB_URI` is left blank, StaffSync will run automatically with its resilient seeded in-memory store.*

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Run the automated test suite:**
   ```bash
   npx tsx tests/runTests.ts
   ```

---

## 10. Deployment Guide

### Deploying to Render (Full-Stack Backend)
1. Fork or push this repository to GitHub.
2. Sign in to [Render](https://render.com) and create a **New Web Service**.
3. Connect your GitHub repository.
4. Set the following build settings:
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
5. Under **Environment Variables**, configure:
   - `NODE_ENV`: `production`
   - `PORT`: `3000`
   - `MONGODB_URI`: Your MongoDB Atlas connection URI
   - `JWT_SECRET`: A secure 32+ character key
   - `CLIENT_URL`: Your production URL

### Deploying to Vercel (Frontend Client)
1. Import your repository into [Vercel](https://vercel.com).
2. Set Framework Preset to **Vite**.
3. Set the environment variable:
   - `VITE_API_URL`: `https://your-staffsync-service.onrender.com/api`
4. Deploy! `vercel.json` will automatically route client routes to `index.html`.

---

## 11. Interview & Academic Presentation Guide

When presenting this project in a technical interview or college viva:
- **Architecture Pitch:** "StaffSync is a monolithic MERN architecture where Express serves both an authenticated RESTful API and a modern Vite-powered React client. It utilizes JWT tokens with HttpOnly cookies for session security."
- **Security Highlights:** "Passwords are encrypted using bcrypt with salt rounds of 10. API endpoints perform resource-level role checks (RBAC) so employees cannot manipulate roles or view salaries, even if they alter frontend code."
- **Database Resilience:** "The system includes an intelligent dual-persistence adapter: in production it binds to MongoDB Atlas through Mongoose models and indexes; for offline or evaluation testing, it seamlessly runs an in-memory document store matching identical schemas."
