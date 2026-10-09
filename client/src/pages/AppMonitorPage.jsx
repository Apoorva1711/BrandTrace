import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { candidateService, brandService } from '../services/api';
import {
  Smartphone,
  Search,
  Filter,
  ExternalLink,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  Building,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import { RiskBadge, StatusBadge } from '../components/Badges';

export function AppMonitorPage() {
  const [candidates, setCandidates] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [brandId, setBrandId] = useState('');
  const [store, setStore] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    brandService.getAll().then(res => setBrands(res.brands || [])).catch(() => {});
  }, []);

  useEffect(() => {
    loadCandidates();
  }, [search, brandId, store, page]);

  async function loadCandidates() {
    try {
      setLoading(true);
      const params = {
        candidateType: 'app',
        page,
        limit: 15
      };
      if (search) params.search = search;
      if (brandId) params.brandId = brandId;
      if (store) params.platformOrStore = store;

      const res = await candidateService.getAll(params);
      setCandidates(res.candidates || []);
      setTotalPages(res.pages || 1);
      setTotalCount(res.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Mobile Application Monitor</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Identify copycat applications, mismatching publishers, and look-alike package identifiers on app stores
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">
            Catalog Size: <strong className="text-slate-800">{totalCount}</strong> listings
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search app title, package ID, developer..."
              className="w-full pl-9 pr-3 py-1.5 rounded border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            value={brandId}
            onChange={(e) => { setBrandId(e.target.value); setPage(1); }}
            className="rounded border border-slate-300 px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Brands</option>
            {brands.map((b) => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>

          <select
            value={store}
            onChange={(e) => { setStore(e.target.value); setPage(1); }}
            className="rounded border border-slate-300 px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All App Stores</option>
            <option value="Google Play">Google Play</option>
            <option value="Apple App Store">Apple App Store</option>
          </select>
        </div>
      </div>

      {/* App Candidates Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Application Title</th>
                <th className="px-4 py-3">Store & Package Identifier</th>
                <th className="px-4 py-3">Developer / Publisher</th>
                <th className="px-4 py-3">Target Brand</th>
                <th className="px-4 py-3">Exclusion / Threat Status</th>
                <th className="px-4 py-3 text-right">Triage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
                    <span>Analyzing mobile app listings...</span>
                  </td>
                </tr>
              ) : candidates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No application listings found matching criteria.
                  </td>
                </tr>
              ) : (
                candidates.map((c) => {
                  const det = c.detection;
                  return (
                    <tr key={c._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span>{c.usernameOrAppName}</span>
                          {c.isExcluded && (
                            <span title="Verified Official Application" className="text-emerald-600">
                              <ShieldCheck className="w-3.5 h-3.5 inline" />
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 max-w-sm">
                          {c.description || 'No description provided'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{c.platformOrStore}</div>
                        <div className="font-mono text-[11px] text-slate-500 truncate max-w-xs">
                          {c.packageId || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800 flex items-center gap-1">
                          <Building className="w-3 h-3 text-slate-400" />
                          <span>{c.publisherName || 'Unknown Developer'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {c.brandId?.name || 'Brand'}
                      </td>
                      <td className="px-4 py-3">
                        {c.isExcluded ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>Official App Excluded</span>
                          </span>
                        ) : det ? (
                          <div className="flex items-center gap-1.5">
                            <RiskBadge category={det.riskCategory} score={det.riskScore} />
                            <StatusBadge status={det.status} />
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Not Evaluated</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedApp(c)}
                            className="px-2 py-1 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded font-medium text-[11px] transition-colors"
                          >
                            Details
                          </button>
                          {det && (
                            <Link
                              to={`/investigations/${det._id}`}
                              className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded font-semibold text-[11px] transition-colors"
                            >
                              Investigate
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
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

      {/* App Inspector Side Drawer */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 overflow-y-auto space-y-5 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900">Mobile Listing Details</h3>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Application Name</span>
                <p className="text-base font-bold text-slate-900 mt-0.5">{selectedApp.usernameOrAppName}</p>
                <p className="text-purple-700 font-medium">{selectedApp.platformOrStore}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Bundle / Package Identifier</span>
                <p className="font-mono text-slate-800 mt-0.5 bg-slate-100 p-2 rounded border border-slate-200 text-[11px]">
                  {selectedApp.packageId || 'Not specified'}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Publisher / Developer Entity</span>
                <p className="font-semibold text-slate-900 mt-0.5">{selectedApp.publisherName || 'Unknown Developer'}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Listing Description</span>
                <div className="mt-1 p-3 bg-slate-50 rounded border border-slate-200 text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {selectedApp.description || 'No listing description provided'}
                </div>
              </div>

              {selectedApp.url && (
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Store Listing URL</span>
                  <a
                    href={selectedApp.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1 mt-0.5 break-all"
                  >
                    <span>{selectedApp.url}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              )}

              {selectedApp.isExcluded ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-800">
                  <div className="font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Official Application Exclusion</span>
                  </div>
                  <p className="mt-1 text-[11px] text-emerald-700">{selectedApp.exclusionReason}</p>
                </div>
              ) : selectedApp.detection ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">Evaluated Risk Assessment</span>
                    <RiskBadge
                      category={selectedApp.detection.riskCategory}
                      score={selectedApp.detection.riskScore}
                    />
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Status: <strong>{selectedApp.detection.status}</strong>
                  </p>
                  <Link
                    to={`/investigations/${selectedApp.detection._id}`}
                    className="block text-center w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold text-xs shadow-sm mt-2"
                  >
                    Open Full Threat Investigation
                  </Link>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded text-slate-500 text-center">
                  This mobile listing has not been processed in an active scan.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
