import { Link } from 'react-router-dom';
import { Button, Card } from '../../components/ui';
import { SITE } from '../../config/site';
import {
  ShieldCheck,
  HeartPulse,
  Users,
  Award,
  CheckCircle2,
  Calendar,
  Building2,
  Clock
} from 'lucide-react';

const PILLARS = [
  {
    icon: ShieldCheck,
    title: 'Patient Safety & Privacy',
    desc: 'Role-based clinical access, encrypted electronic health records, and strict diagnostic verification protocols.'
  },
  {
    icon: HeartPulse,
    title: 'Evidence-Based Medicine',
    desc: 'Multidisciplinary treatment protocols continuously aligned with international medical board guidelines.'
  },
  {
    icon: Users,
    title: 'Coordinated Care Teams',
    desc: 'Physicians, nurses, pharmacists, and billing specialists collaborating on a single shared patient record.'
  },
  {
    icon: Award,
    title: 'Transparent Billing',
    desc: 'Clear upfront consultation fees, itemized invoices, and digital payment receipts with zero hidden charges.'
  }
];

export default function About() {
  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <section className="bg-secondary-950 text-white py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-300">
            About {SITE.name}
          </p>
          <h1 className="mt-2 text-3xl sm:text-5xl font-display font-extrabold tracking-tight text-white">
            Modern Healthcare Built on Clinical Rigor and Compassion
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
            Founded in {SITE.foundedYear}, {SITE.name} combines board-certified medical expertise with seamless digital infrastructure so every patient receives timely, transparent, and coordinated care.
          </p>
        </div>
      </section>

      {/* Mission & Facility Overview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7 space-y-5">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900">
            Integrated Outpatient, Diagnostic &amp; Emergency Services
          </h2>
          <p className="text-slate-600 leading-relaxed">
            Whether you are visiting for an annual preventive screening, specialist consultation, or urgent care, our unified clinical platform ensures your physician has instant access to your medical history, allergies, and active prescriptions.
          </p>
          <ul className="space-y-3 pt-2">
            {[
              'Nine core specialty departments staffed by fellowship-trained clinicians',
              'Real-time online appointment scheduling with zero double-booking',
              'Digital A4 prescriptions and itemized invoices available anytime in your portal',
              '24/7 emergency triage and rapid diagnostic turnaround'
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
                <CheckCircle2 className="w-5 h-5 text-primary-700 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="pt-4 flex flex-wrap gap-3">
            <Link to="/doctors">
              <Button variant="primary">Meet Our Physicians</Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline">Contact Administration</Button>
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="bg-primary-50/60 border-primary-100">
            <Building2 className="w-6 h-6 text-primary-700 mb-3" aria-hidden="true" />
            <p className="text-3xl font-display font-bold text-slate-900 tabular-nums">
              {new Date().getFullYear() - SITE.foundedYear}+
            </p>
            <p className="text-xs font-semibold text-slate-600 mt-1">Years Serving Patients</p>
          </Card>
          <Card className="bg-secondary-50/60 border-secondary-100">
            <HeartPulse className="w-6 h-6 text-secondary-800 mb-3" aria-hidden="true" />
            <p className="text-3xl font-display font-bold text-slate-900 tabular-nums">9</p>
            <p className="text-xs font-semibold text-slate-600 mt-1">Specialty Departments</p>
          </Card>
          <Card>
            <Clock className="w-6 h-6 text-primary-700 mb-3" aria-hidden="true" />
            <p className="text-2xl font-display font-bold text-slate-900">24/7</p>
            <p className="text-xs font-semibold text-slate-600 mt-1">Emergency &amp; Acute Care</p>
          </Card>
          <Card>
            <ShieldCheck className="w-6 h-6 text-emerald-700 mb-3" aria-hidden="true" />
            <p className="text-2xl font-display font-bold text-slate-900">HIPAA</p>
            <p className="text-xs font-semibold text-slate-600 mt-1">Privacy-First EHR Security</p>
          </Card>
        </div>
      </section>

      {/* Core Clinical Values */}
      <section className="bg-white border-t border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-700">
              Our Standards
            </p>
            <h2 className="mt-1 text-2xl sm:text-3xl font-display font-bold text-slate-900">
              Clinical Principles That Guide Every Visit
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PILLARS.map((item) => (
              <Card key={item.title} className="h-full">
                <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="text-base font-display font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.desc}</p>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link to="/appointment">
              <Button variant="primary" size="lg">
                <Calendar className="w-4 h-4" aria-hidden="true" />
                Book Your Consultation Today
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
