import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { billingApi } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import {
  PageHeader,
  Card,
  StatCard,
  Button,
  Input,
  Select,
  StatusBadge,
  LoadingSpinner,
  ErrorAlert,
  EmptyState,
  Pagination,
  useToast
} from '../../components/ui';
import { formatCurrency, formatDate, formatShortId, downloadCsv } from '../../config/site';
import {
  Search,
  DollarSign,
  Wallet,
  CheckCircle2,
  Clock,
  Plus,
  Download,
  FileText,
  CreditCard,
  X
} from 'lucide-react';

export default function Billing() {
  const { user } = useAuth();
  const toast = useToast();

  const [bills, setBills] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingAmount: 0,
    paidCount: 0,
    pendingCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 15 });

  const canCreate = ['ADMIN', 'ACCOUNTANT'].includes(user?.role);
  const isPatient = user?.role === 'PATIENT';

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const loadBilling = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [listRes, statsRes] = await Promise.all([
        billingApi.getAll({
          status,
          search: isPatient ? '' : debouncedSearch,
          page: pagination.page,
          limit: pagination.limit
        }),
        billingApi.getStats()
      ]);
      setBills(listRes.bills || []);
      setStats(
        statsRes || { totalRevenue: 0, pendingAmount: 0, paidCount: 0, pendingCount: 0 }
      );
      setPagination((prev) => ({
        ...prev,
        page: listRes.page || 1,
        totalPages: listRes.totalPages || 1,
        total: listRes.total || 0
      }));
    } catch (err) {
      setError(err.message || 'Failed to load billing ledger');
    } finally {
      setLoading(false);
    }
  }, [status, debouncedSearch, isPatient, pagination.page, pagination.limit]);

  useEffect(() => {
    loadBilling();
  }, [loadBilling]);

  const handleExportCsv = () => {
    if (bills.length === 0) {
      toast.info('No invoices to export.');
      return;
    }
    const headers = ['Invoice ID', 'Patient', 'Subtotal (USD)', 'Discount', 'Tax', 'Total (USD)', 'Paid (USD)', 'Status', 'Date'];
    const rows = bills.map((b) => [
      formatShortId(b._id, 'INV-'),
      `${b.patientId?.userId?.firstName || ''} ${b.patientId?.userId?.lastName || ''}`.trim(),
      Number(b.subtotal || 0).toFixed(2),
      Number(b.discount || 0).toFixed(2),
      Number(b.tax || 0).toFixed(2),
      Number(b.total || 0).toFixed(2),
      Number(b.paidAmount || (b.status === 'PAID' ? b.total : 0)).toFixed(2),
      b.status,
      formatDate(b.createdAt)
    ]);
    downloadCsv('healthcore-invoices.csv', headers, rows);
    toast.success(`Exported ${bills.length} invoice records.`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title={isPatient ? 'My Billing & Statements' : 'Financial Ledger & Invoices'}
        subtitle={
          isPatient
            ? 'Review itemized medical statements, download receipts, and settle open balances.'
            : 'Audit hospital invoices, track settled revenue, and manage patient receivables.'
        }
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handleExportCsv}>
              <Download className="w-4 h-4" aria-hidden="true" />
              Export CSV
            </Button>
            {canCreate && (
              <Link to="/dashboard/billing/new">
                <Button variant="primary" size="sm">
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  Create Invoice
                </Button>
              </Link>
            )}
          </>
        }
      />

      {/* Financial KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={isPatient ? 'Total Paid' : 'Collected Revenue'}
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          tone="success"
        />
        <StatCard
          label="Outstanding Balance"
          value={formatCurrency(stats.pendingAmount)}
          icon={Wallet}
          tone="warning"
        />
        <StatCard
          label="Settled Invoices"
          value={(stats.paidCount ?? 0).toLocaleString()}
          icon={CheckCircle2}
          tone="primary"
        />
        <StatCard
          label="Open Invoices"
          value={(stats.pendingCount ?? 0).toLocaleString()}
          icon={Clock}
          tone="danger"
        />
      </div>

      {/* Filters */}
      <Card padding="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {!isPatient && (
            <Input
              icon={Search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by patient name, email, or invoice ID..."
              aria-label="Search invoices"
              className="flex-1"
            />
          )}
          <Select
            aria-label="Filter by payment status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="sm:w-52"
          >
            <option value="">All Payment Statuses</option>
            <option value="UNPAID">Unpaid / Due</option>
            <option value="PARTIAL">Partially Paid</option>
            <option value="PAID">Paid / Settled</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
          {(search || status) && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearch('');
                setStatus('');
              }}
            >
              <X className="w-4 h-4" />
              Reset
            </Button>
          )}
        </div>
      </Card>

      {error && <ErrorAlert message={error} onRetry={loadBilling} />}

      {/* Ledger Table */}
      <Card padding="p-0" className="overflow-hidden">
        {loading ? (
          <LoadingSpinner label="Loading financial ledger..." />
        ) : bills.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No invoices found"
            description="No billing statements match your current filters."
            action={
              canCreate && (
                <Link to="/dashboard/billing/new">
                  <Button variant="primary" size="sm">
                    <Plus className="w-4 h-4" />
                    Create First Invoice
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
                      Invoice ID
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Patient
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Amount
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Status
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Issued Date
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-600 text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {bills.map((bill) => (
                    <tr key={bill._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs font-semibold text-primary-800 whitespace-nowrap">
                        {formatShortId(bill._id, 'INV-')}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-900">
                          {bill.patientId?.userId?.firstName} {bill.patientId?.userId?.lastName}
                        </p>
                        <p className="text-xs text-slate-600 truncate max-w-[220px]">
                          {bill.items?.[0]?.description || 'Medical Services'}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <p className="font-bold text-slate-900 tabular-nums">
                          {formatCurrency(bill.total)}
                        </p>
                        {bill.status === 'PARTIAL' && (
                          <p className="text-xs text-sky-700 tabular-nums">
                            Paid: {formatCurrency(bill.paidAmount)}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={bill.status} />
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                        {formatDate(bill.createdAt)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link to={`/dashboard/billing/${bill._id}`}>
                          <Button variant="outline" size="sm">
                            <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                            {['UNPAID', 'PARTIAL'].includes(bill.status) ? 'View & Pay' : 'Receipt'}
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
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
