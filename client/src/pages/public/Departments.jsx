import { 
  Heart, 
  Activity, 
  Droplets, 
  Users, 
  Zap, 
  Stethoscope,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Departments() {
  const departments = [
    {
      id: 'cardiology',
      name: 'Cardiology',
      description: 'Comprehensive heart care including diagnostic services, treatment of cardiovascular diseases, and preventive cardiology.',
      icon: Heart,
      color: 'bg-rose-50 text-rose-500',
      services: ['Echocardiogram', 'Stress Testing', 'Angiography', 'Heart Rhythm Management']
    },
    {
      id: 'neurology',
      name: 'Neurology',
      description: 'Expert treatment for disorders of the nervous system, including the brain, spinal cord, and peripheral nerves.',
      icon: Zap,
      color: 'bg-indigo-50 text-indigo-500',
      services: ['EEG & EMG Sleep Studies', 'Stroke Care', 'Epilepsy Treatment', 'Dementia Care']
    },
    {
      id: 'orthopedics',
      name: 'Orthopedics',
      description: 'Specialized surgical and non-surgical care for musculoskeletal injuries, bone fractures, and joint problems.',
      icon: Activity,
      color: 'bg-blue-50 text-blue-500',
      services: ['Joint Replacement', 'Sports Medicine', 'Spine Surgery', 'Trauma Care']
    },
    {
      id: 'pediactrics',
      name: 'Pediatrics',
      description: 'Dedicated medical care for infants, children, and adolescents, covering all physical and emotional needs.',
      icon: Users,
      color: 'bg-amber-50 text-amber-500',
      services: ['Vaccinations', 'Newborn Care', 'Growth Monitoring', 'Pediatric Surgery']
    },
    {
      id: 'dermatology',
      name: 'Dermatology',
      description: 'Advanced care for skin, hair, and nail conditions, including medical and cosmetic dermatological services.',
      icon: Droplets,
      color: 'bg-pink-50 text-pink-500',
      services: ['Skin Cancer Screening', 'Acne Treatment', 'Laser Therapy', 'Clinical Dermatology']
    },
    {
      id: 'general-medicine',
      name: 'General Medicine',
      description: 'Comprehensive primary care services for adults, focusing on disease prevention and overall wellness.',
      icon: Stethoscope,
      color: 'bg-primary-50 text-primary-500',
      services: ['Regular Checkups', 'Chronic Disease Management', 'Diagnostic Screening', 'Vaccinations']
    }
  ];

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <section className="py-24 bg-primary rounded-[4rem] mx-6 mt-6 mb-20 text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-primary-900/20"></div>
        <div className="relative z-10 px-6">
          <h1 className="text-sm font-black uppercase tracking-[0.4em] mb-4 opacity-80">Clinical Specialities</h1>
          <h2 className="text-5xl lg:text-7xl font-black mb-6 tracking-tight">World-Class <span className="text-secondary-200">Departments</span></h2>
          <p className="text-lg text-primary-50 max-w-2xl mx-auto font-medium opacity-80">
            HealthCore Bangladesh offers specialized care across multiple disciplines, integrated with high-end diagnostic technology.
          </p>
        </div>
      </section>

      {/* Department Grid */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {departments.map((dept, idx) => (
              <div key={idx} className="group flex flex-col bg-white rounded-[3rem] shadow-card border border-slate-100 hover:shadow-elevated hover:-translate-y-2 transition-all overflow-hidden">
                <div className="p-10 flex-grow">
                  <div className={`w-16 h-16 ${dept.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                    <dept.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-4">{dept.name}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-8">
                    {dept.description}
                  </p>
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Core Services</p>
                    {dept.services.map((service, sIdx) => (
                      <div key={sIdx} className="flex items-center gap-3 text-sm font-bold text-slate-700">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        {service}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-100 mt-auto">
                  <Link 
                    to={`/appointment?specialization=${dept.name.toUpperCase()}`}
                    className="flex items-center justify-between w-full font-black text-xs uppercase tracking-widest text-primary hover:text-primary-dark transition-colors"
                  >
                    Meet a Specialist
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="bg-white rounded-[4rem] p-12 lg:p-20 shadow-card border border-slate-100 flex flex-col lg:flex-row items-center gap-16">
            <div className="w-24 h-24 lg:w-32 lg:h-32 bg-primary-100 rounded-[2.5rem] flex items-center justify-center shrink-0">
               <Stethoscope className="w-12 h-12 lg:w-16 lg:h-16 text-primary" />
            </div>
            <div className="text-center lg:text-left">
               <h3 className="text-3xl font-black text-slate-900 mb-4">Diagnostic Precision & Care</h3>
               <p className="text-slate-600 leading-relaxed font-medium">
                 All our departments are supported by a unified diagnostic laboratory, ensuring that your test results are accurately integrated into your Electronic Health Record (EHR) instantly. 
               </p>
               <div className="mt-8 flex flex-col sm:flex-row items-center gap-6">
                  <Link to="/doctors" className="font-black text-primary uppercase text-xs tracking-widest flex items-center gap-2 group">
                    View All Doctors
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
               </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
