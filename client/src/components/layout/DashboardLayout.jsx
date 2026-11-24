import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { dashboardApi } from '../../services/api';
import { BrandLogo, Avatar, RoleBadge, StatusBadge } from '../ui';
import { formatDateTime } from '../../config/site';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Calendar,
  CreditCard,
  FileText,
  FlaskConical,
  Pill,
  Ticket,
  ArrowRightLeft,
  UserCog,
  ShieldAlert,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  ExternalLink
} from 'lucide-react';

const NAV_ITEMS = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    end: true,
    icon: LayoutDashboard,
    roles: ['ADMIN', 'DOCTOR', 'NURSE', 'PATIENT', 'ACCOUNTANT', 'RECEPTIONIST', 'PHARMACIST', 'LAB_TECH']
  },
  {
    name: 'Front Desk Queue',
    path: '/dashboard/queue',
    icon: Ticket,
    roles: ['ADMIN', 'RECEPTIONIST', 'NURSE', 'DOCTOR']
  },
  {
    name: 'Patients',
    path: '/dashboard/patients',
    icon: Users,
    roles: ['ADMIN', 'DOCTOR', 'NURSE', 'ACCOUNTANT', 'RECEPTIONIST']
  },
  {
    name: 'My Health Records',
    path: '/dashboard/my-records',
    icon: Users,
    roles: ['PATIENT']
  },
  {
    name: 'Doctors',
    path: '/dashboard/doctors',
    icon: Stethoscope,
    roles: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST']
  },
  {
    name: 'Appointments',
    path: '/dashboard/appointments',
    icon: Calendar,
    roles: ['ADMIN', 'DOCTOR', 'NURSE', 'PATIENT', 'ACCOUNTANT', 'RECEPTIONIST']
  },
  {
    name: 'Referrals',
    path: '/dashboard/referrals',
    icon: ArrowRightLeft,
    roles: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PATIENT']
  },
  {
    name: 'Prescriptions',
    path: '/dashboard/prescriptions',
    icon: FileText,
    roles: ['ADMIN', 'DOCTOR', 'NURSE', 'PATIENT']
  },
  {
    name: 'Laboratory (LIS)',
    path: '/dashboard/labs',
    icon: FlaskConical,
    roles: ['ADMIN', 'LAB_TECH', 'DOCTOR', 'NURSE', 'PATIENT']
  },
  {
    name: 'Pharmacy',
    path: '/dashboard/pharmacy',
    icon: Pill,
    roles: ['ADMIN', 'PHARMACIST']
  },
  {
    name: 'Billing & Invoices',
    path: '/dashboard/billing',
    icon: CreditCard,
    roles: ['ADMIN', 'ACCOUNTANT', 'PATIENT']
  },
  {
    name: 'Hospital Staff',
    path: '/dashboard/staff',
    icon: UserCog,
    roles: ['ADMIN']
  },
  {
    name: 'Audit & Inquiries',
    path: '/dashboard/audit-logs',
    icon: ShieldAlert,
    roles: ['ADMIN']
  },
  {
    name: 'Settings',
    path: '/dashboard/settings',
    icon: Settings,
    roles: ['ADMIN', 'DOCTOR', 'NURSE', 'PATIENT', 'ACCOUNTANT', 'RECEPTIONIST', 'PHARMACIST', 'LAB_TECH']
  }
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [activities, setActivities] = useState([]);
  const [quickQuery, setQuickQuery] = useState('');

  const userMenuRef = useRef(null);
  const notifRef = useRef(null);

  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(user?.role));

  useEffect(() => {
    setSidebarOpen(false);
    setUserMenuOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setSidebarOpen(false);
        setUserMenuOpen(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  const openNotifications = async () => {
    const next = !notifOpen;
    setNotifOpen(next);
    if (next) {
      try {
        const res = await dashboardApi.getActivities();
        setActivities(res.activities || []);
      } catch {
        setActivities([]);
      }
    }
  };

  const handleQuickSearch = (e) => {
    e.preventDefault();
    const term = quickQuery.trim();
    if (!term) return;
    if (['ADMIN', 'DOCTOR', 'NURSE', 'ACCOUNTANT'].includes(user?.role)) {
      navigate(`/dashboard/patients?search=${encodeURIComponent(term)}`);
    } else {
      navigate('/dashboard/appointments');
    }
    setQuickQuery('');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const resolveNavPath = (item) => {
    if (item.path === '/dashboard/my-records' && user?.profile?._id) {
      return `/dashboard/patients/${user.profile._id}/records`;
    }
    return item.path;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <a
        href="#dashboard-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-primary-700 focus:text-white focus:font-semibold"
      >
        Skip to main content
      </a>

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden no-print"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        aria-label="Portal navigation"
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 lg:translate-x-0 no-print ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between">
          <Link to="/dashboard" aria-label="HealthCore Portal Dashboard">
            <BrandLogo subtitle="Clinical Portal" size="sm" />
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
          {visibleNav.map((item) => {
            const target = resolveNavPath(item);
            return (
              <NavLink
                key={item.name}
                to={target}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-700 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <item.icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-200 space-y-2">
          <Link
            to="/"
            className="flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <span>Public Hospital Site</span>
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2.5">
            <Avatar
              src={user?.avatar}
              firstName={user?.firstName}
              lastName={user?.lastName}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <div className="mt-0.5">
                <RoleBadge role={user?.role} className="!px-1.5 !py-0 !text-[11px]" />
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Column */}
      <div className="lg:pl-64 print:!pl-0 min-h-screen flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation sidebar"
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            <form onSubmit={handleQuickSearch} className="hidden sm:block relative w-full">
              <Search
                className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={quickQuery}
                onChange={(e) => setQuickQuery(e.target.value)}
                aria-label="Quick search patients"
                placeholder={
                  user?.role === 'PATIENT'
                    ? 'Jump to appointments...'
                    : 'Quick search patients by name or email...'
                }
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-500 focus:bg-white focus:border-primary-700 focus:ring-2 focus:ring-primary-700/15"
              />
            </form>
          </div>

          <div className="flex items-center gap-2">
            {/* Activity / Notifications Popover */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={openNotifications}
                aria-label="Recent clinical activity"
                aria-expanded={notifOpen}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                <span className="w-2 h-2 rounded-full bg-primary-600 absolute top-1.5 right-1.5" />
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-slate-200 shadow-elevated overflow-hidden z-40 animate-fadeIn">
                  <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-sm font-display font-bold text-slate-900">Recent Activity</span>
                    <Link
                      to="/dashboard/appointments"
                      className="text-xs font-semibold text-primary-700 hover:underline"
                    >
                      View all
                    </Link>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {activities.length === 0 ? (
                      <p className="px-4 py-8 text-center text-xs text-slate-600">
                        No recent activity recorded.
                      </p>
                    ) : (
                      activities.slice(0, 6).map((act) => (
                        <div key={act.id} className="px-4 py-3 hover:bg-slate-50">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-slate-900 truncate">{act.description}</p>
                            <StatusBadge status={act.status} className="!text-[11px] !px-1.5" />
                          </div>
                          <p className="text-xs text-slate-600 mt-1">{formatDateTime(act.timestamp)}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Account Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                aria-expanded={userMenuOpen}
                aria-label="Account menu"
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Avatar
                  src={user?.avatar}
                  firstName={user?.firstName}
                  lastName={user?.lastName}
                  size="xs"
                />
                <div className="hidden md:block text-left leading-tight">
                  <p className="text-xs font-semibold text-slate-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-slate-600 capitalize">{user?.role?.toLowerCase()}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-500" aria-hidden="true" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-elevated py-1.5 z-40 animate-fadeIn">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-slate-600 truncate">{user?.email}</p>
                  </div>
                  <Link
                    to="/dashboard/settings"
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Settings className="w-4 h-4 text-slate-500" aria-hidden="true" />
                    Profile &amp; Settings
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-700 hover:bg-rose-50"
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Workspace Content */}
        <main id="dashboard-content" className="flex-1 p-4 sm:p-6 lg:p-8 print:!p-0 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
