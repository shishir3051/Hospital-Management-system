import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { doctorsApi } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import {
  PageHeader,
  Card,
  Button,
  Input,
  Select,
  Avatar,
  Badge,
  StatusBadge,
  LoadingSpinner,
  ErrorAlert,
  EmptyState,
  Pagination,
  useToast,
  useConfirm
} from '../../components/ui';
import { DEPARTMENTS, formatCurrency } from '../../config/site';
import {
  Search,
  UserPlus,
  Star,
  Briefcase,
  Eye,
  Edit3,
  Trash2,
  Stethoscope,
  X
} from 'lucide-react';

export default function Doctors() {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 12 });

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const loadDoctors = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await doctorsApi.getAll({
        search: debouncedSearch,
        department,
        status,
        page: pagination.page,
        limit: pagination.limit
      });
      setDoctors(res.doctors || []);
      setPagination((prev) => ({
        ...prev,
        page: res.page || 1,
        totalPages: res.totalPages || 1,
        total: res.total || 0
      }));
    } catch (err) {
      setError(err.message || 'Failed to load physicians');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, department, status, pagination.page, pagination.limit]);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  const handleDeactivate = async (doc) => {
    const name = `Dr. ${doc.userId?.firstName || ''} ${doc.userId?.lastName || ''}`.trim();
    const accepted = await confirm({
      title: 'Deactivate Physician',
      message: `Are you sure you want to deactivate ${name}? They will be removed from public booking and marked on leave.`,
      confirmLabel: 'Deactivate',
      variant: 'danger'
    });
    if (!accepted) return;

    try {
      await doctorsApi.delete(doc._id);
      toast.success(`${name} deactivated.`);
      loadDoctors();
    } catch (err) {
      toast.error(err.message || 'Failed to deactivate doctor');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Medical Staff Roster"
        subtitle="Manage board-certified physicians, departments, consultation fees, and weekly availability."
        actions={
          isAdmin && (
            <Link to="/dashboard/doctors/new">
              <Button variant="primary" size="sm">
                <UserPlus className="w-4 h-4" aria-hidden="true" />
                Onboard Doctor
              </Button>
            </Link>
          )
        }
      />

      <Card padding="p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <Input
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by doctor name, specialty, or education..."
            aria-label="Search medical staff"
            className="flex-1"
          />
          <Select
            aria-label="Filter by department"
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="md:w-64"
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Filter by availability"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="md:w-44"
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="BUSY">Busy</option>
            <option value="ON_LEAVE">On Leave</option>
          </Select>
          {(search || department || status) && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearch('');
                setDepartment('');
                setStatus('');
              }}
            >
              <X className="w-4 h-4" />
              Reset
            </Button>
          )}
        </div>
      </Card>

      {error && <ErrorAlert message={error} onRetry={loadDoctors} />}

      {loading ? (
        <LoadingSpinner label="Loading medical roster..." />
      ) : doctors.length === 0 ? (
        <Card>
          <EmptyState
            icon={Stethoscope}
            title="No physicians found"
            description="Adjust your department or availability filter, or onboard a new physician."
            action={
              isAdmin && (
                <Link to="/dashboard/doctors/new">
                  <Button variant="primary" size="sm">
                    <UserPlus className="w-4 h-4" />
                    Onboard Doctor
                  </Button>
                </Link>
              )
            }
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {doctors.map((doc) => {
              const canEdit =
                isAdmin || (user?.role === 'DOCTOR' && user?.profile?._id === doc._id);
              return (
                <Card key={doc._id} className="flex flex-col justify-between gap-4 hover:shadow-elevated transition-shadow">
                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          src={doc.userId?.avatar}
                          firstName={doc.userId?.firstName}
                          lastName={doc.userId?.lastName}
                          size="md"
                        />
                        <div className="min-w-0">
                          <Link
                            to={`/dashboard/doctors/${doc._id}`}
                            className="text-base font-display font-bold text-slate-900 hover:text-primary-700 truncate block"
                          >
                            Dr. {doc.userId?.firstName} {doc.userId?.lastName}
                          </Link>
                          <p className="text-xs font-semibold text-primary-700 truncate">
                            {doc.department}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={doc.status} />
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2">{doc.specialization}</p>

                    <div className="grid grid-cols-3 gap-2 text-center pt-1">
                      <div className="rounded-lg bg-slate-50 border border-slate-100 p-2">
                        <p className="text-xs text-slate-600 flex items-center justify-center gap-1">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" aria-hidden="true" />
                          Rating
                        </p>
                        <p className="text-sm font-bold text-slate-900 tabular-nums">
                          {Number(doc.rating || 4.5).toFixed(1)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-slate-50 border border-slate-100 p-2">
                        <p className="text-xs text-slate-600 flex items-center justify-center gap-1">
                          <Briefcase className="w-3 h-3 text-primary-700" aria-hidden="true" />
                          Exp
                        </p>
                        <p className="text-sm font-bold text-slate-900 tabular-nums">
                          {doc.yearsOfExperience ?? 0}y
                        </p>
                      </div>
                      <div className="rounded-lg bg-slate-50 border border-slate-100 p-2">
                        <p className="text-xs text-slate-600">Fee</p>
                        <p className="text-sm font-bold text-primary-800 tabular-nums">
                          {formatCurrency(doc.consultationFee)}
                        </p>
                      </div>
                    </div>

                    {doc.licenseNumber && (
                      <Badge tone="neutral" className="font-mono">
                        Lic: {doc.licenseNumber}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                    <Link to={`/dashboard/doctors/${doc._id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="w-3.5 h-3.5" />
                        Profile &amp; Schedule
                      </Button>
                    </Link>
                    {canEdit && (
                      <Link
                        to={`/dashboard/doctors/${doc._id}/edit`}
                        aria-label={`Edit Dr. ${doc.userId?.lastName || ''}`}
                        className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Link>
                    )}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDeactivate(doc)}
                        aria-label={`Deactivate Dr. ${doc.userId?.lastName || ''}`}
                        className="p-2 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          <Card padding="p-0" className="overflow-hidden">
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={pagination.limit}
              onPageChange={(nextPage) => setPagination((prev) => ({ ...prev, page: nextPage }))}
            />
          </Card>
        </>
      )}
    </div>
  );
}
