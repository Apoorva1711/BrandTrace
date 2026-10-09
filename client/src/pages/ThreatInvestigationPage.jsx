import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { detectionService } from '../services/api';
import {
  ShieldAlert,
  ShieldCheck,
  Building,
  ExternalLink,
  Loader2,
  Clock,
  UserCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  MessageSquare,
  FileText,
  Smartphone,
  Share2,
  Send
} from 'lucide-react';
import { RiskBadge, StatusBadge } from '../components/Badges';

export function ThreatInvestigationPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Status Modal / Note state
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [generalNote, setGeneralNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [falsePositiveReason, setFalsePositiveReason] = useState('');

  useEffect(() => {
    loadInvestigation();
  }, [id]);

  async function loadInvestigation() {
    try {
      setLoading(true);
      setError('');
      const res = await detectionService.getById(id);
      setData(res);
    } catch (err) {
      setError(err.message || 'Unable to load threat investigation record.');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(targetStatus) {
    if (targetStatus === 'False Positive' && !falsePositiveReason.trim() && !statusNote.trim()) {
      alert('Security Protocol: A justification note is strictly required when declaring a finding as a False Positive.');
      return;
    }

    try {
      setIsUpdatingStatus(true);
      await detectionService.updateStatus(id, {
        status: targetStatus,
        note: statusNote.trim() || falsePositiveReason.trim(),
        falsePositiveReason: falsePositiveReason.trim()
      });
      setStatusNote('');
      setFalsePositiveReason('');
      setNewStatus('');
      await loadInvestigation();
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  async function handleAddNote(e) {
    e.preventDefault();
    if (!generalNote.trim()) return;

    try {
      setIsAddingNote(true);
      await detectionService.addNote(id, { note: generalNote.trim() });
      setGeneralNote('');
      await loadInvestigation();
    } catch (err) {
      alert(`Failed to append note: ${err.message}`);
    } finally {
      setIsAddingNote(false);
    }
  }

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Assembling threat telemetry and evidence breakdown...</p>
      </div>
    );
  }

  if (error || !data?.detection) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-slate-200">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-slate-800">Threat Finding Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">{error || 'This finding may have been removed or belongs to another organization.'}</p>
        <Link to="/detections" className="mt-4 inline-block text-xs font-semibold text-blue-600 hover:underline">
          Return to Detections Queue
        </Link>
      </div>
    );
  }

  const { detection, officialAssets, investigationNotes } = data;
  const cand = detection.candidateId || {};
  const brand = detection.brandId || {};
  const signals = detection.signals || {};

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            to="/detections"
            className="p-1.5 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-50 rounded border border-slate-200 shadow-xs transition-colors"
            title="Back to queue"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Case #{detection._id.slice(-6).toUpperCase()}: {cand.usernameOrAppName}
              </h1>
              <RiskBadge category={detection.riskCategory} score={detection.riskScore} />
              <StatusBadge status={detection.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Target Brand: <strong className="text-slate-800">{brand.name}</strong> • Vector: <span className="capitalize">{detection.candidateType}</span> ({cand.platformOrStore})
            </p>
          </div>
        </div>

        {/* Status Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {detection.status !== 'Under Review' && (
            <button
              onClick={() => handleStatusChange('Under Review')}
              disabled={isUpdatingStatus}
              className="px-3 py-1.5 bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 rounded text-xs font-semibold transition-colors"
            >
              Mark Under Review
            </button>
          )}

          {detection.status !== 'Suspected Impersonation' && (
            <button
              onClick={() => handleStatusChange('Suspected Impersonation')}
              disabled={isUpdatingStatus}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold shadow-xs transition-colors"
            >
              Confirm Impersonation
            </button>
          )}

          {detection.status !== 'False Positive' && (
            <button
              onClick={() => setNewStatus('False Positive')}
              disabled={isUpdatingStatus}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 rounded text-xs font-semibold transition-colors"
            >
              Declare False Positive
            </button>
          )}

          {detection.status !== 'Resolved' && (
            <button
              onClick={() => handleStatusChange('Resolved')}
              disabled={isUpdatingStatus}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-xs transition-colors"
            >
              Resolve Threat
            </button>
          )}
        </div>
      </div>

      {/* Justification Note Prompt when marking as False Positive */}
      {newStatus === 'False Positive' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Mandatory Justification for False Positive Exclusion</span>
            </h4>
            <button onClick={() => setNewStatus('')} className="text-amber-700 hover:text-amber-900 text-xs">
              Cancel
            </button>
          </div>
          <p className="text-xs text-amber-800">
            Explain why this candidate is benign or authorized. This note will be permanently logged in the audit trail.
          </p>
          <textarea
            rows={2}
            required
            value={falsePositiveReason}
            onChange={(e) => setFalsePositiveReason(e.target.value)}
            placeholder="e.g. Confirmed legitimate registered brand partner operating under licensed sub-agreement..."
            className="w-full text-xs rounded border border-amber-300 p-2.5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <div className="flex justify-end">
            <button
              onClick={() => handleStatusChange('False Positive')}
              disabled={!falsePositiveReason.trim() || isUpdatingStatus}
              className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded text-xs font-semibold disabled:opacity-50"
            >
              Submit & Confirm False Positive
            </button>
          </div>
        </div>
      )}

      {/* Recommended Action Notice Banner */}
      <div className="p-4 bg-slate-900 text-white rounded-lg shadow-sm flex items-start justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
            Analyst Recommendation
          </span>
          <p className="text-xs font-medium text-slate-200 mt-1 leading-relaxed">
            {detection.recommendedAction || 'Perform standard identity verification and check external links.'}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[10px] text-slate-400 font-medium">Risk Score Weight</div>
          <div className="text-xl font-bold font-mono text-white">{detection.riskScore} / 100</div>
        </div>
      </div>

      {/* Main Grid: Evidence Breakdown & Candidate Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Evidence Signals Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Signal Cards Breakdown */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Explainable Signal Telemetry</h3>
            <p className="text-xs text-slate-500">Individual points allocated by the 100-point transparent risk algorithm</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {/* Signal 1: Name Similarity */}
              <div className="p-3.5 bg-slate-50 rounded border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">1. Name Similarity</span>
                  <span className="font-mono font-bold text-blue-700">
                    +{signals.name_similarity_score || 0} / 30 pts
                  </span>
                </div>
                <div className="text-[11px] text-slate-600">
                  Ratio: <strong>{signals.name_similarity_ratio || 0}%</strong> • Match Pattern: <code className="text-slate-800 bg-white px-1 py-0.5 rounded border border-slate-200">{signals.name_match_type || 'none'}</code>
                </div>
                <p className="text-[11px] text-slate-500 italic">
                  Evaluated against brand '{brand.name}' and known aliases.
                </p>
              </div>

              {/* Signal 2: Perceptual Logo Similarity */}
              <div className="p-3.5 bg-slate-50 rounded border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">2. Logo Similarity</span>
                  <span className="font-mono font-bold text-blue-700">
                    +{signals.logo_similarity_score || 0} / 25 pts
                  </span>
                </div>
                <div className="text-[11px] text-slate-600">
                  {signals.logo_evaluated ? (
                    <span>Hamming Distance: <strong>{signals.logo_hash_distance}</strong> (dHash algorithm)</span>
                  ) : (
                    <span className="text-slate-400 italic">Not evaluated (image hash unavailable)</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Strictly avoids inventing a score when images cannot be compared.
                </p>
              </div>

              {/* Signal 3: Publisher Mismatch */}
              <div className="p-3.5 bg-slate-50 rounded border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">3. Publisher Mismatch</span>
                  <span className="font-mono font-bold text-blue-700">
                    +{signals.publisher_mismatch_score || 0} / 20 pts
                  </span>
                </div>
                <div className="text-[11px] text-slate-600">
                  Verdict: <code className="text-slate-800 bg-white px-1 py-0.5 rounded border border-slate-200">{signals.publisher_evaluation || 'verified'}</code>
                </div>
                <p className="text-[11px] text-slate-500">
                  Third-party developer publishing branded mobile applications.
                </p>
              </div>

              {/* Signal 4: Contextual Keywords */}
              <div className="p-3.5 bg-slate-50 rounded border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">4. Context Keywords</span>
                  <span className="font-mono font-bold text-blue-700">
                    +{signals.context_indicators_score || 0} / 15 pts
                  </span>
                </div>
                <div className="text-[11px] text-slate-600">
                  Flagged: {signals.flagged_keywords && signals.flagged_keywords.length > 0 ? (
                    <span className="font-semibold text-red-700">{signals.flagged_keywords.join(', ')}</span>
                  ) : (
                    <span className="text-slate-400 italic">None detected</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Scanned for high-risk phrases (support, claim bonus, reset password).
                </p>
              </div>
            </div>

            {/* Signal 5: External Link */}
            <div className="p-3.5 bg-slate-50 rounded border border-slate-200 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">5. External Link / Redirection</span>
                <span className="font-mono font-bold text-blue-700">
                  +{signals.external_link_score || 0} / 10 pts
                </span>
              </div>
              <div className="text-[11px] text-slate-600">
                Evaluation: <code className="text-slate-800 bg-white px-1 py-0.5 rounded border border-slate-200">{signals.link_evaluation || 'neutral'}</code>
              </div>
              <p className="text-[11px] text-slate-500 font-mono truncate">
                Target: {cand.externalUrl || 'None'}
              </p>
            </div>
          </div>

          {/* Contributing Reasons Narrative */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Audit Trail of Flagged Evidence</h3>
            <ul className="space-y-2 text-xs text-slate-700">
              {detection.explanation && detection.explanation.length > 0 ? (
                detection.explanation.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 p-2 bg-slate-50 rounded border border-slate-150">
                    <span className="text-blue-600 font-bold mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))
              ) : (
                <li className="text-slate-400 italic">No detailed explanation recorded.</li>
              )}
            </ul>
          </div>

          {/* Official Asset Comparison */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Official Brand Assets Comparison</h3>
            <p className="text-xs text-slate-500">
              Cross-checked against registered official assets for '{brand.name}'. Did not match exact exclusion rules.
            </p>

            <div className="space-y-2">
              {officialAssets && officialAssets.length > 0 ? (
                officialAssets.slice(0, 4).map((oa) => (
                  <div key={oa._id} className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-900 capitalize">{oa.assetType.replace(/_/g, ' ')}: </span>
                      <span className="font-mono text-slate-700">{oa.identifier}</span>
                      <span className="text-slate-400 text-[11px]"> ({oa.platformOrStore})</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Official Asset</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 italic">No official assets registered for this brand.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Candidate Metadata & Analyst Notes */}
        <div className="space-y-6">
          {/* Candidate Card */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">Candidate Identity</h3>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Account / Title</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{cand.usernameOrAppName}</p>
              {cand.displayName && <p className="text-slate-500 text-[11px]">{cand.displayName}</p>}
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Platform / Store</span>
              <p className="font-medium text-slate-800 mt-0.5">{cand.platformOrStore}</p>
            </div>

            {cand.packageId && (
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Package Identifier</span>
                <p className="font-mono text-[11px] text-slate-800 bg-slate-50 p-1.5 rounded border border-slate-200 mt-0.5">
                  {cand.packageId}
                </p>
              </div>
            )}

            {cand.publisherName && (
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Developer Entity</span>
                <p className="font-medium text-slate-800 mt-0.5">{cand.publisherName}</p>
              </div>
            )}

            {cand.description && (
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Biography / Description</span>
                <div className="mt-1 p-2 bg-slate-50 rounded border border-slate-200 text-slate-700 text-[11px] max-h-32 overflow-y-auto leading-relaxed">
                  {cand.description}
                </div>
              </div>
            )}

            {cand.url && (
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Listing URL</span>
                <a
                  href={cand.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1 mt-0.5 break-all text-[11px]"
                >
                  <span>{cand.url}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400">
              First Seen: {cand.firstSeen ? new Date(cand.firstSeen).toLocaleDateString() : 'N/A'}<br />
              Source: {cand.source || 'Deterministic Sample'}
            </div>
          </div>

          {/* Investigation History & Analyst Notes Timeline */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span>Investigation Log & Notes</span>
            </h3>

            {/* Add note form */}
            <form onSubmit={handleAddNote} className="space-y-2">
              <textarea
                rows={2}
                value={generalNote}
                onChange={(e) => setGeneralNote(e.target.value)}
                placeholder="Add internal analyst note or case update..."
                className="w-full text-xs rounded border border-slate-300 p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!generalNote.trim() || isAddingNote}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs disabled:opacity-50 flex items-center gap-1"
                >
                  <Send className="w-3 h-3" />
                  <span>Post Note</span>
                </button>
              </div>
            </form>

            {/* Notes Timeline List */}
            <div className="space-y-3 pt-2 max-h-80 overflow-y-auto">
              {investigationNotes && investigationNotes.length > 0 ? (
                investigationNotes.map((note) => (
                  <div key={note._id} className="p-3 bg-slate-50 rounded border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-800">{note.author}</span>
                      <span className="text-slate-400">
                        {note.timestamp ? new Date(note.timestamp).toLocaleString() : ''}
                      </span>
                    </div>
                    {note.previousStatus && note.newStatus && (
                      <div className="text-[10px] text-slate-500 font-medium">
                        Transition: {note.previousStatus} → <strong className="text-slate-700">{note.newStatus}</strong>
                      </div>
                    )}
                    <p className="text-slate-700 mt-1 whitespace-pre-wrap">{note.note}</p>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 text-center py-4 italic">
                  No notes recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
