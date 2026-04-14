// Doctors List Page - Internal Dashboard View
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doctorsApi } from '../../services/api';
import { 
  Search, 
  Plus, 
  Star, 
  Clock, 
  DollarSign, 
  Filter,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  Trash2,
  ChevronRight as ChevronRightIcon
} from 'lucide-react';

export default function Doctors() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const specializations = [
    'Cardiology', 
    'Neurology & Neurosurgery', 
    'Orthopedics & Spine', 
    'Dermatology (Skin & VD)', 
    'Pediatrics', 
    'General Medicine / Internal Medicine', 
    'ENT (Otolaryngology)'
  ];

  useEffect(() => {
    loadDoctors();
  }, [search, specialization, pagination.page]);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const params = { page: pagination.page, limit: 6 };
      if (search) params.search = search;
      if (specialization) params.specialization = specialization;
      const response = await doctorsApi.getAll(params);
      setDoctors(response.doctors || []);
      setPagination({
        page: response.page || 1,
        totalPages: response.totalPages || 1,
        total: response.total || 0
      });
    } catch (error) {
      console.error('Failed to load doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to deactivate this doctor? This will mark the staff as INACTIVE and set them on leave.')) {
      try {
        await doctorsApi.delete(id);
        loadDoctors();
      } catch (error) {
        alert(error.message || 'Failed to delete doctor');
      }
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Staff <span className="text-secondary">Directory</span></h1>
          <p className="text-slate-500 font-medium mt-1">Manage hospital specialists, availability, and clinical performance.</p>
        </div>
        <Link 
          to="/dashboard/doctors/new" 
          className="px-8 py-4 bg-secondary text-white font-black rounded-2xl shadow-xl shadow-secondary/20 hover:bg-secondary-dark transition-all flex items-center gap-3 active:scale-95 text-xs uppercase tracking-widest"
        >
          <Plus className="w-5 h-5" />
          Onboard New Doctor
        </Link>
      </div>

      {/* Intelligence & Filters */}
      <div className="bg-white rounded-[2.5rem] p-6 lg:p-8 shadow-card border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-grow w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name, specialist ID, or keyword..." 
            value={search} 
            onChange={(e) => { 
              setSearch(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }} 
            className="w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-medium focus:ring-4 focus:ring-secondary/10 focus:border-secondary transition-all shadow-inner" 
          />
        </div>
        <div className="w-full md:w-72">
           <select 
             value={specialization} 
             onChange={(e) => {
               setSpecialization(e.target.value);
               setPagination(prev => ({ ...prev, page: 1 }));
             }} 
             className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-black uppercase tracking-widest text-slate-400 focus:ring-4 focus:ring-secondary/10 focus:border-secondary transition-all appearance-none cursor-pointer"
           >
             <option value="">All Disciplines</option>
             {specializations.map(s => <option key={s} value={s}>{s}</option>)}
           </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-[2.5rem] h-80 animate-pulse border border-slate-100 shadow-sm flex flex-col p-8">
               <div className="flex gap-4 mb-6">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl"></div>
                  <div className="flex-grow space-y-2 py-2">
                     <div className="h-4 bg-slate-100 rounded w-2/3"></div>
                     <div className="h-3 bg-slate-100 rounded w-1/3"></div>
                  </div>
               </div>
               <div className="space-y-3 flex-grow">
                  <div className="h-3 bg-slate-100 rounded w-full"></div>
                  <div className="h-3 bg-slate-100 rounded w-5/6"></div>
               </div>
               <div className="h-12 bg-slate-100 rounded-2xl w-full"></div>
            </div>
          ))}
        </div>
      ) : doctors.length === 0 ? (
        <div className="text-center p-20 bg-white rounded-[3rem] border border-slate-100 shadow-card">
          <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
             <Stethoscope className="w-10 h-10 text-slate-200" />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">No Specialists Found</h3>
          <p className="text-slate-400 font-medium">No medical staff matches your current filter or department.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {doctors.map((doctor) => (
              <div key={doctor._id} className="bg-white rounded-[2.5rem] shadow-card border border-slate-100 p-8 flex flex-col group hover:shadow-elevated transition-all hover:scale-[1.02]">
                <div className="flex items-start gap-4 mb-8">
                  <div className="w-20 h-20 bg-white rounded-[2.5rem] border-2 border-secondary/10 flex items-center justify-center shadow-lg shadow-secondary/5 group-hover:bg-secondary transition-all">
                    <span className="text-secondary font-black text-xl group-hover:text-white transition-colors">
                      {doctor.userId?.firstName?.[0]}{doctor.userId?.lastName?.[0]}
                    </span>
                  </div>
                  <div className="flex-1 pt-2">
                    <h3 className="font-black text-slate-900 leading-tight">Dr. {doctor.userId?.firstName} {doctor.userId?.lastName}</h3>
                    <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mt-1">{doctor.specialization}</p>
                    <div className="flex items-center gap-1.5 mt-2 px-2 py-1 bg-amber-50 rounded-lg w-fit">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="text-xs font-black text-amber-700">{doctor.rating || '4.8'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-8 flex-grow">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 transition-all">
                    <div className="flex items-center gap-3">
                        <DollarSign className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Fee</span>
                    </div>
                    <span className="font-black text-slate-900">৳{doctor.consultationFee}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 transition-all">
                    <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Status</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${doctor.status === 'AVAILABLE' ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${doctor.status === 'AVAILABLE' ? 'text-green-600' : 'text-slate-400'}`}>{doctor.status}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Link 
                    to={`/dashboard/doctors/${doctor._id}`} 
                    className="flex-grow px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest text-center shadow-lg hover:bg-slate-800 transition-all active:scale-95"
                  >
                    Details
                  </Link>
                  <Link 
                    to={`/dashboard/doctors/${doctor._id}/edit`} 
                    className="px-6 py-4 bg-white text-slate-600 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest text-center hover:bg-slate-50 transition-all active:scale-95"
                  >
                    Edit
                  </Link>
                  <button 
                    onClick={() => handleDelete(doctor._id)}
                    className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all active:scale-95"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm mt-8">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Showing {doctors.length} of {pagination.total} Specialists
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="w-12 h-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-secondary hover:border-secondary disabled:opacity-30 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="px-6 py-3 bg-slate-50 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-600 border border-slate-100">
                  Page {pagination.page} / {pagination.totalPages}
                </div>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="w-12 h-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-secondary hover:border-secondary disabled:opacity-30 transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <div className="text-center pt-8">
         <p className="text-[10px] font-black text-slate-200 uppercase tracking-[0.5em]">Clinical Personnel Database Management</p>
      </div>
    </div>
  );
}