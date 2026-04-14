// Admin Dashboard Overview
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../store/AuthContext';
import { dashboardApi } from '../../../services/api';
import {
  Users,
  Stethoscope,
  Calendar,
  DollarSign,
  TrendingUp,
  Activity,
  CheckCircle,
  Clock,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsData, chartsData] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getCharts()
      ]);
      setStats(statsData);
      setCharts(chartsData);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="p-8 flex flex-col items-center justify-center animate-pulse">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading admin insights...</p>
    </div>
  );

  const statCards = [
    { title: 'Registered Patients', value: stats?.totalPatients || 0, icon: Users, color: 'text-primary', bg: 'bg-primary-50' },
    { title: 'Total Doctors', value: stats?.totalDoctors || 0, icon: Stethoscope, color: 'text-secondary', bg: 'bg-secondary-50' },
    { title: "Today's Appointments", value: stats?.todayAppointments || 0, icon: Calendar, color: 'text-amber-500', bg: 'bg-amber-50' },
    { title: 'Month Revenue', value: `৳${(stats?.monthRevenue || 0).toLocaleString()}`, icon: DollarSign, color: 'text-green-500', bg: 'bg-green-50' }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Header */}
      <div className="bg-white rounded-[2rem] p-8 shadow-card border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
         <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50/50 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
         <div className="relative z-10">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Administration</h1>
            <p className="text-slate-500 font-medium mt-1">Full control over hospital operations and medical records.</p>
         </div>
         <div className="flex items-center gap-4 relative z-10">
            <div className="text-right hidden sm:block">
               <p className="text-sm font-black text-slate-900">{user?.firstName} {user?.lastName}</p>
               <p className="text-[10px] uppercase font-black text-primary tracking-widest">Administrator</p>
            </div>
            <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
               <ShieldAlert className="w-6 h-6" />
            </div>
         </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white rounded-3xl p-6 shadow-card hover:shadow-elevated transition-all border border-slate-100 group">
             <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                   <stat.icon className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{stat.title}</p>
                   <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                </div>
             </div>
             <div className="flex items-center gap-1.5 text-green-500 font-bold text-xs bg-green-50/50 px-3 py-1.5 rounded-full w-fit">
                <TrendingUp className="w-3.5 h-3.5" />
                +12% this month
             </div>
          </div>
        ))}
      </div>

      {/* Charts & Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           {/* Revenue Chart */}
           <div className="bg-white rounded-[2.5rem] p-8 shadow-card border border-slate-100">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xl font-black text-slate-900">Financial Growth</h3>
                 <select className="bg-slate-50 border-0 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl focus:ring-2 focus:ring-primary/20 cursor-pointer">
                    <option>Last 6 Months</option>
                    <option>Year Target</option>
                 </select>
              </div>
              <div className="h-72">
                 <Line 
                    data={{
                       labels: charts?.revenueByMonth?.map(m => m.month) || [],
                       datasets: [{
                          label: 'Revenue (৳)',
                          data: charts?.revenueByMonth?.map(m => m.revenue) || [],
                          borderColor: '#0D9488',
                          backgroundColor: 'rgba(13, 148, 136, 0.05)',
                          fill: true,
                          tension: 0.4,
                          pointRadius: 6,
                          pointBackgroundColor: '#fff',
                          pointBorderColor: '#0D9488',
                          pointBorderWidth: 2
                       }]
                    }}
                    options={{ responsive: true, maintainAspectRatio: false }}
                 />
              </div>
           </div>

           {/* Quick Action Hub */}
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link to="/dashboard/patients/new" className="bg-primary p-6 rounded-[2rem] text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-center">
                 <Users className="w-6 h-6 mx-auto mb-3" />
                 <p className="text-[10px] font-black uppercase tracking-tighter">Add Patient</p>
              </Link>
              <Link to="/dashboard/doctors/new" className="bg-secondary p-6 rounded-[2rem] text-white shadow-lg shadow-secondary/20 hover:scale-105 active:scale-95 transition-all text-center">
                 <Stethoscope className="w-6 h-6 mx-auto mb-3" />
                 <p className="text-[10px] font-black uppercase tracking-tighter">Onboard Doctor</p>
              </Link>
              <Link to="/dashboard/appointments/new" className="bg-amber-500 p-6 rounded-[2rem] text-white shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all text-center">
                 <Calendar className="w-6 h-6 mx-auto mb-3" />
                 <p className="text-[10px] font-black uppercase tracking-tighter">Set Meeting</p>
              </Link>
              <Link to="/dashboard/billing" className="bg-slate-900 p-6 rounded-[2rem] text-white shadow-lg shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all text-center">
                 <DollarSign className="w-6 h-6 mx-auto mb-3" />
                 <p className="text-[10px] font-black uppercase tracking-tighter">Audit Logs</p>
              </Link>
           </div>
        </div>

        <div className="space-y-8">
           {/* Appointment Status */}
           <div className="bg-white rounded-[2.5rem] p-8 shadow-card border border-slate-100">
              <h3 className="text-xl font-black text-slate-900 mb-6">Booking Status</h3>
              <div className="h-56 relative flex items-center justify-center">
                 <Doughnut 
                    data={{
                       labels: ['Pending', 'Completed', 'Cancelled'],
                       datasets: [{
                          data: charts?.statusCounts ? [
                             (charts.statusCounts.SCHEDULED || 0) + (charts.statusCounts.CONFIRMED || 0),
                             charts.statusCounts.COMPLETED || 0,
                             charts.statusCounts.CANCELLED || 0
                          ] : [60, 30, 10],
                          backgroundColor: ['#0D9488', '#3B82F6', '#EF4444'],
                          borderWidth: 0,
                          hoverOffset: 20
                       }]
                    }}
                    options={{ cutout: '75%', plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20, font: { weight: 'bold', size: 10 } } } } }}
                 />
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-2xl font-black text-slate-900">{stats?.totalAppointments || 0}</p>
                    <p className="text-[8px] font-black uppercase text-slate-400">Total Visits</p>
                 </div>
              </div>
           </div>

           {/* Recent Staff Activity */}
           <div className="bg-white rounded-[2.5rem] p-8 shadow-card border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-xl font-black text-slate-900">Recent Visits</h3>
                 <Link to="/dashboard/appointments" className="text-primary hover:underline"><ArrowRight className="w-4 h-4" /></Link>
              </div>
              <div className="space-y-4">
                 {stats?.recentAppointments?.slice(0, 4).map((apt, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors border border-transparent hover:border-slate-100">
                       <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                          <Activity className="w-5 h-5" />
                       </div>
                       <div className="flex-grow min-w-0">
                          <p className="text-xs font-black text-slate-900 truncate">{apt.patientName}</p>
                          <p className="text-[10px] text-slate-500 font-bold">{apt.doctorName}</p>
                       </div>
                       <div className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest ${
                          apt.status === 'COMPLETED' ? 'bg-green-100 text-green-600' : 
                          apt.status === 'CANCELLED' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                       }`}>
                          {apt.status}
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
