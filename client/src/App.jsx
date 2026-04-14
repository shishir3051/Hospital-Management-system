import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/AuthContext';

// Layouts
import DashboardLayout from './components/layout/DashboardLayout';
import PublicLayout from './components/layout/PublicLayout';

// Public Pages
import Home from './pages/public/Home';
import About from './pages/public/About';
import Departments from './pages/public/Departments';
import Contact from './pages/public/Contact';
import DoctorsList from './pages/public/DoctorsList';
import DoctorProfile from './pages/public/DoctorProfile';
import PublicAppointment from './pages/public/PublicAppointment';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Dashboard Pages
import Dashboard from './pages/dashboard/Dashboard';
import Patients from './pages/patients/Patients';
import PatientForm from './pages/patients/PatientForm';
import PatientDetail from './pages/patients/PatientDetail';
import PatientRecords from './pages/patients/PatientRecords';
import Doctors from './pages/doctors/Doctors';
import DoctorForm from './pages/doctors/DoctorForm';
import DoctorDetail from './pages/doctors/DoctorDetail';
import Appointments from './pages/appointments/Appointments';
import AppointmentForm from './pages/appointments/AppointmentForm';
import Billing from './pages/billing/Billing';
import BillingDetail from './pages/billing/BillingDetail';
import PrescriptionForm from './pages/prescriptions/PrescriptionForm';

// Protected Route Component
function ProtectedRoute({ children, roles = [] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="text-slate-500 font-bold animate-pulse text-sm">Verifying Session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Public Route (redirect if logged in)
function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Silent load for public routes
  }

  // We allow access even if logged in for pages like Home, Doctors, etc.
  // But for Login/Register, we redirect if already authenticated.
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Facing Interface */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/departments" element={<Departments />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/doctors" element={<DoctorsList />} />
        <Route path="/doctors/:id" element={<DoctorProfile />} />
        <Route path="/appointment" element={<PublicAppointment />} />
        
        {/* Auth Routes inside Public Layout */}
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
      </Route>

      {/* Protected Dashboards */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />

        {/* Patient Management */}
        <Route path="patients" element={<ProtectedRoute roles={['ADMIN', 'DOCTOR', 'NURSE']}><Patients /></ProtectedRoute>} />
        <Route path="patients/new" element={<ProtectedRoute roles={['ADMIN', 'DOCTOR']}><PatientForm /></ProtectedRoute>} />
        <Route path="patients/:id" element={<ProtectedRoute><PatientDetail /></ProtectedRoute>} />
        <Route path="patients/:id/records" element={<ProtectedRoute><PatientRecords /></ProtectedRoute>} />
        <Route path="patients/:id/edit" element={<ProtectedRoute roles={['ADMIN', 'DOCTOR', 'PATIENT']}><PatientForm /></ProtectedRoute>} />

        {/* Doctor Management (Internal) */}
        <Route path="staff" element={<ProtectedRoute roles={['ADMIN']}><Doctors /></ProtectedRoute>} />
        <Route path="doctors/new" element={<ProtectedRoute roles={['ADMIN']}><DoctorForm /></ProtectedRoute>} />
        <Route path="doctors/:id" element={<ProtectedRoute><DoctorDetail /></ProtectedRoute>} />
        <Route path="doctors/:id/edit" element={<ProtectedRoute roles={['ADMIN', 'DOCTOR']}><DoctorForm /></ProtectedRoute>} />

        {/* Appointment & Medical Management */}
        <Route path="appointments" element={<Appointments />} />
        <Route path="appointments/new" element={<ProtectedRoute roles={['ADMIN', 'DOCTOR', 'PATIENT']}><AppointmentForm /></ProtectedRoute>} />

        {/* Financial Records */}
        <Route path="billing" element={<ProtectedRoute roles={['ADMIN', 'ACCOUNTANT', 'PATIENT']}><Billing /></ProtectedRoute>} />
        <Route path="billing/:id" element={<ProtectedRoute><BillingDetail /></ProtectedRoute>} />

        {/* Medical / Prescription Routes */}
        <Route path="prescriptions/new" element={<ProtectedRoute roles={['ADMIN', 'DOCTOR']}><PrescriptionForm /></ProtectedRoute>} />
        <Route path="prescriptions/:id/edit" element={<ProtectedRoute roles={['ADMIN', 'DOCTOR']}><PrescriptionForm /></ProtectedRoute>} />
      </Route>

      {/* Auth catch */}
      <Route path="/login" element={<Navigate to="/login" replace />} />
      
      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}