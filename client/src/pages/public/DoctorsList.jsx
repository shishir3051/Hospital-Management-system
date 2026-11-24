import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { doctorsApi } from '../../services/api';
import {
  Button,
  Input,
  Avatar,
  StatusBadge,
  LoadingSpinner,
  ErrorAlert,
  EmptyState
} from '../../components/ui';
import { DEPARTMENTS, SITE, formatCurrency } from '../../config/site';
import { Search, Star, Briefcase, Calendar, Phone, Stethoscope, X } from 'lucide-react';

export default function DoctorsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialDept = searchParams.get('department') || '';
  const initialSearch = searchParams.get('search') || '';

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [selectedDepartment, setSelectedDepartment] = useState(initialDept);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadDoctors = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await doctorsApi.getAll({
        search: debouncedSearch,
        department: selectedDepartment,
        limit: 50
      });
      setDoctors(res.doctors || []);
    } catch (err) {
      setError(err.message || 'Failed to load physicians');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedDepartment]);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  const handleSelectDept = (dept) => {
    setSelectedDepartment(dept);
    const next = new URLSearchParams(searchParams);
    if (dept) next.set('department', dept);
    else next.delete('department');
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="animate-fadeIn">
      <section className="bg-secondary-950 text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-300">
            Physician Directory
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-display font-extrabold text-white">
            Find a Board-Certified Specialist
          </h1>
          <p className="mt-2 text-base text-slate-300 max-w-2xl">
            Search by physician name, clinical specialty, or department to view credentials and book live appointments.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {/* Search & Department Filters */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              icon={Search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search doctors by name, specialty, department, or credentials..."
              aria-label="Search physicians"
              className="flex-1"
            />
            {(searchTerm || selectedDepartment) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  handleSelectDept('');
                }}
              >
                <X className="w-4 h-4" aria-hidden="true" />
                Clear Filters
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by department">
            <button
              type="button"
              onClick={() => handleSelectDept('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                selectedDepartment === ''
                  ? 'bg-primary-700 text-white border-primary-700'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              All Departments
            </button>
            {DEPARTMENTS.map((dept) => (
              <button
                key={dept}
                type="button"
                onClick={() => handleSelectDept(dept)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  selectedDepartment === dept
                    ? 'bg-primary-700 text-white border-primary-700'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>

        {error && <ErrorAlert message={error} onRetry={loadDoctors} />}

        {loading ? (
          <LoadingSpinner label="Searching specialist directory..." />
        ) : doctors.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-card">
            <EmptyState
              icon={Stethoscope}
              title="No matching specialists found"
              description="Try clearing your department filter or searching with a broader specialty term."
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    handleSelectDept('');
                  }}
                >
                  Show All Doctors
                </Button>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doc) => (
              <article
                key={doc._id}
                className="bg-white rounded-xl border border-slate-200 shadow-card hover:shadow-elevated hover:border-primary-200 transition-all p-6 flex flex-col justify-between gap-5"
              >
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <Avatar
                      src={doc.userId?.avatar}
                      firstName={doc.userId?.firstName}
                      lastName={doc.userId?.lastName}
                      alt={`Dr. ${doc.userId?.firstName || ''} ${doc.userId?.lastName || ''}`}
                      size="lg"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="text-base font-display font-bold text-slate-900 truncate">
                          Dr. {doc.userId?.firstName} {doc.userId?.lastName}
                        </h2>
                        <StatusBadge status={doc.status} />
                      </div>
                      <p className="text-xs font-semibold text-primary-700 mt-0.5">{doc.department}</p>
                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">{doc.specialization}</p>
                    </div>
                  </div>

                  {doc.education && (
                    <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200/70 rounded-lg px-3 py-2 line-clamp-2">
                      {doc.education}
                    </p>
                  )}

                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                      <p className="text-xs text-slate-600 flex items-center justify-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" aria-hidden="true" />
                        Rating
                      </p>
                      <p className="text-sm font-bold text-slate-900 tabular-nums mt-0.5">
                        {Number(doc.rating || 4.5).toFixed(1)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                      <p className="text-xs text-slate-600 flex items-center justify-center gap-1">
                        <Briefcase className="w-3.5 h-3.5 text-primary-700" aria-hidden="true" />
                        Exp.
                      </p>
                      <p className="text-sm font-bold text-slate-900 tabular-nums mt-0.5">
                        {doc.yearsOfExperience ?? 0} yrs
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                      <p className="text-xs text-slate-600">Fee</p>
                      <p className="text-sm font-bold text-primary-800 tabular-nums mt-0.5">
                        {formatCurrency(doc.consultationFee)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-4 border-t border-slate-100">
                  <Link to={`/doctors/${doc._id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      View Profile
                    </Button>
                  </Link>
                  <Link to={`/appointment?doctorId=${doc._id}`}>
                    <Button variant="primary" size="sm" className="w-full" disabled={doc.status !== 'AVAILABLE'}>
                      <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                      Book Now
                    </Button>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Assistance Strip */}
        <div className="rounded-xl bg-white border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-display font-bold text-slate-900">
              Need help selecting the right physician?
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Our care navigation team is available {SITE.opdHours}.
            </p>
          </div>
          <a href={`tel:${SITE.appointmentTel}`}>
            <Button variant="outline">
              <Phone className="w-4 h-4" aria-hidden="true" />
              Call {SITE.appointmentPhone}
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
}
