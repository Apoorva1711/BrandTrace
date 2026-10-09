import React, { useState, useEffect } from 'react';
import { brandService, detectionService } from '../services/api';
import {
  FileText,
  Download,
  Printer,
  Filter,
  Shield,
  Loader2,
  Calendar,
  Building2,
  AlertTriangle
} from 'lucide-react';
import { RiskBadge, StatusBadge } from '../components/Badges';

export function ReportsPage() {
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [previewDetections, setPreviewDetections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    brandService.getAll().then(res => {
      setBrands(res.brands || []);
    }).catch(console.error);
    loadPreview();
  }, []);

  useEffect(() => {
    loadPreview();
  }, [selectedBrand, selectedSeverity, selectedStatus]);

  async function loadPreview() {
    try {
      setLoading(true);
      const params = { limit: 100 };
      if (selectedBrand) params.brandId = selectedBrand;
      if (selectedSeverity) params.riskCategory = selectedSeverity;
      if (selectedStatus) params.status = selectedStatus;

      const res = await detectionService.getAll(params);
      setPreviewDetections(res.detections || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleDownloadDetectionsCsv() {
    const params = new URLSearchParams();
    if (selectedBrand) params.append('brandId', selectedBrand);
    if (selectedSeverity) params.append('riskCategory', selectedSeverity);
    if (selectedStatus) params.append('status', selectedStatus);

    window.open(`/api/reports/detections.csv?${params.toString()}`, '_blank');
  }

  function handleDownloadScansCsv() {
    const params = new URLSearchParams();
    if (selectedBrand) params.append('brandId', selectedBrand);

    window.open(`/api/reports/scans.csv?${params.toString()}`, '_blank');
  }

  function handlePrintReport() {
    window.print();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Executive Reports & Intelligence Export</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Download sanitised threat datasets or generate printable executive brand defense briefings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintReport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded border border-slate-200 text-xs font-semibold shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report View</span>
          </button>
          <button
            onClick={handleDownloadDetectionsCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Detections CSV</span>
          </button>
          <button
            onClick={handleDownloadScansCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-semibold shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Scans CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Parameters */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs no-print">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>Report Scope:</span>
          </div>
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="rounded border border-slate-300 px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Brands</option>
            {brands.map((b) => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="rounded border border-slate-300 px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Risk Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded border border-slate-300 px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Analyst Statuses</option>
            <option value="New">New</option>
            <option value="Under Review">Under Review</option>
            <option value="Suspected Impersonation">Suspected Impersonation</option>
            <option value="False Positive">False Positive</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
        <div className="text-slate-500 font-medium">
          Report Records: <strong className="text-slate-800">{previewDetections.length}</strong> findings
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8 space-y-6">
        {/* Printable Header */}
        <div className="border-b border-slate-200 pb-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-6 h-6 text-blue-600 fill-current" />
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                BRANDTRACE Executive Risk Briefing
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Digital Risk Protection • Automated Social & Mobile App Surveillance
            </p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <div>Generated: {new Date().toLocaleDateString()}</div>
            <div>Classification: <strong className="text-slate-800">CONFIDENTIAL TLP:AMBER</strong></div>
          </div>
        </div>

        {/* Security & Sanitization Statement */}
        <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
          <span>
            🛡️ <strong>Data Protection Protocol:</strong> CSV exports are sanitised against formula injection (CWE-1236). Passwords and session secrets are strictly excluded.
          </span>
          <span className="font-mono text-[11px] text-slate-500">ISO/IEC 27001 Aligned</span>
        </div>

        {/* Report Findings Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="px-3 py-2.5">Target Candidate</th>
                <th className="px-3 py-2.5">Vector</th>
                <th className="px-3 py-2.5">Brand</th>
                <th className="px-3 py-2.5">Risk Score</th>
                <th className="px-3 py-2.5">Category</th>
                <th className="px-3 py-2.5">Analyst Status</th>
                <th className="px-3 py-2.5">Primary Flagged Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    <span>Compiling report view...</span>
                  </td>
                </tr>
              ) : previewDetections.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No detections match the selected report filter criteria.
                  </td>
                </tr>
              ) : (
                previewDetections.map((d) => (
                  <tr key={d._id} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2.5 font-semibold text-slate-900">
                      {d.candidateId?.usernameOrAppName || 'Unknown'}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">
                      {d.candidateId?.platformOrStore} ({d.candidateType})
                    </td>
                    <td className="px-3 py-2.5 font-medium text-slate-800">
                      {d.brandId?.name || 'Brand'}
                    </td>
                    <td className="px-3 py-2.5 font-mono font-bold">
                      {d.riskScore} / 100
                    </td>
                    <td className="px-3 py-2.5">
                      <RiskBadge category={d.riskCategory} score={d.riskScore} showScore={false} />
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="px-3 py-2.5 max-w-sm truncate text-slate-600 text-[11px]">
                      {d.explanation && d.explanation.length > 0 ? d.explanation[0] : 'Multiple signals'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Report Footer */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
          <span>BRANDTRACE Enterprise Threat Engine v1.0</span>
          <span>Page 1 of 1</span>
        </div>
      </div>
    </div>
  );
}
