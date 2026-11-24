import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { patientsApi } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import {
  PageHeader,
  Card,
  Button,
  Input,
  Select,
  Avatar,
  Badge,
  LoadingSpinner,
  ErrorAlert,
  EmptyState,
  Pagination,
  useToast,
  useConfirm
} from '../../components/ui';
import {
  BLOOD_GROUPS,
  calculateAge,
  formatDate,
  formatShortId,
  downloadCsv
} from '../../config/site';
import {
  Search,
  UserPlus,
  Download,
  ClipboardList,
  Eye,
  Edit3,
  Trash2,
  Users,
  X
} from 'lucide-react';

export default function Patients() {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('search') || '');
  const [bloodGroup, setBloodGroup] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 15 });

  const canCreate = ['ADMIN', 'DOCTOR', 'NURSE'].includes(user?.role);
  const canEdit = ['ADMIN', 'DOCTOR', 'NURSE'].includes(user?.role);
  const canDelete = user?.role === 'ADMIN';
  const canViewEhr = ['ADMIN', 'DOCTOR', 'NURSE'].includes(user?.role);

  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    if (urlSearch && urlSearch !== search) {
      setSearch(urlSearch);
      setDebouncedSearch(urlSearch);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const loadPatients = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await patientsApi.getAll({
        search: debouncedSearch,
        bloodGroup,
        page: pagination.page,
        limit: pagination.limit
      });
      setPatients(res.patients || []);
      setPagination((prev) => ({
        ...prev,
        page: res.page || 1,
        totalPages: res.totalPages || 1,
        total: res.total || 0
      }));
    } catch (err) {
      setError(err.message || 'Failed to load patient directory');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, bloodGroup, pagination.page, pagination.limit]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const handleDeactivate = async (patient) => {
    const name = `${patient.userId?.firstName || ''} ${patient.userId?.lastName || ''}`.trim() || 'this patient';
    const accepted = await confirm({
      title: 'Deactivate Patient Account',
      message: `Are you sure you want to deactivate ${name}? Their historical EHR and billing records will remain preserved for auditing.`,
      confirmLabel: 'Deactivate',
      variant: 'danger'
    });
    if (!accepted) return;

    try {
      await patientsApi.delete(patient._id);
      toast.success(`${name} deactivated.`);
      loadPatients();
    } catch (err) {
      toast.error(err.message || 'Failed to deactivate patient');
    }
  };

  const handleExportCsv = () => {
    if (patients.length === 0) {
      toast.info('No patient records to export.');
      return;
    }
    const headers = ['Patient ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Gender', 'DOB', 'Blood Group', 'Allergies'];
    const rows = patients.map((p) => [
      formatShortId(p._id, 'PID-'),
      p.userId?.firstName || '',
      p.userId?.lastName || '',
      p.userId?.email || '',
      p.userId?.phone || '',
      p.gender || '',
      formatDate(p.dateOfBirth),
      p.bloodGroup || '',
      p.allergies || ''
    ]);
    downloadCsv('healthcore-patients.csv', headers, rows);
    toast.success(`Exported ${patients.length} patient records.`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Patient Directory"
        subtitle="Search active electronic health records, demographics, and visit histories."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handleExportCsv}>
              <Download className="w-4 h-4" aria-hidden="true" />
              Export CSV
            </Button>
            {canCreate && (
              <Link to="/dashboard/patients/new">
                <Button variant="primary" size="sm">
                  <UserPlus className="w-4 h-4" aria-hidden="true" />
                  Register Patient
                </Button>
              </Link>
            )}
          </>
        }
      />

      {/* Search & Filter Bar */}
      <Card padding="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient name, email, phone, or ID..."
            aria-label="Search patients"
            className="flex-1"
          />
          <Select
            aria-label="Filter by blood group"
            value={bloodGroup}
            onChange={(e) => {
              setBloodGroup(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="sm:w-48"
          >
            <option value="">All Blood Groups</option>
            {BLOOD_GROUPS.map((bg) => (
              <option key={bg} value={bg}>
                Blood Group: {bg}
              </option>
            ))}
          </Select>
          {(search || bloodGroup) && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearch('');
                setBloodGroup('');
                setSearchParams({}, { replace: true });
              }}
            >
              <X className="w-4 h-4" aria-hidden="true" />
              Reset
            </Button>
          )}
        </div>
      </Card>

      {error && <ErrorAlert message={error} onRetry={loadPatients} />}

      {/* Patients Table */}
      <Card padding="p-0" className="overflow-hidden">
        {loading ? (
          <LoadingSpinner label="Loading patient registry..." />
        ) : patients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No patients found"
            description="No active patient profiles match your current search or blood group filter."
            action={
              canCreate && (
                <Link to="/dashboard/patients/new">
                  <Button variant="primary" size="sm">
                    <UserPlus className="w-4 h-4" />
                    Register First Patient
                  </Button>
                </Link>
              )
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Patient
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Contact
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Demographics
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Blood / Allergies
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-600 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {patients.map((patient) => {
                    const age = calculateAge(patient.dateOfBirth);
                    const hasAllergy =
                      patient.allergies && patient.allergies.toLowerCase() !== 'none';
                    return (
                      <tr key={patient._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={patient.userId?.avatar}
                              firstName={patient.userId?.firstName}
                              lastName={patient.userId?.lastName}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <Link
                                to={`/dashboard/patients/${patient._id}`}
                                className="font-semibold text-slate-900 hover:text-primary-700 transition-colors block truncate"
                              >
                                {patient.userId?.firstName} {patient.userId?.lastName}
                              </Link>
                              <p className="text-xs font-mono text-slate-600">
                                {formatShortId(patient._id, 'PID-')}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-slate-900 truncate max-w-[210px]">{patient.userId?.email || '—'}</p>
                          <p className="text-xs text-slate-600">{patient.userId?.phone || 'No phone'}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-slate-900 capitalize">
                            {patient.gender?.toLowerCase() || '—'}
                            {age !== null ? ` · ${age} yrs` : ''}
                          </p>
                          <p className="text-xs text-slate-600">DOB: {formatDate(patient.dateOfBirth)}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge tone={patient.bloodGroup ? 'primary' : 'neutral'}>
                              {patient.bloodGroup || 'Unrecorded'}
                            </Badge>
                            {hasAllergy && (
                              <Badge tone="danger" className="max-w-[160px] truncate">
                                Allergy: {patient.allergies}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {canViewEhr && (
                              <Link
                                to={`/dashboard/patients/${patient._id}/records`}
                                title="Open EHR"
                                aria-label={`Open health records for ${patient.userId?.firstName || 'patient'}`}
                                className="p-2 rounded-lg border border-slate-200 text-primary-700 hover:bg-primary-50 hover:border-primary-300 transition-colors"
                              >
                                <ClipboardList className="w-4 h-4" />
                              </Link>
                            )}
                            <Link
                              to={`/dashboard/patients/${patient._id}`}
                              title="View profile"
                              aria-label={`View profile for ${patient.userId?.firstName || 'patient'}`}
                              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            {canEdit && (
                              <Link
                                to={`/dashboard/patients/${patient._id}/edit`}
                                title="Edit patient"
                                aria-label={`Edit ${patient.userId?.firstName || 'patient'}`}
                                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                              >
                                <Edit3 className="w-4 h-4" />
                              </Link>
                            )}
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => handleDeactivate(patient)}
                                title="Deactivate patient"
                                aria-label={`Deactivate ${patient.userId?.firstName || 'patient'}`}
                                className="p-2 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={pagination.limit}
              onPageChange={(nextPage) => setPagination((prev) => ({ ...prev, page: nextPage }))}
            />
          </>
        )}
      </Card>
    </div>
  );
}
