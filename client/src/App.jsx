import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/AuthContext';
import { ErrorBoundary, ToastProvider, LoadingSpinner } from './components/ui';
import { SITE } from './config/site';

// Layouts
import PublicLayout from './components/layout/PublicLayout';
import DashboardLayout from './components/layout/DashboardLayout';

// Public Pages
import Home from './pages/public/Home';
import About from './pages/public/About';
import Departments from './pages/public/Departments';
import DoctorsList from './pages/public/DoctorsList';
import DoctorProfile from './pages/public/DoctorProfile';
import PublicAppointment from './pages/public/PublicAppointment';
import Contact from './pages/public/Contact';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Dashboard & Clinical Modules
import Dashboard from './pages/dashboard/Dashboard';
import Patients from './pages/patients/Patients';
import PatientDetail from './pages/patients/PatientDetail';
import PatientForm from './pages/patients/PatientForm';
import PatientRecords from './pages/patients/PatientRecords';
import Doctors from './pages/doctors/Doctors';
import DoctorDetail from './pages/doctors/DoctorDetail';
import DoctorForm from './pages/doctors/DoctorForm';
import Appointments from './pages/appointments/Appointments';
import AppointmentForm from './pages/appointments/AppointmentForm';
import AppointmentDetail from './pages/appointments/AppointmentDetail';
import Billing from './pages/billing/Billing';
import BillingDetail from './pages/billing/BillingDetail';
import BillingForm from './pages/billing/BillingForm';
import Prescriptions from './pages/prescriptions/Prescriptions';
import PrescriptionForm from './pages/prescriptions/PrescriptionForm';
import Settings from './pages/settings/Settings';
import AuditLogs from './pages/admin/AuditLogs';
import StaffManagement from './pages/admin/StaffManagement';
import LabOrders from './pages/labs/LabOrders';
import Pharmacy from './pages/pharmacy/Pharmacy';
import ReceptionQueue from './pages/reception/ReceptionQueue';
import Referrals from './pages/referrals/Referrals';

function RouteTitleUpdater() {
  const { pathname } = useLocation();
  useEffect(() => {
    const titles = {
      '/': `${SITE.name} — Clinical Healthcare Platform`,
      '/about': `About Us — ${SITE.name}`,
      '/departments': `Clinical Departments — ${SITE.name}`,
      '/doctors': `Find a Specialist — ${SITE.name}`,
      '/appointment': `Book Appointment — ${SITE.name}`,
      '/contact': `Contact Us — ${SITE.name}`,
      '/login': `Sign In — ${SITE.name}`,
      '/register': `Patient Registration — ${SITE.name}`,
      '/dashboard': `Portal Dashboard — ${SITE.name}`
    };
    document.title = titles[pathname] || `${SITE.name} — Clinical Portal`;
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function ProtectedRoute({ children, roles }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner label="Verifying clinical session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function GuestRoute({ children }) {
  const { loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner label="Loading..." />
      </div>
    );
  }

  if (isAuthenticated && !location.state?.appointmentData) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <>
      <RouteTitleUpdater />
      <Routes>
        {/* Public Hospital Website */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/departments" element={<Departments />} />
          <Route path="/doctors" element={<DoctorsList />} />
          <Route path="/doctors/:id" element={<DoctorProfile />} />
          <Route path="/appointment" element={<PublicAppointment />} />
          <Route path="/contact" element={<Contact />} />
        </Route>

        {/* Dedicated Auth Pages (outside PublicLayout) */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <Register />
            </GuestRoute>
          }
        />

        {/* Authenticated Clinical Portal */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />

          {/* Patients & EHR */}
          <Route
            path="patients"
            element={
              <ProtectedRoute roles={['ADMIN', 'DOCTOR', 'NURSE', 'ACCOUNTANT', 'RECEPTIONIST']}>
                <Patients />
              </ProtectedRoute>
            }
          />
          <Route
            path="patients/new"
            element={
              <ProtectedRoute roles={['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST']}>
                <PatientForm />
              </ProtectedRoute>
            }
          />
          <Route path="patients/:id" element={<PatientDetail />} />
          <Route
            path="patients/:id/records"
            element={
              <ProtectedRoute roles={['ADMIN', 'DOCTOR', 'NURSE', 'PATIENT']}>
                <PatientRecords />
              </ProtectedRoute>
            }
          />
          <Route
            path="patients/:id/edit"
            element={
              <ProtectedRoute roles={['ADMIN', 'DOCTOR', 'NURSE', 'PATIENT']}>
                <PatientForm />
              </ProtectedRoute>
            }
          />

          {/* Doctors */}
          <Route
            path="doctors"
            element={
              <ProtectedRoute roles={['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST']}>
                <Doctors />
              </ProtectedRoute>
            }
          />
          <Route
            path="doctors/new"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <DoctorForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="doctors/:id"
            element={
              <ProtectedRoute roles={['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST']}>
                <DoctorDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="doctors/:id/edit"
            element={
              <ProtectedRoute roles={['ADMIN', 'DOCTOR']}>
                <DoctorForm />
              </ProtectedRoute>
            }
          />

          {/* Appointments & Front Desk */}
          <Route
            path="queue"
            element={
              <ProtectedRoute roles={['ADMIN', 'RECEPTIONIST', 'NURSE', 'DOCTOR']}>
                <ReceptionQueue />
              </ProtectedRoute>
            }
          />
          <Route path="appointments" element={<Appointments />} />
          <Route
            path="appointments/new"
            element={
              <ProtectedRoute roles={['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PATIENT']}>
                <AppointmentForm />
              </ProtectedRoute>
            }
          />
          <Route path="appointments/:id" element={<AppointmentDetail />} />

          {/* Specialist Referrals */}
          <Route
            path="referrals"
            element={
              <ProtectedRoute roles={['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PATIENT']}>
                <Referrals />
              </ProtectedRoute>
            }
          />

          {/* Prescriptions */}
          <Route
            path="prescriptions"
            element={
              <ProtectedRoute roles={['ADMIN', 'DOCTOR', 'NURSE', 'PATIENT']}>
                <Prescriptions />
              </ProtectedRoute>
            }
          />
          <Route
            path="prescriptions/new"
            element={
              <ProtectedRoute roles={['ADMIN', 'DOCTOR']}>
                <PrescriptionForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="prescriptions/:id/edit"
            element={
              <ProtectedRoute roles={['ADMIN', 'DOCTOR']}>
                <PrescriptionForm />
              </ProtectedRoute>
            }
          />

          {/* Laboratory (LIS) & Pharmacy */}
          <Route
            path="labs"
            element={
              <ProtectedRoute roles={['ADMIN', 'LAB_TECH', 'DOCTOR', 'NURSE', 'PATIENT']}>
                <LabOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="pharmacy"
            element={
              <ProtectedRoute roles={['ADMIN', 'PHARMACIST']}>
                <Pharmacy />
              </ProtectedRoute>
            }
          />

          {/* Billing */}
          <Route
            path="billing"
            element={
              <ProtectedRoute roles={['ADMIN', 'ACCOUNTANT', 'PATIENT']}>
                <Billing />
              </ProtectedRoute>
            }
          />
          <Route
            path="billing/new"
            element={
              <ProtectedRoute roles={['ADMIN', 'ACCOUNTANT']}>
                <BillingForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="billing/:id"
            element={
              <ProtectedRoute roles={['ADMIN', 'ACCOUNTANT', 'PATIENT']}>
                <BillingDetail />
              </ProtectedRoute>
            }
          />

          {/* Admin & Settings */}
          <Route
            path="staff"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <StaffManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="audit-logs"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <AuditLogs />
              </ProtectedRoute>
            }
          />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
