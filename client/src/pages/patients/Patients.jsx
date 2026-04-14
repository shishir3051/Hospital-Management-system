// Patients List Page - Enhanced for EHR
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { patientsApi } from '../../services/api';
import { 
  Search, 
  Plus, 
  Filter, 
  User, 
  Phone, 
  Mail, 
  ChevronLeft, 
  ChevronRight,
  Clipboard,
  FileText,
  Activity,
  UserCheck,
  MoreHorizontal,
  Trash2
} from 'lucide-react';

export default function Patients() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  useEffect(() => {
    loadPatients();
  }, [pagination.page, search]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const response = await patientsApi.getAll({ page: pagination.page, search, limit: 10 });
      setPatients(response.patients || []);
      setPagination({ 
        page: response.page || 1, 
        totalPages: response.totalPages || 1, 
        total: response.total || 0 
      });
    } catch (error) {
      console.error('Failed to load patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to deactivate this patient account?')) {
      try {
        await patientsApi.delete(id);
        loadPatients();
      } catch (error) {
        alert(error.message || 'Failed to delete patient');
      }
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Patient <span className="text-primary">Registry</span></h1>
          <p className="text-slate-500 font-medium mt-1">Access clinical records and manage medical profiles.</p>
        </div>
        <div className="flex items-center gap-3">
           <Link
             to="/dashboard/patients/new"
             className="px-8 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all flex items-center gap-3 active:scale-95 text-xs uppercase tracking-widest"
           >
             <Plus className="w-5 h-5" />
             Register New Patient
           </Link>
        </div>
      </div>

      {/* Search & Intelligence */}
      <div className="bg-white rounded-[2.5rem] p-6 lg:p-8 shadow-card border border-slate-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Query by name, insurance ID, or symptoms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-inner"
            />
          </div>
          <button className="px-10 py-5 bg-slate-900 text-white font-black rounded-3xl shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2 active:scale-95 text-xs uppercase tracking-widest">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Patients Table / Grid */}
      <div className="bg-white rounded-[3rem] shadow-card border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center animate-pulse">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Retrieving medical database...</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="p-24 text-center">
            <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-slate-100">
               <User className="w-12 h-12 text-slate-200" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">No Patients Found</h3>
            <p className="text-slate-400 font-medium max-w-sm mx-auto">Try refining your search or add a new patient to the system.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Biological ID</th>
                  <th className="text-left px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Communication</th>
                  <th className="text-left px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Serology</th>
                  <th className="text-left px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Health Status</th>
                  <th className="text-right px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Clinical Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map((patient) => (
                  <tr key={patient._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                          <span className="text-primary font-black text-lg">
                            {patient.userId?.firstName?.[0]}{patient.userId?.lastName?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-black text-slate-900 leading-none mb-1">
                            {patient.userId?.firstName} {patient.userId?.lastName}
                          </p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">PID: {patient._id.slice(-8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1.5">
                        <p className="text-xs font-bold text-slate-600 flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-primary/50" />
                          {patient.userId?.email}
                        </p>
                        <p className="text-xs font-bold text-slate-600 flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-primary/50" />
                          {patient.userId?.phone || 'Emergency Contact Only'}
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-rose-50 text-rose-500 border border-rose-100 shadow-sm">
                        {patient.bloodGroup || 'O+'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                          <span className="text-[10px] font-black uppercase text-slate-700 tracking-widest">Active File</span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          to={`/dashboard/patients/${patient._id}/records`}
                          className="px-5 py-2.5 bg-white text-primary rounded-xl border border-primary/20 hover:bg-primary hover:text-white font-black text-[10px] uppercase tracking-widest shadow-sm transition-all flex items-center gap-2"
                        >
                          <Clipboard className="w-3.5 h-3.5" />
                          EHR
                        </Link>
                        <Link
                          to={`/dashboard/patients/${patient._id}/edit`}
                          className="p-2.5 text-slate-400 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:shadow-sm transition-all"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(patient._id)}
                          className="p-2.5 text-rose-400 hover:text-white hover:bg-rose-500 border border-transparent rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
          <div className="px-8 py-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Index {(pagination.page - 1) * 10 + 1} to {Math.min(pagination.page * 10, pagination.total)} of {pagination.total} Records
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="w-12 h-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary disabled:opacity-30 transition-all shadow-sm"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="px-6 py-3 bg-white border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-600 shadow-sm">
                Page {pagination.page} / {pagination.totalPages}
              </div>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.totalPages}
                className="w-12 h-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary disabled:opacity-30 transition-all shadow-sm"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="text-center pt-8">
         <p className="text-[10px] font-black text-slate-200 uppercase tracking-[0.5em]">Global Healthcare Identity Management</p>
      </div>
    </div>
  );
}