import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, CalendarCheck2, FileText } from 'lucide-react';
import { BrandLogo } from '../ui';
import { SITE } from '../../config/site';

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-slate-50 grid grid-cols-1 lg:grid-cols-12">
      {/* Left Clinical Trust Panel */}
      <aside className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-secondary-950 via-secondary-900 to-primary-900 text-white p-10 xl:p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-secondary-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <Link to="/" aria-label={`${SITE.name} Home`}>
            <BrandLogo subtitle="Medical Center" dark />
          </Link>
        </div>

        <div className="relative z-10 space-y-8 my-12">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary-200">
              Clinical Care Portal
            </p>
            <h2 className="text-3xl font-display font-bold leading-tight text-white">
              Coordinated care, electronic records, and instant scheduling.
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed max-w-md">
              Access your appointments, official prescriptions, billing statements, and clinical updates inside one secure platform.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                icon: ShieldCheck,
                title: 'Role-Secured Clinical Access',
                desc: 'Encrypted sessions with strict patient privacy and audit trails.'
              },
              {
                icon: CalendarCheck2,
                title: 'Real-Time Specialist Booking',
                desc: 'Live physician availability with instant slot confirmation.'
              },
              {
                icon: FileText,
                title: 'Unified EHR & Billing',
                desc: 'Downloadable A4 prescriptions, invoices, and visit summaries.'
              }
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center shrink-0 text-primary-200">
                  <item.icon className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="text-xs text-slate-300 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-400 flex items-center justify-between pt-6 border-t border-white/10">
          <span>{SITE.name}</span>
          <span>24/7 Emergency: {SITE.emergencyPhone}</span>
        </div>
      </aside>

      {/* Right Form Panel */}
      <main className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-10">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-primary-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to {SITE.shortName}
          </Link>
          <div className="lg:hidden">
            <BrandLogo subtitle="" size="sm" />
          </div>
        </div>

        <div className="w-full max-w-md mx-auto my-8">
          <div className="mb-6">
            <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-slate-600">{subtitle}</p>}
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6 sm:p-7">
            {children}
          </div>
        </div>

        <p className="text-center text-xs text-slate-500">
          Need assistance? Contact Support at{' '}
          <a href={`mailto:${SITE.email}`} className="font-medium text-primary-700 hover:underline">
            {SITE.email}
          </a>
        </p>
      </main>
    </div>
  );
}
