import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../../../services/api';
import {
  Card,
  StatCard,
  PageHeader,
  Button,
  Select,
  StatusBadge,
  LoadingSpinner,
  ErrorAlert
} from '../../../components/ui';
import { formatCurrency, formatDateTime } from '../../../config/site';
import {
  Users,
  Stethoscope,
  Calendar,
  DollarSign,
  Plus,
  FileText,
  ShieldAlert,
  ArrowRight,
  Clock
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [period, setPeriod] = useState('6months');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [statsRes, chartsRes] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getCharts(period)
      ]);
      setStats(statsRes);
      setCharts(chartsRes);
    } catch (err) {
      setError(err.message || 'Failed to load executive dashboard data');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading && !stats) return <LoadingSpinner label="Loading hospital operations overview..." />;

  const revenueChartData = {
    labels: (charts?.revenueByMonth || []).map((m) => m.month),
    datasets: [
      {
        label: 'Settled Revenue ($)',
        data: (charts?.revenueByMonth || []).map((m) => m.revenue),
        backgroundColor: '#0F766E',
        borderRadius: 6,
        maxBarThickness: 36
      }
    ]
  };

  const statusObj = charts?.statusCounts || {};
  const statusEntries = [
    { label: 'Scheduled', val: statusObj.SCHEDULED || 0, color: '#D97706' },
    { label: 'Confirmed', val: statusObj.CONFIRMED || 0, color: '#0284C7' },
    { label: 'In Progress', val: statusObj.IN_PROGRESS || 0, color: '#4F46E5' },
    { label: 'Completed', val: statusObj.COMPLETED || 0, color: '#059669' },
    { label: 'Cancelled', val: statusObj.CANCELLED || 0, color: '#E11D48' },
    { label: 'No Show', val: statusObj.NO_SHOW || 0, color: '#64748B' }
  ];
  const totalStatusCount = statusEntries.reduce((sum, s) => sum + s.val, 0);

  const statusChartData = {
    labels: statusEntries.map((s) => s.label),
    datasets: [
      {
        data: statusEntries.map((s) => s.val),
        backgroundColor: statusEntries.map((s) => s.color),
        borderWidth: 2,
        borderColor: '#FFFFFF'
      }
    ]
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Hospital Operations Overview"
        subtitle="Real-time clinical volume, specialist availability, and financial performance."
        actions={
          <>
            <Link to="/dashboard/billing/new">
              <Button variant="outline" size="sm">
                <FileText className="w-4 h-4" aria-hidden="true" />
                New Invoice
              </Button>
            </Link>
            <Link to="/dashboard/appointments/new">
              <Button variant="primary" size="sm">
                <Plus className="w-4 h-4" aria-hidden="true" />
                Book Appointment
              </Button>
            </Link>
          </>
        }
      />

      {error && <ErrorAlert message={error} onRetry={loadData} />}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Patients"
          value={(stats?.totalPatients ?? 0).toLocaleString()}
          subtitle="Registered EHR profiles"
          icon={Users}
          tone="primary"
        />
        <StatCard
          label="Medical Staff"
          value={`${stats?.availableDoctors ?? 0} / ${stats?.totalDoctors ?? 0}`}
          subtitle="Available specialists on roster"
          icon={Stethoscope}
          tone="secondary"
        />
        <StatCard
          label="Today's Visits"
          value={(stats?.todayAppointments ?? 0).toLocaleString()}
          subtitle={`${stats?.scheduledAppointments ?? 0} total upcoming`}
          icon={Calendar}
          tone="warning"
        />
        <StatCard
          label="Monthly Revenue"
          value={formatCurrency(stats?.monthRevenue ?? 0)}
          subtitle={`Outstanding: ${formatCurrency(stats?.pendingAmount ?? 0)}`}
          icon={DollarSign}
          tone="success"
        />
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-base font-display font-bold text-slate-900">Settled Revenue Trend</h2>
              <p className="text-xs text-slate-600">Aggregated paid invoices across selected timeframe</p>
            </div>
            <Select
              aria-label="Select revenue timeframe"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-44"
            >
              <option value="month">Current Month</option>
              <option value="6months">Last 6 Months</option>
              <option value="year">Last 12 Months</option>
            </Select>
          </div>
          <div className="h-72">
            <Bar
              data={revenueChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (v) => `$${Number(v).toLocaleString()}`
                    },
                    grid: { color: '#F1F5F9' }
                  },
                  x: { grid: { display: false } }
                }
              }}
            />
          </div>
        </Card>

        <Card className="lg:col-span-4 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-display font-bold text-slate-900">Appointment Status Mix</h2>
            <p className="text-xs text-slate-600 mb-4">Distribution across all clinical visits</p>
          </div>
          {totalStatusCount === 0 ? (
            <div className="py-16 text-center text-sm text-slate-500">
              No appointment data recorded yet.
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <Doughnut
                data={statusChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '62%',
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: { boxWidth: 10, padding: 12, font: { size: 11 } }
                    }
                  }
                }}
              />
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions + Recent Appointments + Top Doctors */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-7" padding="p-0">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-display font-bold text-slate-900">Recent Appointments</h2>
            <Link
              to="/dashboard/appointments"
              className="text-xs font-semibold text-primary-700 hover:underline inline-flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {(stats?.recentAppointments || []).length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-slate-500">No appointments yet.</p>
            ) : (
              stats.recentAppointments.map((apt) => (
                <Link
                  key={apt._id}
                  to={`/dashboard/appointments/${apt._id}`}
                  className="px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {apt.patientName} <span className="text-slate-400 font-normal">with</span> {apt.doctorName}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                      {formatDateTime(apt.dateTime)}
                    </p>
                  </div>
                  <StatusBadge status={apt.status} />
                </Link>
              ))
            )}
          </div>
        </Card>

        <div className="lg:col-span-5 space-y-6">
          <Card>
            <h2 className="text-base font-display font-bold text-slate-900 mb-3">Quick Administration</h2>
            <div className="grid grid-cols-2 gap-2.5">
              <Link to="/dashboard/patients/new">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Users className="w-4 h-4 text-primary-700" />
                  Register Patient
                </Button>
              </Link>
              <Link to="/dashboard/doctors/new">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Stethoscope className="w-4 h-4 text-secondary-800" />
                  Onboard Doctor
                </Button>
              </Link>
              <Link to="/dashboard/billing">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <DollarSign className="w-4 h-4 text-emerald-700" />
                  Billing Ledger
                </Button>
              </Link>
              <Link to="/dashboard/audit-logs">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <ShieldAlert className="w-4 h-4 text-amber-700" />
                  Audit &amp; Inquiries
                  {stats?.openInquiries > 0 && (
                    <span className="ml-auto px-1.5 py-0.5 text-[11px] rounded bg-amber-100 text-amber-900">
                      {stats.openInquiries}
                    </span>
                  )}
                </Button>
              </Link>
            </div>
          </Card>

          <Card>
            <h2 className="text-base font-display font-bold text-slate-900 mb-3">Top Active Physicians</h2>
            {(charts?.topDoctors || []).length === 0 ? (
              <p className="text-sm text-slate-500">No physician volume data yet.</p>
            ) : (
              <ul className="space-y-3">
                {charts.topDoctors.map((doc) => (
                  <li key={doc.doctorId} className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{doc.name}</p>
                      <p className="text-xs text-slate-600 truncate">{doc.department}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-primary-50 text-primary-800 text-xs font-semibold tabular-nums shrink-0">
                      {doc.appointments} visits
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
