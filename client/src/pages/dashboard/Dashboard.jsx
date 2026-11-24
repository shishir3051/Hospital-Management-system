import { useAuth } from '../../store/AuthContext';
import AdminDashboard from './components/AdminDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import PatientDashboard from './components/PatientDashboard';
import StaffDashboard from './components/StaffDashboard';

export default function Dashboard() {
  const { user } = useAuth();

  switch (user?.role) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'DOCTOR':
      return <DoctorDashboard />;
    case 'PATIENT':
      return <PatientDashboard />;
    case 'NURSE':
    case 'ACCOUNTANT':
    case 'RECEPTIONIST':
    case 'PHARMACIST':
    case 'LAB_TECH':
      return <StaffDashboard role={user.role} />;
    default:
      return <PatientDashboard />;
  }
}
