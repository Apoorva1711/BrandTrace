import React, { useState } from 'react';
import { Play, Activity, ShieldCheck, User } from 'lucide-react';
import { ScanModal } from '../components/ScanModal';

export function Navbar({ onScanFinished }) {
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Continuous Identity Protection Active</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsScanModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-sm transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Scan Now</span>
          </button>
        </div>
      </header>

      <ScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onScanComplete={(scan) => {
          if (onScanFinished) onScanFinished(scan);
        }}
      />
    </>
  );
}
