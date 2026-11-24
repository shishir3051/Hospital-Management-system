import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { billingApi, patientsApi } from '../../services/api';
import {
  PageHeader,
  Card,
  Button,
  Input,
  Select,
  Textarea,
  LoadingSpinner,
  ErrorAlert,
  useToast
} from '../../components/ui';
import { SITE, formatCurrency, toLocalDateInput } from '../../config/site';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';

function createLineItem() {
  return {
    rowId: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    description: '',
    quantity: 1,
    unitPrice: 100
  };
}

export default function BillingForm() {
  const navigate = useNavigate();
  const toast = useToast();

  const [patients, setPatients] = useState([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const defaultDue = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const [patientId, setPatientId] = useState('');
  const [dueDate, setDueDate] = useState(toLocalDateInput(defaultDue));
  const [discount, setDiscount] = useState(0);
  const [taxRatePct, setTaxRatePct] = useState(Math.round(SITE.defaultTaxRate * 100));
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([createLineItem()]);

  useEffect(() => {
    patientsApi
      .getAll({ limit: 100 })
      .then((res) => setPatients(res.patients || []))
      .catch((err) => setError(err.message || 'Failed to load patients'))
      .finally(() => setLoadingInit(false));
  }, []);

  const updateItem = (rowId, field, value) => {
    setItems((prev) =>
      prev.map((item) => (item.rowId === rowId ? { ...item, [field]: value } : item))
    );
  };

  const removeItem = (rowId) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((item) => item.rowId !== rowId));
  };

  const subtotal = items.reduce(
    (sum, item) => sum + Math.max(0, Number(item.quantity || 0) * Number(item.unitPrice || 0)),
    0
  );
  const numericDiscount = Math.max(0, Number(discount || 0));
  const taxable = Math.max(0, subtotal - numericDiscount);
  const tax = taxable * (Math.max(0, Number(taxRatePct || 0)) / 100);
  const grandTotal = taxable + tax;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!patientId) {
      setError('Please select a patient.');
      return;
    }
    if (numericDiscount > subtotal) {
      setError('Discount cannot exceed invoice subtotal.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        patientId,
        dueDate,
        discount: numericDiscount,
        taxRate: Math.max(0, Math.min(100, Number(taxRatePct || 0))) / 100,
        notes: notes.trim(),
        items: items.map(({ description, quantity, unitPrice }) => ({
          description: description.trim(),
          quantity: Number(quantity),
          unitPrice: Number(unitPrice)
        }))
      };
      const res = await billingApi.create(payload);
      toast.success('Invoice created successfully.');
      navigate(`/dashboard/billing/${res.bill?._id || ''}`);
    } catch (err) {
      setError(err.message || 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInit) return <LoadingSpinner label="Preparing invoice builder..." />;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      <PageHeader
        breadcrumb={
          <Link
            to="/dashboard/billing"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-primary-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            Back to Billing Ledger
          </Link>
        }
        title="Create Medical Invoice"
        subtitle="Generate an itemized USD statement with automated tax calculation."
      />

      {error && <ErrorAlert message={error} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="space-y-4">
          <h2 className="text-base font-display font-bold text-slate-900">Invoice Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Patient"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              required
            >
              <option value="">Select patient account</option>
              {patients.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.userId?.firstName} {p.userId?.lastName} ({p.userId?.email})
                </option>
              ))}
            </Select>
            <Input
              label="Payment Due Date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-display font-bold text-slate-900">Line Items</h2>
            <Button variant="outline" size="sm" onClick={() => setItems((prev) => [...prev, createLineItem()])}>
              <Plus className="w-4 h-4" />
              Add Service
            </Button>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.rowId}
                className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end p-3.5 rounded-xl bg-slate-50 border border-slate-200"
              >
                <Input
                  label="Description"
                  value={item.description}
                  onChange={(e) => updateItem(item.rowId, 'description', e.target.value)}
                  placeholder="e.g. Specialist Consultation, Comprehensive Blood Panel"
                  className="sm:col-span-6"
                  required
                />
                <Input
                  label="Qty"
                  type="number"
                  min="1"
                  max="1000"
                  value={item.quantity}
                  onChange={(e) => updateItem(item.rowId, 'quantity', e.target.value)}
                  className="sm:col-span-2"
                  required
                />
                <Input
                  label="Unit Price ($)"
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(item.rowId, 'unitPrice', e.target.value)}
                  className="sm:col-span-3"
                  required
                />
                <div className="sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeItem(item.rowId)}
                    disabled={items.length <= 1}
                    aria-label="Remove line item"
                    className="h-10 w-10 rounded-lg border border-slate-200 bg-white text-rose-600 hover:bg-rose-50 disabled:opacity-40 flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Discount (USD $)"
                type="number"
                step="0.01"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
              <Input
                label="Tax Rate (%)"
                type="number"
                step="0.5"
                min="0"
                max="100"
                value={taxRatePct}
                onChange={(e) => setTaxRatePct(e.target.value)}
              />
            </div>
            <Textarea
              label="Invoice Notes (Optional)"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Insurance reference, payment terms, or billing instructions..."
            />
          </div>

          <div className="lg:col-span-5 rounded-xl bg-slate-50 border border-slate-200 p-5 space-y-2.5 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">
              Summary Preview
            </p>
            <div className="flex justify-between text-slate-700">
              <span>Subtotal</span>
              <span className="font-semibold tabular-nums">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-emerald-700">
              <span>Discount</span>
              <span className="font-semibold tabular-nums">-{formatCurrency(numericDiscount)}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Tax ({taxRatePct}%)</span>
              <span className="font-semibold tabular-nums">{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between text-base font-display font-bold text-slate-900 pt-2.5 border-t border-slate-200">
              <span>Total Due</span>
              <span className="tabular-nums">{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate('/dashboard/billing')}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            <Save className="w-4 h-4" />
            Issue Invoice
          </Button>
        </div>
      </form>
    </div>
  );
}
