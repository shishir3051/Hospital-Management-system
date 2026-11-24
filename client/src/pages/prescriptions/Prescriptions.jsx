import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { prescriptionsApi } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import {
  PageHeader,
  Card,
  Button,
  Select,
  Badge,
  StatusBadge,
  LoadingSpinner,
  ErrorAlert,
  EmptyState,
  Pagination,
  PrintablePrescriptionModal,
  useToast,
  useConfirm
} from '../../components/ui';
import { formatDate, formatShortId } from '../../config/site';
import { Plus, FileText, Pill, Edit3, Trash2, Printer } from 'lucide-react';

export default function Prescriptions() {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();

  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 15 });
  const [selectedRx, setSelectedRx] = useState(null);

  const canPrescribe = ['ADMIN', 'DOCTOR'].includes(user?.role);

  const loadPrescriptions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await prescriptionsApi.getAll({
        status,
        page: pagination.page,
        limit: pagination.limit
      });
      setPrescriptions(res.prescriptions || []);
      setPagination((prev) => ({
        ...prev,
        page: res.page || 1,
        totalPages: res.totalPages || 1,
        total: res.total || 0
      }));
    } catch (err) {
      setError(err.message || 'Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  }, [status, pagination.page, pagination.limit]);

  useEffect(() => {
    loadPrescriptions();
  }, [loadPrescriptions]);

  const handleDelete = async (rx) => {
    const accepted = await confirm({
      title: 'Delete Prescription',
      message: `Delete prescription ${formatShortId(rx._id, 'RX-')} (${rx.diagnosis})?`,
      confirmLabel: 'Delete',
      variant: 'danger'
    });
    if (!accepted) return;

    try {
      await prescriptionsApi.delete(rx._id);
      toast.success('Prescription deleted.');
      loadPrescriptions();
    } catch (err) {
      toast.error(err.message || 'Failed to delete prescription');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Digital Prescriptions (Rx)"
        subtitle={
          user?.role === 'PATIENT'
            ? 'Access and print your official electronic prescriptions and dosage schedules.'
            : 'Issue, update, and print official medication regimens.'
        }
        actions={
          canPrescribe && (
            <Link to="/dashboard/prescriptions/new">
              <Button variant="primary" size="sm">
                <Plus className="w-4 h-4" aria-hidden="true" />
                Write Prescription
              </Button>
            </Link>
          )
        }
      />

      <Card padding="p-4">
        <div className="flex items-center gap-3">
          <Select
            aria-label="Filter prescriptions by status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="w-52"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
        </div>
      </Card>

      {error && <ErrorAlert message={error} onRetry={loadPrescriptions} />}

      <Card padding="p-0" className="overflow-hidden">
        {loading ? (
          <LoadingSpinner label="Loading prescriptions..." />
        ) : prescriptions.length === 0 ? (
          <EmptyState
            icon={Pill}
            title="No prescriptions found"
            description="Official digital prescriptions will appear here once issued by a physician."
            action={
              canPrescribe && (
                <Link to="/dashboard/prescriptions/new">
                  <Button variant="primary" size="sm">
                    <Plus className="w-4 h-4" />
                    Issue First Prescription
                  </Button>
                </Link>
              )
            }
          />
        ) : (
          <>
            <div className="divide-y divide-slate-200">
              {prescriptions.map((rx) => {
                const canModify =
                  user?.role === 'ADMIN' ||
                  (user?.role === 'DOCTOR' && user?.profile?._id === rx.doctorId?._id);
                return (
                  <div
                    key={rx._id}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-primary-800">
                          {formatShortId(rx._id, 'RX-')}
                        </span>
                        <StatusBadge status={rx.status || 'ACTIVE'} />
                        <Badge tone="neutral">{(rx.medications || []).length} medications</Badge>
                      </div>
                      <h2 className="text-base font-display font-bold text-slate-900">
                        {rx.diagnosis}
                      </h2>
                      <p className="text-xs text-slate-600">
                        Patient:{' '}
                        <strong className="text-slate-800">
                          {rx.patientId?.userId?.firstName} {rx.patientId?.userId?.lastName}
                        </strong>{' '}
                        · Physician:{' '}
                        <strong className="text-slate-800">
                          Dr. {rx.doctorId?.userId?.firstName} {rx.doctorId?.userId?.lastName}
                        </strong>{' '}
                        · Issued {formatDate(rx.issuedDate || rx.createdAt)}
                      </p>
                      {(rx.medications || []).length > 0 && (
                        <p className="text-xs text-slate-600 truncate">
                          Rx: {rx.medications.map((m) => `${m.name} (${m.dosage})`).join(', ')}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => setSelectedRx(rx)}>
                        <Printer className="w-3.5 h-3.5" aria-hidden="true" />
                        View / Print
                      </Button>
                      {canModify && (
                        <>
                          <Link
                            to={`/dashboard/prescriptions/${rx._id}/edit`}
                            aria-label="Edit prescription"
                            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(rx)}
                            aria-label="Delete prescription"
                            className="p-2 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
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

      <PrintablePrescriptionModal
        prescription={selectedRx}
        open={Boolean(selectedRx)}
        onClose={() => setSelectedRx(null)}
      />
    </div>
  );
}
