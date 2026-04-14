// API Service - handles all HTTP requests
const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const { isPublic = false, ...fetchOptions } = options;
  const token = localStorage.getItem('token');

  const config = {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(!isPublic && token && { Authorization: `Bearer ${token}` }),
      ...fetchOptions.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  } catch (error) {
    throw error;
  }
}

// Auth API
export const authApi = {
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  sendRegisterOtp: (data) =>
    request('/auth/send-register-otp', { method: 'POST', body: JSON.stringify(data) }),
  register: (data) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  forgotPassword: (email) =>
    request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (email, otp, newPassword) =>
    request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, otp, newPassword }) }),
  me: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),
};

// Patients API
export const patientsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/patients${query ? `?${query}` : ''}`);
  },
  getById: (id) => request(`/patients/${id}`),
  create: (data) => request('/patients', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/patients/${id}`, { method: 'DELETE' }),
};

// Doctors API
export const doctorsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/doctors${query ? `?${query}` : ''}`, { isPublic: true });
  },
  getById: (id) => request(`/doctors/${id}`, { isPublic: true }),
  create: (data) => request('/doctors', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/doctors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/doctors/${id}`, { method: 'DELETE' }),
};

// Appointments API
export const appointmentsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/appointments${query ? `?${query}` : ''}`);
  },
  getToday: () => request('/appointments/today'),
  getById: (id) => request(`/appointments/${id}`),
  getAvailableSlots: (doctorId, date) =>
    request(`/appointments/available-slots?doctorId=${doctorId}&date=${date}`, { isPublic: true }),
  create: (data) => request('/appointments', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/appointments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateStatus: (id, status) =>
    request(`/appointments/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  delete: (id) => request(`/appointments/${id}`, { method: 'DELETE' }),
};

// Billing API
export const billingApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/billing${query ? `?${query}` : ''}`);
  },
  getById: (id) => request(`/billing/${id}`),
  getByPatient: (patientId) => request(`/billing/patient/${patientId}`),
  create: (data) => request('/billing', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/billing/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  pay: (id, paymentMethod) =>
    request(`/billing/${id}/pay`, { method: 'POST', body: JSON.stringify({ paymentMethod }) }),
  getStats: () => request('/billing/stats/summary'),
};

// Dashboard API
export const dashboardApi = {
  getStats: () => request('/dashboard/stats'),
  getCharts: (period) => request(`/dashboard/charts?period=${period || 'month'}`),
  getActivities: () => request('/dashboard/activities'),
};

// Prescriptions API
export const prescriptionsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/prescriptions${query ? `?${query}` : ''}`);
  },
  getById: (id) => request(`/prescriptions/${id}`),
  create: (data) => request('/prescriptions', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/prescriptions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/prescriptions/${id}`, { method: 'DELETE' }),
};

export default {
  auth: authApi,
  patients: patientsApi,
  doctors: doctorsApi,
  appointments: appointmentsApi,
  billing: billingApi,
  dashboard: dashboardApi,
  prescriptions: prescriptionsApi,
};