import React, { useState, useEffect } from 'react';
import { assetService, brandService } from '../services/api';
import {
  ShieldCheck,
  Plus,
  Trash2,
  Filter,
  ExternalLink,
  Loader2,
  X,
  Share2,
  Smartphone,
  Globe,
  Building,
  CheckCircle2
} from 'lucide-react';

export function AssetsPage() {
  const [assets, setAssets] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add Asset Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [brandId, setBrandId] = useState('');
  const [assetType, setAssetType] = useState('official_social_profile');
  const [identifier, setIdentifier] = useState('');
  const [url, setUrl] = useState('');
  const [platformOrStore, setPlatformOrStore] = useState('Twitter/X');
  const [publisherName, setPublisherName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadInitial();
  }, []);

  async function loadInitial() {
    try {
      setLoading(true);
      setError('');
      const [brandRes, assetRes] = await Promise.all([
        brandService.getAll(),
        assetService.getAll()
      ]);
      setBrands(brandRes.brands || []);
      setAssets(assetRes.assets || []);
      if (brandRes.brands && brandRes.brands.length > 0) {
        setBrandId(brandRes.brands[0]._id);
      }
    } catch (err) {
      setError(err.message || 'Failed to load official assets.');
    } finally {
      setLoading(false);
    }
  }

  async function loadAssets() {
    try {
      setLoading(true);
      const params = {};
      if (selectedBrand) params.brandId = selectedBrand;
      if (selectedType) params.assetType = selectedType;
      const res = await assetService.getAll(params);
      setAssets(res.assets || []);
    } catch (err) {
      setError(err.message || 'Error filtering assets.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAssets();
  }, [selectedBrand, selectedType]);

  async function handleCreateAsset(e) {
    e.preventDefault();
    if (!identifier.trim()) return;

    try {
      setIsSubmitting(true);
      await assetService.create({
        brandId,
        assetType,
        identifier: identifier.trim(),
        url: url.trim(),
        platformOrStore: platformOrStore.trim(),
        publisherName: publisherName.trim(),
        notes: notes.trim()
      });
      setIsModalOpen(false);
      resetForm();
      await loadAssets();
    } catch (err) {
      alert(`Error registering asset: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteAsset(id, name) {
    if (!window.confirm(`Are you sure you want to remove trusted asset '${name}'? Candidates matching this identifier will no longer be excluded from active threat findings.`)) {
      return;
    }
    try {
      await assetService.delete(id);
      await loadAssets();
    } catch (err) {
      alert(`Failed to delete asset: ${err.message}`);
    }
  }

  function resetForm() {
    setIdentifier('');
    setUrl('');
    setPublisherName('');
    setNotes('');
  }

  function getAssetIcon(type) {
    switch (type) {
      case 'official_social_profile':
      case 'official_company_page':
        return <Share2 className="w-3.5 h-3.5 text-blue-600" />;
      case 'official_mobile_app':
        return <Smartphone className="w-3.5 h-3.5 text-purple-600" />;
      case 'domain':
        return <Globe className="w-3.5 h-3.5 text-emerald-600" />;
      case 'trusted_publisher':
        return <Building className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Official Asset Registry</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified accounts, mobile package IDs, and domains used for exact exclusion to prevent false positives
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Register Trusted Asset</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter By:</span>
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
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="rounded border border-slate-300 px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Asset Types</option>
            <option value="official_social_profile">Official Social Profile</option>
            <option value="official_company_page">Official Company Page</option>
            <option value="official_mobile_app">Official Mobile App</option>
            <option value="domain">Official Domain</option>
            <option value="trusted_publisher">Trusted Publisher</option>
          </select>
        </div>
        <div className="text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-800">{assets.length}</span> trusted assets
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Asset Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Asset Type</th>
                <th className="px-4 py-3">Identifier / Handle / Package ID</th>
                <th className="px-4 py-3">Platform / Store</th>
                <th className="px-4 py-3">Brand</th>
                <th className="px-4 py-3">Normalized Target URL</th>
                <th className="px-4 py-3">Exclusion Rule</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    <span>Loading official asset registry...</span>
                  </td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No official assets match the selected filters.
                  </td>
                </tr>
              ) : (
                assets.map((a) => (
                  <tr key={a._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                        {getAssetIcon(a.assetType)}
                        <span className="capitalize">{a.assetType.replace(/_/g, ' ')}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 font-mono">
                      {a.identifier}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {a.platformOrStore || 'Universal'}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {a.brandId?.name || 'Brand'}
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate">
                      {a.url ? (
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1 truncate"
                        >
                          <span className="truncate">{a.url}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Exact Match Exclusion</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteAsset(a._id, a.identifier)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                        title="Remove from Registry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Asset Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-semibold text-slate-900">Register Official Brand Asset</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateAsset} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Brand Association *
                </label>
                <select
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                  className="w-full text-sm rounded border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {brands.map((b) => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Asset Category *
                </label>
                <select
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value)}
                  className="w-full text-sm rounded border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="official_social_profile">Official Social Profile (Handle/Page)</option>
                  <option value="official_company_page">Official Company Page</option>
                  <option value="official_mobile_app">Official Mobile App (Package ID)</option>
                  <option value="domain">Official Website Domain</option>
                  <option value="trusted_publisher">Trusted Publisher / Developer Entity</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Exact Identifier *
                </label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. AcmeOfficial or com.acme.app"
                  className="w-full text-sm rounded border border-slate-300 px-3 py-2 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">Exact handle without @, or bundle/package ID.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Platform / Store
                  </label>
                  <input
                    type="text"
                    value={platformOrStore}
                    onChange={(e) => setPlatformOrStore(e.target.value)}
                    placeholder="Twitter/X, Google Play..."
                    className="w-full text-sm rounded border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Publisher / Developer
                  </label>
                  <input
                    type="text"
                    value={publisherName}
                    onChange={(e) => setPublisherName(e.target.value)}
                    placeholder="Acme Inc."
                    className="w-full text-sm rounded border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Listing / Profile URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://twitter.com/AcmeOfficial"
                  className="w-full text-sm rounded border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Analyst Registry Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Verification verification badge details or notes..."
                  className="w-full text-sm rounded border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded border border-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Save Trusted Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
