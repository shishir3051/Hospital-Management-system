import { useState, useEffect, useCallback } from 'react';
import { pharmacyApi } from '../../services/api';
import {
  PageHeader,
  Card,
  StatCard,
  Button,
  Input,
  Select,
  Badge,
  StatusBadge,
  Modal,
  LoadingSpinner,
  ErrorAlert,
  EmptyState,
  Pagination,
  useToast,
  useConfirm
} from '../../components/ui';
import { formatCurrency, formatDate, formatShortId, toLocalDateInput } from '../../config/site';
import {
  Pill,
  Package,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Search,
  Edit3,
  Trash2,
  Clock
} from 'lucide-react';

const CATEGORIES = [
  'ANTIBIOTIC',
  'ANALGESIC',
  'CARDIOVASCULAR',
  'DIABETES',
  'RESPIRATORY',
  'GASTROINTESTINAL',
  'VITAMIN',
  'OTHER'
];

const FORMS = ['TABLET', 'CAPSULE', 'SYRUP', 'INJECTION', 'OINTMENT', 'INHALER', 'DROPS'];

export default function Pharmacy() {
  const toast = useToast();
  const confirm = useConfirm();

  const [tab, setTab] = useState('queue'); // 'queue' | 'inventory'
  const [queue, setQueue] = useState([]);
  const [dispenseFilter, setDispenseFilter] = useState('PENDING');
  const [queuePage, setQueuePage] = useState({ page: 1, totalPages: 1, total: 0, limit: 15 });

  const [medicines, setMedicines] = useState([]);
  const [allMedicines, setAllMedicines] = useState([]);
  const [alerts, setAlerts] = useState({ lowStockCount: 0, outOfStockCount: 0, expiringSoonCount: 0 });
  const [medSearch, setMedSearch] = useState('');
  const [medCategory, setMedCategory] = useState('');
  const [medStatus, setMedStatus] = useState('');
  const [medPage, setMedPage] = useState({ page: 1, totalPages: 1, total: 0, limit: 25 });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dispense modal
  const [dispenseTarget, setDispenseTarget] = useState(null);
  const [dispenseItems, setDispenseItems] = useState([]);
  const [dispenseFee, setDispenseFee] = useState(5);
  const [dispensing, setDispensing] = useState(false);

  // Add / Edit medicine modal
  const [medModalOpen, setMedModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [savingMed, setSavingMed] = useState(false);
  const [medForm, setMedForm] = useState({
    name: '',
    genericName: '',
    category: 'ANTIBIOTIC',
    dosageForm: 'TABLET',
    strength: '',
    batchNumber: '',
    manufacturer: '',
    stockQuantity: 100,
    reorderLevel: 25,
    unitPrice: 12,
    expiryDate: ''
  });

  const loadQueue = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [qRes, mRes] = await Promise.all([
        pharmacyApi.getQueue({
          dispenseStatus: dispenseFilter,
          page: queuePage.page,
          limit: queuePage.limit
        }),
        pharmacyApi.getMedicines({ limit: 100 })
      ]);
      setQueue(qRes.prescriptions || []);
      setQueuePage((prev) => ({
        ...prev,
        page: qRes.page || 1,
        totalPages: qRes.totalPages || 1,
        total: qRes.total || 0
      }));
      setAllMedicines(mRes.medicines || []);
      setAlerts(mRes.alerts || { lowStockCount: 0, outOfStockCount: 0, expiringSoonCount: 0 });
    } catch (err) {
      setError(err.message || 'Failed to load pharmacy dispensing queue');
    } finally {
      setLoading(false);
    }
  }, [dispenseFilter, queuePage.page, queuePage.limit]);

  const loadInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await pharmacyApi.getMedicines({
        search: medSearch.trim(),
        category: medCategory,
        status: medStatus,
        page: medPage.page,
        limit: medPage.limit
      });
      setMedicines(res.medicines || []);
      setAlerts(res.alerts || { lowStockCount: 0, outOfStockCount: 0, expiringSoonCount: 0 });
      setMedPage((prev) => ({
        ...prev,
        page: res.page || 1,
        totalPages: res.totalPages || 1,
        total: res.total || 0
      }));
    } catch (err) {
      setError(err.message || 'Failed to load medicine inventory');
    } finally {
      setLoading(false);
    }
  }, [medSearch, medCategory, medStatus, medPage.page, medPage.limit]);

  useEffect(() => {
    if (tab === 'queue') loadQueue();
    else loadInventory();
  }, [tab, loadQueue, loadInventory]);

  const openDispenseModal = (rx) => {
    setDispenseTarget(rx);
    setDispenseFee(5);
    // Try auto-matching prescribed meds to inventory items by name
    const matched = [];
    for (const med of rx.medications || []) {
      const found = allMedicines.find(
        (inv) =>
          inv.stockQuantity > 0 &&
          (inv.name.toLowerCase().includes(med.name.toLowerCase()) ||
            med.name.toLowerCase().includes(inv.name.toLowerCase()))
      );
      if (found) {
        matched.push({
          rowId: `${Date.now()}-${Math.random()}`,
          medicineId: found._id,
          quantity: 1
        });
      }
    }
    setDispenseItems(matched);
  };

  const handleConfirmDispense = async (e) => {
    e.preventDefault();
    setDispensing(true);
    try {
      const validItems = dispenseItems
        .filter((i) => i.medicineId && Number(i.quantity) > 0)
        .map(({ medicineId, quantity }) => ({ medicineId, quantity: Number(quantity) }));
      const res = await pharmacyApi.dispense(dispenseTarget._id, {
        items: validItems,
        dispenseFee: Number(dispenseFee || 0),
        createBill: true
      });
      toast.success(res.message || 'Prescription dispensed.');
      setDispenseTarget(null);
      loadQueue();
    } catch (err) {
      toast.error(err.message || 'Failed to dispense prescription');
    } finally {
      setDispensing(false);
    }
  };

  const openMedModal = (med = null) => {
    setEditingMed(med);
    if (med) {
      setMedForm({
        name: med.name || '',
        genericName: med.genericName || '',
        category: med.category || 'OTHER',
        dosageForm: med.dosageForm || 'TABLET',
        strength: med.strength || '',
        batchNumber: med.batchNumber || '',
        manufacturer: med.manufacturer || '',
        stockQuantity: med.stockQuantity ?? 0,
        reorderLevel: med.reorderLevel ?? 25,
        unitPrice: med.unitPrice ?? 0,
        expiryDate: med.expiryDate ? toLocalDateInput(med.expiryDate) : ''
      });
    } else {
      setMedForm({
        name: '',
        genericName: '',
        category: 'ANTIBIOTIC',
        dosageForm: 'TABLET',
        strength: '',
        batchNumber: '',
        manufacturer: '',
        stockQuantity: 100,
        reorderLevel: 25,
        unitPrice: 12,
        expiryDate: ''
      });
    }
    setMedModalOpen(true);
  };

  const handleSaveMedicine = async (e) => {
    e.preventDefault();
    setSavingMed(true);
    try {
      const payload = {
        ...medForm,
        stockQuantity: Number(medForm.stockQuantity),
        reorderLevel: Number(medForm.reorderLevel),
        unitPrice: Number(medForm.unitPrice),
        expiryDate: medForm.expiryDate || null
      };
      if (editingMed) {
        await pharmacyApi.updateMedicine(editingMed._id, payload);
        toast.success('Inventory item updated.');
      } else {
        await pharmacyApi.createMedicine(payload);
        toast.success('Medicine added to pharmacy stock.');
      }
      setMedModalOpen(false);
      loadInventory();
    } catch (err) {
      toast.error(err.message || 'Failed to save medicine');
    } finally {
      setSavingMed(false);
    }
  };

  const handleDeleteMedicine = async (med) => {
    const accepted = await confirm({
      title: 'Remove Medicine',
      message: `Remove ${med.name} from the pharmacy inventory?`,
      confirmLabel: 'Remove',
      variant: 'danger'
    });
    if (!accepted) return;

    try {
      await pharmacyApi.deleteMedicine(med._id);
      toast.success('Medicine removed.');
      loadInventory();
    } catch (err) {
      toast.error(err.message || 'Failed to delete medicine');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Hospital Pharmacy & Inventory"
        subtitle="Verify patient allergies, dispense e-prescriptions, manage drug stock, and automate pharmacy billing."
        actions={
          <Button variant="primary" size="sm" onClick={() => openMedModal(null)}>
            <Plus className="w-4 h-4" aria-hidden="true" />
            Add Medicine
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Low Stock Alerts" value={alerts.lowStockCount} icon={AlertTriangle} tone="warning" />
        <StatCard label="Out of Stock" value={alerts.outOfStockCount} icon={Package} tone="danger" />
        <StatCard label="Expiring Within 60 Days" value={alerts.expiringSoonCount} icon={Clock} tone="secondary" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-3" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'queue'}
          onClick={() => setTab('queue')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${
            tab === 'queue'
              ? 'bg-primary-700 text-white'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Pill className="w-4 h-4" />
          Dispensing Queue
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'inventory'}
          onClick={() => setTab('inventory')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${
            tab === 'inventory'
              ? 'bg-primary-700 text-white'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Package className="w-4 h-4" />
          Medicine Inventory
        </button>
      </div>

      {error && <ErrorAlert message={error} onRetry={tab === 'queue' ? loadQueue : loadInventory} />}

      {tab === 'queue' ? (
        <>
          <Card padding="p-4">
            <Select
              aria-label="Filter dispensing queue"
              value={dispenseFilter}
              onChange={(e) => {
                setDispenseFilter(e.target.value);
                setQueuePage((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-52"
            >
              <option value="PENDING">Pending Dispense</option>
              <option value="DISPENSED">Already Dispensed</option>
              <option value="">All Prescriptions</option>
            </Select>
          </Card>

          <Card padding="p-0" className="overflow-hidden">
            {loading ? (
              <LoadingSpinner label="Loading pharmacy queue..." />
            ) : queue.length === 0 ? (
              <EmptyState
                icon={Pill}
                title="Dispensing queue is clear"
                description="No prescriptions match the selected dispensing filter."
              />
            ) : (
              <>
                <div className="divide-y divide-slate-200">
                  {queue.map((rx) => {
                    const allergyText = rx.patientId?.allergies;
                    const hasAllergy = allergyText && allergyText.toLowerCase() !== 'none';
                    const isPending = !rx.dispenseStatus || rx.dispenseStatus === 'PENDING';
                    return (
                      <div key={rx._id} className="p-5 space-y-3">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-semibold text-primary-800">
                                {formatShortId(rx._id, 'RX-')}
                              </span>
                              <StatusBadge status={rx.dispenseStatus || 'PENDING'} />
                              <span className="text-xs text-slate-600">
                                Issued {formatDate(rx.issuedDate || rx.createdAt)}
                              </span>
                            </div>
                            <h2 className="text-base font-display font-bold text-slate-900">
                              {rx.patientId?.userId?.firstName} {rx.patientId?.userId?.lastName}{' '}
                              <span className="text-sm font-normal text-slate-600">— {rx.diagnosis}</span>
                            </h2>
                            <p className="text-xs text-slate-600">
                              Prescribed by Dr. {rx.doctorId?.userId?.firstName} {rx.doctorId?.userId?.lastName}
                            </p>
                          </div>

                          <div className="shrink-0">
                            {isPending ? (
                              <Button variant="primary" size="sm" onClick={() => openDispenseModal(rx)}>
                                <CheckCircle2 className="w-4 h-4" />
                                Dispense &amp; Bill
                              </Button>
                            ) : (
                              <Badge tone="success">
                                Dispensed {rx.dispensedAt ? formatDate(rx.dispensedAt) : ''}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {hasAllergy && (
                          <div className="rounded-lg bg-rose-50 border border-rose-200 px-3.5 py-2 flex items-center gap-2 text-xs font-semibold text-rose-900">
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" aria-hidden="true" />
                            <span>ALLERGY SAFETY ALERT: Patient has documented allergy to {allergyText}</span>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {(rx.medications || []).map((m, idx) => (
                            <div
                              key={`${rx._id}-${m.name}-${idx}`}
                              className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs"
                            >
                              <p className="font-semibold text-slate-900">
                                {m.name} <span className="font-mono text-primary-800">{m.dosage}</span>
                              </p>
                              <p className="text-slate-600">
                                {m.frequency} · {m.duration}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Pagination
                  page={queuePage.page}
                  totalPages={queuePage.totalPages}
                  total={queuePage.total}
                  limit={queuePage.limit}
                  onPageChange={(p) => setQueuePage((prev) => ({ ...prev, page: p }))}
                />
              </>
            )}
          </Card>
        </>
      ) : (
        <>
          <Card padding="p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <Input
                icon={Search}
                value={medSearch}
                onChange={(e) => {
                  setMedSearch(e.target.value);
                  setMedPage((prev) => ({ ...prev, page: 1 }));
                }}
                placeholder="Search medicine name, generic name, or manufacturer..."
                aria-label="Search inventory"
                className="flex-1"
              />
              <Select
                aria-label="Filter by category"
                value={medCategory}
                onChange={(e) => {
                  setMedCategory(e.target.value);
                  setMedPage((prev) => ({ ...prev, page: 1 }));
                }}
                className="md:w-48"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0) + c.slice(1).toLowerCase()}
                  </option>
                ))}
              </Select>
              <Select
                aria-label="Filter by stock status"
                value={medStatus}
                onChange={(e) => {
                  setMedStatus(e.target.value);
                  setMedPage((prev) => ({ ...prev, page: 1 }));
                }}
                className="md:w-44"
              >
                <option value="">All Stock Levels</option>
                <option value="IN_STOCK">In Stock</option>
                <option value="LOW_STOCK">Low Stock</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
              </Select>
            </div>
          </Card>

          <Card padding="p-0" className="overflow-hidden">
            {loading ? (
              <LoadingSpinner label="Loading drug inventory..." />
            ) : medicines.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No medicines in inventory"
                description="Add formulary items to track stock levels, expiry dates, and unit pricing."
                action={
                  <Button variant="primary" size="sm" onClick={() => openMedModal(null)}>
                    <Plus className="w-4 h-4" />
                    Add First Medicine
                  </Button>
                }
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                          Medicine
                        </th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                          Category / Form
                        </th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                          Stock
                        </th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                          Unit Price
                        </th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                          Expiry
                        </th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-sm">
                      {medicines.map((m) => (
                        <tr key={m._id} className="hover:bg-slate-50/70">
                          <td className="px-5 py-3.5">
                            <p className="font-semibold text-slate-900">
                              {m.name} {m.strength && <span className="font-mono text-xs text-primary-800">{m.strength}</span>}
                            </p>
                            <p className="text-xs text-slate-600">
                              {m.genericName || m.manufacturer || 'Standard formulary'}
                            </p>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-slate-700 capitalize">
                            {m.category.toLowerCase()} · {m.dosageForm.toLowerCase()}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 tabular-nums">{m.stockQuantity}</span>
                              <Badge
                                tone={
                                  m.status === 'OUT_OF_STOCK'
                                    ? 'danger'
                                    : m.status === 'LOW_STOCK'
                                    ? 'warning'
                                    : 'success'
                                }
                              >
                                {m.status.replace(/_/g, ' ')}
                              </Badge>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 font-semibold text-slate-900 tabular-nums">
                            {formatCurrency(m.unitPrice)}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                            {m.expiryDate ? formatDate(m.expiryDate) : '—'}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openMedModal(m)}
                                aria-label={`Edit ${m.name}`}
                                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteMedicine(m)}
                                aria-label={`Remove ${m.name}`}
                                className="p-2 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  page={medPage.page}
                  totalPages={medPage.totalPages}
                  total={medPage.total}
                  limit={medPage.limit}
                  onPageChange={(p) => setMedPage((prev) => ({ ...prev, page: p }))}
                />
              </>
            )}
          </Card>
        </>
      )}

      {/* Dispense Prescription Modal */}
      <Modal
        open={Boolean(dispenseTarget)}
        onClose={() => setDispenseTarget(null)}
        title="Dispense Prescription & Deduct Stock"
        subtitle={
          dispenseTarget
            ? `Patient: ${dispenseTarget.patientId?.userId?.firstName || ''} ${dispenseTarget.patientId?.userId?.lastName || ''}`
            : ''
        }
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleConfirmDispense} className="space-y-4">
          {dispenseTarget?.patientId?.allergies &&
            dispenseTarget.patientId.allergies.toLowerCase() !== 'none' && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 flex items-center gap-2 text-xs font-semibold text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                Verify before dispensing — Allergies: {dispenseTarget.patientId.allergies}
              </div>
            )}

          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Link Inventory Items to Deduct (Optional)</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setDispenseItems((prev) => [
                  ...prev,
                  { rowId: `${Date.now()}-${Math.random()}`, medicineId: '', quantity: 1 }
                ])
              }
            >
              <Plus className="w-3.5 h-3.5" />
              Add Stock Item
            </Button>
          </div>

          {dispenseItems.length > 0 && (
            <div className="space-y-2.5">
              {dispenseItems.map((item) => (
                <div
                  key={item.rowId}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end p-3 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <Select
                    label="Inventory Medicine"
                    value={item.medicineId}
                    onChange={(e) =>
                      setDispenseItems((prev) =>
                        prev.map((r) => (r.rowId === item.rowId ? { ...r, medicineId: e.target.value } : r))
                      )
                    }
                    className="sm:col-span-8"
                  >
                    <option value="">Select medicine from stock</option>
                    {allMedicines
                      .filter((m) => m.stockQuantity > 0)
                      .map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.name} {m.strength} — {formatCurrency(m.unitPrice)} (Stock: {m.stockQuantity})
                        </option>
                      ))}
                  </Select>
                  <Input
                    label="Qty"
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      setDispenseItems((prev) =>
                        prev.map((r) => (r.rowId === item.rowId ? { ...r, quantity: e.target.value } : r))
                      )
                    }
                    className="sm:col-span-3"
                  />
                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setDispenseItems((prev) => prev.filter((r) => r.rowId !== item.rowId))}
                      aria-label="Remove item"
                      className="h-10 w-10 rounded-lg border border-slate-200 bg-white text-rose-600 hover:bg-rose-50 flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Input
            label="Dispensing Service Fee (USD $)"
            type="number"
            min="0"
            step="0.5"
            value={dispenseFee}
            onChange={(e) => setDispenseFee(e.target.value)}
          />

          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="outline" onClick={() => setDispenseTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={dispensing}>
              Confirm Dispense &amp; Bill
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add / Edit Medicine Modal */}
      <Modal
        open={medModalOpen}
        onClose={() => setMedModalOpen(false)}
        title={editingMed ? 'Update Medicine Stock' : 'Add Medicine to Formulary'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSaveMedicine} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Brand / Trade Name"
              value={medForm.name}
              onChange={(e) => setMedForm({ ...medForm, name: e.target.value })}
              placeholder="e.g. Amoxil"
              required
            />
            <Input
              label="Generic Name"
              value={medForm.genericName}
              onChange={(e) => setMedForm({ ...medForm, genericName: e.target.value })}
              placeholder="e.g. Amoxicillin"
            />
            <Select
              label="Category"
              value={medForm.category}
              onChange={(e) => setMedForm({ ...medForm, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0) + c.slice(1).toLowerCase()}
                </option>
              ))}
            </Select>
            <Select
              label="Dosage Form"
              value={medForm.dosageForm}
              onChange={(e) => setMedForm({ ...medForm, dosageForm: e.target.value })}
            >
              {FORMS.map((f) => (
                <option key={f} value={f}>
                  {f.charAt(0) + f.slice(1).toLowerCase()}
                </option>
              ))}
            </Select>
            <Input
              label="Strength"
              value={medForm.strength}
              onChange={(e) => setMedForm({ ...medForm, strength: e.target.value })}
              placeholder="e.g. 500 mg"
            />
            <Input
              label="Batch Number"
              value={medForm.batchNumber}
              onChange={(e) => setMedForm({ ...medForm, batchNumber: e.target.value })}
              placeholder="e.g. B2026-44"
            />
            <Input
              label="Stock Quantity"
              type="number"
              min="0"
              value={medForm.stockQuantity}
              onChange={(e) => setMedForm({ ...medForm, stockQuantity: e.target.value })}
              required
            />
            <Input
              label="Reorder Alert Level"
              type="number"
              min="0"
              value={medForm.reorderLevel}
              onChange={(e) => setMedForm({ ...medForm, reorderLevel: e.target.value })}
              required
            />
            <Input
              label="Unit Price (USD $)"
              type="number"
              min="0"
              step="0.01"
              value={medForm.unitPrice}
              onChange={(e) => setMedForm({ ...medForm, unitPrice: e.target.value })}
              required
            />
            <Input
              label="Expiry Date"
              type="date"
              value={medForm.expiryDate}
              onChange={(e) => setMedForm({ ...medForm, expiryDate: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="outline" onClick={() => setMedModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={savingMed}>
              {editingMed ? 'Save Changes' : 'Add to Inventory'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
