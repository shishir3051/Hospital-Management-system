import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Star, 
  MapPin, 
  Clock, 
  Award, 
  GraduationCap, 
  Calendar, 
  ShieldCheck, 
  ArrowLeft,
  ChevronRight,
  Phone,
  Mail,
  Users
} from 'lucide-react';
import { doctorsApi } from '../../services/api';

export default function DoctorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDoctor();
  }, [id]);

  const loadDoctor = async () => {
    try {
      const response = await doctorsApi.getById(id);
      setDoctor(response);
    } catch (error) {
      console.error('Failed to load doctor:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold animate-pulse">Loading specialist profile...</p>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
          <Users className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Doctor Not Found</h2>
        <p className="text-slate-500 text-center max-w-sm mb-8">
          The specialist you are looking for might have been moved or is currently unavailable.
        </p>
        <button 
          onClick={() => navigate('/doctors')}
          className="px-8 py-3 bg-primary text-white font-bold rounded-2xl flex items-center gap-2 hover:bg-primary-dark transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Doctors
        </button>
      </div>
    );
  }

  const scheduleLabels = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
  };

  return (
    <div className="bg-background min-h-screen py-12">
      <div className="container mx-auto px-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-slate-400 text-sm font-bold mb-8 uppercase tracking-widest">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/doctors" className="hover:text-primary transition-colors">Our Doctors</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-900">Dr. {doctor.userId?.firstName} {doctor.userId?.lastName}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column: Image & Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-[3rem] p-10 shadow-card border border-slate-100 sticky top-24">
              <div className="w-full aspect-square bg-gradient-to-br from-primary-50 to-primary-100 rounded-[2.5rem] flex items-center justify-center mb-8 relative overflow-hidden group">
                 {doctor.userId?.avatar ? (
                    <img src={doctor.userId.avatar} alt="" className="w-full h-full object-cover rounded-[2.5rem] group-hover:scale-110 transition-transform duration-500" />
                 ) : (
                    <Users className="w-24 h-24 text-primary-300" />
                 )}
                 <div className="absolute top-4 right-4 capitalize">
                    <span className={`px-4 py-2 rounded-full text-[10px] font-black tracking-widest uppercase bg-white/90 backdrop-blur shadow-sm ${
                      doctor.status === 'AVAILABLE' ? 'text-green-600' : 'text-amber-600'
                    }`}>
                      {doctor.status}
                    </span>
                 </div>
              </div>

              <div className="text-center mb-8">
                <h1 className="text-3xl font-black text-slate-900 mb-2 leading-tight">
                  Dr. {doctor.userId?.firstName} {doctor.userId?.lastName}
                </h1>
                <p className="text-primary font-bold uppercase tracking-widest text-sm mb-4">
                  {doctor.specialization} Specialist
                </p>
                <div className="flex items-center justify-center gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-5 h-5 ${i < Math.floor(doctor.rating || 5) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                  ))}
                  <span className="text-base font-bold text-slate-900 ml-2">{doctor.rating || '5.0'}</span>
                  <span className="text-sm text-slate-400 font-medium">(250+ Reviews)</span>
                </div>
              </div>

              <div className="space-y-4">
                <Link
                  to="/appointment"
                  state={{ doctorId: doctor._id }}
                  className="w-full py-5 bg-primary text-white font-black rounded-[1.5rem] shadow-xl shadow-primary/20 hover:bg-primary-dark hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <Calendar className="w-6 h-6" />
                  Book Appointment
                </Link>
                <button className="w-full py-5 bg-slate-50 text-slate-700 font-bold rounded-[1.5rem] border border-slate-200 hover:bg-slate-100 transition-all flex items-center justify-center gap-3">
                  <Phone className="w-6 h-6" />
                  Request Callback
                </button>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-slate-50 rounded-3xl border border-slate-100/50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fee</p>
                  <p className="text-lg font-black text-primary">৳{doctor.consultationFee}</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-3xl border border-slate-100/50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Experience</p>
                  <p className="text-lg font-black text-slate-900">{doctor.yearsOfExperience}+ Yrs</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Detailed Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* About / Bio */}
            <div className="bg-white rounded-[3rem] p-10 lg:p-12 shadow-card border border-slate-100">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Professional Bio</h2>
              </div>
              <p className="text-slate-600 leading-relaxed text-lg mb-8">
                {doctor.bio || `Dr. ${doctor.userId?.firstName} ${doctor.userId?.lastName} is a highly accomplished ${doctor.specialization} specialist with over ${doctor.yearsOfExperience} years of experience in clinical practice. Committed to patient-centered care and utilizing the latest medical advancements to provide outstanding treatment outcomes.`}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <GraduationCap className="w-6 h-6 text-primary" />
                    <h3 className="text-lg font-bold text-slate-900">Education</h3>
                  </div>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-4">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="font-bold text-slate-900">{doctor.education}</p>
                        <p className="text-sm text-slate-500">Medical University of Healthcare</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="font-bold text-slate-900">Advanced Fellowship in {doctor.specialization}</p>
                        <p className="text-sm text-slate-500">Institute of Specialized Medicine</p>
                      </div>
                    </li>
                  </ul>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <Award className="w-6 h-6 text-primary" />
                    <h3 className="text-lg font-bold text-slate-900">Achievements</h3>
                  </div>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-4">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="font-bold text-slate-900">Golden Apple Medical Award</p>
                        <p className="text-sm text-slate-500">Excellence in Specialized Care</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="font-bold text-slate-900">Published Research Contributor</p>
                        <p className="text-sm text-slate-500">International Healthcare Journal</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Availability / Schedule */}
            <div className="bg-white rounded-[3rem] p-10 lg:p-12 shadow-card border border-slate-100">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary">
                  <Clock className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Available Schedule</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {doctor.schedule && Object.entries(doctor.schedule).map(([day, slots]) => (
                  <div key={day} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <h4 className="font-black text-slate-900 mb-4 flex items-center justify-between">
                      {scheduleLabels[day]}
                      <span className="text-[10px] font-black uppercase text-primary bg-primary-50 px-3 py-1 rounded-full">Active</span>
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {slots.length > 0 ? slots.map((slot, i) => (
                        <span key={i} className="px-4 py-2 bg-white rounded-xl text-xs font-bold text-slate-600 border border-slate-200">
                          {slot}
                        </span>
                      )) : (
                        <span className="text-xs text-slate-400 font-bold italic uppercase tracking-widest">No Slots Available</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-12 p-8 bg-primary-900 text-white rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/20 blur-2xl rounded-full"></div>
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Mail className="w-8 h-8 text-primary-300" />
                </div>
                <div className="text-center md:text-left flex-grow">
                  <h3 className="text-xl font-black mb-2 tracking-tight">Need a customized schedule?</h3>
                  <p className="text-primary-100 text-sm opacity-80">
                    If these slots don't work for you, contact our concierge for a priority appointment.
                  </p>
                </div>
                <Link to="/contact" className="px-8 py-4 bg-primary text-white font-black rounded-xl hover:bg-primary-dark transition-all flex-shrink-0">
                  Inquire Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
