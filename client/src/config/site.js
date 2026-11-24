// Single source of truth for HealthCore Medical Center (International / USD)

export const SITE = {
  name: 'HealthCore Medical Center',
  shortName: 'HealthCore',
  tagline: 'Clinical Excellence & Digital Care',
  foundedYear: 2010,
  currency: 'USD',
  currencySymbol: '$',
  locale: 'en-US',
  defaultTaxRate: Number(import.meta.env.VITE_TAX_RATE ?? 0.08),
  emergencyPhone: '+1 (800) 555-0199',
  emergencyTel: '+18005550199',
  appointmentPhone: '+1 (617) 555-0140',
  appointmentTel: '+16175550140',
  email: 'care@healthcore.org',
  billingEmail: 'billing@healthcore.org',
  address: '450 Medical Center Plaza, Suite 100, Boston, MA 02115',
  opdHours: 'Mon – Sat: 8:00 AM – 8:00 PM',
  emergencyHours: 'Emergency Care: Open 24/7'
};

export const DEPARTMENTS = [
  'Cardiology',
  'Neurology & Neurosurgery',
  'Orthopedics & Spine',
  'Dermatology (Skin & VD)',
  'Pediatrics',
  'General Medicine / Internal Medicine',
  'ENT (Otolaryngology)',
  'Oncology',
  'Radiology'
];

export const DEPARTMENT_METADATA = {
  Cardiology: {
    shortDesc: 'Preventive heart care, cardiac imaging, arrhythmia management, and interventional procedures.',
    services: ['Echocardiography & ECG', 'Hypertension Clinic', 'Interventional Cardiology']
  },
  'Neurology & Neurosurgery': {
    shortDesc: 'Comprehensive stroke care, headache clinics, epilepsy diagnostics, and neuro-rehabilitation.',
    services: ['EEG & Nerve Conduction', 'Stroke Care Unit', 'Migraine Therapeutics']
  },
  'Orthopedics & Spine': {
    shortDesc: 'Joint preservation, sports medicine, fracture care, and minimally invasive spine surgery.',
    services: ['Joint Replacement', 'Sports Injury Rehab', 'Spinal Diagnostics']
  },
  'Dermatology (Skin & VD)': {
    shortDesc: 'Evidence-based clinical dermatology, allergy testing, and preventive skin screening.',
    services: ['Clinical Dermatology', 'Skin Cancer Screening', 'Eczema & Psoriasis Care']
  },
  Pediatrics: {
    shortDesc: 'Compassionate infant, child, and adolescent care from immunizations to developmental wellness.',
    services: ['Well-Child Visits', 'Immunization Schedule', 'Pediatric Urgent Care']
  },
  'General Medicine / Internal Medicine': {
    shortDesc: 'Primary adult care, chronic condition management, preventive checkups, and care coordination.',
    services: ['Executive Health Exams', 'Diabetes & Metabolic Care', 'Preventive Medicine']
  },
  'ENT (Otolaryngology)': {
    shortDesc: 'Specialized ear, nose, throat, sinus, and audiology diagnosis and surgical care.',
    services: ['Sinus & Allergy Clinic', 'Audiology & Balance', 'Voice & Throat Care']
  },
  Oncology: {
    shortDesc: 'Multidisciplinary cancer screening, medical oncology, and personalized survivorship plans.',
    services: ['Preventive Screening', 'Infusion Therapy', 'Supportive Oncology']
  },
  Radiology: {
    shortDesc: 'High-resolution diagnostic MRI, CT, ultrasound, and digital X-ray imaging services.',
    services: ['3T MRI & CT Scan', 'Diagnostic Ultrasound', 'Digital Mammography']
  }
};

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday', short: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday', label: 'Thursday', short: 'Thu' },
  { key: 'friday', label: 'Friday', short: 'Fri' },
  { key: 'saturday', label: 'Saturday', short: 'Sat' },
  { key: 'sunday', label: 'Sunday', short: 'Sun' }
];

const currencyFormatter = new Intl.NumberFormat(SITE.locale, {
  style: 'currency',
  currency: SITE.currency,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

export function formatCurrency(amount) {
  const num = Number(amount);
  return currencyFormatter.format(Number.isFinite(num) ? num : 0);
}

export function formatShortId(id, prefix = '#') {
  if (!id) return `${prefix}—`;
  return `${prefix}${String(id).slice(-8).toUpperCase()}`;
}

export function formatDate(value, options = {}) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(SITE.locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  });
}

export function formatTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString(SITE.locale, {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatDateTime(value) {
  if (!value) return '—';
  return `${formatDate(value)} at ${formatTime(value)}`;
}

export function toLocalDateInput(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatCalendarDate(dateStr) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return formatDate(dateStr);
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(SITE.locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

export function downloadCsv(filename, headers, rows) {
  const escapeCell = (val) => {
    const str = val === null || val === undefined ? '' : String(val);
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const csvContent = [headers.map(escapeCell).join(','), ...rows.map((r) => r.map(escapeCell).join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
