import { Phone, Mail, MapPin, Clock, Facebook, Twitter, Instagram, Linkedin, Send } from 'lucide-react';
import { useState } from 'react';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Thank you for contacting HealthCore. We will get back to you soon!');
  };

  return (
    <div className="animate-fadeIn">
      {/* Hero Section */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-sm font-black text-primary uppercase tracking-[0.3em] mb-4">Connect With Us</h1>
          <h2 className="text-5xl lg:text-7xl font-black text-slate-900 leading-tight">Get in <span className="text-primary">Touch.</span></h2>
          <p className="text-slate-500 mt-8 max-w-2xl mx-auto font-medium text-lg leading-relaxed">
            Have questions or need assistance? Our team at HealthCore Bangladesh is available 24/7 to help you with your medical inquiries.
          </p>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            
            {/* Contact Info Sidebar */}
            <div className="lg:col-span-1 space-y-10">
               <div className="p-10 bg-primary/5 rounded-[3rem] border border-primary/10">
                  <h3 className="text-xl font-black text-slate-900 mb-8">Contact Information</h3>
                  
                  <div className="space-y-8">
                     <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center text-primary shrink-0">
                           <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Location</p>
                           <p className="text-sm font-bold text-slate-700 leading-relaxed">House 12, Road 5, Dhanmondi, Dhaka 1205, Bangladesh</p>
                        </div>
                     </div>
                     <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center text-primary shrink-0">
                           <Phone className="w-5 h-5" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Phone</p>
                           <p className="text-sm font-bold text-slate-700">+880 1711-234567</p>
                           <p className="text-xs text-slate-500">Emergency: 10666</p>
                        </div>
                     </div>
                     <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center text-primary shrink-0">
                           <Mail className="w-5 h-5" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email</p>
                           <p className="text-sm font-bold text-slate-700">info@healthcore.com.bd</p>
                           <p className="text-xs text-slate-500">support@healthcore.com.bd</p>
                        </div>
                     </div>
                     <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center text-primary shrink-0">
                           <Clock className="w-5 h-5" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hours</p>
                           <p className="text-sm font-bold text-slate-700">24/7 Emergency Services</p>
                           <p className="text-xs text-slate-500">OPD: 8:00 AM - 10:00 PM</p>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Social Icons */}
               <div className="flex items-center gap-4 px-6">
                  {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                     <a key={i} href="#" className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all">
                        <Icon className="w-5 h-5" />
                     </a>
                  ))}
               </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
               <div className="bg-white rounded-[4rem] p-10 lg:p-16 shadow-card border border-slate-100">
                  <h3 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Send a <span className="text-primary">Message.</span></h3>
                  
                  <form onSubmit={handleSubmit} className="space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                           <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-3 block">Full Name</label>
                           <input 
                              type="text" 
                              required
                              className="w-full bg-slate-50 border border-slate-200 p-5 rounded-2xl font-bold text-sm focus:ring-4 focus:ring-primary/5 transition-all"
                              placeholder="e.g. John Doe"
                              value={formData.name}
                              onChange={(e) => setFormData({...formData, name: e.target.value})}
                           />
                        </div>
                        <div>
                           <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-3 block">Email Address</label>
                           <input 
                              type="email" 
                              required
                              className="w-full bg-slate-50 border border-slate-200 p-5 rounded-2xl font-bold text-sm focus:ring-4 focus:ring-primary/5 transition-all"
                              placeholder="e.g. john@example.com"
                              value={formData.email}
                              onChange={(e) => setFormData({...formData, email: e.target.value})}
                           />
                        </div>
                     </div>
                     <div>
                        <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-3 block">Subject</label>
                        <input 
                           type="text" 
                           required
                           className="w-full bg-slate-50 border border-slate-200 p-5 rounded-2xl font-bold text-sm focus:ring-4 focus:ring-primary/5 transition-all"
                           placeholder="How can we help?"
                           value={formData.subject}
                           onChange={(e) => setFormData({...formData, subject: e.target.value})}
                        />
                     </div>
                     <div>
                        <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-3 block">Message</label>
                        <textarea 
                           required
                           className="w-full bg-slate-50 border border-slate-200 p-5 rounded-[2rem] font-medium text-sm focus:ring-4 focus:ring-primary/5 transition-all h-40 resize-none"
                           placeholder="Type your message here..."
                           value={formData.message}
                           onChange={(e) => setFormData({...formData, message: e.target.value})}
                        ></textarea>
                     </div>
                     <button className="flex items-center gap-3 px-10 py-5 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary-dark hover:scale-105 active:scale-95 transition-all group">
                        Send Message
                        <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                     </button>
                  </form>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map (Placeholder) */}
      <section className="py-24 bg-slate-50">
         <div className="container mx-auto px-6">
            <div className="aspect-[21/9] bg-slate-200 rounded-[4rem] relative overflow-hidden shadow-card group">
               <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                  <div className="text-center group-hover:scale-110 transition-transform duration-700">
                     <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                        <MapPin className="w-8 h-8" />
                     </div>
                     <p className="font-black text-slate-500 uppercase tracking-widest text-xs">Map Loading...</p>
                     <p className="text-slate-400 text-[10px] mt-2 italic">Integrated Google Maps Interface</p>
                  </div>
               </div>
            </div>
         </div>
      </section>
    </div>
  );
}
