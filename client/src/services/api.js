// API Service — centralized HTTP client with safe response parsing & 401 session handling
const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export const AUTH_EXPIRED_EVENT = 'healthcore:auth-expired';

function buildQuery(params = {}) {
  const clean = {};
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== '') {
      clean[key] = String(val);
    }
  }
  const qs = new URLSearchParams(clean).toString();
  return qs ? `?${qs}` : '';
}

async function request(endpoint, options = {}) {
  const { isPublic = false, ...fetchOptions } = options;
  const token = localStorage.getItem('token');

  const config = {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(!isPublic && token ? { Authorization: `Bearer ${token}` } : {}),
      ...fetchOptions.headers
    }
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (response.status !== 204) {
    if (contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch {
        data = null;
      }
    } else {
      const text = await response.text();
      data = text ? { message: text } : null;
    }
  }

  if (!response.ok) {
    if (response.status === 401 && !isPublic && token && !endpoint.startsWith('/auth/login')) {
      localStorage.removeItem('token');
      window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
    }

    const message =
      data?.error ||
      data?.message ||
      (response.status === 502 || response.status === 503
        ? 'API server is temporarily unavailable. Please try again.'
        : `Request failed (${response.status})`);
    const err = new Error(message);
    err.status = response.status;
    err.details = data?.details;
    throw err;
  }

  return data;
}

export const authApi = {
  login: (email, password) =>
    request('/auth/login', { method: 'POST', isPublic: true, body: JSON.stringify({ email, password }) }),
  sendRegisterOtp: (data) =>
    request('/auth/send-register-otp', { method: 'POST', isPublic: true, body: JSON.stringify(data) }),
  register: (data) =>
    request('/auth/register', { method: 'POST', isPublic: true, body: JSON.stringify(data) }),
  forgotPassword: (email) =>
    request('/auth/forgot-password', { method: 'POST', isPublic: true, body: JSON.stringify({ email }) }),
  resetPassword: (email, otp, newPassword) =>
    request('/auth/reset-password', {
      method: 'POST',
      isPublic: true,
      body: JSON.stringify({ email, otp, newPassword })
    }),
  me: () => request('/auth/me'),
  updateProfile: (data) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
  changePassword: (currentPassword, newPassword) =>
    request('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    }),
  logout: () => request('/auth/logout', { method: 'POST' })
};

export const patientsApi = {
  getAll: (params = {}) => request(`/patients${buildQuery(params)}`),
  getById: (id) => request(`/patients/${id}`),
  create: (data) => request('/patients', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/patients/${id}`, { method: 'DELETE' })
};

export const doctorsApi = {
  getDepartments: () => request('/doctors/departments', { isPublic: true }),
  getAll: (params = {}) => request(`/doctors${buildQuery(params)}`),
  getById: (id) => request(`/doctors/${id}`),
  create: (data) => request('/doctors', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/doctors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateSchedule: (id, schedule) =>
    request(`/doctors/${id}/schedule`, { method: 'PUT', body: JSON.stringify({ schedule }) }),
  delete: (id) => request(`/doctors/${id}`, { method: 'DELETE' })
};

export const appointmentsApi = {
  getAll: (params = {}) => request(`/appointments${buildQuery(params)}`),
  getToday: () => request('/appointments/today'),
  getById: (id) => request(`/appointments/${id}`),
  getAvailableSlots: (doctorId, date) =>
    request(`/appointments/available-slots${buildQuery({ doctorId, date })}`, { isPublic: true }),
  create: (data) => request('/appointments', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/appointments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  checkIn: (id) => request(`/appointments/${id}/check-in`, { method: 'POST' }),
  updateStatus: (id, status, notes, soapNotes) =>
    request(`/appointments/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes, ...(soapNotes ? { soapNotes } : {}) })
    }),
  delete: (id) => request(`/appointments/${id}`, { method: 'DELETE' })
};

export const billingApi = {
  getAll: (params = {}) => request(`/billing${buildQuery(params)}`),
  getById: (id) => request(`/billing/${id}`),
  getByPatient: (patientId) => request(`/billing/patient/${patientId}`),
  create: (data) => request('/billing', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/billing/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  pay: (id, paymentMethod, amount) =>
    request(`/billing/${id}/pay`, {
      method: 'POST',
      body: JSON.stringify({ paymentMethod, ...(amount ? { amount } : {}) })
    }),
  getStats: () => request('/billing/stats/summary')
};

export const dashboardApi = {
  getStats: () => request('/dashboard/stats'),
  getCharts: (period = '6months') => request(`/dashboard/charts${buildQuery({ period })}`),
  getActivities: () => request('/dashboard/activities'),
  getAuditLogs: (params = {}) => request(`/dashboard/audit-logs${buildQuery(params)}`)
};

export const prescriptionsApi = {
  getAll: (params = {}) => request(`/prescriptions${buildQuery(params)}`),
  getById: (id) => request(`/prescriptions/${id}`),
  create: (data) => request('/prescriptions', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/prescriptions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/prescriptions/${id}`, { method: 'DELETE' })
};

export const contactApi = {
  submit: (data) =>
    request('/contact', { method: 'POST', isPublic: true, body: JSON.stringify(data) }),
  getAll: (params = {}) => request(`/contact${buildQuery(params)}`),
  updateStatus: (id, status) =>
    request(`/contact/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
};

export const usersApi = {
  getAll: (params = {}) => request(`/users${buildQuery(params)}`),
  create: (data) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id, status) =>
    request(`/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  updateRole: (id, role) =>
    request(`/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) })
};

export const labsApi = {
  getCatalog: () => request('/labs/catalog'),
  getAll: (params = {}) => request(`/labs${buildQuery(params)}`),
  getById: (id) => request(`/labs/${id}`),
  create: (data) => request('/labs', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id, status) =>
    request(`/labs/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  submitResults: (id, data) =>
    request(`/labs/${id}/results`, { method: 'PUT', body: JSON.stringify(data) })
};

export const pharmacyApi = {
  getMedicines: (params = {}) => request(`/pharmacy/medicines${buildQuery(params)}`),
  createMedicine: (data) =>
    request('/pharmacy/medicines', { method: 'POST', body: JSON.stringify(data) }),
  updateMedicine: (id, data) =>
    request(`/pharmacy/medicines/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMedicine: (id) => request(`/pharmacy/medicines/${id}`, { method: 'DELETE' }),
  getQueue: (params = {}) => request(`/pharmacy/queue${buildQuery(params)}`),
  dispense: (prescriptionId, data) =>
    request(`/pharmacy/dispense/${prescriptionId}`, { method: 'POST', body: JSON.stringify(data) })
};

export const referralsApi = {
  getAll: (params = {}) => request(`/referrals${buildQuery(params)}`),
  create: (data) => request('/referrals', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id, status) =>
    request(`/referrals/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
};

export default {
  auth: authApi,
  patients: patientsApi,
  doctors: doctorsApi,
  appointments: appointmentsApi,
  billing: billingApi,
  dashboard: dashboardApi,
  prescriptions: prescriptionsApi,
  contact: contactApi,
  users: usersApi,
  labs: labsApi,
  pharmacy: pharmacyApi,
  referrals: referralsApi
};
