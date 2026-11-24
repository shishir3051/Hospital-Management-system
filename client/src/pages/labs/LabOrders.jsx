import { useState, useEffect, useCallback } from 'react';
import { labsApi, patientsApi } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import {
  PageHeader,
  Card,
  StatCard,
  Button,
  Input,
  Select,
  Textarea,
  Badge,
  StatusBadge,
  BrandLogo,
  Modal,
  LoadingSpinner,
  ErrorAlert,
  EmptyState,
  Pagination,
  useToast
} from '../../components/ui';
import { SITE, formatCurrency, formatDate, formatDateTime, formatShortId } from '../../config/site';
import {
  FlaskConical,
  Plus,
  Printer,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Trash2
} from 'lucide-react';

function createParamRow(initial = {}) {
  return {
    rowId: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    parameter: initial.parameter || '',
    value: initial.value || '',
    unit: initial.unit || '',
    referenceRange: initial.referenceRange || '',
    flag: initial.flag || 'NORMAL'
  };
}

const FLAG_TONES = {
  NORMAL: 'success',
  LOW: 'warning',
  HIGH: 'warning',
  CRITICAL: 'danger'
};

export default function LabOrders() {
  const { user } = useAuth();
  const toast = useToast();

  const [orders, setOrders] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 20 });

  // Order creation modal
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [orderForm, setOrderForm] = useState({
    patientId: '',
    testName: '',
    category: 'HEMATOLOGY',
    priority: 'ROUTINE',
    price: 45,
    clinicalNotes: ''
  });

  // Result entry modal
  const [resultTarget, setResultTarget] = useState(null);
  const [resultRows, setResultRows] = useState([createParamRow()]);
  const [resultSummary, setResultSummary] = useState('');
  const [savingResults, setSavingResults] = useState(false);

  // Printable report modal
  const [reportTarget, setReportTarget] = useState(null);

  const canOrder = ['ADMIN', 'DOCTOR'].includes(user?.role);
  const canProcess = ['ADMIN', 'LAB_TECH', 'NURSE'].includes(user?.role);
  const canPublishResults = ['ADMIN', 'LAB_TECH', 'DOCTOR'].includes(user?.role);
  const isPatient = user?.role === 'PATIENT';

  useEffect(() => {
    if (isPatient) return;
    labsApi
      .getCatalog()
      .then((res) => setCatalog(res.catalog || []))
      .catch(() => {});
    if (canOrder) {
      patientsApi
        .getAll({ limit: 100 })
        .then((res) => setPatients(res.patients || []))
        .catch(() => {});
    }
  }, [isPatient, canOrder]);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await labsApi.getAll({
        status: statusFilter,
        priority: priorityFilter,
        page: pagination.page,
        limit: pagination.limit
      });
      setOrders(res.orders || []);
      setPagination((prev) => ({
        ...prev,
        page: res.page || 1,
        totalPages: res.totalPages || 1,
        total: res.total || 0
      }));
    } catch (err) {
      setError(err.message || 'Failed to load diagnostic lab orders');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, pagination.page, pagination.limit]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleCatalogPick = (testName) => {
    const preset = catalog.find((c) => c.testName === testName);
    if (preset) {
      setOrderForm((prev) => ({
        ...prev,
        testName: preset.testName,
        category: preset.category,
        price: preset.price
      }));
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await labsApi.create(orderForm);
      toast.success('Lab test ordered and billed automatically.');
      setOrderModalOpen(false);
      setOrderForm({
        patientId: '',
        testName: '',
        category: 'HEMATOLOGY',
        priority: 'ROUTINE',
        price: 45,
        clinicalNotes: ''
      });
      loadOrders();
    } catch (err) {
      toast.error(err.message || 'Failed to create lab order');
    } finally {
      setCreating(false);
    }
  };

  const handleStatusStep = async (orderId, nextStatus) => {
    try {
      await labsApi.updateStatus(orderId, nextStatus);
      toast.success(`Order updated to ${nextStatus.replace('_', ' ').toLowerCase()}.`);
      loadOrders();
    } catch (err) {
      toast.error(err.message || 'Status update failed');
    }
  };

  const openResultsModal = (order) => {
    setResultTarget(order);
    setResultSummary(order.summary || '');
    if (Array.isArray(order.results) && order.results.length > 0) {
      setResultRows(order.results.map((r) => createParamRow(r)));
    } else {
      const preset = catalog.find((c) => c.testName === order.testName);
      if (preset?.parameters?.length) {
        setResultRows(preset.parameters.map((p) => createParamRow(p)));
      } else {
        setResultRows([createParamRow({ parameter: order.testName })]);
      }
    }
  };

  const handlePublishResults = async (e) => {
    e.preventDefault();
    setSavingResults(true);
    try {
      const results = resultRows.map(({ rowId: _r, ...rest }) => rest);
      await labsApi.submitResults(resultTarget._id, { results, summary: resultSummary.trim() });
      toast.success('Lab results published and patient notified.');
      setResultTarget(null);
      loadOrders();
    } catch (err) {
      toast.error(err.message || 'Failed to publish lab results');
    } finally {
      setSavingResults(false);
    }
  };

  const pendingCount = orders.filter((o) => ['ORDERED', 'SAMPLE_COLLECTED', 'IN_PROGRESS'].includes(o.status)).length;
  const completedCount = orders.filter((o) => o.status === 'COMPLETED').length;
  const statCount = orders.filter((o) => ['URGENT', 'STAT'].includes(o.priority) && o.status !== 'COMPLETED').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title={isPatient ? 'My Lab & Diagnostic Reports' : 'Laboratory & Diagnostics (LIS)'}
        subtitle={
          isPatient
            ? 'Review published diagnostic test results, reference ranges, and print official reports.'
            : 'Order diagnostic panels, track sample collection, and publish verified lab results.'
        }
        actions={
          canOrder && (
            <Button variant="primary" size="sm" onClick={() => setOrderModalOpen(true)}>
              <Plus className="w-4 h-4" aria-hidden="true" />
              Order Lab Test
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Pending / Active Orders" value={pendingCount} icon={Clock} tone="warning" />
        <StatCard label="Urgent / STAT Queue" value={statCount} icon={AlertTriangle} tone="danger" />
        <StatCard label="Completed Reports" value={completedCount} icon={CheckCircle2} tone="success" />
      </div>

      <Card padding="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Select
            aria-label="Filter lab orders by status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="sm:w-52"
          >
            <option value="">All Statuses</option>
            <option value="ORDERED">Ordered</option>
            <option value="SAMPLE_COLLECTED">Sample Collected</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>

          <Select
            aria-label="Filter lab orders by priority"
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="sm:w-44"
          >
            <option value="">All Priorities</option>
            <option value="ROUTINE">Routine</option>
            <option value="URGENT">Urgent</option>
            <option value="STAT">STAT (Immediate)</option>
          </Select>
        </div>
      </Card>

      {error && <ErrorAlert message={error} onRetry={loadOrders} />}

      <Card padding="p-0" className="overflow-hidden">
        {loading ? (
          <LoadingSpinner label="Loading laboratory queue..." />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={FlaskConical}
            title="No diagnostic lab orders"
            description={
              isPatient
                ? 'Your laboratory test results will appear here once ordered and completed.'
                : 'Order a new diagnostic test to begin tracking samples and results.'
            }
            action={
              canOrder && (
                <Button variant="primary" size="sm" onClick={() => setOrderModalOpen(true)}>
                  <Plus className="w-4 h-4" />
                  Order First Test
                </Button>
              )
            }
          />
        ) : (
          <>
            <div className="divide-y divide-slate-200">
              {orders.map((order) => (
                <div
                  key={order._id}
                  className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-primary-800">
                        {formatShortId(order._id, 'LAB-')}
                      </span>
                      <StatusBadge status={order.status} />
                      <Badge tone={order.priority === 'STAT' ? 'danger' : order.priority === 'URGENT' ? 'warning' : 'neutral'}>
                        {order.priority}
                      </Badge>
                      <Badge tone="secondary">{order.category}</Badge>
                    </div>
                    <h2 className="text-base font-display font-bold text-slate-900">{order.testName}</h2>
                    <p className="text-xs text-slate-600">
                      Patient:{' '}
                      <strong className="text-slate-900">
                        {order.patientId?.userId?.firstName} {order.patientId?.userId?.lastName}
                      </strong>{' '}
                      · Ordered {formatDateTime(order.createdAt)} · Fee:{' '}
                      <span className="font-semibold text-slate-900 tabular-nums">{formatCurrency(order.price)}</span>
                    </p>
                    {order.clinicalNotes && (
                      <p className="text-xs text-slate-600">Note: {order.clinicalNotes}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {canProcess && order.status === 'ORDERED' && (
                      <Button variant="outline" size="sm" onClick={() => handleStatusStep(order._id, 'SAMPLE_COLLECTED')}>
                        Collect Sample
                      </Button>
                    )}
                    {canProcess && order.status === 'SAMPLE_COLLECTED' && (
                      <Button variant="outline" size="sm" onClick={() => handleStatusStep(order._id, 'IN_PROGRESS')}>
                        Start Analysis
                      </Button>
                    )}
                    {canPublishResults && order.status !== 'CANCELLED' && (
                      <Button
                        variant={order.status === 'COMPLETED' ? 'outline' : 'primary'}
                        size="sm"
                        onClick={() => openResultsModal(order)}
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        {order.status === 'COMPLETED' ? 'Edit Results' : 'Enter Results'}
                      </Button>
                    )}
                    {order.status === 'COMPLETED' && (
                      <Button variant="secondary" size="sm" onClick={() => setReportTarget(order)}>
                        <Printer className="w-3.5 h-3.5" />
                        View / Print Report
                      </Button>
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

      {/* Order Lab Test Modal */}
      <Modal
        open={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        title="Order Diagnostic Lab Test"
        subtitle="Select a standard catalog panel or enter a custom test. An invoice is automatically created."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <Select
            label="Patient"
            value={orderForm.patientId}
            onChange={(e) => setOrderForm({ ...orderForm, patientId: e.target.value })}
            required
          >
            <option value="">Select patient</option>
            {patients.map((p) => (
              <option key={p._id} value={p._id}>
                {p.userId?.firstName} {p.userId?.lastName} ({p.userId?.email})
              </option>
            ))}
          </Select>

          <Select
            label="Standard Test Preset (Optional)"
            value={catalog.some((c) => c.testName === orderForm.testName) ? orderForm.testName : ''}
            onChange={(e) => handleCatalogPick(e.target.value)}
          >
            <option value="">Choose from hospital lab catalog...</option>
            {catalog.map((item) => (
              <option key={item.testName} value={item.testName}>
                {item.testName} — {formatCurrency(item.price)}
              </option>
            ))}
          </Select>

          <Input
            label="Diagnostic Test Name"
            value={orderForm.testName}
            onChange={(e) => setOrderForm({ ...orderForm, testName: e.target.value })}
            placeholder="e.g. Complete Blood Count (CBC)"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Category"
              value={orderForm.category}
              onChange={(e) => setOrderForm({ ...orderForm, category: e.target.value })}
            >
              <option value="HEMATOLOGY">Hematology</option>
              <option value="BIOCHEMISTRY">Biochemistry</option>
              <option value="MICROBIOLOGY">Microbiology</option>
              <option value="IMAGING">Imaging / ECG</option>
              <option value="PATHOLOGY">Pathology</option>
              <option value="URINALYSIS">Urinalysis</option>
            </Select>
            <Select
              label="Priority"
              value={orderForm.priority}
              onChange={(e) => setOrderForm({ ...orderForm, priority: e.target.value })}
            >
              <option value="ROUTINE">Routine</option>
              <option value="URGENT">Urgent</option>
              <option value="STAT">STAT</option>
            </Select>
            <Input
              label="Price (USD $)"
              type="number"
              min="0"
              step="0.01"
              value={orderForm.price}
              onChange={(e) => setOrderForm({ ...orderForm, price: e.target.value })}
              required
            />
          </div>

          <Textarea
            label="Clinical Indication / Notes"
            rows={2}
            value={orderForm.clinicalNotes}
            onChange={(e) => setOrderForm({ ...orderForm, clinicalNotes: e.target.value })}
            placeholder="Fasting required, suspected infection, routine annual screening..."
          />

          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="outline" onClick={() => setOrderModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={creating}>
              Place Lab Order
            </Button>
          </div>
        </form>
      </Modal>

      {/* Enter Lab Results Modal */}
      <Modal
        open={Boolean(resultTarget)}
        onClose={() => setResultTarget(null)}
        title={`Enter Lab Results — ${resultTarget?.testName || ''}`}
        subtitle={`Patient: ${resultTarget?.patientId?.userId?.firstName || ''} ${resultTarget?.patientId?.userId?.lastName || ''}`}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handlePublishResults} className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Measured Parameters</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setResultRows((prev) => [...prev, createParamRow()])}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Row
            </Button>
          </div>

          <div className="space-y-3">
            {resultRows.map((row) => (
              <div
                key={row.rowId}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end p-3 rounded-xl bg-slate-50 border border-slate-200"
              >
                <Input
                  label="Parameter"
                  value={row.parameter}
                  onChange={(e) =>
                    setResultRows((prev) =>
                      prev.map((r) => (r.rowId === row.rowId ? { ...r, parameter: e.target.value } : r))
                    )
                  }
                  className="sm:col-span-3"
                  required
                />
                <Input
                  label="Value"
                  value={row.value}
                  onChange={(e) =>
                    setResultRows((prev) =>
                      prev.map((r) => (r.rowId === row.rowId ? { ...r, value: e.target.value } : r))
                    )
                  }
                  className="sm:col-span-2"
                  required
                />
                <Input
                  label="Unit"
                  value={row.unit}
                  onChange={(e) =>
                    setResultRows((prev) =>
                      prev.map((r) => (r.rowId === row.rowId ? { ...r, unit: e.target.value } : r))
                    )
                  }
                  className="sm:col-span-2"
                />
                <Input
                  label="Ref. Range"
                  value={row.referenceRange}
                  onChange={(e) =>
                    setResultRows((prev) =>
                      prev.map((r) => (r.rowId === row.rowId ? { ...r, referenceRange: e.target.value } : r))
                    )
                  }
                  className="sm:col-span-2"
                />
                <Select
                  label="Flag"
                  value={row.flag}
                  onChange={(e) =>
                    setResultRows((prev) =>
                      prev.map((r) => (r.rowId === row.rowId ? { ...r, flag: e.target.value } : r))
                    )
                  }
                  className="sm:col-span-2"
                >
                  <option value="NORMAL">Normal</option>
                  <option value="LOW">Low</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </Select>
                <div className="sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    disabled={resultRows.length <= 1}
                    onClick={() => setResultRows((prev) => prev.filter((r) => r.rowId !== row.rowId))}
                    aria-label="Remove parameter row"
                    className="h-10 w-10 rounded-lg border border-slate-200 bg-white text-rose-600 hover:bg-rose-50 disabled:opacity-40 flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Textarea
            label="Pathologist / Technician Interpretation"
            rows={3}
            value={resultSummary}
            onChange={(e) => setResultSummary(e.target.value)}
            placeholder="Summary interpretation or clinical follow-up recommendation..."
          />

          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="outline" onClick={() => setResultTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={savingResults}>
              Publish Verified Report
            </Button>
          </div>
        </form>
      </Modal>

      {/* A4 Printable Lab Report Modal */}
      <Modal
        open={Boolean(reportTarget)}
        onClose={() => setReportTarget(null)}
        title="Official Diagnostic Laboratory Report"
        subtitle={reportTarget ? formatShortId(reportTarget._id, 'LAB-') : ''}
        maxWidth="max-w-3xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setReportTarget(null)}>
              Close
            </Button>
            <Button variant="primary" onClick={() => window.print()}>
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </Button>
          </>
        }
      >
        {reportTarget && (
          <div className="print-sheet space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200">
              <BrandLogo subtitle="Clinical Diagnostics Laboratory" />
              <div className="text-xs text-slate-600 sm:text-right">
                <p className="font-semibold text-slate-900">{SITE.name}</p>
                <p>{SITE.address}</p>
                <p>{SITE.appointmentPhone}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 rounded-xl border border-slate-200 p-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase">Patient</p>
                <p className="font-bold text-slate-900">
                  {reportTarget.patientId?.userId?.firstName} {reportTarget.patientId?.userId?.lastName}
                </p>
              </div>
              <div className="sm:text-right">
                <p className="text-xs font-semibold text-slate-600 uppercase">Test &amp; Category</p>
                <p className="font-bold text-slate-900">{reportTarget.testName}</p>
                <p className="text-xs text-slate-600">{reportTarget.category}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase">Completed Date</p>
                <p className="font-medium text-slate-900">
                  {formatDate(reportTarget.completedAt || reportTarget.updatedAt)}
                </p>
              </div>
              <div className="sm:text-right">
                <p className="text-xs font-semibold text-slate-600 uppercase">Verified By</p>
                <p className="font-medium text-slate-900">
                  {reportTarget.completedByUserId
                    ? `${reportTarget.completedByUserId.firstName} ${reportTarget.completedByUserId.lastName}`
                    : 'Laboratory Department'}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5 text-xs font-semibold text-slate-700">Parameter</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-slate-700">Result</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-slate-700">Reference Range</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(reportTarget.results || []).map((r, i) => (
                    <tr key={`${r.parameter}-${i}`}>
                      <td className="px-4 py-3 font-semibold text-slate-900">{r.parameter}</td>
                      <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                        {r.value} {r.unit}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{r.referenceRange || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge tone={FLAG_TONES[r.flag] || 'neutral'}>{r.flag}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {reportTarget.summary && (
              <div className="rounded-xl bg-primary-50/60 border border-primary-100 p-4 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-800">
                  Clinical Interpretation
                </p>
                <p className="mt-1 text-slate-800 whitespace-pre-line">{reportTarget.summary}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
