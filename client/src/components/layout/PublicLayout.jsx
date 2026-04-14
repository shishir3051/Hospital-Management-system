import { Outlet, Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { 
  Menu, 
  X, 
  Stethoscope, 
  Phone, 
  MapPin, 
  Clock,
  Instagram,
  Facebook,
  Twitter,
  Linkedin
} from 'lucide-react';
import { useState } from 'react';

export default function PublicLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Departments', href: '/departments' },
    { name: 'Doctors', href: '/doctors' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header Information */}
      <div className="hidden lg:block bg-primary-900 text-white py-2">
        <div className="container mx-auto px-6 flex justify-between items-center text-sm">
          <div className="flex items-center space-x-6">
            <span className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary-300" />
              Emergency: +880 1711-******
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary-300" />
              123 Medical Plaza, Health City
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-300" />
              Mon - Sat: 8:00 AM - 8:00 PM
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="bg-white shadow-card sticky top-0 z-50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-transform shadow-lg">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-dark">HealthCore</span>
              <span className="text-xs text-slate-500 block -mt-1 font-medium tracking-wider">HOSPITAL</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.name}
                to={link.href}
                className={({ isActive }) =>
                  `text-sm font-semibold transition-all hover:text-primary ${
                    isActive ? 'text-primary' : 'text-slate-600'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
            
            {user ? (
              <Link
                to="/dashboard"
                className="bg-primary text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary-dark hover:scale-105 active:scale-95 transition-all"
              >
                Dashboard
              </Link>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-sm font-bold text-slate-700 hover:text-primary">
                  Login
                </Link>
                <Link
                  to="/appointment"
                  className="bg-primary text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary-dark hover:scale-105 active:scale-95 transition-all"
                >
                  Book Appointment
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-100 animate-fadeIn">
            <div className="container mx-auto px-6 py-6 flex flex-col space-y-4">
              {navLinks.map((link) => (
                <NavLink
                  key={link.name}
                  to={link.href}
                  className={({ isActive }) =>
                    `text-base font-semibold py-2 transition-all ${
                      isActive ? 'text-primary' : 'text-slate-600'
                    }`
                  }
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </NavLink>
              ))}
              <div className="pt-4 flex flex-col space-y-4">
                {user ? (
                  <Link
                    to="/dashboard"
                    className="bg-primary text-white text-center py-3 rounded-xl font-bold shadow-lg shadow-primary/20"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="text-center py-3 font-bold text-slate-700"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      to="/appointment"
                      className="bg-primary text-white text-center py-3 rounded-xl font-bold shadow-lg shadow-primary/20"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Book Appointment
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300">
        <div className="container mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            <div>
              <Link to="/" className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">HealthCore</span>
              </Link>
              <p className="text-sm leading-relaxed mb-6">
                Leading healthcare provider committed to delivering exceptional medical services with a patient-first approach. Your health is our priority.
              </p>
              <div className="flex items-center space-x-4">
                <a href="#" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-primary hover:text-white transition-all transform hover:-translate-y-1">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-primary hover:text-white transition-all transform hover:-translate-y-1">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-primary hover:text-white transition-all transform hover:-translate-y-1">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-primary hover:text-white transition-all transform hover:-translate-y-1">
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Quick Links</h4>
              <ul className="space-y-4 text-sm">
                <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                <li><Link to="/doctors" className="hover:text-primary transition-colors">Our Doctors</Link></li>
                <li><Link to="/departments" className="hover:text-primary transition-colors">Departments</Link></li>
                <li><Link to="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Services</h4>
              <ul className="space-y-4 text-sm">
                <li><a href="#" className="hover:text-primary transition-colors">Emergency Care</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Cardiology</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Neurology</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Orthopedics</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Contact Info</h4>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>House 12, Road 5, Dhanmondi, Dhaka 1205, Bangladesh</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>+880 1711-234567</span>
                </li>
                <li className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Emergency Hotline Available 24/7</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p>© {new Date().getFullYear()} HealthCore Hospital Management System. All rights reserved.</p>
            <div className="flex space-x-6">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
