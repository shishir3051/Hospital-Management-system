import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { appointmentsApi, doctorsApi } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import {
  PageHeader,
  Card,
  Button,
  Input,
  Select,
  StatusBadge,
  LoadingSpinner,
  ErrorAlert,
  EmptyState,
  Pagination,
  useToast,
  useConfirm
} from '../../components/ui';
import { formatDate, formatTime } from '../../config/site';
import {
  Plus,
  Calendar,
  Eye,
  CheckCircle2,
  XCircle,
  Edit3,
  X
} from 'lucide-react';

export default function Appointments() {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();

  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ status: '', doctorId: '', date: '' });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 15 });

  const canBook = ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PATIENT'].includes(user?.role);
  const canUpdateStatus = ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'].includes(user?.role);
  const isStaff = ['ADMIN', 'NURSE', 'ACCOUNTANT', 'RECEPTIONIST'].includes(user?.role);

  useEffect(() => {
    if (!isStaff) return;
    doctorsApi
      .getAll({ limit: 100 })
      .then((res) => setDoctors(res.doctors || []))
      .catch(() => {});
  }, [isStaff]);

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await appointmentsApi.getAll({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });
      setAppointments(res.appointments || []);
      setPagination((prev) => ({
        ...prev,
        page: res.page || 1,
        totalPages: res.totalPages || 1,
        total: res.total || 0
      }));
    } catch (err) {
      setError(err.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleStatusChange = async (aptId, nextStatus) => {
    try {
      await appointmentsApi.updateStatus(aptId, nextStatus);
      toast.success(`Appointment marked as ${nextStatus.replace('_', ' ').toLowerCase()}.`);
      loadAppointments();
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const handleCancel = async (apt) => {
    const accepted = await confirm({
      title: 'Cancel Appointment',
      message: `Cancel this appointment scheduled for ${formatDate(apt.dateTime)} at ${formatTime(apt.dateTime)}? Any associated unpaid invoice will also be voided.`,
      confirmLabel: 'Cancel Appointment',
      variant: 'danger'
    });
    if (!accepted) return;

    try {
      await appointmentsApi.delete(apt._id);
      toast.success('Appointment cancelled.');
      loadAppointments();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel appointment');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Appointments Schedule"
        subtitle={
          user?.role === 'PATIENT'
            ? 'Review upcoming consultations, reschedule visits, or book a new specialist.'
            : 'Manage clinical bookings, check-in workflow, and consultation statuses.'
        }
        actions={
          canBook && (
            <Link to={user?.role === 'PATIENT' ? '/appointment' : '/dashboard/appointments/new'}>
              <Button variant="primary" size="sm">
                <Plus className="w-4 h-4" aria-hidden="true" />
                Book Appointment
              </Button>
            </Link>
          )
        }
      />

      <Card padding="p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <Select
            aria-label="Filter by status"
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="md:w-48"
          >
            <option value="">All Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="NO_SHOW">No Show</option>
          </Select>

          {isStaff && (
            <Select
              aria-label="Filter by physician"
              value={filters.doctorId}
              onChange={(e) => updateFilter('doctorId', e.target.value)}
              className="md:w-64"
            >
              <option value="">All Physicians</option>
              {doctors.map((doc) => (
                <option key={doc._id} value={doc._id}>
                  Dr. {doc.userId?.firstName} {doc.userId?.lastName} ({doc.department})
                </option>
              ))}
            </Select>
          )}

          <Input
            type="date"
            aria-label="Filter by date"
            value={filters.date}
            onChange={(e) => updateFilter('date', e.target.value)}
            className="md:w-48"
          />

          {(filters.status || filters.doctorId || filters.date) && (
            <Button
              variant="ghost"
              onClick={() => {
                setFilters({ status: '', doctorId: '', date: '' });
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              <X className="w-4 h-4" />
              Reset
            </Button>
          )}
        </div>
      </Card>

      {error && <ErrorAlert message={error} onRetry={loadAppointments} />}

      <Card padding="p-0" className="overflow-hidden">
        {loading ? (
          <LoadingSpinner label="Loading appointments..." />
        ) : appointments.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No appointments found"
            description="No visits match your current filter selection."
            action={
              canBook && (
                <Link to={user?.role === 'PATIENT' ? '/appointment' : '/dashboard/appointments/new'}>
                  <Button variant="primary" size="sm">
                    <Plus className="w-4 h-4" />
                    Schedule Visit
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
                      Date &amp; Time
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Patient
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Physician
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Type &amp; Reason
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Status
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-600 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {appointments.map((apt) => {
                    const isActive = ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'].includes(apt.status);
                    const canCancel =
                      apt.status !== 'COMPLETED' &&
                      apt.status !== 'CANCELLED' &&
                      ['ADMIN', 'DOCTOR', 'NURSE', 'PATIENT'].includes(user?.role);
                    const canReschedule =
                      ['SCHEDULED', 'CONFIRMED'].includes(apt.status) &&
                      ['ADMIN', 'DOCTOR', 'NURSE', 'PATIENT'].includes(user?.role);

                    return (
                      <tr key={apt._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <p className="font-semibold text-slate-900 tabular-nums">{formatDate(apt.dateTime)}</p>
                          <p className="text-xs font-mono text-primary-800">{formatTime(apt.dateTime)}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-slate-900">
                            {apt.patientId?.userId?.firstName} {apt.patientId?.userId?.lastName}
                          </p>
                          <p className="text-xs text-slate-600">{apt.patientId?.userId?.phone || ''}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-slate-900">
                            Dr. {apt.doctorId?.userId?.firstName} {apt.doctorId?.userId?.lastName}
                          </p>
                          <p className="text-xs text-slate-600">{apt.doctorId?.department}</p>
                        </td>
                        <td className="px-5 py-3.5 max-w-[240px]">
                          <p className="text-xs font-semibold text-slate-700 capitalize">
                            {apt.type?.toLowerCase()}
                          </p>
                          <p className="text-xs text-slate-600 truncate">{apt.reason}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={apt.status} />
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <Link
                              to={`/dashboard/appointments/${apt._id}`}
                              title="View details"
                              aria-label="View appointment details"
                              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            {canUpdateStatus && isActive && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleStatusChange(
                                    apt._id,
                                    apt.status === 'SCHEDULED' ? 'CONFIRMED' : 'COMPLETED'
                                  )
                                }
                                title={apt.status === 'SCHEDULED' ? 'Confirm visit' : 'Mark completed'}
                                aria-label={apt.status === 'SCHEDULED' ? 'Confirm visit' : 'Mark completed'}
                                className="p-2 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}
                            {canReschedule && (
                              <Link
                                to={`/dashboard/appointments/new?edit=${apt._id}`}
                                title="Reschedule"
                                aria-label="Reschedule appointment"
                                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                              >
                                <Edit3 className="w-4 h-4" />
                              </Link>
                            )}
                            {canCancel && (
                              <button
                                type="button"
                                onClick={() => handleCancel(apt)}
                                title="Cancel appointment"
                                aria-label="Cancel appointment"
                                className="p-2 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-200"
                              >
                                <XCircle className="w-4 h-4" />
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
