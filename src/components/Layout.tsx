import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import type { Role } from '@/lib/types';

const NAV_ITEMS: Record<Role, { label: string; to: string }[]> = {
  citizen: [
    { label: 'Dashboard', to: '/citizen' },
    { label: 'Submit Problem', to: '/citizen/submit' },
    { label: 'My Problems', to: '/citizen/problems' },
  ],
  university: [
    { label: 'Dashboard', to: '/university' },
    { label: 'Browse Problems', to: '/university/browse' },
    { label: 'My Projects', to: '/university/projects' },
  ],
  admin: [
    { label: 'Dashboard', to: '/admin' },
    { label: 'All Problems', to: '/admin/problems' },
  ],
};

export function Layout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!profile) return null;

  const items = NAV_ITEMS[profile.role];
  const roleLabel = profile.role.charAt(0).toUpperCase() + profile.role.slice(1);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                  SP
                </div>
                <span className="font-semibold text-slate-900 hidden sm:block">SocietalConnect</span>
              </Link>
              <span className="ml-2 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                {roleLabel}
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {items.map((item) => {
                const active = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      active ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <div className="w-px h-6 bg-slate-200 mx-2" />
              <span className="text-sm text-slate-500">{profile.name}</span>
              <button
                onClick={handleSignOut}
                className="ml-2 p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Sign out"
              >
                <LogOut size={18} />
              </button>
            </nav>

            <button
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <div className="px-4 py-3 space-y-1">
              {items.map((item) => {
                const active = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                      active ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="text-sm text-slate-500 px-3">{profile.name}</span>
                <button
                  onClick={handleSignOut}
                  className="px-3 py-2 text-sm text-red-600 flex items-center gap-1.5"
                >
                  <LogOut size={16} /> Sign out
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-sm text-slate-400">
          SocietalConnect — Smart India Hackathon Demo
        </div>
      </footer>
    </div>
  );
}
