// Patient Dashboard Overview
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../store/AuthContext';
import { appointmentsApi, billingApi, patientsApi } from '../../../services/api';
import {
  Calendar,
  Clock,
  DollarSign,
  FileText,
  Activity,
  Heart,
  Droplets,
  Video,
  ChevronRight,
  ArrowRight,
  CreditCard,
  ShieldCheck,
  Zap
} from 'lucide-react';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [bills, setBills] = useState([]);
  const [patientProfile, setPatientProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatientData();
  }, []);

  const loadPatientData = async () => {
    try {
      // Find patient record
      const patientResponse = await patientsApi.getAll();
      const myPatient = patientResponse.patients.find(p => p.userId?._id === user?._id);
      
      if (myPatient) {
        setPatientProfile(myPatient);
        const [aptResponse, billResponse] = await Promise.all([
          appointmentsApi.getAll({ patientId: myPatient._id }),
          billingApi.getByPatient(myPatient._id)
        ]);
        setAppointments(aptResponse.appointments || []);
        setBills(billResponse.bills || []);
      }
    } catch (error) {
      console.error('Failed to load patient dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="p-8 flex flex-col items-center justify-center animate-pulse">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Accessing patient portal...</p>
    </div>
  );

  const upcomingAppointments = appointments.filter(a => ['SCHEDULED', 'CONFIRMED'].includes(a.status));
  const pendingBills = bills.filter(b => b.status === 'UNPAID');

  const stats = [
    { label: 'Upcoming Visits', value: upcomingAppointments.length, icon: Calendar, color: 'text-primary', bg: 'bg-primary-50' },
    { label: 'Pending Bills', value: pendingBills.length, icon: DollarSign, color: 'text-rose-500', bg: 'bg-rose-50' },
    { label: 'Medical Records', value: '12', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Health Score', value: '85', icon: Activity, color: 'text-green-500', bg: 'bg-green-50' }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Patient Header */}
      <div className="bg-white rounded-[2rem] p-8 shadow-card border border-slate-100 flex flex-col lg:flex-row items-center justify-between gap-6 overflow-hidden relative">
         <div className="absolute top-0 right-0 w-64 h-64 bg-primary-100/30 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
         <div className="relative z-10 text-center lg:text-left">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Your Health Overview</h1>
            <p className="text-slate-500 font-medium mt-1">Keep track of your medical journey and wellness goals.</p>
         </div>
         <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10 w-full lg:w-auto">
            <Link to="/appointment" className="w-full sm:w-auto px-10 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary-dark hover:scale-105 active:scale-95 transition-all text-center flex items-center justify-center gap-2">
               <Calendar className="w-5 h-5" />
               Book New Appointment
            </Link>
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
               <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                  <Heart className="w-5 h-5 text-rose-500" />
               </div>
               <div className="pr-4">
                  <p className="text-[10px] uppercase font-black text-slate-400 leading-none mb-1">Blood Type</p>
                  <p className="text-sm font-black text-slate-900 leading-none">{patientProfile?.bloodGroup || 'O+'}</p>
               </div>
            </div>
         </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-[2rem] p-6 shadow-card hover:shadow-elevated transition-all border border-slate-100 group">
             <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                   <stat.icon className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-2xl font-black text-slate-900 leading-none mb-1">{stat.value}</p>
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">{stat.label}</p>
                </div>
             </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Appointments Section */}
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-white rounded-[2.5rem] p-8 lg:p-10 shadow-card border border-slate-100">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xl font-black text-slate-900 tracking-tight">Upcoming Consultations</h3>
                 <Link to="/dashboard/appointments" className="text-primary font-bold text-sm tracking-tighter hover:underline flex items-center gap-2">
                    My Schedule <ArrowRight className="w-4 h-4" />
                 </Link>
              </div>

              <div className="space-y-4">
                 {upcomingAppointments.length > 0 ? upcomingAppointments.map((apt, i) => (
                    <div key={i} className="group p-6 rounded-[2.5rem] bg-slate-50 border border-transparent hover:border-primary-100 hover:bg-white transition-all">
                       <div className="flex flex-col sm:flex-row items-center gap-6">
                          <div className="w-16 h-16 bg-white rounded-3xl flex flex-col items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                             <p className="text-lg font-black text-primary leading-none">{new Date(apt.dateTime).getDate()}</p>
                             <p className="text-[10px] font-black text-slate-400 uppercase">{new Date(apt.dateTime).toLocaleDateString('en-US', { month: 'short' })}</p>
                          </div>
                          <div className="flex-grow text-center sm:text-left">
                             <h4 className="font-black text-slate-900">Dr. {apt.doctorId?.userId?.firstName} {apt.doctorId?.userId?.lastName}</h4>
                             <p className="text-xs font-bold text-primary uppercase tracking-widest mt-1">{apt.doctorId?.specialization || 'Clinical Specialist'}</p>
                             <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-4">
                                <span className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
                                   <Clock className="w-3 h-3 text-primary" />
                                   {new Date(apt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
                                   <Video className="w-3 h-3 text-blue-500" />
                                   {apt.type} Visit
                                </span>
                             </div>
                          </div>
                          <button className="px-6 py-3 bg-white text-slate-600 rounded-2xl font-bold text-xs border border-slate-200 hover:bg-slate-50 transition-colors">
                             Reschedule
                          </button>
                       </div>
                    </div>
                 )) : (
                    <div className="py-16 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                       <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                       <p className="font-bold text-slate-400">No appointments scheduled.</p>
                       <Link to="/appointment" className="text-primary font-black uppercase text-xs mt-2 block hover:underline">Book your first visit today</Link>
                    </div>
                 )}
              </div>
           </div>

           {/* Health Stats Grid */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-6 bg-gradient-to-br from-blue-50 to-white rounded-3xl border border-blue-100 text-center">
                 <Droplets className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                 <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Blood Pressure</p>
                 <p className="text-lg font-black text-slate-900">120/80</p>
                 <span className="text-[10px] font-bold text-green-500 uppercase">Normal</span>
              </div>
              <div className="p-6 bg-gradient-to-br from-rose-50 to-white rounded-3xl border border-rose-100 text-center">
                 <Zap className="w-8 h-8 text-rose-500 mx-auto mb-3" />
                 <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Heart Rate</p>
                 <p className="text-lg font-black text-slate-900">72 BPM</p>
                 <span className="text-[10px] font-bold text-green-500 uppercase">Excellent</span>
              </div>
              <div className="p-6 bg-gradient-to-br from-amber-50 to-white rounded-3xl border border-amber-100 text-center">
                 <Activity className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                 <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Body Weight</p>
                 <p className="text-lg font-black text-slate-900">68.5 KG</p>
                 <span className="text-[10px] font-bold text-slate-400 uppercase">-1.2 vs last month</span>
              </div>
           </div>
        </div>

        {/* Financial & Medical Status */}
        <div className="space-y-8">
           {/* Billing Overview */}
           <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xl font-black tracking-tight">Pending Invoices</h3>
                 <CreditCard className="w-6 h-6 text-primary-400" />
              </div>

              {pendingBills.length > 0 ? (
                 <div className="space-y-4">
                    {pendingBills.slice(0, 2).map((bill, i) => (
                       <div key={i} className="p-5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group">
                          <div className="flex justify-between items-start mb-2">
                             <div>
                                <p className="text-xs font-black uppercase text-primary-300">Invoice #{bill._id.slice(-6)}</p>
                                <p className="text-sm font-bold text-slate-400 truncate w-32">Medical Consultation</p>
                             </div>
                             <p className="text-lg font-black text-white">৳{bill.total}</p>
                          </div>
                          <button className="w-full py-2 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary-dark transition-all mt-4 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                             Pay Now
                          </button>
                       </div>
                    ))}
                    <Link to="/dashboard/billing" className="block text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-colors">
                       View All Invoices
                    </Link>
                 </div>
              ) : (
                 <div className="py-10 text-center bg-white/5 rounded-[2rem] border border-white/5">
                    <CheckCircle2 className="w-10 h-10 text-primary-400 mx-auto mb-3" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No pending bills</p>
                 </div>
              )}
           </div>

           {/* Security / Verification */}
           <div className="bg-white rounded-[2.5rem] p-8 shadow-card border border-slate-100">
              <div className="flex items-center gap-4 mb-6">
                 <ShieldCheck className="w-6 h-6 text-primary" />
                 <h4 className="font-black text-slate-900 uppercase text-xs tracking-tight">Verified Profile</h4>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">
                 Your medical data is encrypted with 256-bit security. Only you and your assigned doctors can access this information.
              </p>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                 <span className="text-[10px] font-black text-slate-900 uppercase">Security Online</span>
              </div>
           </div>

           {/* Quick Support CTA */}
           <div className="bg-primary rounded-[2.5rem] p-8 text-white relative overflow-hidden group hover:scale-[1.02] transition-all cursor-pointer shadow-lg shadow-primary/20">
              <div className="relative z-10">
                 <h4 className="text-lg font-black mb-2 tracking-tight">Need Support?</h4>
                 <p className="text-xs text-primary-50 font-medium opacity-80 mb-6">Our 24/7 medical concierge is here to help you with booking or health queries.</p>
                 <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest">
                    Contact Now <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                 </div>
              </div>
              <div className="absolute top-1/2 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
           </div>
        </div>
      </div>
    </div>
  );
}

function CheckCircle2(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
