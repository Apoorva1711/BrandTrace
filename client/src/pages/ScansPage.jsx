import React, { useState, useEffect } from 'react';
import { scanService } from '../services/api';
import {
  Radio,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
  X
} from 'lucide-react';
import { ScanModal } from '../components/ScanModal';
import { RiskBadge, StatusBadge } from '../components/Badges';

export function ScansPage() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [selectedScanResults, setSelectedScanResults] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadScans();
  }, [page]);

  async function loadScans() {
    try {
      setLoading(true);
      const res = await scanService.getAll({ page, limit: 12 });
      setScans(res.scans || []);
      setTotalPages(res.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleViewResults(scanId) {
    try {
      setLoadingResults(true);
      const res = await scanService.getResults(scanId);
      setSelectedScanResults(res);
    } catch (err) {
      alert(`Error loading scan results: ${err.message}`);
    } finally {
      setLoadingResults(false);
    }
  }

  function getStatusIcon(status) {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'Failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'Running':
      case 'Queued':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-amber-600" />;
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Scan Execution Center</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit trail of identity verification pipelines, candidate ingestion, and threat detection jobs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadScans}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 rounded border border-slate-200 shadow-sm"
            title="Refresh Scan History"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsScanModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-sm transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Launch New Scan</span>
          </button>
        </div>
      </div>

      {/* Scans Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Scan Status</th>
                <th className="px-4 py-3">Target Brand</th>
                <th className="px-4 py-3">Vector Scope</th>
                <th className="px-4 py-3">Evaluated</th>
                <th className="px-4 py-3">Official Excluded</th>
                <th className="px-4 py-3">Active Threats</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Triggered At</th>
                <th className="px-4 py-3 text-right">Inspection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    <span>Loading scan records...</span>
                  </td>
                </tr>
              ) : scans.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    No scan executions recorded. Launch a scan to evaluate brands.
                  </td>
                </tr>
              ) : (
                scans.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 font-semibold">
                        {getStatusIcon(s.status)}
                        <span className={s.status === 'Completed' ? 'text-emerald-700' : s.status === 'Failed' ? 'text-red-700' : 'text-blue-700'}>
                          {s.status}
                        </span>
                      </span>
                      {s.errorMessage && (
                        <div className="text-[10px] text-red-600 mt-0.5 truncate max-w-xs" title={s.errorMessage}>
                          {s.errorMessage}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {s.brandId?.name || 'Brand Profile'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="capitalize text-slate-700 font-medium">
                        {s.scanType === 'both' ? 'Social + Apps' : s.scanType}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-slate-800">
                      {s.candidatesEvaluated || 0}
                    </td>
                    <td className="px-4 py-3 text-emerald-700 font-mono font-medium">
                      {s.excludedCount || 0}
                    </td>
                    <td className="px-4 py-3 text-red-700 font-mono font-bold">
                      {s.threatsFound || 0}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500">
                      {s.durationMs ? `${s.durationMs}ms` : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {s.createdAt ? new Date(s.createdAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {s.status === 'Completed' && (
                        <button
                          onClick={() => handleViewResults(s._id)}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                        >
                          View Results
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div>
            Page <span className="font-semibold text-slate-700">{page}</span> of <span className="font-semibold text-slate-700">{totalPages}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Scan Results Inspection Drawer */}
      {selectedScanResults && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl p-6 overflow-y-auto space-y-5 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Scan Execution Findings</h3>
                <p className="text-xs text-slate-500">
                  Target: <strong>{selectedScanResults.scan.brandId?.name}</strong> • Completed in {selectedScanResults.scan.durationMs}ms
                </p>
              </div>
              <button
                onClick={() => setSelectedScanResults(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <div className="text-lg font-bold text-slate-800">{selectedScanResults.scan.candidatesEvaluated}</div>
                <div className="text-[11px] text-slate-500">Evaluated</div>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded">
                <div className="text-lg font-bold text-emerald-700">{selectedScanResults.excludedCount}</div>
                <div className="text-[11px] text-emerald-600 font-medium">Excluded Official</div>
              </div>
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <div className="text-lg font-bold text-red-700">{selectedScanResults.detectionsCount}</div>
                <div className="text-[11px] text-red-600 font-medium">Active Threats Found</div>
              </div>
            </div>

            {/* Detections List */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Active Threat Findings ({selectedScanResults.detections.length})
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedScanResults.detections.map(d => (
                  <div key={d._id} className="p-3 bg-slate-50 rounded border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-900">
                        {d.candidateId?.usernameOrAppName || 'Unknown'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {d.candidateId?.platformOrStore} • {d.candidateType}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <RiskBadge category={d.riskCategory} score={d.riskScore} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Excluded Assets List */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Excluded Official Assets ({selectedScanResults.excludedCandidates.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedScanResults.excludedCandidates.map(c => (
                  <div key={c._id} className="p-2.5 bg-emerald-50/50 rounded border border-emerald-200 text-xs">
                    <div className="font-semibold text-emerald-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{c.usernameOrAppName} ({c.platformOrStore})</span>
                    </div>
                    <p className="text-[11px] text-emerald-700 mt-0.5">{c.exclusionReason}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scan Modal */}
      <ScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onScanComplete={() => loadScans()}
      />
    </div>
  );
}
