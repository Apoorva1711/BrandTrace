import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  ShieldCheck,
  Share2,
  Smartphone,
  Radio,
  AlertTriangle,
  FileText,
  Settings,
  Shield,
  LogOut,
  Building
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Sidebar() {
  const { user, logout } = useAuth();

  const navItems = [
    { label: 'Overview', to: '/', icon: LayoutDashboard },
    { label: 'Brand Profiles', to: '/brands', icon: Building2 },
    { label: 'Official Asset Registry', to: '/assets', icon: ShieldCheck },
    { label: 'Social Media Monitor', to: '/social-monitor', icon: Share2 },
    { label: 'Mobile App Monitor', to: '/app-monitor', icon: Smartphone },
    { label: 'Scan Center', to: '/scans', icon: Radio },
    { label: 'Threat Detections', to: '/detections', icon: AlertTriangle },
    { label: 'Reports & Exports', to: '/reports', icon: FileText },
    { label: 'Settings & Health', to: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 select-none shrink-0">
      {/* Brandtrace Wordmark */}
      <div className="h-16 flex items-center px-5 border-b border-slate-200">
        <NavLink to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-sm">
            <Shield className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="font-bold text-slate-900 tracking-tight text-base leading-none">
              BRAND<span className="text-blue-600">TRACE</span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium tracking-wide uppercase mt-0.5">
              Digital Risk Protection
            </div>
          </div>
        </NavLink>
      </div>

      {/* Organization Badge */}
      <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center gap-2">
        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="text-xs font-semibold text-slate-700 truncate">
          {user?.organization || 'Enterprise Security'}
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom User Profile */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <p className="text-xs font-semibold text-slate-900 truncate">{user?.name || 'Security Analyst'}</p>
            <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100 transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
