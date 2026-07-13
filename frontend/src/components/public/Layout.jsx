import React, { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, Boxes, ExternalLink, Mail, Phone, MapPin } from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on path changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'About' },
    { path: '/portfolio', label: 'Portfolio' },
    { path: '/blog', label: 'Blog' },
    { path: '/contact', label: 'Contact' },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-[#F8FAFC] font-sans flex flex-col selection:bg-amber-500 selection:text-slate-950">
      
      {/* Header / Navbar */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out px-6 lg:px-12 ${
          scrolled
            ? 'py-4 bg-[#020617]/85 backdrop-blur-md border-b border-slate-800/80 shadow-lg'
            : 'py-6 bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform duration-300">
              <Boxes className="w-5.5 h-5.5 text-slate-950" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white block">
                All <span className="text-amber-500">3D</span> Studio
              </span>
              <span className="text-[9px] uppercase tracking-widest text-slate-400 block -mt-1 font-semibold">
                Creative Visualization
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map(({ path, label }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `relative py-1 text-sm font-medium tracking-wide transition-colors duration-300 ${
                    isActive ? 'text-amber-500' : 'text-slate-300 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {label}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-amber-500" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Auth Controls & Staff Portal Link */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <Link
                  to={
                    user.role === 'superadmin'
                      ? '/superadmin/dashboard'
                      : user.role === 'admin'
                      ? '/admin/dashboard'
                      : user.role === 'employee'
                      ? '/employee/dashboard'
                      : '/client/dashboard'
                  }
                  className="text-xs bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-lg hover:text-white hover:border-slate-700 transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-xs bg-red-950/40 border border-red-900/30 text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-900/20 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-300 hover:text-white transition-colors py-1.5 px-4"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="text-sm font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 px-4 py-2 rounded-xl transition-all duration-300 shadow-md shadow-amber-500/10 hover:shadow-amber-500/25 active:scale-95"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white focus:outline-none"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <div
        className={`fixed inset-0 z-40 bg-[#020617]/98 backdrop-blur-lg md:hidden transition-all duration-500 ease-in-out ${
          mobileMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'
        }`}
      >
        <div className="flex flex-col h-full justify-between p-8 pt-28">
          <nav className="flex flex-col gap-6 text-center">
            {navLinks.map(({ path, label }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `text-2xl font-semibold tracking-wide ${isActive ? 'text-amber-500' : 'text-slate-300'}`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex flex-col gap-4 items-center">
            {user ? (
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <Link
                  to={
                    user.role === 'superadmin'
                      ? '/superadmin/dashboard'
                      : user.role === 'admin'
                      ? '/admin/dashboard'
                      : user.role === 'employee'
                      ? '/employee/dashboard'
                      : '/client/dashboard'
                  }
                  className="w-full text-center text-sm bg-slate-900 border border-slate-800 py-3 rounded-xl font-medium"
                >
                  Go to Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-center text-sm bg-red-950/60 border border-red-900/30 text-red-400 py-3 rounded-xl"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <Link
                  to="/login"
                  className="w-full text-center text-sm border border-slate-800 bg-slate-900 py-3 rounded-xl text-slate-300"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="w-full text-center text-sm bg-amber-500 hover:bg-amber-400 text-slate-950 py-3 rounded-xl font-bold"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer Section */}
      <footer className="bg-[#0b0f19] border-t border-slate-900 pt-16 pb-8 px-6 lg:px-12 text-slate-400">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          
          {/* Col 1: Brand details */}
          <div className="flex flex-col gap-6">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
                <Boxes className="w-5.5 h-5.5 text-slate-950" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                All <span className="text-amber-500">3D</span> Studio
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Award-winning 3D visualization and rendering studio creating photorealistic experiences for global developers and design visionaries.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-9 h-9 rounded-lg bg-slate-900 hover:bg-slate-850 hover:text-white border border-slate-800 flex items-center justify-center transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-slate-900 hover:bg-slate-850 hover:text-white border border-slate-800 flex items-center justify-center transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-slate-900 hover:bg-slate-850 hover:text-white border border-slate-800 flex items-center justify-center transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              </a>
            </div>
          </div>

          {/* Col 2: Services Quick links */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-6">Expertise</h4>
            <ul className="flex flex-col gap-3.5 text-sm">
              <li><Link to="/portfolio?cat=architecture" className="hover:text-amber-500 transition-colors">Architectural Viz</Link></li>
              <li><Link to="/portfolio?cat=interior" className="hover:text-amber-500 transition-colors">Interior Rendering</Link></li>
              <li><Link to="/portfolio?cat=exterior" className="hover:text-amber-500 transition-colors">Exterior Walkthroughs</Link></li>
              <li><Link to="/portfolio?cat=modeling" className="hover:text-amber-500 transition-colors">3D Product Design</Link></li>
              <li><Link to="/portfolio?cat=animation" className="hover:text-amber-500 transition-colors">Cinematic Animation</Link></li>
            </ul>
          </div>

          {/* Col 3: Company Pages */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-6">Studio</h4>
            <ul className="flex flex-col gap-3.5 text-sm">
              <li><Link to="/about" className="hover:text-amber-500 transition-colors">Our Story</Link></li>
              <li><Link to="/portfolio" className="hover:text-amber-500 transition-colors">Portfolio Gallery</Link></li>
              <li><Link to="/blog" className="hover:text-amber-500 transition-colors">Insights & Blog</Link></li>
              <li><Link to="/contact" className="hover:text-amber-500 transition-colors">Get a Quote</Link></li>
            </ul>
          </div>

          {/* Col 4: Contact details */}
          <div className="flex flex-col gap-5 text-sm">
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-2">Connect</h4>
            <div className="flex items-start gap-3">
              <MapPin className="w-4.5 h-4.5 text-amber-500 mt-0.5 flex-shrink-0" />
              <span>102, Design District, Sector 62, Noida, UP, India</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4.5 h-4.5 text-amber-500 flex-shrink-0" />
              <span>+91 98765 43210</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4.5 h-4.5 text-amber-500 flex-shrink-0" />
              <span>hello@all3dstudio.com</span>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto border-t border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p>© {new Date().getFullYear()} All 3D Studio. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-amber-500 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-amber-500 transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
