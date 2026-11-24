import { useState, useEffect } from 'react';
import { Outlet, Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { BrandLogo, Button } from '../ui';
import { SITE } from '../../config/site';
import {
  Phone,
  Clock,
  MapPin,
  Mail,
  Menu,
  X,
  Calendar,
  LayoutDashboard,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Home', to: '/', end: true },
  { name: 'Departments', to: '/departments' },
  { name: 'Find a Doctor', to: '/doctors' },
  { name: 'About Us', to: '/about' },
  { name: 'Contact', to: '/contact' }
];

export default function PublicLayout() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-primary-700 focus:text-white focus:font-semibold"
      >
        Skip to main content
      </a>

      {/* Top Clinical Info & Emergency Bar */}
      <div className="bg-secondary-950 text-slate-200 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <a
              href={`tel:${SITE.emergencyTel}`}
              className="inline-flex items-center gap-1.5 font-semibold text-primary-200 hover:text-white transition-colors"
            >
              <Phone className="w-3.5 h-3.5" aria-hidden="true" />
              <span>24/7 Emergency: {SITE.emergencyPhone}</span>
            </a>
            <span className="hidden md:inline-flex items-center gap-1.5 text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-primary-300" aria-hidden="true" />
              {SITE.address}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-slate-300">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary-300" aria-hidden="true" />
              {SITE.opdHours}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link to="/" aria-label={`${SITE.name} Home`}>
            <BrandLogo subtitle="Medical Center" size="sm" />
          </Link>

          <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-800 font-semibold'
                      : 'text-slate-700 hover:text-primary-700 hover:bg-slate-100'
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-2.5">
            <Link to="/appointment">
              <Button variant="primary" size="sm">
                <Calendar className="w-4 h-4" aria-hidden="true" />
                Book Appointment
              </Button>
            </Link>
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button variant="outline" size="sm">
                  <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
                  {user?.firstName ? `${user.firstName}'s Portal` : 'Portal'}
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            aria-controls="public-mobile-nav"
            className="lg:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div
            id="public-mobile-nav"
            className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2 shadow-elevated animate-fadeIn"
          >
            <nav aria-label="Mobile navigation" className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `block px-3.5 py-2.5 rounded-lg text-sm font-medium ${
                      isActive
                        ? 'bg-primary-50 text-primary-800 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}
            </nav>
            <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
              <Link to="/appointment">
                <Button variant="primary" className="w-full">
                  <Calendar className="w-4 h-4" />
                  Book Appointment
                </Button>
              </Link>
              {isAuthenticated ? (
                <Link to="/dashboard">
                  <Button variant="outline" className="w-full">
                    <LayoutDashboard className="w-4 h-4" />
                    Go to Portal
                  </Button>
                </Link>
              ) : (
                <Link to="/login">
                  <Button variant="outline" className="w-full">
                    Sign In / Register
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      <main id="main-content" className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="space-y-4">
            <BrandLogo subtitle="Medical Center" dark />
            <p className="text-sm text-slate-400 leading-relaxed">
              Accredited multidisciplinary hospital delivering evidence-based medicine, coordinated electronic health records, and 24/7 emergency response.
            </p>
            <div className="inline-flex items-center gap-2 text-xs font-medium text-primary-300 bg-primary-950/60 border border-primary-800/60 px-3 py-1.5 rounded-lg">
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              HIPAA-Aligned Digital Care
            </div>
          </div>

          <div>
            <h2 className="text-sm font-display font-bold text-white uppercase tracking-wider mb-4">
              Patient Services
            </h2>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/appointment" className="hover:text-primary-300 transition-colors inline-flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-primary-400" />
                  Book an Appointment
                </Link>
              </li>
              <li>
                <Link to="/doctors" className="hover:text-primary-300 transition-colors inline-flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-primary-400" />
                  Find a Specialist
                </Link>
              </li>
              <li>
                <Link to="/departments" className="hover:text-primary-300 transition-colors inline-flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-primary-400" />
                  Clinical Departments
                </Link>
              </li>
              <li>
                <Link to={isAuthenticated ? '/dashboard' : '/login'} className="hover:text-primary-300 transition-colors inline-flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-primary-400" />
                  Patient &amp; Staff Portal
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-display font-bold text-white uppercase tracking-wider mb-4">
              Organization
            </h2>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/about" className="hover:text-primary-300 transition-colors">
                  About {SITE.shortName}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-primary-300 transition-colors">
                  Contact &amp; Directions
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-primary-300 transition-colors">
                  Create Patient Account
                </Link>
              </li>
              <li>
                <Link to="/departments" className="hover:text-primary-300 transition-colors">
                  Diagnostic &amp; Specialty Care
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-display font-bold text-white uppercase tracking-wider mb-4">
              Contact &amp; Hours
            </h2>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{SITE.address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-primary-400 shrink-0" aria-hidden="true" />
                <a href={`tel:${SITE.appointmentTel}`} className="hover:text-white transition-colors">
                  {SITE.appointmentPhone}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-primary-400 shrink-0" aria-hidden="true" />
                <a href={`mailto:${SITE.email}`} className="hover:text-white transition-colors">
                  {SITE.email}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-primary-400 shrink-0" aria-hidden="true" />
                <span>{SITE.emergencyHours}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
            <p>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
            <p>Serving patients since {SITE.foundedYear} · {SITE.opdHours}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
