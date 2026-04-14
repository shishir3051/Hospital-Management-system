import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  User, 
  Stethoscope, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Activity,
  ArrowRight,
  Heart,
  Droplets,
  Zap,
  Users
} from 'lucide-react';
import { doctorsApi, appointmentsApi } from '../../services/api';
import { useAuth } from '../../store/AuthContext';

export default function PublicAppointment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(location.state?.doctorId || '');
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [appointmentType, setAppointmentType] = useState('CONSULTATION');
  const [reason, setReason] = useState('');

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedDoctor, selectedDate]);

  const loadDoctors = async () => {
    try {
      const response = await doctorsApi.getAll({ limit: 100 });
      setDoctors(response.doctors || []);
    } catch (error) {
      console.error('Failed to load doctors:', error);
    }
  };

  const loadAvailableSlots = async () => {
    setLoading(true);
    try {
      const response = await appointmentsApi.getAvailableSlots(selectedDoctor, selectedDate);
      setAvailableSlots(response.slots || []);
    } catch (error) {
      console.error('Failed to load slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentDoctor = doctors.find(d => d._id === selectedDoctor);

  const handleNextStep = () => {
    if (step === 3 && !user) {
      // Redirect to login but save appointment state
      navigate('/login', { 
        state: { 
          from: '/appointment',
          appointmentData: { selectedDoctor, selectedDate, selectedSlot, appointmentType, reason }
        } 
      });
      return;
    }
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const dateTime = new Date(`${selectedDate}T${selectedSlot}:00`);
      await appointmentsApi.create({
        doctorId: selectedDoctor,
        dateTime: dateTime.toISOString(),
        type: appointmentType,
        reason
      });
      setStep(5); // Success step
    } catch (error) {
      console.error('Booking failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to get next 14 days
  const getNextDays = () => {
    const days = [];
    for (let i = 1; i <= 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  };

  const specialties = [
    { name: 'Cardiology', icon: Heart, experience: '25+', color: 'text-rose-500', bg: 'bg-rose-50' },
    { name: 'Orthopedics & Spine', icon: Activity, experience: '20+', color: 'text-blue-500', bg: 'bg-blue-50' },
    { name: 'Neurology & Neurosurgery', icon: Zap, experience: '22+', color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { name: 'Dermatology (Skin & VD)', icon: Droplets, experience: '10+', color: 'text-pink-500', bg: 'bg-pink-50' },
    { name: 'Pediatrics', icon: Users, experience: '14+', color: 'text-amber-500', bg: 'bg-amber-50' },
    { name: 'General Medicine / Internal Medicine', icon: Stethoscope, experience: '30+', color: 'text-primary-500', bg: 'bg-primary-50' },
    { name: 'ENT (Otolaryngology)', icon: Activity, experience: '16+', color: 'text-emerald-500', bg: 'bg-emerald-50' },
  ];

  const handleSpecialtySelect = (specName) => {
    const doctor = doctors.find(d => d.department === specName);
    if (doctor) {
      setSelectedDoctor(doctor._id);
    }
  };

  return (
    <div className="bg-background min-h-screen py-16">
      <div className="container mx-auto px-6">
        {/* Step Indicator */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -translate-y-1/2 z-0"></div>
            <div 
              className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 z-0 transition-all duration-500"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            ></div>
            
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i} 
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black relative z-10 transition-all duration-300 ${
                  step >= i ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110' : 'bg-white text-slate-400 border-2 border-slate-200'
                }`}
              >
                {step > i ? <CheckCircle2 className="w-6 h-6" /> : i}
                <span className={`absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] uppercase font-black tracking-widest whitespace-nowrap ${
                  step >= i ? 'text-primary' : 'text-slate-400'
                }`}>
                  {i === 1 && 'Specialist'}
                  {i === 2 && 'Schedule'}
                  {i === 3 && 'Details'}
                  {i === 4 && 'Confirm'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-[3.5rem] shadow-card border border-slate-100 overflow-hidden min-h-[600px] flex flex-col">
            
            {/* Step 1: Select Specialty */}
            {step === 1 && (
              <div className="p-10 lg:p-16 flex-grow animate-fadeIn">
                <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Select your <span className="text-primary">Specialist</span></h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {specialties.map((spec) => {
                    const isSelected = selectedDoctor && doctors.find(d => d._id === selectedDoctor)?.specialization === spec.name;
                    return (
                      <button
                        key={spec.name}
                        onClick={() => handleSpecialtySelect(spec.name)}
                        className={`p-6 rounded-[2.5rem] border-2 text-left transition-all flex items-center gap-6 group ${
                          isSelected
                            ? 'border-primary bg-primary-50/50 ring-4 ring-primary/5' 
                            : 'border-slate-100 hover:border-primary-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${isSelected ? 'text-primary' : 'text-slate-400'}`}>
                          <spec.icon className="w-8 h-8" />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 leading-tight">Dr.</h4>
                          <h4 className="font-black text-primary uppercase text-sm tracking-widest">{spec.name}</h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            {spec.experience} Years Experience
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Sub-selection for Doctor if multiple doctors exist for specialty */}
                {selectedDoctor && doctors.filter(d => d.department === doctors.find(doc => doc._id === selectedDoctor).department).length > 1 && (
                  <div className="mt-12 animate-slideUp">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-4">Choose a specific Doctor</label>
                    <div className="flex flex-wrap gap-4">
                      {doctors
                        .filter(d => d.department === doctors.find(doc => doc._id === selectedDoctor).department)
                        .map(doc => (
                          <button
                            key={doc._id}
                            onClick={() => setSelectedDoctor(doc._id)}
                            className={`px-6 py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                              selectedDoctor === doc._id ? 'border-primary bg-primary text-white' : 'border-slate-100 text-slate-600 hover:border-primary-200'
                            }`}
                          >
                            Dr. {doc.userId?.firstName} {doc.userId?.lastName}
                          </button>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Select Schedule */}
            {step === 2 && (
              <div className="p-10 lg:p-16 flex-grow animate-fadeIn">
                <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Choose your <span className="text-primary">Preferred Time</span></h2>
                
                <div className="mb-10">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-4">Select Date</label>
                  <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                    {getNextDays().map((date) => {
                      const d = new Date(date);
                      return (
                        <button
                          key={date}
                          onClick={() => setSelectedDate(date)}
                          className={`flex flex-col items-center justify-center min-w-[100px] h-24 rounded-3xl border-2 font-bold transition-all ${
                            selectedDate === date
                              ? 'border-primary bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                              : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-primary-200'
                          }`}
                        >
                          <span className="text-[10px] uppercase opacity-70 mb-1">
                            {d.toLocaleDateString('en-US', { weekday: 'short' })}
                          </span>
                          <span className="text-2xl font-black">
                            {d.getDate()}
                          </span>
                          <span className="text-[10px] uppercase opacity-70">
                            {d.toLocaleDateString('en-US', { month: 'short' })}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedDate && (
                  <div className="animate-fadeIn">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-4">Available Slots</label>
                    {loading ? (
                      <div className="flex items-center gap-4">
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm font-bold text-slate-400">Fetching availability...</span>
                      </div>
                    ) : availableSlots.length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot}
                            onClick={() => setSelectedSlot(slot)}
                            className={`py-3 rounded-2xl font-bold text-sm transition-all border-2 ${
                              selectedSlot === slot
                                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-110'
                                : 'bg-white text-slate-600 border-slate-100 hover:border-primary-200'
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 text-center">
                        <Clock className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-bold">No slots available for this day.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Appointment Details */}
            {step === 3 && (
              <div className="p-10 lg:p-16 flex-grow animate-fadeIn">
                <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Final <span className="text-primary">Details</span></h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="space-y-6">
                    <div>
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-3">Visit Type</label>
                      <div className="grid grid-cols-2 gap-4">
                        {['CONSULTATION', 'FOLLOWUP', 'CHECKUP'].map((type) => (
                          <button
                            key={type}
                            onClick={() => setAppointmentType(type)}
                            className={`py-4 rounded-2xl font-bold text-xs transition-all border-2 ${
                              appointmentType === type
                                ? 'bg-primary/5 text-primary border-primary shadow-sm'
                                : 'bg-white text-slate-400 border-slate-100'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-3">Reason for Visit</label>
                    <textarea
                      placeholder="Briefly describe your symptoms or reason for the appointment..."
                      className="w-full h-40 p-5 bg-slate-50 border border-slate-200 rounded-[2rem] text-sm font-medium focus:ring-4 focus:ring-primary/10 transition-all resize-none"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    ></textarea>
                  </div>
                </div>

                <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 flex items-start gap-4">
                  <ShieldCheck className="w-6 h-6 text-amber-600 flex-shrink-0" />
                  <p className="text-xs font-bold text-amber-800 leading-relaxed uppercase">
                    Your appointment information is secure and will only be shared with your selected specialist for medical purposes.
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Final Confirmation */}
            {step === 4 && (
              <div className="p-10 lg:p-16 flex-grow animate-fadeIn">
                <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Book <span className="text-primary">Appointment</span></h2>
                
                <div className="bg-slate-50 rounded-[3rem] p-10 lg:p-12 border border-slate-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                     <div className="space-y-8">
                        <div className="flex items-center gap-6">
                           <div className="w-16 h-16 bg-white rounded-3xl shadow-sm flex items-center justify-center">
                              <Stethoscope className="w-8 h-8 text-primary" />
                           </div>
                           <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Healthcare Specialist</p>
                              <p className="text-xl font-black text-slate-900">Dr. {currentDoctor?.userId?.firstName} {currentDoctor?.userId?.lastName}</p>
                              <p className="text-xs font-bold text-primary uppercase">{currentDoctor?.specialization}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-6">
                           <div className="w-16 h-16 bg-white rounded-3xl shadow-sm flex items-center justify-center">
                              <Calendar className="w-8 h-8 text-primary" />
                           </div>
                           <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date & Time</p>
                              <p className="text-xl font-black text-slate-900">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                              <p className="text-lg font-black text-primary">{selectedSlot}</p>
                           </div>
                        </div>
                     </div>
                     <div className="space-y-8">
                        <div className="flex items-center gap-6">
                           <div className="w-16 h-16 bg-white rounded-3xl shadow-sm flex items-center justify-center">
                              <Activity className="w-8 h-8 text-primary" />
                           </div>
                           <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Service Type</p>
                              <p className="text-xl font-black text-slate-900">{appointmentType}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-6">
                           <div className="w-16 h-16 bg-white rounded-3xl shadow-sm flex items-center justify-center">
                              <User className="w-8 h-8 text-primary" />
                           </div>
                           <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Patient Name</p>
                              <p className="text-xl font-black text-slate-900">{user?.firstName} {user?.lastName}</p>
                              <p className="text-xs font-bold text-slate-500">{user?.email}</p>
                           </div>
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            )}

            {/* Execution step (Success) */}
            {step === 5 && (
              <div className="p-16 flex-grow flex flex-col items-center justify-center text-center animate-fadeIn">
                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-[2rem] flex items-center justify-center mb-10 animate-bounce">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <h2 className="text-5xl font-black text-slate-900 mb-6 tracking-tighter">Appointment <span className="text-primary">Confirmed!</span></h2>
                <p className="text-slate-500 font-medium max-w-md mx-auto mb-12 text-lg leading-relaxed">
                  Your medical consultation is scheduled. You will receive a confirmation message and details shortly.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                  <Link
                    to="/dashboard"
                    className="px-10 py-5 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/30 hover:bg-primary-dark transition-all"
                  >
                    Go to Dashboard
                  </Link>
                  <Link
                    to="/"
                    className="px-10 py-5 bg-slate-100 text-slate-700 font-black rounded-2xl hover:bg-slate-200 transition-all underline underline-offset-8"
                  >
                    Back to Home
                  </Link>
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            {step < 5 && (
              <div className="p-8 lg:p-12 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                  disabled={step === 1}
                  onClick={() => setStep(step - 1)}
                  className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-bold transition-all ${
                    step === 1 ? 'opacity-0 invisible' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </button>
                
                <div className="flex flex-col items-end">
                   {step === 3 && !user && (
                      <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] mb-3 animate-pulse">Account Required for Confirmation</span>
                   )}
                   <button
                    disabled={
                      (step === 1 && !selectedDoctor) ||
                      (step === 2 && (!selectedDate || !selectedSlot)) ||
                      (step === 3 && !reason) ||
                      loading
                    }
                    onClick={step === 4 ? handleSubmit : handleNextStep}
                    className="px-12 py-5 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/30 hover:bg-primary-dark hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all flex items-center gap-3 group"
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : step === 4 ? (
                      'Confirm Appointment'
                    ) : (
                      <>
                        {step === 3 && !user ? 'Login to Confirm' : 'Continue'}
                        <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          <p className="text-center text-slate-400 font-bold text-xs uppercase tracking-[0.3em] mt-12">
             HealthCore Hospital Management System • Established 1998
          </p>
        </div>
      </div>
    </div>
  );
}
