import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doctorsApi } from '../../services/api';
import { Button, Avatar, Badge, StatusBadge } from '../../components/ui';
import { SITE, DEPARTMENT_METADATA, formatCurrency } from '../../config/site';
import {
  Calendar,
  Phone,
  ShieldCheck,
  Clock,
  Star,
  ArrowRight,
  Stethoscope,
  Activity,
  HeartPulse,
  CheckCircle2
} from 'lucide-react';

export default function Home() {
  const [featuredDoctors, setFeaturedDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    Promise.allSettled([
      doctorsApi.getAll({ status: 'AVAILABLE', limit: 4 }),
      doctorsApi.getDepartments()
    ]).then(([docRes, deptRes]) => {
      if (docRes.status === 'fulfilled') {
        setFeaturedDoctors(docRes.value.doctors || []);
      }
      if (deptRes.status === 'fulfilled') {
        setDepartments(deptRes.value.departments || []);
      }
    });
  }, []);

  const totalActiveDoctors = departments.reduce((sum, d) => sum + (d.doctorCount || 0), 0);
  const featuredDepartments = departments.slice(0, 6);

  return (
    <div className="animate-fadeIn">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-secondary-950 via-secondary-900 to-primary-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(20,184,166,0.18),transparent_50%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-primary-200">
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              Accredited Multidisciplinary Medical Center · Est. {SITE.foundedYear}
            </div>

            <h1 className="text-4xl sm:text-5xl font-display font-extrabold tracking-tight leading-[1.1] text-white">
              Precision Clinical Care,{' '}
              <span className="text-primary-300">Built Around Every Patient.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-200 leading-relaxed max-w-2xl">
              Book board-certified specialists in real time, access your electronic health records and official prescriptions, and manage transparent medical billing in one secure portal.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link to="/appointment">
                <Button variant="primary" size="lg" className="!bg-primary-600 hover:!bg-primary-500">
                  <Calendar className="w-4 h-4" aria-hidden="true" />
                  Book an Appointment
                </Button>
              </Link>
              <Link to="/doctors">
                <Button
                  variant="outline"
                  size="lg"
                  className="!bg-white/10 !text-white !border-white/25 hover:!bg-white/20"
                >
                  Browse Specialists
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Button>
              </Link>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary-300" aria-hidden="true" />
                Same-Day Urgent Slots
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary-300" aria-hidden="true" />
                Digital Rx &amp; EHR Access
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary-300" aria-hidden="true" />
                24/7 Emergency Triage
              </span>
            </div>
          </div>

          {/* Clinical Access Panel */}
          <div className="lg:col-span-5">
            <div className="bg-white text-slate-900 rounded-2xl border border-slate-200/80 shadow-modal p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center">
                    <HeartPulse className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-display font-bold text-slate-900">Live Care Directory</p>
                    <p className="text-xs text-slate-600">Real-time hospital availability</p>
                  </div>
                </div>
                <Badge tone="success">Online</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                  <p className="text-xs font-semibold text-slate-600">Active Specialists</p>
                  <p className="mt-1 text-2xl font-display font-bold text-slate-900 tabular-nums">
                    {totalActiveDoctors || '—'}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                  <p className="text-xs font-semibold text-slate-600">Clinical Units</p>
                  <p className="mt-1 text-2xl font-display font-bold text-slate-900 tabular-nums">
                    {departments.length || 9}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                  <p className="text-xs font-semibold text-slate-600">Emergency Response</p>
                  <p className="mt-1 text-lg font-display font-bold text-primary-700">24 / 7</p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                  <p className="text-xs font-semibold text-slate-600">OPD Schedule</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">Mon–Sat · 8am–8pm</p>
                </div>
              </div>

              <div className="rounded-xl bg-primary-50 border border-primary-100 p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-primary-800">Immediate Clinical Support</p>
                  <a
                    href={`tel:${SITE.emergencyTel}`}
                    className="text-base font-display font-bold text-slate-900 hover:text-primary-700 transition-colors"
                  >
                    {SITE.emergencyPhone}
                  </a>
                </div>
                <a
                  href={`tel:${SITE.emergencyTel}`}
                  aria-label="Call emergency desk"
                  className="w-10 h-10 rounded-lg bg-primary-700 text-white flex items-center justify-center hover:bg-primary-800 transition-colors shrink-0"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clinical Specialties */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-700">
              Clinical Departments
            </p>
            <h2 className="mt-1 text-3xl font-display font-bold text-slate-900">
              Specialized Care Across Every Discipline
            </h2>
          </div>
          <Link
            to="/departments"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 hover:text-primary-800"
          >
            View all departments
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(featuredDepartments.length > 0
            ? featuredDepartments
            : Object.keys(DEPARTMENT_METADATA)
                .slice(0, 6)
                .map((name) => ({ name, doctorCount: 0 }))
          ).map((dept) => {
            const meta = DEPARTMENT_METADATA[dept.name] || {};
            return (
              <div
                key={dept.name}
                className="bg-white rounded-xl border border-slate-200 shadow-card hover:shadow-elevated hover:border-primary-200 transition-all p-6 flex flex-col justify-between gap-5"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center">
                      <Activity className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <Badge tone={dept.doctorCount > 0 ? 'primary' : 'neutral'}>
                      {dept.doctorCount} {dept.doctorCount === 1 ? 'Specialist' : 'Specialists'}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-display font-bold text-slate-900">{dept.name}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    {meta.shortDesc || 'Comprehensive outpatient evaluation and ongoing care.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
                  <Link
                    to={`/doctors?department=${encodeURIComponent(dept.name)}`}
                    className="font-semibold text-primary-700 hover:underline inline-flex items-center gap-1"
                  >
                    Meet Doctors
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                  <Link
                    to={`/appointment?department=${encodeURIComponent(dept.name)}`}
                    className="font-medium text-slate-600 hover:text-slate-900"
                  >
                    Book Visit
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured Available Doctors */}
      {featuredDoctors.length > 0 && (
        <section className="bg-white border-y border-slate-200 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary-700">
                  Medical Staff
                </p>
                <h2 className="mt-1 text-3xl font-display font-bold text-slate-900">
                  Featured Board-Certified Physicians
                </h2>
              </div>
              <Link
                to="/doctors"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 hover:text-primary-800"
              >
                Full doctor directory
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredDoctors.map((doc) => (
                <div
                  key={doc._id}
                  className="bg-slate-50 rounded-xl border border-slate-200 p-5 flex flex-col justify-between gap-4 hover:bg-white hover:shadow-elevated transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <Avatar
                        src={doc.userId?.avatar}
                        firstName={doc.userId?.firstName}
                        lastName={doc.userId?.lastName}
                        size="lg"
                      />
                      <StatusBadge status={doc.status} />
                    </div>
                    <div>
                      <h3 className="text-base font-display font-bold text-slate-900">
                        Dr. {doc.userId?.firstName} {doc.userId?.lastName}
                      </h3>
                      <p className="text-xs font-semibold text-primary-700 mt-0.5">{doc.department}</p>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">{doc.specialization}</p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-200/80">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" aria-hidden="true" />
                        {Number(doc.rating || 4.5).toFixed(1)}
                      </span>
                      <span className="font-semibold text-slate-900 tabular-nums">
                        {formatCurrency(doc.consultationFee)}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Link to={`/doctors/${doc._id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        Profile
                      </Button>
                    </Link>
                    <Link to={`/appointment?doctorId=${doc._id}`}>
                      <Button variant="primary" size="sm" className="w-full">
                        Book
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-secondary-900 rounded-2xl p-8 sm:p-12 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary-300">
              <Stethoscope className="w-4 h-4" aria-hidden="true" />
              Same-Day Outpatient Care
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white">
              Ready to schedule your next consultation?
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              Select your specialist and preferred time slot online in under two minutes, or speak directly with our scheduling desk.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link to="/appointment">
              <Button variant="primary" size="lg" className="!bg-primary-600 hover:!bg-primary-500">
                <Calendar className="w-4 h-4" aria-hidden="true" />
                Schedule Online
              </Button>
            </Link>
            <a href={`tel:${SITE.appointmentTel}`}>
              <Button
                variant="outline"
                size="lg"
                className="!bg-white/10 !text-white !border-white/25 hover:!bg-white/20"
              >
                <Phone className="w-4 h-4" aria-hidden="true" />
                {SITE.appointmentPhone}
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
