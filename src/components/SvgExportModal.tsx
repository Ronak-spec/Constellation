import React, { useState, useMemo } from 'react';
import { StarEntry } from '../types/constellation';
import { 
  generateConstellationSvgString, 
  downloadConstellationSvg, 
  copyConstellationSvgToClipboard,
  SvgExportOptions 
} from '../utils/svgExporter';
import { formatDateLong } from '../utils/skyEngine';

interface SvgExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr: string;
  isToday: boolean;
  entries: StarEntry[];
  birthYear: number;
  lifeExp: number;
  userName?: string;
  constellationName?: string;
}

export function SvgExportModal({
  isOpen,
  onClose,
  dateStr,
  isToday,
  entries,
  birthYear,
  lifeExp,
  userName = 'Stargazer',
  constellationName,
}: SvgExportModalProps) {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const exportOptions: SvgExportOptions = useMemo(() => ({
    dateStr,
    isToday,
    entries,
    birthYear,
    lifeExp,
    userName,
    constellationName,
  }), [dateStr, isToday, entries, birthYear, lifeExp, userName, constellationName]);

  const svgContent = useMemo(() => {
    if (!isOpen) return '';
    return generateConstellationSvgString(exportOptions);
  }, [isOpen, exportOptions]);

  if (!isOpen) return null;

  const handleDownload = () => {
    downloadConstellationSvg(exportOptions);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  const handleCopyCode = async () => {
    const success = await copyConstellationSvgToClipboard(exportOptions);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6 overflow-y-auto font-sans-manrope">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
        aria-hidden="true" 
      />
      
      <div className="relative w-full max-w-3xl bg-[#080a1c] border border-[#F2C572]/40 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0c102c]/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[#F2C572] text-sm">✦</span>
              <h3 className="font-serif-cormorant text-xl sm:text-2xl font-medium text-[#EDEFF7]">
                Export Constellation Vector Map
              </h3>
            </div>
            <p className="text-[12px] text-[#8890AE] mt-0.5">
              High-resolution, standalone SVG graphic of {formatDateLong(dateStr)} ({entries.length} stars)
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[#8890AE] hover:text-white flex items-center justify-center transition-colors cursor-pointer text-base"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* SVG Graphic Live Preview Container */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 flex flex-col items-center bg-[#050611]">
          <div className="w-full rounded-xl overflow-hidden border border-white/15 shadow-2xl bg-[#080a1c] relative group">
            <div 
              className="w-full aspect-[4/3] max-h-[380px] sm:max-h-[440px] flex items-center justify-center overflow-hidden"
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
            <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-black/70 backdrop-blur border border-white/10 text-[10px] font-mono-dm text-[#F2C572]">
              1200 × 900 SVG
            </div>
          </div>

          <div className="w-full mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#8890AE]">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-[#4A7C59]" />
              <span>Includes embedded fonts, nebula styling, lines, &amp; category legend.</span>
            </div>
            <div className="font-mono-dm text-[11px] text-[#A9C0F0]">
              Ready for Figma, Illustrator, web sharing, or print
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-white/10 bg-[#0a0d24]">
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 text-xs text-[#EDEFF7] transition-all cursor-pointer font-medium"
          >
            <span>{copied ? '✓ SVG Copied!' : 'Copy SVG Code'}</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl hover:bg-white/5 text-xs text-[#8890AE] hover:text-[#EDEFF7] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F2C572] to-[#E5B55E] hover:brightness-110 text-[#080a1c] font-semibold text-xs transition-all shadow-lg cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>{downloaded ? '✓ Downloaded SVG!' : 'Download High-Res SVG (.svg)'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
