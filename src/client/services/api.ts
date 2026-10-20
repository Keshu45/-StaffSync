const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  statusCode: number;
  data: any;
  constructor(message: string, statusCode: number, data?: any) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
    this.name = 'ApiError';
  }
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('staffsync_token');
  
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Include HttpOnly cookies
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data.message || `Request failed with status ${response.status}`, response.status, data);
  }

  return data;
}

export const api = {
  get: <T = any>(url: string) => request<T>(url, { method: 'GET' }),
  post: <T = any>(url: string, body?: any) => request<T>(url, { method: 'POST', body: JSON.stringify(body) }),
  put: <T = any>(url: string, body?: any) => request<T>(url, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T = any>(url: string, body?: any) => request<T>(url, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T = any>(url: string) => request<T>(url, { method: 'DELETE' }),
};

// API Services
export const authService = {
  register: (data: any) => api.post('/auth/register', data),
  login: (credentials: { email: string; password: string }) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  changePassword: (data: { currentPassword: string; newPassword: string }) => api.post('/auth/change-password', data),
};

export const employeeService = {
  getAll: (params?: { department?: string; status?: string; search?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams(params as any).toString();
    return api.get(`/employees${q ? `?${q}` : ''}`);
  },
  getById: (id: string) => api.get(`/employees/${id}`),
  create: (data: any) => api.post('/employees', data),
  update: (id: string, data: any) => api.put(`/employees/${id}`, data),
  updateStatus: (id: string, status: string) => api.patch(`/employees/${id}/status`, { employmentStatus: status }),
  getAttendance: (id: string) => api.get(`/employees/${id}/attendance`),
  getLeaves: (id: string) => api.get(`/employees/${id}/leaves`),
};

export const managerService = {
  getAll: () => api.get('/managers'),
  create: (data: any) => api.post('/managers', data),
  getTeam: (id: string) => api.get(`/managers/${id}/team`),
  assignTeam: (id: string, employeeIds: string[]) => api.post(`/managers/${id}/assignments`, { employeeIds }),
};

export const attendanceService = {
  checkIn: (notes?: string) => api.post('/attendance/check-in', { notes }),
  checkOut: () => api.post('/attendance/check-out'),
  getMyAttendance: () => api.get('/attendance/me'),
  getTeamAttendance: (date?: string) => api.get(`/attendance/team${date ? `?date=${date}` : ''}`),
  getOrgAttendance: (params?: { date?: string; department?: string; status?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return api.get(`/attendance${q ? `?${q}` : ''}`);
  },
};

export const leaveService = {
  apply: (data: { leaveType: string; startDate: string; endDate: string; reason: string }) => api.post('/leaves', data),
  getMyLeaves: () => api.get('/leaves/me'),
  getAll: (params?: { status?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return api.get(`/leaves${q ? `?${q}` : ''}`);
  },
  getById: (id: string) => api.get(`/leaves/${id}`),
  approve: (id: string, comment?: string) => api.patch(`/leaves/${id}/approve`, { comment }),
  reject: (id: string, comment: string) => api.patch(`/leaves/${id}/reject`, { comment }),
  cancel: (id: string) => api.patch(`/leaves/${id}/cancel`),
};

export const announcementService = {
  getAll: () => api.get('/announcements'),
  create: (data: any) => api.post('/announcements', data),
  update: (id: string, data: any) => api.put(`/announcements/${id}`, data),
  archive: (id: string) => api.patch(`/announcements/${id}/archive`),
  delete: (id: string) => api.delete(`/announcements/${id}`),
};

export const trainingService = {
  getAll: () => api.get('/trainings'),
  getById: (id: string) => api.get(`/trainings/${id}`),
  create: (data: any) => api.post('/trainings', data),
  update: (id: string, data: any) => api.put(`/trainings/${id}`, data),
  enroll: (id: string) => api.post(`/trainings/${id}/enroll`),
  cancelEnrollment: (id: string) => api.delete(`/trainings/${id}/enroll`),
  getEnrollments: (id: string) => api.get(`/trainings/${id}/enrollments`),
};

export const notificationService = {
  getAll: () => api.get('/notifications'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

export const dashboardService = {
  getHR: () => api.get('/dashboard/hr'),
  getManager: () => api.get('/dashboard/manager'),
  getEmployee: () => api.get('/dashboard/employee'),
};

export const reportService = {
  getAttendance: (params?: { startDate?: string; endDate?: string; department?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return api.get(`/reports/attendance${q ? `?${q}` : ''}`);
  },
  getLeaves: () => api.get('/reports/leaves'),
  getEmployees: () => api.get('/reports/employees'),
};
