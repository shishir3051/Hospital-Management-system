import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doctorsApi } from '../../services/api';
import { Button, Badge, LoadingSpinner, ErrorAlert } from '../../components/ui';
import { DEPARTMENT_METADATA, formatCurrency } from '../../config/site';
import { Stethoscope, ArrowRight, Calendar, CheckCircle2, Star } from 'lucide-react';

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDepartments = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await doctorsApi.getDepartments();
      setDepartments(res.departments || []);
    } catch (err) {
      setError(err.message || 'Failed to load clinical departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  return (
    <div className="animate-fadeIn">
      <section className="bg-secondary-950 text-white py-14 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-300">
            Clinical Units
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-display font-extrabold text-white">
            Centers of Medical Excellence
          </h1>
          <p className="mt-3 text-base text-slate-300 max-w-2xl">
            Explore our specialty departments with live physician availability, transparent consultation fees, and direct appointment scheduling.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && <ErrorAlert message={error} onRetry={loadDepartments} className="mb-6" />}

        {loading ? (
          <LoadingSpinner label="Loading clinical departments..." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((dept) => {
              const meta = DEPARTMENT_METADATA[dept.name] || {};
              return (
                <div
                  key={dept.name}
                  className="bg-white rounded-xl border border-slate-200 shadow-card hover:shadow-elevated hover:border-primary-200 transition-all p-6 flex flex-col justify-between gap-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center shrink-0">
                        <Stethoscope className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <Badge tone={dept.doctorCount > 0 ? 'primary' : 'neutral'}>
                          {dept.doctorCount} {dept.doctorCount === 1 ? 'Doctor' : 'Doctors'}
                        </Badge>
                        {dept.avgRating > 0 && (
                          <Badge tone="warning">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" aria-hidden="true" />
                            {dept.avgRating.toFixed(1)}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div>
                      <h2 className="text-lg font-display font-bold text-slate-900">{dept.name}</h2>
                      <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                        {meta.shortDesc || 'Comprehensive outpatient and diagnostic clinical care.'}
                      </p>
                    </div>

                    {meta.services && (
                      <ul className="space-y-1.5 pt-2 border-t border-slate-100">
                        {meta.services.map((svc) => (
                          <li key={svc} className="flex items-center gap-2 text-xs font-medium text-slate-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-primary-700 shrink-0" aria-hidden="true" />
                            {svc}
                          </li>
                        ))}
                      </ul>
                    )}

                    {dept.minFee !== null && (
                      <p className="text-xs text-slate-600 tabular-nums">
                        Consultation fees from{' '}
                        <span className="font-semibold text-slate-900">{formatCurrency(dept.minFee)}</span>
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-100">
                    <Link to={`/doctors?department=${encodeURIComponent(dept.name)}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        View Doctors
                      </Button>
                    </Link>
                    <Link to={`/appointment?department=${encodeURIComponent(dept.name)}`}>
                      <Button variant="primary" size="sm" className="w-full">
                        <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                        Book Visit
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-12 rounded-xl bg-primary-50 border border-primary-100 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-display font-bold text-slate-900">
              Not sure which department to visit?
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Start with General Medicine / Internal Medicine for a comprehensive assessment and referral.
            </p>
          </div>
          <Link to={`/appointment?department=${encodeURIComponent('General Medicine / Internal Medicine')}`}>
            <Button variant="primary">
              Book General Consultation
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
