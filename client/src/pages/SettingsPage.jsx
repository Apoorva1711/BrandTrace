import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { systemService } from '../services/api';
import {
  Settings,
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  Shield,
  Radio,
  Server,
  RefreshCw,
  Lock,
  Building
} from 'lucide-react';

export function SettingsPage() {
  const { user } = useAuth();
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSourceHealth();
  }, []);

  async function loadSourceHealth() {
    try {
      setLoading(true);
      setError('');
      const res = await systemService.getSourceHealth();
      setSources(res.sources || []);
    } catch (err) {
      setError(err.message || 'Unable to retrieve source health telemetry.');
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status) {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Connected & Operational</span>
          </span>
        );
      case 'degraded':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Degraded (Fallback Active)</span>
          </span>
        );
      case 'unconfigured':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>Unconfigured (Demo Active)</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            <span>Unavailable</span>
          </span>
        );
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Settings & Source Health</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent telemetry on active adapters, external platform connectors, and tenant identity
          </p>
        </div>
        <button
          onClick={loadSourceHealth}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded border border-slate-200 text-xs font-semibold shadow-xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Ping Connectors</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Analyst Profile Card */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-600" />
          <span>Analyst Account & Tenant Isolation</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-1">
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Security Analyst</span>
            <p className="text-sm font-bold text-slate-900 mt-0.5">{user?.name || 'Sarah Connor'}</p>
            <p className="text-slate-500 text-[11px]">{user?.email}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Organization Partition</span>
            <p className="text-sm font-bold text-slate-900 mt-0.5">{user?.organization || 'Global Risk Corp'}</p>
            <p className="text-slate-500 text-[11px]">Strict multi-tenant boundary</p>
          </div>
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">RBAC Role</span>
            <p className="text-sm font-bold text-blue-700 capitalize mt-0.5">{user?.role || 'Lead Analyst'}</p>
            <p className="text-slate-500 text-[11px]">Full investigation permissions</p>
          </div>
        </div>
      </div>

      {/* Source Health & Availability */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <span>Source Connectors & Adapter Integrity</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Honest connectivity disclosure. External sources without production credentials operate in deterministic sample fallback.
          </p>
        </div>

        <div className="divide-y divide-slate-200">
          {loading ? (
            <div className="p-8 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
              <span className="text-xs">Checking adapter health endpoints...</span>
            </div>
          ) : (
            sources.map((s) => (
              <div key={s.sourceKey} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{s.name}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 font-mono">
                      {s.sourceKey}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{s.details}</p>
                  {s.errorMessage && (
                    <p className="text-red-700 text-[11px] font-medium bg-red-50 p-2 rounded border border-red-100">
                      Reason: {s.errorMessage}
                    </p>
                  )}
                </div>

                <div className="shrink-0 flex flex-col md:items-end gap-1">
                  {getStatusBadge(s.status)}
                  <span className="text-[11px] text-slate-400">
                    Checked: {s.lastChecked ? new Date(s.lastChecked).toLocaleTimeString() : 'Just now'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detection Engine Specification Summary */}
      <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-2">
        <h4 className="font-bold text-slate-800">Deterministic Explainable Detection Model</h4>
        <p className="leading-relaxed">
          BRANDTRACE employs an explainable 100-point scoring formula rather than an opaque black box. Maximum allocations:
          Name Similarity (30 pts), Logo Perceptual Hash (25 pts), Publisher/Developer Mismatch (20 pts), Context Keywords (15 pts), and External Link Evaluation (10 pts).
          Official brand assets registered in the Official Asset Registry receive automatic exact-match exclusion to guarantee zero false positives for legitimate channels.
        </p>
      </div>
    </div>
  );
}
