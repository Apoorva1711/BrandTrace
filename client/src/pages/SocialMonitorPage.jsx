import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { candidateService, brandService } from '../services/api';
import {
  Share2,
  Search,
  Filter,
  ExternalLink,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  Upload,
  ArrowUpDown,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';
import { RiskBadge, StatusBadge } from '../components/Badges';

export function SocialMonitorPage() {
  const [candidates, setCandidates] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [brandId, setBrandId] = useState('');
  const [platform, setPlatform] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  useEffect(() => {
    brandService.getAll().then(res => setBrands(res.brands || [])).catch(() => {});
  }, []);

  useEffect(() => {
    loadCandidates();
  }, [search, brandId, platform, page]);

  async function loadCandidates() {
    try {
      setLoading(true);
      const params = {
        candidateType: 'social',
        page,
        limit: 15
      };
      if (search) params.search = search;
      if (brandId) params.brandId = brandId;
      if (platform) params.platformOrStore = platform;

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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Social Media Monitor</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active surveillance of potential impersonating profiles across Twitter/X, Instagram, LinkedIn, and Telegram
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">
            Surveillance Corpus: <strong className="text-slate-800">{totalCount}</strong> profiles
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
              placeholder="Search handle, display name, description..."
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
            value={platform}
            onChange={(e) => { setPlatform(e.target.value); setPage(1); }}
            className="rounded border border-slate-300 px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Platforms</option>
            <option value="Twitter/X">Twitter/X</option>
            <option value="Instagram">Instagram</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="Telegram">Telegram</option>
            <option value="Facebook">Facebook</option>
            <option value="YouTube">YouTube</option>
          </select>
        </div>
      </div>

      {/* Social Candidates Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Profile / Handle</th>
                <th className="px-4 py-3">Platform</th>
                <th className="px-4 py-3">Target Brand</th>
                <th className="px-4 py-3">Followers</th>
                <th className="px-4 py-3">Exclusion / Threat Status</th>
                <th className="px-4 py-3">External Destination</th>
                <th className="px-4 py-3 text-right">Triage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    <span>Querying social surveillance dataset...</span>
                  </td>
                </tr>
              ) : candidates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No social media candidates found matching criteria.
                  </td>
                </tr>
              ) : (
                candidates.map((c) => {
                  const det = c.detection;
                  return (
                    <tr key={c._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <span>@{c.usernameOrAppName}</span>
                          {c.isExcluded && (
                            <span title="Verified Official Asset" className="text-emerald-600">
                              <ShieldCheck className="w-3.5 h-3.5 inline" />
                            </span>
                          )}
                        </div>
                        {c.displayName && c.displayName !== c.usernameOrAppName && (
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">{c.displayName}</div>
                        )}
                        <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1 max-w-sm">
                          {c.description || 'No profile biography'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-700">{c.platformOrStore}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {c.brandId?.name || 'Brand'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-mono">
                        {c.followers ? c.followers.toLocaleString() : '0'}
                      </td>
                      <td className="px-4 py-3">
                        {c.isExcluded ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>Official Excluded</span>
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
                      <td className="px-4 py-3 max-w-xs truncate">
                        {c.externalUrl ? (
                          <a
                            href={c.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1 truncate"
                          >
                            <span className="truncate">{c.externalUrl}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedCandidate(c)}
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

        {/* Pagination Bar */}
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

      {/* Candidate Inspector Side Drawer */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 overflow-y-auto space-y-5 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Social Candidate Details</h3>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Account Identity</span>
                <p className="text-base font-bold text-slate-900 mt-0.5">@{selectedCandidate.usernameOrAppName}</p>
                <p className="text-slate-600">{selectedCandidate.displayName}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Platform & URL</span>
                <p className="font-medium text-slate-800">{selectedCandidate.platformOrStore}</p>
                {selectedCandidate.url && (
                  <a
                    href={selectedCandidate.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                  >
                    <span>{selectedCandidate.url}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Biography / Description</span>
                <div className="mt-1 p-3 bg-slate-50 rounded border border-slate-200 text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {selectedCandidate.description || 'No description available'}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Claimed External Link</span>
                <p className="font-mono text-slate-800 mt-0.5">{selectedCandidate.externalUrl || 'None specified'}</p>
              </div>

              {selectedCandidate.isExcluded ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-800">
                  <div className="font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Official Asset Exclusion</span>
                  </div>
                  <p className="mt-1 text-[11px] text-emerald-700">{selectedCandidate.exclusionReason}</p>
                </div>
              ) : selectedCandidate.detection ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">Evaluated Risk Assessment</span>
                    <RiskBadge
                      category={selectedCandidate.detection.riskCategory}
                      score={selectedCandidate.detection.riskScore}
                    />
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Status: <strong>{selectedCandidate.detection.status}</strong>
                  </p>
                  <Link
                    to={`/investigations/${selectedCandidate.detection._id}`}
                    className="block text-center w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold text-xs shadow-sm mt-2"
                  >
                    Open Full Threat Investigation
                  </Link>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded text-slate-500 text-center">
                  This candidate has not yet been processed in an active scan.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
