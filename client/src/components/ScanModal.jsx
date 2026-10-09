import React, { useState, useEffect } from 'react';
import { brandService, scanService } from '../services/api';
import { Play, ShieldAlert, CheckCircle, AlertTriangle, X, Loader2 } from 'lucide-react';

export function ScanModal({ isOpen, onClose, onScanComplete, initialBrandId }) {
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(initialBrandId || '');
  const [scanType, setScanType] = useState('both');
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setScanResult(null);
      setError('');
      loadBrands();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialBrandId) {
      setSelectedBrand(initialBrandId);
    }
  }, [initialBrandId]);

  async function loadBrands() {
    try {
      setLoadingBrands(true);
      const res = await brandService.getAll();
      if (res.brands && res.brands.length > 0) {
        setBrands(res.brands);
        if (!selectedBrand) {
          setSelectedBrand(res.brands[0]._id);
        }
      }
    } catch (err) {
      setError('Unable to load configured brands.');
    } finally {
      setLoadingBrands(false);
    }
  }

  async function handleStartScan(e) {
    e.preventDefault();
    if (!selectedBrand) {
      setError('Please select a target brand.');
      return;
    }

    try {
      setIsScanning(true);
      setError('');
      setScanResult(null);

      const res = await scanService.createScan({
        brandId: selectedBrand,
        scanType,
        source: 'deterministic_sample'
      });

      setScanResult(res.scan);
      if (onScanComplete) {
        onScanComplete(res.scan);
      }
    } catch (err) {
      setError(err.message || 'Scan failed to execute.');
    } finally {
      setIsScanning(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded border border-blue-200">
              <Play className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Initiate Risk Scan</h3>
              <p className="text-xs text-slate-500">Scan candidates against official brand identity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isScanning}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!scanResult ? (
            <form onSubmit={handleStartScan} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Brand Profile
                </label>
                {loadingBrands ? (
                  <div className="h-9 bg-slate-100 rounded animate-pulse" />
                ) : (
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    disabled={isScanning || brands.length === 0}
                    className="w-full text-sm rounded border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {brands.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name} ({b.legalName || 'Registered Entity'})
                      </option>
                    ))}
                  </select>
                )}
                {brands.length === 0 && !loadingBrands && (
                  <p className="text-xs text-amber-600 mt-1">No brands configured yet. Please create a brand first.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Monitoring Scope
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <label className={`flex flex-col items-center justify-center p-3 rounded border text-xs font-medium cursor-pointer transition-colors ${scanType === 'both' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}>
                    <input
                      type="radio"
                      name="scanType"
                      value="both"
                      checked={scanType === 'both'}
                      onChange={() => setScanType('both')}
                      className="sr-only"
                    />
                    <span>Full Scan</span>
                    <span className="text-[10px] text-slate-500">Social + Apps</span>
                  </label>
                  <label className={`flex flex-col items-center justify-center p-3 rounded border text-xs font-medium cursor-pointer transition-colors ${scanType === 'social' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}>
                    <input
                      type="radio"
                      name="scanType"
                      value="social"
                      checked={scanType === 'social'}
                      onChange={() => setScanType('social')}
                      className="sr-only"
                    />
                    <span>Social Media</span>
                    <span className="text-[10px] text-slate-500">Profiles & Pages</span>
                  </label>
                  <label className={`flex flex-col items-center justify-center p-3 rounded border text-xs font-medium cursor-pointer transition-colors ${scanType === 'app' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}>
                    <input
                      type="radio"
                      name="scanType"
                      value="app"
                      checked={scanType === 'app'}
                      onChange={() => setScanType('app')}
                      className="sr-only"
                    />
                    <span>Mobile Apps</span>
                    <span className="text-[10px] text-slate-500">Store Listings</span>
                  </label>
                </div>
              </div>

              <div className="pt-2 text-xs text-slate-500 bg-slate-50 p-3 rounded border border-slate-200">
                <span className="font-semibold text-slate-700">Scan Pipeline:</span> Candidates will be gathered from active adapters, cross-referenced with the Official Asset Registry to exclude trusted entities, and scored using explainable name, logo, publisher, and keyword signals.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isScanning}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded border border-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isScanning || !selectedBrand}
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Scanning Candidates...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Execute Real Scan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold">Scan Completed Successfully</h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Pipeline executed in {scanResult.durationMs}ms across configured datasets.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                  <div className="text-xl font-bold text-slate-800">{scanResult.candidatesEvaluated}</div>
                  <div className="text-[11px] text-slate-500">Evaluated</div>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded">
                  <div className="text-xl font-bold text-emerald-700">{scanResult.excludedCount}</div>
                  <div className="text-[11px] text-emerald-600 font-medium">Excluded Official</div>
                </div>
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <div className="text-xl font-bold text-red-700">{scanResult.threatsFound}</div>
                  <div className="text-[11px] text-red-600 font-medium">Active Threats Found</div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setScanResult(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded border border-slate-300"
                >
                  Run Another
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm"
                >
                  View Updated Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
