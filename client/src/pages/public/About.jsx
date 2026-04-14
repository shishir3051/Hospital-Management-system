import { ShieldCheck, Target, Heart, Award, Users, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function About() {
  const values = [
    {
      title: 'Patient First',
      description: 'Our primary focus is always the health and well-being of the people we serve in Bangladesh.',
      icon: Heart,
      color: 'text-rose-500',
      bg: 'bg-rose-50'
    },
    {
      title: 'Clinical Excellence',
      description: 'We adhere to the highest international standards of medical practice and safety.',
      icon: ShieldCheck,
      color: 'text-primary-600',
      bg: 'bg-primary-50'
    },
    {
      title: 'Innovation',
      description: 'Continuously adopting advanced medical technologies to provide state-of-the-art care.',
      icon: Target,
      color: 'text-amber-600',
      bg: 'bg-amber-50'
    }
  ];

  return (
    <div className="animate-fadeIn">
      {/* Hero Section */}
      <section className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary-900/5 clip-path-hero hidden lg:block"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-sm font-black text-primary uppercase tracking-[0.3em] mb-4">About HealthCore</h1>
            <h2 className="text-5xl lg:text-7xl font-black text-slate-900 leading-tight mb-8">
              Pioneering <span className="text-primary">Healthcare</span> <br /> 
              Excellence in Bangladesh.
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed mb-10">
              Founded in 2010, HealthCore has grown from a specialized clinic in Dhanmondi to a premier healthcare network dedicated to serving the community with compassion and cutting-edge medical science.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="relative">
              <div className="aspect-[4/5] bg-slate-200 rounded-[3rem] overflow-hidden shadow-2xl transition-transform hover:scale-[1.02] duration-500">
                <div className="w-full h-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center p-12">
                   <div className="text-center">
                      <ShieldCheck className="w-24 h-24 text-primary mx-auto mb-6 opacity-20" />
                      <p className="text-slate-400 font-black italic">Quality Healthcare for Every Bangladeshi</p>
                   </div>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 bg-primary p-10 rounded-[2rem] shadow-xl text-white hidden md:block">
                <p className="text-4xl font-black mb-1">15+</p>
                <p className="text-xs font-bold uppercase tracking-widest opacity-80">Years of Service</p>
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-900 mb-6">Our Journey & Mission</h3>
              <p className="text-slate-600 mb-6 leading-relaxed">
                HealthCore was established with a singular vision: to bridge the gap between world-class medical standards and accessible healthcare in Bangladesh. What started as a 20-bed facility has evolved into a comprehensive hospital management ecosystem.
              </p>
              <p className="text-slate-600 mb-8 leading-relaxed">
                We believe that every patient deserves dignified, accurate, and rapid medical attention. Our mission is to empower our clinical staff with the best tools to heal and our patients with the best environment to recover.
              </p>
              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-100">
                <div>
                  <h4 className="text-sm font-black text-slate-900 mb-1">Our Vision</h4>
                  <p className="text-xs text-slate-500">To be the most trusted healthcare brand in South Asia.</p>
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 mb-1">Our Goal</h4>
                  <p className="text-xs text-slate-500">Integrating technology for 100% patient satisfaction.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-black text-slate-900 mb-4">Core Principles</h3>
            <p className="text-slate-500 max-w-xl mx-auto">The foundation of everything we do at HealthCore Bangladesh.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((val, idx) => (
              <div key={idx} className="bg-white p-10 rounded-[2.5rem] shadow-card border border-slate-100 group hover:-translate-y-2 transition-all">
                <div className={`w-14 h-14 ${val.bg} ${val.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                  <val.icon className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-black text-slate-900 mb-4">{val.title}</h4>
                <p className="text-slate-500 text-sm leading-relaxed">{val.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-primary rounded-[4rem] mx-6 mb-24 text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-primary-900/20"></div>
        <div className="relative z-10">
          <h2 className="text-4xl lg:text-5xl font-black mb-8 leading-tight">Ready to Experience <br /> Modern Care?</h2>
          <div className="flex justify-center gap-4">
            <Link to="/appointment" className="px-10 py-5 bg-white text-primary font-black rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
              Book Appointment
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
