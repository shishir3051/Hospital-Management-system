// Billing & Payments Page - Enhanced Financial Dashboard
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { billingApi } from '../../services/api';
import { 
  Search, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  CreditCard,
  TrendingUp,
  ArrowRight,
  Filter,
  FileText,
  Download,
  Wallet,
  PieChart
} from 'lucide-react';

export default function Billing() {
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [stats, setStats] = useState({ totalRevenue: 0, pendingAmount: 0, paidCount: 0, pendingCount: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '' });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  useEffect(() => {
    loadBilling();
  }, [filters, pagination.page]);

  const loadBilling = async () => {
    try {
      setLoading(true);
      const [billingResponse, statsResponse] = await Promise.all([
        billingApi.getAll({ ...filters, page: pagination.page, limit: 10 }),
        billingApi.getStats()
      ]);
      setBills(billingResponse.bills || []);
      setStats(statsResponse || { totalRevenue: 0, pendingAmount: 0, paidCount: 0, pendingCount: 0 });
      setPagination({
        page: billingResponse.page || 1,
        totalPages: billingResponse.totalPages || 1,
        total: billingResponse.total || 0
      });
    } catch (error) { 
        console.error('Failed to load billing:', error); 
    } finally { 
        setLoading(false); 
    }
  };

  const statusMap = {
    'PAID': { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-100' },
    'UNPAID': { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
    'PENDING': { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
    'PARTIAL': { icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' },
    'CANCELLED': { icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100' }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Financial <span className="text-primary">Ledger</span></h1>
          <p className="text-slate-500 font-medium mt-1">Audit medical invoices, track revenue streams, and manage payments.</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="px-6 py-4 bg-white text-slate-900 font-black rounded-2xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2 text-[10px] uppercase tracking-widest">
              <Download className="w-4 h-4" />
              Export CSV
           </button>
           <Link to="/dashboard/billing/new" className="px-8 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center gap-3 active:scale-95 text-[10px] uppercase tracking-widest">
              <PlusIcon className="w-5 h-5" />
              Create Invoice
           </Link>
        </div>
      </div>

      {/* Financial Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Cumulative Revenue', value: `৳${stats.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-100/50' },
          { label: 'Outstand Balance', value: `৳${stats.pendingAmount.toLocaleString()}`, icon: Wallet, color: 'text-amber-500', bg: 'bg-amber-100/50' },
          { label: 'Settled Invoices', value: stats.paidCount, icon: CheckCircle, color: 'text-primary', bg: 'bg-primary-100/30' },
          { label: 'Active Receivables', value: stats.pendingCount, icon: PieChart, color: 'text-rose-500', bg: 'bg-rose-100/30' }
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-[2rem] p-6 shadow-card border border-slate-100 hover:shadow-elevated transition-all group">
             <div className="flex items-center gap-4">
                <div className={`w-14 h-14 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                   <item.icon className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{item.label}</p>
                   <p className="text-xl font-black text-slate-900 leading-none">{item.value}</p>
                </div>
             </div>
          </div>
        ))}
      </div>

      {/* Intelligence & Context */}
      <div className="bg-white rounded-[2.5rem] p-6 lg:p-8 shadow-card border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="flex-grow w-full md:max-w-md relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
               type="text" 
               placeholder="Locate invoice by ID or Patient name..." 
               className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-medium focus:ring-4 focus:ring-primary/10 transition-all outline-none"
            />
         </div>
         <div className="flex items-center gap-3 w-full md:w-auto">
            <select 
              value={filters.status} 
              onChange={(e) => {
                setFilters({...filters, status: e.target.value});
                setPagination(prev => ({ ...prev, page: 1 }));
              }} 
              className="px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl text-[10px] font-black uppercase text-slate-400 tracking-widest focus:ring-4 focus:ring-primary/10 transition-all outline-none cursor-pointer"
            >
              <option value="">Status: All Records</option>
              <option value="PAID">Paid / Settled</option>
              <option value="UNPAID">Unpaid / Due</option>
              <option value="PARTIAL">Partial Payment</option>
            </select>
            <button 
              onClick={() => {
                setFilters({status: ''});
                setPagination(prev => ({ ...prev, page: 1 }));
              }} 
              className="p-4 bg-slate-50 text-slate-400 border border-slate-200 rounded-2xl hover:bg-slate-100 hover:text-slate-600 transition-all active:scale-90"
            >
               <Filter className="w-5 h-5" />
            </button>
         </div>
      </div>

      {/* Bills Ledger */}
      <div className="bg-white rounded-[3rem] shadow-card border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-24 flex flex-col items-center justify-center animate-pulse">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Processing financial transactions...</p>
          </div>
        ) : bills.length === 0 ? (
          <div className="p-32 text-center">
            <CreditCard className="w-16 h-16 text-slate-200 mx-auto mb-6" />
            <h3 className="text-xl font-black text-slate-900 mb-2">No Invoices Found</h3>
            <p className="text-slate-400 font-medium max-w-sm mx-auto">There are no billing records matching your criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Transaction ID</th>
                  <th className="text-left px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Patient Authority</th>
                  <th className="text-left px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Gross Amount</th>
                  <th className="text-left px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Payment Status</th>
                  <th className="text-left px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Audit Date</th>
                  <th className="text-right px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Protocol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bills.map(bill => {
                   const status = statusMap[bill.status] || { icon: AlertCircle, color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-100' };
                   return (
                      <tr key={bill._id} className="hover:bg-slate-50/50 transition-all group">
                        <td className="px-10 py-6">
                           <p className="font-mono text-xs font-black text-slate-400 group-hover:text-primary transition-colors">#{bill._id.slice(-8).toUpperCase()}</p>
                        </td>
                        <td className="px-10 py-6">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-100 shadow-sm text-xs font-black text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                                 {bill.patientId?.userId?.firstName?.[0]}{bill.patientId?.userId?.lastName?.[0]}
                              </div>
                              <p className="font-black text-slate-900 text-sm">{bill.patientId?.userId?.firstName} {bill.patientId?.userId?.lastName}</p>
                           </div>
                        </td>
                        <td className="px-10 py-6">
                           <p className="text-lg font-black text-slate-900">৳{bill.total.toLocaleString()}</p>
                        </td>
                        <td className="px-10 py-6">
                           <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border w-fit ${status.bg} ${status.color} ${status.border}`}>
                              <status.icon className="w-3.5 h-3.5" />
                              <span className="text-[9px] font-black uppercase tracking-widest">{bill.status}</span>
                           </div>
                        </td>
                        <td className="px-10 py-6 text-center">
                           <p className="text-sm font-black text-slate-500">{new Date(bill.createdAt).toLocaleDateString()}</p>
                        </td>
                        <td className="px-10 py-6 text-right">
                           <Link to={`/dashboard/billing/${bill._id}`} className="inline-flex items-center justify-center w-10 h-10 bg-white text-slate-400 hover:text-primary rounded-xl border border-slate-200 hover:border-primary transition-all active:scale-95 shadow-sm">
                              <FileText className="w-5 h-5" />
                           </Link>
                        </td>
                      </tr>
                   );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        {pagination.totalPages > 1 && (
          <div className="px-10 py-10 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
              Records Index {(pagination.page - 1) * 10 + 1} to {Math.min(pagination.page * 10, pagination.total)} of {pagination.total} entries
            </p>
            <div className="flex items-center gap-4">
               <button 
                 onClick={() => setPagination(prev => ({...prev, page: prev.page - 1}))} 
                 disabled={pagination.page === 1} 
                 className="w-12 h-12 bg-white rounded-2xl border border-slate-200 text-slate-400 hover:text-primary disabled:opacity-30 transition-all shadow-sm flex items-center justify-center"
               >
                 <ChevronLeft className="w-6 h-6" />
               </button>
               <div className="px-8 py-3 bg-white border border-slate-200 rounded-2xl font-black text-[10px] uppercase text-slate-600 shadow-sm leading-none flex items-center">
                  Page {pagination.page} / {pagination.totalPages}
               </div>
               <button 
                 onClick={() => setPagination(prev => ({...prev, page: prev.page + 1}))} 
                 disabled={pagination.page === pagination.totalPages} 
                 className="w-12 h-12 bg-white rounded-2xl border border-slate-200 text-slate-400 hover:text-primary disabled:opacity-30 transition-all shadow-sm flex items-center justify-center"
               >
                 <ChevronRight className="w-6 h-6" />
               </button>
            </div>
          </div>
        )}
      </div>

      <div className="text-center pt-8">
         <p className="text-[10px] font-black text-slate-200 uppercase tracking-[0.5em]">Global Hospital Financial Oversight & Secure Auditing</p>
      </div>
    </div>
  );
}

// Internal Plus Icon
function PlusIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
  );
}

const XCircle = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
);