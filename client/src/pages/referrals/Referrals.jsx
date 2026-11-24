import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { referralsApi, patientsApi, doctorsApi } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import {
  PageHeader,
  Card,
  Button,
  Select,
  Textarea,
  Badge,
  StatusBadge,
  Modal,
  LoadingSpinner,
  ErrorAlert,
  EmptyState,
  Pagination,
  useToast
} from '../../components/ui';
import { DEPARTMENTS, formatDate } from '../../config/site';
import { ArrowRightLeft, Plus, Calendar, CheckCircle2, XCircle } from 'lucide-react';

export default function Referrals() {
  const { user } = useAuth();
  const toast = useToast();

  const [referrals, setReferrals] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 20 });

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    targetDepartment: DEPARTMENTS[0],
    toDoctorId: '',
    urgency: 'ROUTINE',
    reason: '',
    clinicalSummary: ''
  });

  const canCreate = ['ADMIN', 'DOCTOR'].includes(user?.role);
  const canUpdateStatus = ['ADMIN', 'DOCTOR', 'RECEPTIONIST'].includes(user?.role);

  useEffect(() => {
    if (!canCreate) return;
    Promise.all([patientsApi.getAll({ limit: 100 }), doctorsApi.getAll({ limit: 100 })])
      .then(([pRes, dRes]) => {
        setPatients(pRes.patients || []);
        setDoctors(dRes.doctors || []);
      })
      .catch(() => {});
  }, [canCreate]);

  const loadReferrals = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await referralsApi.getAll({
        status: statusFilter,
        page: pagination.page,
        limit: pagination.limit
      });
      setReferrals(res.referrals || []);
      setPagination((prev) => ({
        ...prev,
        page: res.page || 1,
        totalPages: res.totalPages || 1,
        total: res.total || 0
      }));
    } catch (err) {
      setError(err.message || 'Failed to load specialist referrals');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, pagination.page, pagination.limit]);

  useEffect(() => {
    loadReferrals();
  }, [loadReferrals]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await referralsApi.create(formData);
      toast.success('Specialist referral created.');
      setCreateOpen(false);
      setFormData({
        patientId: '',
        targetDepartment: DEPARTMENTS[0],
        toDoctorId: '',
        urgency: 'ROUTINE',
        reason: '',
        clinicalSummary: ''
      });
      loadReferrals();
    } catch (err) {
      toast.error(err.message || 'Failed to create referral');
    } finally {
      setCreating(false);
    }
  };

  const handleStatus = async (id, nextStatus) => {
    try {
      await referralsApi.updateStatus(id, nextStatus);
      toast.success(`Referral marked ${nextStatus.toLowerCase()}.`);
      loadReferrals();
    } catch (err) {
      toast.error(err.message || 'Status update failed');
    }
  };

  const deptDoctors = doctors.filter((d) => d.department === formData.targetDepartment);

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Specialist Referrals"
        subtitle="Coordinate cross-department physician referrals and convert accepted referrals into booked consultations."
        actions={
          canCreate && (
            <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4" />
              New Referral
            </Button>
          )
        }
      />

      <Card padding="p-4">
        <Select
          aria-label="Filter referrals by status"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          className="w-52"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="COMPLETED">Completed</option>
          <option value="DECLINED">Declined</option>
        </Select>
      </Card>

      {error && <ErrorAlert message={error} onRetry={loadReferrals} />}

      <Card padding="p-0" className="overflow-hidden">
        {loading ? (
          <LoadingSpinner label="Loading specialist referrals..." />
        ) : referrals.length === 0 ? (
          <EmptyState
            icon={ArrowRightLeft}
            title="No referrals recorded"
            description="Internal specialist-to-specialist patient referrals will appear here."
            action={
              canCreate && (
                <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
                  <Plus className="w-4 h-4" />
                  Create First Referral
                </Button>
              )
            }
          />
        ) : (
          <>
            <div className="divide-y divide-slate-200">
              {referrals.map((ref) => (
                <div key={ref._id} className="p-5 flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={ref.status} />
                      <Badge tone={ref.urgency === 'EMERGENCY' ? 'danger' : ref.urgency === 'URGENT' ? 'warning' : 'neutral'}>
                        {ref.urgency}
                      </Badge>
                      <Badge tone="primary">{ref.targetDepartment}</Badge>
                      <span className="text-xs text-slate-600">{formatDate(ref.createdAt)}</span>
                    </div>
                    <h2 className="text-base font-display font-bold text-slate-900">
                      {ref.patientId?.userId?.firstName} {ref.patientId?.userId?.lastName}
                    </h2>
                    <p className="text-xs text-slate-600">
                      Referred by{' '}
                      <strong>
                        {ref.fromDoctorId?.userId
                          ? `Dr. ${ref.fromDoctorId.userId.firstName} ${ref.fromDoctorId.userId.lastName}`
                          : `${ref.fromUserId?.firstName || 'Staff'} ${ref.fromUserId?.lastName || ''}`}
                      </strong>
                      {ref.toDoctorId?.userId
                        ? ` → Dr. ${ref.toDoctorId.userId.firstName} ${ref.toDoctorId.userId.lastName}`
                        : ` → Any specialist in ${ref.targetDepartment}`}
                    </p>
                    <p className="text-sm text-slate-800 pt-1">{ref.reason}</p>
                    {ref.clinicalSummary && (
                      <p className="text-xs text-slate-600 bg-slate-50 rounded px-3 py-2 border border-slate-200">
                        Clinical summary: {ref.clinicalSummary}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {canUpdateStatus && ref.status === 'PENDING' && (
                      <>
                        <Button variant="primary" size="sm" onClick={() => handleStatus(ref._id, 'ACCEPTED')}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Accept
                        </Button>
                        <Button variant="danger-outline" size="sm" onClick={() => handleStatus(ref._id, 'DECLINED')}>
                          <XCircle className="w-3.5 h-3.5" />
                          Decline
                        </Button>
                      </>
                    )}
                    {['PENDING', 'ACCEPTED'].includes(ref.status) && ref.patientId?._id && (
                      <Link
                        to={
                          user?.role === 'PATIENT'
                            ? `/appointment?department=${encodeURIComponent(ref.targetDepartment)}${ref.toDoctorId?._id ? `&doctorId=${ref.toDoctorId._id}` : ''}`
                            : `/dashboard/appointments/new?patientId=${ref.patientId._id}${ref.toDoctorId?._id ? `&doctorId=${ref.toDoctorId._id}` : ''}`
                        }
                      >
                        <Button variant="outline" size="sm">
                          <Calendar className="w-3.5 h-3.5" />
                          Book Visit
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={pagination.limit}
              onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))}
            />
          </>
        )}
      </Card>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Refer Patient to Specialist"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Select
            label="Patient"
            value={formData.patientId}
            onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
            required
          >
            <option value="">Select patient</option>
            {patients.map((p) => (
              <option key={p._id} value={p._id}>
                {p.userId?.firstName} {p.userId?.lastName} ({p.userId?.email})
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Select
              label="Target Department"
              value={formData.targetDepartment}
              onChange={(e) => setFormData({ ...formData, targetDepartment: e.target.value, toDoctorId: '' })}
              required
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
            <Select
              label="Urgency"
              value={formData.urgency}
              onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
            >
              <option value="ROUTINE">Routine</option>
              <option value="URGENT">Urgent</option>
              <option value="EMERGENCY">Emergency</option>
            </Select>
          </div>

          <Select
            label="Preferred Specialist (Optional)"
            value={formData.toDoctorId}
            onChange={(e) => setFormData({ ...formData, toDoctorId: e.target.value })}
          >
            <option value="">Any available specialist in {formData.targetDepartment}</option>
            {deptDoctors.map((d) => (
              <option key={d._id} value={d._id}>
                Dr. {d.userId?.firstName} {d.userId?.lastName} — {d.specialization}
              </option>
            ))}
          </Select>

          <Textarea
            label="Reason for Referral"
            rows={3}
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            placeholder="Describe suspected diagnosis or specialized evaluation needed..."
            required
          />

          <Textarea
            label="Clinical Summary / Relevant History (Optional)"
            rows={2}
            value={formData.clinicalSummary}
            onChange={(e) => setFormData({ ...formData, clinicalSummary: e.target.value })}
            placeholder="Key vitals, medications tried, or lab findings..."
          />

          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={creating}>
              Submit Referral
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
