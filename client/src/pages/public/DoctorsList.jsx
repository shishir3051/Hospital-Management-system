import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Star, 
  MapPin, 
  Clock, 
  ChevronRight, 
  Stethoscope,
  Heart,
  Zap,
  Activity,
  Users,
  Droplets
} from 'lucide-react';
import { doctorsApi } from '../../services/api';

export default function DoctorsList() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('ALL');

  const departments = [
    { id: 'ALL', label: 'All Specialities', icon: Stethoscope },
    { id: 'Cardiology', label: 'Cardiology', icon: Heart },
    { id: 'Neurology & Neurosurgery', label: 'Neurology', icon: Zap },
    { id: 'Orthopedics & Spine', label: 'Orthopedics', icon: Activity },
    { id: 'Pediatrics', label: 'Pediatrics', icon: Users },
    { id: 'Dermatology (Skin & VD)', label: 'Dermatology', icon: Droplets },
    { id: 'ENT (Otolaryngology)', label: 'ENT', icon: Activity },
  ];

  useEffect(() => {
    loadDoctors();
  }, [department]);

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (department !== 'ALL') {
        params.department = department;
      }
      const response = await doctorsApi.getAll(params);
      setDoctors(response.doctors || []);
    } catch (error) {
      console.error('Failed to load doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter(doc => 
    `${doc.userId?.firstName} ${doc.userId?.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-background min-h-screen py-12">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 mb-6 tracking-tight">Meet Our <span className="text-primary">Medical Experts</span></h1>
          <p className="text-slate-500 font-medium leading-relaxed">
            Our team of highly qualified doctors and specialists are dedicated to providing you with the best medical care possible.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-card flex flex-col lg:flex-row gap-6 mb-12 border border-slate-100">
          <div className="flex-grow relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search doctors by name or specialization..."
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {departments.map((spec) => (
              <button
                key={spec.id}
                onClick={() => setDepartment(spec.id)}
                className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-bold whitespace-nowrap text-sm transition-all ${
                  department === spec.id
                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <spec.icon className="w-4 h-4" />
                {spec.label}
              </button>
            ))}
          </div>
        </div>

        {/* Doctor Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-[2.5rem] p-8 animate-pulse shadow-card border border-slate-100">
                <div className="w-24 h-24 bg-slate-100 rounded-2xl mb-6 mx-auto"></div>
                <div className="h-6 bg-slate-100 rounded-full w-3/4 mx-auto mb-4"></div>
                <div className="h-4 bg-slate-100 rounded-full w-1/2 mx-auto"></div>
              </div>
            ))}
          </div>
        ) : filteredDoctors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredDoctors.map((doc) => (
              <div 
                key={doc._id} 
                className="group bg-white rounded-[2.5rem] p-8 shadow-card hover:shadow-elevated hover:-translate-y-2 transition-all duration-300 border border-slate-100 relative overflow-hidden"
              >
                {/* Status Badge */}
                <div className="absolute top-6 right-6">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase ${
                    doc.status === 'AVAILABLE' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${doc.status === 'AVAILABLE' ? 'bg-green-600 animate-pulse' : 'bg-amber-600'}`}></div>
                    {doc.status}
                  </span>
                </div>

                <div className="flex flex-col items-center mb-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary-50 to-primary-100 rounded-[2rem] flex items-center justify-center mb-6 relative group-hover:scale-110 transition-transform">
                    {doc.userId?.avatar ? (
                      <img src={doc.userId.avatar} alt="" className="w-full h-full object-cover rounded-[2rem]" />
                    ) : (
                      <Users className="w-10 h-10 text-primary-400 group-hover:text-primary transition-colors" />
                    )}
                  </div>
                  <h3 className="text-xl font-black text-slate-900 group-hover:text-primary transition-colors">
                    Dr. {doc.userId?.firstName} {doc.userId?.lastName}
                  </h3>
                  <p className="text-primary font-bold text-xs uppercase tracking-widest mt-1">
                    {doc.specialization}
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                    <span className="text-slate-500 text-xs font-bold uppercase">Experience</span>
                    <span className="text-slate-900 font-black text-sm">{doc.yearsOfExperience}+ Years</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                    <span className="text-slate-500 text-xs font-bold uppercase">Fee</span>
                    <span className="text-primary font-black text-sm">৳{doc.consultationFee}</span>
                  </div>
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(doc.rating || 5) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                      ))}
                      <span className="text-xs font-bold text-slate-700 ml-1">({doc.rating || 5}.0)</span>
                    </div>
                  </div>
                </div>

                <Link
                  to={`/doctors/${doc._id}`}
                  className="flex items-center justify-center gap-2 w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all group-hover:scale-[1.02]"
                >
                  View Profile
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-[3rem] shadow-card border border-slate-100">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No Doctors Found</h3>
            <p className="text-slate-500">We couldn't find any doctors matching your search or criteria.</p>
            <button 
              onClick={() => {setSearch(''); setDepartment('ALL');}}
              className="mt-6 text-primary font-bold hover:underline"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* CTA */}
        <div className="mt-20 bg-gradient-to-r from-primary to-primary-dark rounded-[3rem] p-12 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
          
          <h2 className="text-3xl lg:text-4xl font-black mb-6 relative z-10">Can't Find Your Specialist?</h2>
          <p className="text-primary-100 font-medium mb-10 max-w-xl mx-auto relative z-10">
            Contact our helpline or visit our emergency department if you have urgent medical needs. We are here to help you 24/7.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <a href="tel:+8801711234567" className="px-8 py-4 bg-white text-primary font-black rounded-2xl hover:bg-primary-50 transition-all flex items-center gap-2">
              Call Helpline
            </a>
            <Link to="/contact" className="px-8 py-4 bg-primary-dark text-white font-black rounded-2xl border border-white/20 hover:bg-primary-900 transition-all">
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
