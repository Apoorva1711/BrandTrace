import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { detectionService, brandService } from '../services/api';
import {
  AlertTriangle,
  Search,
  Filter,
  ExternalLink,
  Loader2,
  Smartphone,
  Users,
  ChevronLeft,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { RiskBadge, StatusBadge } from '../components/Badges';

export function DetectionsPage() {
  const [searchParams] = useSearchParams();
  const [detections, setDetections] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [brandId, setBrandId] = useState(searchParams.get('brandId') || '');
  const [candidateType, setCandidateType] = useState(searchParams.get('candidateType') || '');
  const [riskCategory, setRiskCategory] = useState(searchParams.get('riskCategory') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    brandService.getAll().then(res => setBrands(res.brands || [])).catch(() => {});
  }, []);

  useEffect(() => {
    loadDetections();
  }, [search, brandId, candidateType, riskCategory, status, page]);

  async function loadDetections() {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 15
      };
      if (search) params.search = search;
      if (brandId) params.brandId = brandId;
      if (candidateType) params.candidateType = candidateType;
      if (riskCategory) params.riskCategory = riskCategory;
      if (status) params.status = status;

      const res = await detectionService.getAll(params);
      setDetections(res.detections || []);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Threat Detections Queue</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active brand impersonations, mobile look-alikes, and flagged risk anomalies awaiting triage
          </p>
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Total Findings: <strong className="text-slate-800">{totalCount}</strong>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search candidate name, handles..."
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
            value={candidateType}
            onChange={(e) => { setCandidateType(e.target.value); setPage(1); }}
            className="rounded border border-slate-300 px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Vectors</option>
            <option value="social">Social Media</option>
            <option value="app">Mobile Apps</option>
          </select>

          <select
            value={riskCategory}
            onChange={(e) => { setRiskCategory(e.target.value); setPage(1); }}
            className="rounded border border-slate-300 px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Severities</option>
            <option value="Critical">Critical (80-100)</option>
            <option value="High">High (60-79)</option>
            <option value="Medium">Medium (30-59)</option>
            <option value="Low">Low (0-29)</option>
          </select>

          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="rounded border border-slate-300 px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Review Statuses</option>
            <option value="New">New</option>
            <option value="Under Review">Under Review</option>
            <option value="Suspected Impersonation">Suspected Impersonation</option>
            <option value="False Positive">False Positive</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Detections Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Threat Candidate</th>
                <th className="px-4 py-3">Vector & Platform</th>
                <th className="px-4 py-3">Target Brand</th>
                <th className="px-4 py-3">Risk Assessment</th>
                <th className="px-4 py-3">Investigation Status</th>
                <th className="px-4 py-3">Assigned Analyst</th>
                <th className="px-4 py-3">Primary Signal Evidence</th>
                <th className="px-4 py-3 text-right">Triage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    <span>Loading threat findings...</span>
                  </td>
                </tr>
              ) : detections.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No threat detections found matching criteria.
                  </td>
                </tr>
              ) : (
                detections.map((d) => {
                  const cand = d.candidateId || {};
                  const brand = d.brandId || {};
                  return (
                    <tr key={d._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          {d.candidateType === 'app' ? (
                            <Smartphone className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          ) : (
                            <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          )}
                          <span>{cand.usernameOrAppName || 'Unknown'}</span>
                        </div>
                        {cand.displayName && cand.displayName !== cand.usernameOrAppName && (
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">{cand.displayName}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {cand.platformOrStore || 'Web'}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {brand.name || 'Brand'}
                      </td>
                      <td className="px-4 py-3">
                        <RiskBadge category={d.riskCategory} score={d.riskScore} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={d.status} />
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {d.assignedAnalyst || 'Unassigned'}
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate text-[11px] text-slate-600">
                        {d.explanation && d.explanation.length > 0 ? d.explanation[0] : 'Signal rules triggered'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/investigations/${d._id}`}
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded font-semibold text-xs transition-colors inline-flex items-center gap-1 shadow-xs"
                        >
                          <span>Investigate</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
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
    </div>
  );
}
