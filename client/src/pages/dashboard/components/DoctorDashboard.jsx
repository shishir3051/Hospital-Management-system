// Doctor Dashboard Overview
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../store/AuthContext';
import { appointmentsApi, doctorsApi } from '../../../services/api';
import {
  Calendar,
  Users,
  Clock,
  CheckCircle,
  Activity,
  UserPlus,
  Clipboard,
  FileText,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  Stethoscope
} from 'lucide-react';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDoctorData();
  }, []);

  const loadDoctorData = async () => {
    try {
      // Find doctor record for this user
      const docResponse = await doctorsApi.getAll();
      const myDoc = docResponse.doctors.find(d => d.userId?._id === user?._id);
      
      if (myDoc) {
        setDoctorProfile(myDoc);
        const aptResponse = await appointmentsApi.getAll({ doctorId: myDoc._id });
        setAppointments(aptResponse.appointments || []);
      }
    } catch (error) {
      console.error('Failed to load doctor dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="p-8 flex flex-col items-center justify-center animate-pulse">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading clinical portal...</p>
    </div>
  );

  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.dateTime.startsWith(today));
  const pendingAppointments = appointments.filter(a => ['SCHEDULED', 'CONFIRMED'].includes(a.status));
  const completedAppointments = appointments.filter(a => a.status === 'COMPLETED');

  const stats = [
    { label: "Today's Clinic", value: todayAppointments.length, icon: Calendar, color: 'text-primary', bg: 'bg-primary-50' },
    { label: 'Pending Visits', value: pendingAppointments.length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Total Patients', value: new Set(appointments.map(a => a.patientId?._id)).size, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Success Rate', value: '98%', icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50' }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Clinician Header */}
      <div className="bg-white rounded-[2rem] p-8 shadow-card border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
         <div className="absolute top-0 left-0 w-64 h-64 bg-primary-50/50 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
         <div className="relative z-10">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Doctor Portal</h1>
            <p className="text-slate-500 font-medium mt-1">Manage your appointments, patients, and clinical records.</p>
         </div>
         <div className="flex items-center gap-4 relative z-10 bg-slate-50 p-4 rounded-3xl border border-slate-100">
            <div className="text-right">
               <p className="text-sm font-black text-slate-900">Dr. {user?.firstName} {user?.lastName}</p>
               <p className="text-[10px] uppercase font-black text-primary tracking-widest">{doctorProfile?.specialization || 'Specialist'}</p>
            </div>
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
               <Stethoscope className="w-5 h-5 text-primary" />
            </div>
         </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-[2rem] p-6 shadow-card hover:shadow-elevated transition-all border border-slate-100 group">
             <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform`}>
                   <stat.icon className="w-6 h-6" />
                </div>
                <div className="px-3 py-1 bg-slate-50 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">Live</div>
             </div>
             <p className="text-2xl font-black text-slate-900">{stat.value}</p>
             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Appointments Feed */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 lg:p-10 shadow-card border border-slate-100">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Today's Appointments</h3>
              <Link to="/dashboard/appointments" className="px-6 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-colors">View Schedule</Link>
           </div>

           <div className="space-y-4">
              {todayAppointments.length > 0 ? todayAppointments.map((apt, i) => (
                 <div key={i} className="flex items-center gap-6 p-6 bg-slate-50 rounded-3xl border border-transparent hover:border-primary-100 hover:bg-white transition-all group">
                    <div className="w-16 h-16 bg-white rounded-2xl flex flex-col items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                       <p className="text-lg font-black text-primary leading-none">{new Date(apt.dateTime).getHours() % 12 || 12}</p>
                       <p className="text-[10px] font-black text-slate-400 uppercase">{new Date(apt.dateTime).getHours() >= 12 ? 'PM' : 'AM'}</p>
                    </div>
                    <div className="flex-grow">
                       <h4 className="font-black text-slate-900">{apt.patientId?.userId?.firstName} {apt.patientId?.userId?.lastName}</h4>
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mt-1">{apt.type} • {apt.reason || 'No details provided'}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2">
                       <button className="p-3 bg-white text-primary rounded-xl hover:bg-primary hover:text-white shadow-sm transition-all shadow-primary/10">
                          <Clipboard className="w-4 h-4" />
                       </button>
                       <button className="p-3 bg-white text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white shadow-sm transition-all shadow-blue-500/10">
                          <MessageSquare className="w-4 h-4" />
                       </button>
                    </div>
                 </div>
              )) : (
                 <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                       <Calendar className="w-8 h-8 text-slate-200" />
                    </div>
                    <p className="font-bold text-slate-400">No appointments scheduled for today.</p>
                 </div>
              )}
           </div>
        </div>

        {/* Quick Tools & Patients */}
        <div className="space-y-8">
           {/* Quick Actions */}
           <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary-500/20 rounded-full translate-x-1/2 translate-y-1/2 blur-2xl"></div>
              <h3 className="text-xl font-black mb-6 tracking-tight relative z-10">Clinical Tools</h3>
              <div className="grid grid-cols-1 gap-3 relative z-10">
                 <button className="w-full p-4 bg-white/10 rounded-2xl flex items-center gap-4 hover:bg-white/20 transition-all text-left">
                    <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary-400">
                       <FileText className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-black uppercase tracking-widest text-primary-100">Write Prescription</span>
                 </button>
                 <button className="w-full p-4 bg-white/10 rounded-2xl flex items-center gap-4 hover:bg-white/20 transition-all text-left">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
                       <UserPlus className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-black uppercase tracking-widest text-primary-100">Update Record</span>
                 </button>
              </div>
           </div>

           {/* Patient History Overview */}
           <div className="bg-white rounded-[2.5rem] p-8 shadow-card border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-xl font-black text-slate-900 tracking-tight text-center">Recent Patients</h3>
                 <Link to="/dashboard/patients" className="text-primary"><ArrowRight className="w-5 h-5" /></Link>
              </div>
              <div className="space-y-6">
                 {appointments.slice(0, 4).map((apt, i) => (
                    <div key={i} className="flex items-center gap-4 group cursor-pointer">
                       <div className="w-12 h-12 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center group-hover:bg-primary-50 transition-colors">
                          <Activity className="w-5 h-5 text-slate-400 group-hover:text-primary" />
                       </div>
                       <div>
                          <p className="text-sm font-black text-slate-900">{apt.patientId?.userId?.firstName} {apt.patientId?.userId?.lastName}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last visited {new Date(apt.dateTime).toLocaleDateString()}</p>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           {/* Feedback Stats */}
           <div className="bg-gradient-to-br from-primary-50 to-white rounded-[2.5rem] p-8 border border-primary-100 shadow-sm relative overflow-hidden">
              <div className="flex items-center gap-4 mb-4">
                 <CheckCircle className="w-6 h-6 text-primary" />
                 <h4 className="font-black text-slate-900 tracking-tight uppercase text-sm">Patient Satisfaction</h4>
              </div>
              <p className="text-3xl font-black text-slate-900 mb-1">4.9 / 5.0</p>
              <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                 <div className="w-[98%] h-full bg-primary"></div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
