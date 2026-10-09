import React, { useState, useEffect } from 'react';
import { brandService } from '../services/api';
import {
  Building2,
  Plus,
  Globe,
  Archive,
  Play,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  ExternalLink,
  X,
  Upload
} from 'lucide-react';
import { ScanModal } from '../components/ScanModal';

export function BrandsPage() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeScanBrandId, setActiveScanBrandId] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [description, setDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [aliases, setAliases] = useState('');
  const [keywords, setKeywords] = useState('');
  const [trustedDomains, setTrustedDomains] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadBrands();
  }, []);

  async function loadBrands() {
    try {
      setLoading(true);
      setError('');
      const res = await brandService.getAll();
      setBrands(res.brands || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch brands.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBrand(e) {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('name', name.trim());
      if (legalName) formData.append('legalName', legalName.trim());
      if (description) formData.append('description', description.trim());
      if (websiteUrl) formData.append('websiteUrl', websiteUrl.trim());
      if (aliases) formData.append('aliases', aliases);
      if (keywords) formData.append('keywords', keywords);
      if (trustedDomains) formData.append('trustedDomains', trustedDomains);
      if (logoFile) formData.append('logo', logoFile);

      await brandService.create(formData);
      setIsCreateOpen(false);
      resetForm();
      await loadBrands();
    } catch (err) {
      alert(`Error creating brand: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleArchiveBrand(brandId, brandName) {
    if (!window.confirm(`Are you sure you want to archive brand '${brandName}'?`)) {
      return;
    }
    try {
      await brandService.archive(brandId);
      await loadBrands();
    } catch (err) {
      alert(`Failed to archive brand: ${err.message}`);
    }
  }

  function resetForm() {
    setName('');
    setLegalName('');
    setDescription('');
    setWebsiteUrl('');
    setAliases('');
    setKeywords('');
    setTrustedDomains('');
    setLogoFile(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Monitored Brand Profiles</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure organization trademarks, official domains, and aliases to detect impersonation
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setIsCreateOpen(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Brand Profile</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : brands.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-lg border border-slate-200 shadow-sm">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No Brand Profiles Registered</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Get started by registering your organization's primary brand identity and official digital assets.
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 shadow-sm"
          >
            Create First Brand
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brands.map((b) => (
            <div
              key={b._id}
              className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-blue-600 font-bold text-sm overflow-hidden">
                      {b.logoUrl ? (
                        <img src={b.logoUrl} alt={b.name} className="w-full h-full object-cover" />
                      ) : (
                        b.name.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{b.name}</h3>
                      <p className="text-xs text-slate-500 truncate max-w-[180px]">{b.legalName || 'Registered Trademark'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleArchiveBrand(b._id, b.name)}
                    title="Archive Brand"
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-slate-50 transition-colors"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                  {b.description || 'No description provided.'}
                </p>

                {b.websiteUrl && (
                  <div className="flex items-center gap-1.5 text-xs text-blue-600 mb-3 truncate">
                    <Globe className="w-3.5 h-3.5 shrink-0" />
                    <a href={b.websiteUrl} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">
                      {b.websiteUrl}
                    </a>
                  </div>
                )}

                {/* Aliases & Keywords tags */}
                <div className="space-y-2 mb-4">
                  {b.aliases && b.aliases.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Aliases:</span>
                      {b.aliases.slice(0, 3).map((a, i) => (
                        <span key={i} className="text-[11px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                          {a}
                        </span>
                      ))}
                    </div>
                  )}
                  {b.keywords && b.keywords.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Keywords:</span>
                      {b.keywords.slice(0, 3).map((k, i) => (
                        <span key={i} className="text-[11px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">
                          {k}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer: Metrics & Action */}
              <div className="pt-3 border-t border-slate-100">
                <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                  <div className="p-2 bg-slate-50 rounded border border-slate-100">
                    <div className="font-bold text-slate-800">{b.stats?.assetCount || 0}</div>
                    <div className="text-[10px] text-slate-500">Official Assets</div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-100">
                    <div className="font-bold text-slate-800">{b.stats?.totalCandidates || 0}</div>
                    <div className="text-[10px] text-slate-500">Candidates</div>
                  </div>
                  <div className="p-2 bg-red-50 rounded border border-red-100">
                    <div className="font-bold text-red-700">{b.stats?.activeThreatCount || 0}</div>
                    <div className="text-[10px] text-red-600 font-medium">Active Threats</div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveScanBrandId(b._id)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold transition-colors shadow-sm"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Scan This Brand</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Brand Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-semibold text-slate-900">Create Brand Profile</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateBrand} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Brand Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. AcmeCorp"
                  className="w-full text-sm rounded border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Legal / Registered Entity Name
                </label>
                <input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="e.g. Acme Corporation Inc."
                  className="w-full text-sm rounded border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Website URL
                </label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://acmecorp.com"
                  className="w-full text-sm rounded border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Brand Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summary of business operations, services, products..."
                  className="w-full text-sm rounded border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Known Brand Aliases
                  </label>
                  <input
                    type="text"
                    value={aliases}
                    onChange={(e) => setAliases(e.target.value)}
                    placeholder="Acme, AcmePay (comma separated)"
                    className="w-full text-sm rounded border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Relevant Keywords
                  </label>
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="fintech, payments, wallet"
                    className="w-full text-sm rounded border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Trusted Domains (comma separated)
                </label>
                <input
                  type="text"
                  value={trustedDomains}
                  onChange={(e) => setTrustedDomains(e.target.value)}
                  placeholder="acmecorp.com, acmecorp-api.com"
                  className="w-full text-sm rounded border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Brand Logo (PNG / JPG / WEBP)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded border border-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating Profile...' : 'Save Brand Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Scan Modal Triggered for Brand */}
      <ScanModal
        isOpen={Boolean(activeScanBrandId)}
        initialBrandId={activeScanBrandId}
        onClose={() => setActiveScanBrandId(null)}
        onScanComplete={() => {
          setActiveScanBrandId(null);
          loadBrands();
        }}
      />
    </div>
  );
}
