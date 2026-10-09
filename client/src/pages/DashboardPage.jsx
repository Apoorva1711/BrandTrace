import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  ShieldCheck,
  Users,
  Smartphone,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  ArrowUpRight,
  Loader2,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

import { systemService } from '../services/api';
import { RiskBadge, StatusBadge } from '../components/Badges';
import { ScanModal } from '../components/ScanModal';

export function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError('');
      const res = await systemService.getDashboardStats();
      if (res.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      setError(err.message || 'Unable to load live dashboard statistics.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Aggregating live telemetry from MongoDB records...</p>
      </div>
    );
  }

  const statCards = [
    { label: 'Configured Brands', value: stats?.totalBrands || 0, icon: Building2, color: 'text-blue-600', link: '/brands' },
    { label: 'Official Assets', value: stats?.totalAssets || 0, icon: ShieldCheck, color: 'text-emerald-600', link: '/assets' },
    { label: 'Candidates Scanned', value: stats?.totalCandidates || 0, icon: Users, color: 'text-slate-600', link: '/social-monitor' },
    { label: 'Social Impersonations', value: stats?.socialFindings || 0, icon: Users, color: 'text-orange-600', link: '/detections?candidateType=social' },
    { label: 'Suspicious Mobile Apps', value: stats?.appFindings || 0, icon: Smartphone, color: 'text-red-600', link: '/detections?candidateType=app' },
    { label: 'High & Critical Risks', value: stats?.highAndCritical || 0, icon: AlertTriangle, color: 'text-red-700', link: '/detections?riskCategory=Critical' },
    { label: 'Awaiting Analyst Review', value: stats?.awaitingReview || 0, icon: Clock, color: 'text-amber-600', link: '/detections?status=New' },
    { label: 'Excluded False Positives', value: stats?.falsePositives || 0, icon: CheckCircle, color: 'text-slate-500', link: '/detections?status=False Positive' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Executive Threat Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time digital risk protection, brand impersonation posture, and mobile listing telemetry
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadDashboard}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 rounded border border-slate-200 shadow-sm transition-colors"
            title="Refresh Metrics"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsScanModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-sm transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Scan Now</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link
              key={idx}
              to={card.link}
              className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium text-slate-600">{card.label}</span>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-slate-900 tracking-tight">{card.value}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition-colors" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution Chart */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Risk Severity Distribution</h3>
              <p className="text-xs text-slate-500">Live counts categorized by explainable 100-point model</p>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
              Active Threats
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.riskDistribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '6px', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {(stats?.riskDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Channel Breakdown: Social vs Mobile Apps */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Surface Channel Comparison</h3>
              <p className="text-xs text-slate-500">Social impersonations vs malicious app listings</p>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
              Monitoring Vectors
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Social Profiles', value: stats?.socialFindings || 0, color: '#3b82f6' },
                    { name: 'Mobile Apps', value: stats?.appFindings || 0, color: '#8b5cf6' }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  <Cell fill="#3b82f6" />
                  <Cell fill="#8b5cf6" />
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '6px', fontSize: '12px' }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(value) => <span className="text-xs text-slate-600 font-medium">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Detections Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Threat Detections</h3>
            <p className="text-xs text-slate-500">Live priority queue for analyst triage and evidence investigation</p>
          </div>
          <Link
            to="/detections"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>View All Findings</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Candidate / Handle</th>
                <th className="px-4 py-3">Vector</th>
                <th className="px-4 py-3">Target Brand</th>
                <th className="px-4 py-3">Risk Assessment</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Primary Evidence</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {stats?.recentDetections && stats.recentDetections.length > 0 ? (
                stats.recentDetections.map((d) => {
                  const cand = d.candidateId || {};
                  const brand = d.brandId || {};
                  return (
                    <tr key={d._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">
                          {cand.usernameOrAppName || 'Unknown'}
                        </div>
                        {cand.displayName && cand.displayName !== cand.usernameOrAppName && (
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">{cand.displayName}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600">
                          {d.candidateType === 'app' ? (
                            <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                          ) : (
                            <Users className="w-3.5 h-3.5 text-blue-600" />
                          )}
                          <span>{cand.platformOrStore || 'Web'}</span>
                        </span>
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
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate text-[11px]">
                        {d.explanation && d.explanation.length > 0
                          ? d.explanation[0]
                          : 'Flagged by signal matching rules'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/investigations/${d._id}`}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors inline-block"
                        >
                          Investigate
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No detections registered yet. Execute a scan to discover threats.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onScanComplete={() => loadDashboard()}
      />
    </div>
  );
}
