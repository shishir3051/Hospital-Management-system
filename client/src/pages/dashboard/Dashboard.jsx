// Dashboard - Role-Based Switcher
import { useAuth } from '../../store/AuthContext';
import AdminDashboard from './components/AdminDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import PatientDashboard from './components/PatientDashboard';

export default function Dashboard() {
  const { user } = useAuth();

  // Route to the appropriate dashboard based on user role
  switch (user?.role) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'DOCTOR':
      return <DoctorDashboard />;
    case 'PATIENT':
      return <PatientDashboard />;
    default:
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center bg-white rounded-[3rem] shadow-card border border-slate-100 p-12">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
             <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
             </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Access Restricted</h2>
          <p className="text-slate-500 text-center max-w-md uppercase tracking-widest text-[10px] font-black">
             Your account role ({user?.role || 'GUEST'}) does not have a designated dashboard view. 
             Please contact system administrator if you believe this is an error.
          </p>
        </div>
      );
  }
}