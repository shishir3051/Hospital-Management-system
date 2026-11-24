import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { billingApi } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import {
  PageHeader,
  Card,
  Button,
  BrandLogo,
  StatusBadge,
  Input,
  Select,
  Modal,
  LoadingSpinner,
  ErrorAlert,
  useToast
} from '../../components/ui';
import { SITE, formatCurrency, formatDate, formatShortId } from '../../config/site';
import { ArrowLeft, Printer, CreditCard, CheckCircle2 } from 'lucide-react';

export default function BillingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paying, setPaying] = useState(false);

  const isFinanceStaff = ['ADMIN', 'ACCOUNTANT'].includes(user?.role);
  const isOwnerPatient =
    user?.role === 'PATIENT' && user?.profile?._id && bill?.patientId?._id === user.profile._id;
  const canPay =
    (isFinanceStaff || isOwnerPatient) &&
    ['UNPAID', 'PARTIAL'].includes(bill?.status);

  const loadBill = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await billingApi.getById(id);
      setBill(data);
      const alreadyPaid = Number(data.paidAmount || 0);
      const remaining = Math.max(0, Number(data.total || 0) - alreadyPaid);
      setPaymentAmount(remaining.toFixed(2));
    } catch (err) {
      setError(err.message || 'Unable to load invoice');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBill();
  }, [loadBill]);

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    setPaying(true);
    try {
      const amount = isFinanceStaff && paymentAmount ? Number(paymentAmount) : undefined;
      const res = await billingApi.pay(id, paymentMethod, amount);
      toast.success(res.message || 'Payment recorded successfully.');
      setPayModalOpen(false);
      loadBill();
    } catch (err) {
      toast.error(err.message || 'Failed to process payment');
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading invoice statement..." />;

  if (error || !bill) {
    return (
      <div className="space-y-4">
        <ErrorAlert message={error || 'Invoice not found'} onRetry={loadBill} />
        <Button variant="outline" onClick={() => navigate('/dashboard/billing')}>
          <ArrowLeft className="w-4 h-4" />
          Back to Billing
        </Button>
      </div>
    );
  }

  const patientUser = bill.patientId?.userId;
  const alreadyPaid = bill.status === 'PAID' ? Number(bill.total || 0) : Number(bill.paidAmount || 0);
  const remainingBalance = Math.max(0, Number(bill.total || 0) - alreadyPaid);
  const taxPct = Math.round(Number(bill.taxRate ?? SITE.defaultTaxRate) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      <div className="no-print">
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
          title={`Invoice ${formatShortId(bill._id, 'INV-')}`}
          subtitle={`Issued on ${formatDate(bill.createdAt)} · Due ${formatDate(bill.dueDate)}`}
          actions={
            <>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="w-4 h-4" aria-hidden="true" />
                Print / Save PDF
              </Button>
              {canPay && (
                <Button variant="primary" size="sm" onClick={() => setPayModalOpen(true)}>
                  <CreditCard className="w-4 h-4" aria-hidden="true" />
                  Process Payment
                </Button>
              )}
            </>
          }
        />
      </div>

      {/* Printable A4 Invoice Sheet */}
      <Card className="print-sheet p-6 sm:p-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="space-y-2">
            <BrandLogo subtitle={SITE.tagline} />
            <div className="text-xs text-slate-600 space-y-0.5 pt-1">
              <p>{SITE.address}</p>
              <p>{SITE.appointmentPhone} · {SITE.billingEmail}</p>
            </div>
          </div>
          <div className="sm:text-right space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Medical Statement
            </p>
            <p className="text-xl font-display font-bold font-mono text-slate-900">
              {formatShortId(bill._id, 'INV-')}
            </p>
            <StatusBadge status={bill.status} />
          </div>
        </div>

        {/* Bill To & Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">
              Billed To
            </p>
            <p className="text-base font-display font-bold text-slate-900">
              {patientUser ? `${patientUser.firstName} ${patientUser.lastName}` : 'Patient Account'}
            </p>
            {patientUser?.email && <p className="text-slate-600">{patientUser.email}</p>}
            {patientUser?.phone && <p className="text-slate-600">{patientUser.phone}</p>}
          </div>
          <div className="sm:text-right space-y-1">
            <p className="text-slate-600">
              <span className="font-semibold text-slate-800">Invoice Date:</span>{' '}
              {formatDate(bill.createdAt)}
            </p>
            <p className="text-slate-600">
              <span className="font-semibold text-slate-800">Due Date:</span>{' '}
              {formatDate(bill.dueDate)}
            </p>
            {bill.paymentDate && (
              <p className="text-emerald-700 font-medium">
                Paid on {formatDate(bill.paymentDate)} via {bill.paymentMethod}
              </p>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Service Description
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600 text-center">
                  Qty
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600 text-right">
                  Unit Price
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600 text-right">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {(bill.items || []).map((item, idx) => (
                <tr key={`${item.description}-${idx}`}>
                  <td className="px-4 py-3.5 font-medium text-slate-900">{item.description}</td>
                  <td className="px-4 py-3.5 text-center tabular-nums text-slate-700">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums text-slate-700">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-slate-900">
                    {formatCurrency(item.total ?? Number(item.quantity || 1) * Number(item.unitPrice || 0))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex flex-col sm:flex-row justify-between gap-6 pt-2">
          <div className="max-w-sm text-xs text-slate-600 space-y-1">
            {bill.notes && (
              <>
                <p className="font-semibold text-slate-800 uppercase tracking-wide">Notes</p>
                <p>{bill.notes}</p>
              </>
            )}
            <p className="pt-2">
              Questions regarding this statement? Contact {SITE.billingEmail}.
            </p>
          </div>

          <div className="w-full sm:w-72 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="tabular-nums font-medium text-slate-900">
                {formatCurrency(bill.subtotal)}
              </span>
            </div>
            {Number(bill.discount || 0) > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount</span>
                <span className="tabular-nums font-medium">-{formatCurrency(bill.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Tax ({taxPct}%)</span>
              <span className="tabular-nums font-medium text-slate-900">
                {formatCurrency(bill.tax)}
              </span>
            </div>
            <div className="flex justify-between text-base font-display font-bold text-slate-900 pt-2.5 border-t border-slate-200">
              <span>Invoice Total</span>
              <span className="tabular-nums">{formatCurrency(bill.total)}</span>
            </div>
            {alreadyPaid > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Amount Paid</span>
                <span className="tabular-nums">{formatCurrency(alreadyPaid)}</span>
              </div>
            )}
            {remainingBalance > 0 && (
              <div className="flex justify-between text-amber-800 font-bold pt-1">
                <span>Balance Due</span>
                <span className="tabular-nums">{formatCurrency(remainingBalance)}</span>
              </div>
            )}
          </div>
        </div>

        {bill.status === 'PAID' && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3 text-sm text-emerald-900">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" />
            <span>
              <strong>Paid in Full</strong> — Settled via {bill.paymentMethod} on {formatDate(bill.paymentDate)}.
            </span>
          </div>
        )}
      </Card>

      {/* Payment Modal */}
      <Modal
        open={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        title="Process Invoice Payment"
        subtitle={`Remaining balance: ${formatCurrency(remainingBalance)}`}
      >
        <form onSubmit={handleProcessPayment} className="space-y-4">
          <Select
            label="Payment Method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            required
          >
            <option value="CARD">Credit / Debit Card</option>
            <option value="ONLINE">Online Bank Transfer</option>
            {isFinanceStaff && <option value="CASH">Cash (Front Desk)</option>}
            {isFinanceStaff && <option value="INSURANCE">Insurance Settlement</option>}
          </Select>

          {isFinanceStaff && (
            <Input
              label="Payment Amount (USD $)"
              type="number"
              step="0.01"
              min="0.01"
              max={remainingBalance.toFixed(2)}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              hint="Enter a smaller amount to record a partial payment."
              required
            />
          )}

          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="outline" onClick={() => setPayModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={paying}>
              Confirm Payment ({formatCurrency(isFinanceStaff ? paymentAmount : remainingBalance)})
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
