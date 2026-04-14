// Appointments List Page - Enhanced UI
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { appointmentsApi, doctorsApi } from '../../services/api';
import { 
  Plus, 
  Calendar, 
  Clock, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  User,
  Stethoscope,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MoreVertical,
  CalendarDays,
  Trash2,
  Edit
} from 'lucide-react';

export default function Appointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', doctorId: '', date: '' });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  useEffect(() => {
    loadData();
  }, [pagination.page, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = { page: pagination.page, limit: 10, ...filters };
      const [aptResponse, docResponse] = await Promise.all([
        appointmentsApi.getAll(Object.fromEntries(Object.entries(params).filter(([_, v]) => v))),
        doctorsApi.getAll()
      ]);
      setAppointments(aptResponse.appointments || []);
      setDoctors(docResponse.doctors || []);
      setPagination({ 
        page: aptResponse.page || 1, 
        totalPages: aptResponse.totalPages || 1, 
        total: aptResponse.total || 0 
      });
    } catch (error) { 
      console.error('Failed to load appointments:', error); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await appointmentsApi.delete(id);
        loadData();
      } catch (error) {
        alert(error.message || 'Failed to cancel appointment');
      }
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-50 text-green-600 border-green-100';
      case 'CANCELLED': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'SCHEDULED': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'CONFIRMED': return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const clearFilters = () => setFilters({ status: '', doctorId: '', date: '' });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Clinical <span className="text-primary">Schedule</span></h1>
          <p className="text-slate-500 font-medium mt-1">Real-time monitoring of hospital consultations and surgeon availability.</p>
        </div>
        <Link 
          to="/dashboard/appointments/new" 
          className="px-8 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all flex items-center gap-3 active:scale-95 text-xs uppercase tracking-widest"
        >
          <Plus className="w-5 h-5" />
          Schedule Visit
        </Link>
      </div>

      {/* Intelligence & Filters */}
      <div className="bg-white rounded-[2.5rem] p-6 lg:p-10 shadow-card border border-slate-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Filter className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select 
              value={filters.status} 
              onChange={(e) => setFilters({...filters, status: e.target.value})} 
              className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl text-[10px] font-black uppercase text-slate-400 focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
            >
              <option value="">Status: All</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div className="relative">
            <Stethoscope className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select 
              value={filters.doctorId} 
              onChange={(e) => setFilters({...filters, doctorId: e.target.value})} 
              className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl text-[10px] font-black uppercase text-slate-400 focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
            >
              <option value="">Specialist: Any</option>
              {doctors.map(d => <option key={d._id} value={d._id}>Dr. {d.userId?.firstName} {d.userId?.lastName}</option>)}
            </select>
          </div>
          <div className="relative">
             <CalendarDays className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input 
               type="date" 
               value={filters.date} 
               onChange={(e) => setFilters({...filters, date: e.target.value})} 
               className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl text-[10px] font-black uppercase text-slate-400 focus:ring-4 focus:ring-primary/10 transition-all" 
             />
          </div>
          <button 
            onClick={clearFilters} 
            className="px-6 py-4 bg-slate-50 text-slate-900 border border-slate-200 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-[3rem] shadow-card border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-24 flex flex-col items-center justify-center animate-pulse">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Syncing hospital schedule...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-32 text-center">
            <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-slate-100">
               <Calendar className="w-12 h-12 text-slate-200" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">No Appointments Found</h3>
            <p className="text-slate-400 font-medium max-w-sm mx-auto mb-10 text-sm">There are no records matching your criteria. Try scheduling a new consultation.</p>
            <Link to="/dashboard/appointments/new" className="px-10 py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95 text-xs uppercase tracking-widest">
               Manual Entry
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Patient Data</th>
                  <th className="text-left px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Healthcare Expert</th>
                  <th className="text-left px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Chronology</th>
                  <th className="text-left px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Visit Type</th>
                  <th className="text-left px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                  <th className="text-right px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((apt) => (
                  <tr key={apt._id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                          <User className="w-6 h-6 text-primary/40" />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 leading-none mb-1">
                            {apt.patientId?.userId?.firstName} {apt.patientId?.userId?.lastName}
                          </p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Patient File: {apt.patientId?._id?.slice(-8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div>
                         <p className="text-sm font-black text-slate-900">Dr. {apt.doctorId?.userId?.firstName} {apt.doctorId?.userId?.lastName}</p>
                         <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-black bg-primary/5 text-primary px-2 py-0.5 rounded-md uppercase tracking-wider">{apt.doctorId?.specialization}</span>
                         </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div>
                         <p className="text-sm font-black text-slate-900">{new Date(apt.dateTime).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                         <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 mt-1 uppercase">
                            <Clock className="w-3.5 h-3.5 text-primary/50" />
                            {new Date(apt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </p>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <span className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200/50 shadow-sm">{apt.type}</span>
                    </td>
                    <td className="px-10 py-6">
                       <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border w-fit shadow-sm ${getStatusStyle(apt.status)}`}>
                          {apt.status}
                       </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          to={`/dashboard/appointments/${apt._id}`} 
                          className="p-3 bg-white text-slate-400 hover:text-primary rounded-xl border border-slate-200 hover:border-primary transition-all active:scale-90 shadow-sm"
                          title="View Details"
                        >
                           <Activity className="w-5 h-5" />
                        </Link>
                        <Link 
                          to={`/dashboard/appointments/new?edit=${apt._id}`} 
                          className="p-3 bg-white text-slate-400 hover:text-secondary rounded-xl border border-slate-200 hover:border-secondary transition-all active:scale-90 shadow-sm"
                          title="Edit Schedule"
                        >
                           <Edit className="w-5 h-5" />
                        </Link>
                        {apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED' && (
                          <button 
                            onClick={() => handleDelete(apt._id)}
                            className="p-3 bg-rose-50 text-rose-400 hover:text-white hover:bg-rose-500 rounded-xl transition-all active:scale-90"
                            title="Cancel Appointment"
                          >
                             <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Enhanced Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-10 py-10 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Consultation Index { (pagination.page - 1) * 10 + 1 } to { Math.min(pagination.page * 10, pagination.total) }
            </p>
            <div className="flex items-center gap-4">
               <button 
                 onClick={() => setPagination({...pagination, page: pagination.page - 1})} 
                 disabled={pagination.page === 1} 
                 className="p-3 bg-white rounded-2xl border border-slate-200 text-slate-400 hover:text-primary disabled:opacity-30 transition-all shadow-sm"
               >
                 <ChevronLeft className="w-6 h-6" />
               </button>
               <div className="px-8 py-3 bg-white border border-slate-200 rounded-2xl font-black text-[10px] uppercase text-slate-600 shadow-sm">
                  {pagination.page} / {pagination.totalPages}
               </div>
               <button 
                 onClick={() => setPagination({...pagination, page: pagination.page + 1})} 
                 disabled={pagination.page === pagination.totalPages} 
                 className="p-3 bg-white rounded-2xl border border-slate-200 text-slate-400 hover:text-primary disabled:opacity-30 transition-all shadow-sm"
               >
                 <ChevronRight className="w-6 h-6" />
               </button>
            </div>
          </div>
        )}
      </div>

      <div className="text-center pt-8">
         <p className="text-[10px] font-black text-slate-200 uppercase tracking-[0.5em]">System Calendar Synchronized with IST Precision</p>
      </div>
    </div>
  );
}