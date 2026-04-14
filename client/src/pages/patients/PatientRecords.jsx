import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  patientsApi, 
  appointmentsApi, 
  prescriptionsApi,
  billingApi 
} from '../../services/api';
import { 
  ArrowLeft, 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Stethoscope, 
  Activity,
  Droplets,
  Clipboard,
  Pill,
  Download,
  Eye,
  Edit2
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';

export default function PatientRecords() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    loadEHRData();
  }, [id]);

  const loadEHRData = async () => {
    try {
      const [patientData, aptData, presData, billData] = await Promise.all([
        patientsApi.getById(id),
        appointmentsApi.getAll({ patientId: id }),
        prescriptionsApi.getAll({ patientId: id }),
        billingApi.getByPatient(id)
      ]);
      setPatient(patientData);
      setAppointments(aptData.appointments || []);
      setPrescriptions(presData.prescriptions || []);
      setBills(billData.bills || []);
    } catch (err) {
      console.error('Failed to load EHR:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 animate-pulse">
       <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
       <p className="mt-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Accessing Electronic Health Records...</p>
    </div>
  );

  if (!patient) return <div className="p-20 text-center font-bold text-slate-400">Patient Data Not Found</div>;

  const tabs = [
    { id: 'summary', label: 'Clinical Summary', icon: Clipboard },
    { id: 'appointments', label: 'Visit History', icon: Calendar },
    { id: 'prescriptions', label: 'Medications', icon: Pill },
    { id: 'billing', label: 'Financials', icon: FileText },
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate(-1)}
            className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 hover:bg-slate-50 transition-all group"
          >
            <ArrowLeft className="w-6 h-6 text-slate-400 group-hover:text-primary transition-colors" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">EHR <span className="text-primary">Profile</span></h1>
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mt-1">Patient Electronic Health Record Control</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           {['ADMIN', 'DOCTOR'].includes(user?.role) && (
              <Link 
                to="/dashboard/prescriptions/new" 
                state={{ patientId: patient._id }}
                className="px-6 py-3 bg-primary text-white font-black rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 text-xs uppercase tracking-widest"
              >
                <Plus className="w-4 h-4" />
                Issue Prescription
              </Link>
           )}
           <button className="px-6 py-3 bg-white text-slate-600 font-black rounded-xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2 text-xs uppercase tracking-widest">
              <Download className="w-4 h-4" />
              Download Report
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Patient Quick Stats */}
        <div className="lg:col-span-1 space-y-8">
           <div className="bg-white rounded-[2.5rem] p-8 shadow-card border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
              <div className="flex flex-col items-center text-center relative z-10">
                 <div className="w-24 h-24 bg-primary text-white rounded-[2rem] flex items-center justify-center text-3xl font-black mb-6 shadow-xl shadow-primary/20">
                    {patient.userId?.firstName?.[0]}{patient.userId?.lastName?.[0]}
                 </div>
                 <h2 className="text-2xl font-black text-slate-900 tracking-tight">{patient.userId?.firstName} {patient.userId?.lastName}</h2>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">UID: {patient._id.slice(-8)}</p>
                 
                 <div className="grid grid-cols-2 gap-4 w-full mt-8">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Blood</p>
                       <p className="text-lg font-black text-rose-500">{patient.bloodGroup || 'O+'}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Gender</p>
                       <p className="text-lg font-black text-slate-900">{patient.gender?.charAt(0) || 'M'}</p>
                    </div>
                 </div>
              </div>

              <div className="mt-8 space-y-4 pt-8 border-t border-slate-100">
                 <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                       <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                       <p className="text-[8px] font-black text-slate-400 uppercase">Age</p>
                       <p className="text-xs font-bold text-slate-700">32 Years</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                       <Activity className="w-4 h-4" />
                    </div>
                    <div>
                       <p className="text-[8px] font-black text-slate-400 uppercase">Last Contact</p>
                       <p className="text-xs font-bold text-slate-700">{appointments[0] ? new Date(appointments[0].dateTime).toLocaleDateString() : 'N/A'}</p>
                    </div>
                 </div>
              </div>
           </div>

           {/* Medical Warnings */}
           <div className="bg-rose-50 rounded-[2.5rem] p-8 border border-rose-100">
              <div className="flex items-center gap-3 mb-4 text-rose-600">
                 <ShieldCheck className="w-5 h-5 font-black" />
                 <h3 className="text-xs font-black uppercase tracking-widest">Medical Alerts</h3>
              </div>
              <ul className="space-y-3">
                 <li className="flex items-center gap-3 text-xs font-bold text-rose-800">
                    <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></div>
                    Penicillin Allergy
                 </li>
                 <li className="flex items-center gap-3 text-xs font-bold text-rose-800">
                    <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></div>
                    Chronic Hypertension
                 </li>
              </ul>
           </div>
        </div>

        {/* Right Column: EHR Content Tabs */}
        <div className="lg:col-span-3 space-y-8">
           {/* Tab Navigation */}
           <div className="bg-white p-2 rounded-3xl shadow-card border border-slate-100 flex items-center gap-2">
              {tabs.map(tab => (
                 <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-grow py-4 px-6 rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest transition-all ${
                       activeTab === tab.id 
                          ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' 
                          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                    }`}
                 >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                 </button>
              ))}
           </div>

           {/* Tab Content */}
           <div className="bg-white rounded-[2.5rem] p-8 lg:p-12 shadow-card border border-slate-100 min-h-[500px] animate-fadeIn">
              
              {activeTab === 'summary' && (
                 <div className="space-y-12">
                    <div>
                       <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                          <Clipboard className="w-6 h-6 text-primary" />
                          Clinical Observation
                       </h3>
                       <p className="text-slate-600 leading-relaxed font-medium">
                          Patient presents with chronic respiratory symptoms. Initial diagnosis suggests mild asthma exacerbation. 
                          Regular monitoring of peak flow and adherence to inhaler regimen is required. 
                          Medical history indicates no surgical intervention in the last 24 months.
                       </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                          <h4 className="font-black text-slate-900 mb-4 uppercase text-[10px] tracking-widest">Active Medications</h4>
                          <div className="space-y-3">
                             {prescriptions[0]?.medications?.map((med, i) => (
                                <div key={i} className="flex items-center justify-between text-sm font-bold">
                                   <span className="text-slate-700">{med.name}</span>
                                   <span className="px-3 py-1 bg-white rounded-lg border border-slate-100 text-[10px] text-primary">{med.dosage}</span>
                                </div>
                             ))}
                          </div>
                       </div>
                       <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                          <h4 className="font-black text-slate-900 mb-4 uppercase text-[10px] tracking-widest">Recent Vitals</h4>
                          <div className="space-y-4">
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 font-bold uppercase text-[9px]">Pulse</span>
                                <span className="font-black text-slate-900">72 BPM</span>
                             </div>
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 font-bold uppercase text-[9px]">Temp</span>
                                <span className="font-black text-slate-900">98.6 °F</span>
                             </div>
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 font-bold uppercase text-[9px]">SPO2</span>
                                <span className="font-black text-primary">99%</span>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              )}

              {activeTab === 'appointments' && (
                 <div className="space-y-6">
                    {appointments.map((apt, i) => (
                       <div key={i} className="p-6 bg-slate-50 rounded-[2rem] border border-transparent hover:border-slate-100 hover:bg-white transition-all group">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-6">
                                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-primary font-black group-hover:scale-110 transition-transform">
                                   <Calendar className="w-6 h-6" />
                                </div>
                                <div>
                                   <h4 className="text-sm font-black text-slate-900">{apt.reason || apt.type} Visit</h4>
                                   <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                                      {new Date(apt.dateTime).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                   </p>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className="text-xs font-black text-slate-900">Dr. {apt.doctorId?.userId?.firstName} {apt.doctorId?.userId?.lastName}</p>
                                <span className={`inline-block px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest mt-2 ${
                                   apt.status === 'COMPLETED' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                                }`}>
                                   {apt.status}
                                </span>
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
              )}

              {activeTab === 'prescriptions' && (
                 <div className="space-y-8">
                    {prescriptions.map((pres, i) => (
                       <div key={i} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200/50">
                             <div>
                                <h4 className="text-lg font-black text-slate-900 tracking-tight">Prescription #{pres._id.slice(-6)}</h4>
                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Issued {new Date(pres.createdAt).toLocaleDateString()}</p>
                             </div>
                             <div className="flex items-center gap-2">
                                <button className="p-2 hover:bg-primary-50 hover:text-primary rounded-lg transition-colors"><Eye className="w-5 h-5" /></button>
                                <button className="p-2 hover:bg-primary-50 hover:text-primary rounded-lg transition-colors"><Download className="w-5 h-5" /></button>
                             </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                             {pres.medications.map((med, j) => (
                                <div key={j} className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm">
                                   <div>
                                      <p className="font-black text-slate-900 text-sm mb-1">{med.name}</p>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase">{med.frequency} • {med.duration}</p>
                                   </div>
                                   <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-lg">
                                      {med.dosage}
                                   </span>
                                </div>
                             ))}
                          </div>
                       </div>
                    ))}
                 </div>
              )}

              {activeTab === 'billing' && (
                 <div className="space-y-4">
                    {bills.map((bill, i) => (
                       <div key={i} className="flex items-center justify-between p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                          <div className="flex items-center gap-6">
                             <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                                <FileText className="w-6 h-6" />
                             </div>
                             <div>
                                <h4 className="text-sm font-black text-slate-900">Medical Invoice #{bill._id.slice(-6)}</h4>
                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                                   Date: {new Date(bill.createdAt).toLocaleDateString()}
                                </p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-lg font-black text-slate-900">${bill.total}</p>
                             <span className={`inline-block px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest mt-2 ${
                                bill.status === 'PAID' ? 'bg-green-100 text-green-600' : 'bg-rose-100 text-rose-600'
                             }`}>
                                {bill.status}
                             </span>
                          </div>
                       </div>
                    ))}
                 </div>
              )}

           </div>
        </div>
      </div>
    </div>
  );
}
