import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  ShieldCheck, 
  Stethoscope, 
  Clock, 
  Users, 
  Award, 
  Calendar,
  Activity,
  Heart,
  Droplets,
  Zap,
  Phone
} from 'lucide-react';

export default function Home() {
  const services = [
    {
      title: 'Cardiology',
      description: 'Advanced heart care focusing on prevention, diagnosis, and treatment of cardiovascular diseases.',
      icon: Heart,
      color: 'bg-red-50 text-red-600',
    },
    {
      title: 'Neurology',
      description: 'Expert care for complex neurological conditions of the brain, spine, and nervous system.',
      icon: Zap,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      title: 'Orthopedics',
      description: 'Specialized treatment for musculoskeletal injuries, bone diseases, and joint replacement.',
      icon: Activity,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Pediatrics',
      description: 'Comprehensive medical care for infants, children, and adolescents in a friendly environment.',
      icon: Users,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      title: 'Emergency',
      description: '24/7 trauma and emergency services equipped with state-of-the-art medical technology.',
      icon: Clock,
      color: 'bg-primary-50 text-primary-600',
    },
    {
      title: 'Hematology',
      description: 'Specialized diagnosis and treatment of blood-related disorders and conditions.',
      icon: Droplets,
      color: 'bg-pink-50 text-pink-600',
    },
  ];

  const stats = [
    { label: 'Happy Patients', value: '15,000+', icon: Users },
    { label: 'Expert Doctors', value: '85+', icon: Stethoscope },
    { label: 'Years Experience', value: '25+', icon: Award },
    { label: 'Success Rate', value: '98%', icon: ShieldCheck },
  ];

  return (
    <div className="animate-fadeIn">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-slate-50">
        {/* Background Patterns */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-primary-50/50 clip-path-hero hidden lg:block"></div>
          <div className="absolute top-20 left-10 w-64 h-64 bg-primary-200/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary-200/20 rounded-full blur-3xl animate-pulse delay-700"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 text-primary-700 font-bold text-xs mb-6 tracking-wider uppercase animate-slideIn">
                <ShieldCheck className="w-4 h-4" />
                Trusted Healthcare Excellence
              </div>
              <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1.1] mb-6">
                Your Health Is Our <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Highest Priority</span>
              </h1>
              <p className="text-lg text-slate-600 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                HealthCore provides world-class medical services with state-of-the-art technology and a team of compassionate experts dedicated to your wellbeing.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  to="/appointment"
                  className="w-full sm:w-auto px-8 py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/30 hover:bg-primary-dark hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 group"
                >
                  Book Appointment
                  <Calendar className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/doctors"
                  className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 font-bold rounded-2xl shadow-lg border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  Find a Doctor
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>

            <div className="relative hidden lg:block h-[600px] animate-slideIn delay-300">
              {/* Image Placeholder with rich design */}
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-[450px] h-[550px] bg-gradient-to-br from-primary-200 to-secondary-200 rounded-[3rem] p-4 rotate-3 shadow-2xl overflow-hidden relative group">
                    <div className="w-full h-full bg-white/50 backdrop-blur rounded-[2.5rem] flex items-center justify-center">
                       {/* AI generated image would go here */}
                       <div className="flex flex-col items-center gap-4 text-primary">
                          <Stethoscope className="w-24 h-24 stroke-[1.5]" />
                          <span className="font-black text-2xl uppercase tracking-tighter opacity-20">Premium Healthcare</span>
                       </div>
                    </div>
                 </div>
                 {/* Floating Badges */}
                 <div className="absolute top-1/4 -right-10 bg-white p-4 rounded-2xl shadow-elevated flex items-center gap-4 animate-fadeIn delay-1000">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                       <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                       <p className="text-xs text-slate-500 font-bold uppercase">Certified Staff</p>
                       <p className="text-sm font-black">Top 1% Specialists</p>
                    </div>
                 </div>
                 <div className="absolute bottom-1/4 -left-10 bg-white p-4 rounded-2xl shadow-elevated flex items-center gap-4 animate-fadeIn delay-700">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600">
                       <Clock className="w-6 h-6" />
                    </div>
                    <div>
                       <p className="text-xs text-slate-500 font-bold uppercase">Emergency 24/7</p>
                       <p className="text-sm font-black">Always Available</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white relative -mt-10 lg:mt-0 z-20 mx-6 lg:mx-0">
        <div className="container mx-auto px-6">
          <div className="bg-white rounded-[3rem] shadow-elevated p-10 lg:p-16 grid grid-cols-2 lg:grid-cols-4 gap-12 border border-slate-100">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center group">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-50 text-primary mb-4 group-hover:scale-110 transition-transform">
                  <stat.icon className="w-6 h-6" />
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-1">{stat.value}</h3>
                <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-sm font-black text-primary uppercase tracking-[0.2em] mb-4">Our Specialities</h2>
            <h3 className="text-4xl lg:text-5xl font-black text-slate-900 leading-tight">
              Exceptional Services For <br /> Your Family's Health
            </h3>
            <p className="text-slate-500 mt-6 text-lg leading-relaxed">
              We provide wide range of medical services with a team of professional doctors and the latest technology.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, idx) => (
              <div 
                key={idx} 
                className="group p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-card hover:shadow-elevated hover:-translate-y-2 transition-all duration-300"
              >
                <div className={`w-14 h-14 ${service.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <service.icon className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-4 group-hover:text-primary transition-colors">{service.title}</h4>
                <p className="text-slate-500 text-sm leading-relaxed mb-6">
                  {service.description}
                </p>
                <Link to="/departments" className="inline-flex items-center gap-2 text-sm font-bold text-primary group-hover:gap-3 transition-all">
                  Learn More
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Appointment CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary-900 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-800 to-black/40"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/20 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-600/20 blur-[120px] rounded-full"></div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10 text-center">
          <div className="max-w-4xl mx-auto py-16 px-8 rounded-[3.5rem] bg-white/5 border border-white/10 backdrop-blur-md">
            <h2 className="text-4xl lg:text-6xl font-black text-white mb-8 leading-tight">
              Ready to Experience the <br /> Best Medical Care?
            </h2>
            <p className="text-lg text-primary-100 mb-12 max-w-2xl mx-auto font-medium opacity-80">
              Join thousands of patients who have already experienced our high-quality medical services. Book your meeting with our specialists today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link
                to="/appointment"
                className="w-full sm:w-auto px-10 py-5 bg-white text-primary-900 font-black rounded-2xl shadow-2xl hover:bg-primary-50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                Schedule Appointment Now
                <Calendar className="w-6 h-6 text-primary" />
              </Link>
              <div className="flex items-center gap-2 text-white">
                <Phone className="w-6 h-6 text-primary" />
                <span className="text-xl font-black tracking-tighter">Call Support: +880 1711-234567</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
