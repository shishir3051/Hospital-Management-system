import { useState, useEffect, useCallback } from 'react';
import { dashboardApi, contactApi } from '../../services/api';
import {
  PageHeader,
  Card,
  Button,
  Select,
  Badge,
  RoleBadge,
  StatusBadge,
  LoadingSpinner,
  ErrorAlert,
  EmptyState,
  Pagination,
  useToast
} from '../../components/ui';
import { formatDateTime } from '../../config/site';
import { ShieldAlert, Mail, CheckCircle2 } from 'lucide-react';

export default function AuditLogs() {
  const toast = useToast();
  const [tab, setTab] = useState('audit'); // 'audit' | 'inquiries'

  const [logs, setLogs] = useState([]);
  const [resourceFilter, setResourceFilter] = useState('');
  const [logPage, setLogPage] = useState({ page: 1, totalPages: 1, total: 0, limit: 25 });

  const [inquiries, setInquiries] = useState([]);
  const [inquiryFilter, setInquiryFilter] = useState('');
  const [inqPage, setInqPage] = useState({ page: 1, totalPages: 1, total: 0, limit: 20 });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAudit = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await dashboardApi.getAuditLogs({
        resourceType: resourceFilter,
        page: logPage.page,
        limit: logPage.limit
      });
      setLogs(res.logs || []);
      setLogPage((prev) => ({
        ...prev,
        page: res.page || 1,
        totalPages: res.totalPages || 1,
        total: res.total || 0
      }));
    } catch (err) {
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [resourceFilter, logPage.page, logPage.limit]);

  const loadInquiries = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await contactApi.getAll({
        status: inquiryFilter,
        page: inqPage.page,
        limit: inqPage.limit
      });
      setInquiries(res.inquiries || []);
      setInqPage((prev) => ({
        ...prev,
        page: res.page || 1,
        totalPages: res.totalPages || 1,
        total: res.total || 0
      }));
    } catch (err) {
      setError(err.message || 'Failed to load contact inquiries');
    } finally {
      setLoading(false);
    }
  }, [inquiryFilter, inqPage.page, inqPage.limit]);

  useEffect(() => {
    if (tab === 'audit') loadAudit();
    else loadInquiries();
  }, [tab, loadAudit, loadInquiries]);

  const handleInquiryStatus = async (id, nextStatus) => {
    try {
      await contactApi.updateStatus(id, nextStatus);
      toast.success(`Inquiry marked as ${nextStatus.toLowerCase()}.`);
      loadInquiries();
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Security Audit Trail & Patient Inquiries"
        subtitle="Monitor sensitive clinical operations, authentication events, and public contact messages."
      />

      <div className="flex gap-2 border-b border-slate-200 pb-3" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'audit'}
          onClick={() => setTab('audit')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${
            tab === 'audit'
              ? 'bg-primary-700 text-white'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Audit Trail
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'inquiries'}
          onClick={() => setTab('inquiries')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${
            tab === 'inquiries'
              ? 'bg-primary-700 text-white'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Mail className="w-4 h-4" />
          Contact Inquiries
        </button>
      </div>

      {error && <ErrorAlert message={error} onRetry={tab === 'audit' ? loadAudit : loadInquiries} />}

      {tab === 'audit' ? (
        <>
          <Card padding="p-4">
            <Select
              aria-label="Filter audit logs by resource"
              value={resourceFilter}
              onChange={(e) => {
                setResourceFilter(e.target.value);
                setLogPage((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-56"
            >
              <option value="">All Resource Types</option>
              <option value="User">Authentication / User</option>
              <option value="Patient">Patients</option>
              <option value="Doctor">Doctors</option>
              <option value="Appointment">Appointments</option>
              <option value="Billing">Billing &amp; Payments</option>
              <option value="Prescription">Prescriptions</option>
            </Select>
          </Card>

          <Card padding="p-0" className="overflow-hidden">
            {loading ? (
              <LoadingSpinner label="Loading audit log..." />
            ) : logs.length === 0 ? (
              <EmptyState
                icon={ShieldAlert}
                title="No audit entries recorded yet"
                description="Authentication, clinical edits, and payment transactions are automatically logged here."
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                          Timestamp
                        </th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                          Actor
                        </th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                          Action
                        </th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                          Resource
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-sm">
                      {logs.map((entry) => (
                        <tr key={entry._id} className="hover:bg-slate-50/70">
                          <td className="px-5 py-3 text-xs text-slate-600 whitespace-nowrap tabular-nums">
                            {formatDateTime(entry.createdAt)}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-900">
                                {entry.actorEmail || 'System'}
                              </span>
                              <RoleBadge role={entry.actorRole} />
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <Badge tone="primary" className="font-mono">
                              {entry.action}
                            </Badge>
                          </td>
                          <td className="px-5 py-3 text-xs text-slate-600 font-mono">
                            {entry.resourceType} {entry.resourceId ? `(${entry.resourceId.slice(-8)})` : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  page={logPage.page}
                  totalPages={logPage.totalPages}
                  total={logPage.total}
                  limit={logPage.limit}
                  onPageChange={(p) => setLogPage((prev) => ({ ...prev, page: p }))}
                />
              </>
            )}
          </Card>
        </>
      ) : (
        <>
          <Card padding="p-4">
            <Select
              aria-label="Filter inquiries by status"
              value={inquiryFilter}
              onChange={(e) => {
                setInquiryFilter(e.target.value);
                setInqPage((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-52"
            >
              <option value="">All Inquiries</option>
              <option value="NEW">New</option>
              <option value="REVIEWED">Reviewed</option>
              <option value="RESOLVED">Resolved</option>
            </Select>
          </Card>

          <Card padding="p-0" className="overflow-hidden">
            {loading ? (
              <LoadingSpinner label="Loading contact inquiries..." />
            ) : inquiries.length === 0 ? (
              <EmptyState
                icon={Mail}
                title="No contact inquiries"
                description="Messages submitted from the public Contact page will appear here."
              />
            ) : (
              <>
                <div className="divide-y divide-slate-200">
                  {inquiries.map((inq) => (
                    <div key={inq._id} className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge status={inq.status} />
                          <span className="text-xs text-slate-600">{formatDateTime(inq.createdAt)}</span>
                        </div>
                        <h3 className="text-base font-display font-bold text-slate-900">{inq.subject}</h3>
                        <p className="text-xs text-slate-600">
                          From <strong className="text-slate-900">{inq.name}</strong> ({inq.email}
                          {inq.phone ? ` · ${inq.phone}` : ''})
                        </p>
                        <p className="text-sm text-slate-700 pt-1 whitespace-pre-line">{inq.message}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {inq.status === 'NEW' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleInquiryStatus(inq._id, 'REVIEWED')}
                          >
                            Mark Reviewed
                          </Button>
                        )}
                        {inq.status !== 'RESOLVED' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleInquiryStatus(inq._id, 'RESOLVED')}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <Pagination
                  page={inqPage.page}
                  totalPages={inqPage.totalPages}
                  total={inqPage.total}
                  limit={inqPage.limit}
                  onPageChange={(p) => setInqPage((prev) => ({ ...prev, page: p }))}
                />
              </>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
