import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  PenTool, 
  Sparkles, 
  Trash2, 
  RotateCcw, 
  Download, 
  Save, 
  Volume2, 
  Plus, 
  Check, 
  Compass, 
  Layers, 
  Palette,
  BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CustomConstellation, CustomStarNode, SpectralClass } from '../types/astronomy';
import { celestialAudio } from '../utils/audioSynth';
import { SPECTRAL_COLORS } from '../utils/celestialMath';

interface ConstellationStudioProps {
  onSaveToGallery: (constellation: CustomConstellation) => void;
  savedCustomConstellations: CustomConstellation[];
  onDeleteCustomConstellation: (id: string) => void;
}

export function ConstellationStudio({
  onSaveToGallery,
  savedCustomConstellations,
  onDeleteCustomConstellation
}: ConstellationStudioProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Studio canvas state
  const [stars, setStars] = useState<CustomStarNode[]>([]);
  const [lines, setLines] = useState<Array<[number, number]>>([]);
  const [selectedStarIndex, setSelectedStarIndex] = useState<number | null>(null);
  
  // Constellation metadata form
  const [name, setName] = useState('Novastella');
  const [latinName, setLatinName] = useState('Stella Nova');
  const [creatorName, setCreatorName] = useState('');
  const [symbol, setSymbol] = useState('✨');
  const [myth, setMyth] = useState('A celestial compass forged by ancient navigators to find their way across uncharted cosmic seas.');
  const [season, setSeason] = useState('Autumn');
  const [colorTheme, setColorTheme] = useState<'cyan' | 'gold' | 'purple' | 'emerald'>('cyan');
  
  const [isSaved, setIsSaved] = useState(false);

  // Initialize with an inviting starter starfield
  useEffect(() => {
    generateDefaultStarfield();
  }, []);

  const generateDefaultStarfield = () => {
    const seedStars: CustomStarNode[] = [
      { id: 'cs_1', x: 0.28, y: 0.35, name: 'Alpha Primus', mag: 1.2, spectralType: 'A' },
      { id: 'cs_2', x: 0.42, y: 0.22, name: 'Beta Radiant', mag: 2.1, spectralType: 'B' },
      { id: 'cs_3', x: 0.58, y: 0.25, name: 'Gamma Lucis', mag: 1.8, spectralType: 'K' },
      { id: 'cs_4', x: 0.72, y: 0.40, name: 'Delta Horizon', mag: 2.4, spectralType: 'F' },
      { id: 'cs_5', x: 0.50, y: 0.60, name: 'Epsilon Core', mag: 0.9, spectralType: 'O' },
      { id: 'cs_6', x: 0.35, y: 0.72, name: 'Zeta Anchor', mag: 2.7, spectralType: 'M' },
      { id: 'cs_7', x: 0.65, y: 0.70, name: 'Eta Zenith', mag: 2.5, spectralType: 'G' },
    ];
    setStars(seedStars);
    setLines([
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [4, 5], [4, 6]
    ]);
    setSelectedStarIndex(null);
  };

  const clearCanvas = () => {
    setStars([]);
    setLines([]);
    setSelectedStarIndex(null);
  };

  // Color themes
  const THEME_CONFIGS = {
    cyan: {
      line: 'rgba(56, 189, 248, 0.85)',
      glow: '#38bdf8',
      hex: '#38bdf8',
      label: 'Astral Cyan',
    },
    gold: {
      line: 'rgba(251, 191, 36, 0.85)',
      glow: '#fbbf24',
      hex: '#fbbf24',
      label: 'Solar Gold',
    },
    purple: {
      line: 'rgba(192, 132, 252, 0.85)',
      glow: '#c084fc',
      hex: '#c084fc',
      label: 'Nebula Violet',
    },
    emerald: {
      line: 'rgba(52, 211, 153, 0.85)',
      glow: '#34d399',
      hex: '#34d399',
      label: 'Aurora Emerald',
    },
  };

  // Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Background Gradient
    const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 40, width / 2, height / 2, width * 0.7);
    bgGrad.addColorStop(0, '#0c112e');
    bgGrad.addColorStop(0.6, '#060918');
    bgGrad.addColorStop(1, '#03040c');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Decorative antique grid rings
    ctx.save();
    ctx.strokeStyle = 'rgba(70, 95, 150, 0.12)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, width * 0.38, 0, Math.PI * 2);
    ctx.arc(width / 2, height / 2, width * 0.22, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(width / 2, 20);
    ctx.lineTo(width / 2, height - 20);
    ctx.moveTo(20, height / 2);
    ctx.lineTo(width - 20, height / 2);
    ctx.stroke();
    ctx.restore();

    const theme = THEME_CONFIGS[colorTheme];

    // Render Asterism Lines
    ctx.save();
    ctx.strokeStyle = theme.line;
    ctx.lineWidth = 2.2;
    ctx.shadowColor = theme.glow;
    ctx.shadowBlur = 8;

    lines.forEach(([i1, i2]) => {
      const s1 = stars[i1];
      const s2 = stars[i2];
      if (s1 && s2) {
        ctx.beginPath();
        ctx.moveTo(s1.x * width, s1.y * height);
        ctx.lineTo(s2.x * width, s2.y * height);
        ctx.stroke();
      }
    });
    ctx.restore();

    // Render Stars
    stars.forEach((star, idx) => {
      const px = star.x * width;
      const py = star.y * height;
      const isSelected = selectedStarIndex === idx;

      // Glow
      ctx.beginPath();
      const glowGrad = ctx.createRadialGradient(px, py, 0, px, py, isSelected ? 22 : 14);
      glowGrad.addColorStop(0, isSelected ? 'rgba(255, 255, 255, 0.8)' : 'rgba(186, 230, 253, 0.4)');
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGrad;
      ctx.arc(px, py, isSelected ? 22 : 14, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.fillStyle = isSelected ? '#ffffff' : SPECTRAL_COLORS[star.spectralType]?.main || '#ffffff';
      ctx.arc(px, py, isSelected ? 5.5 : 4, 0, Math.PI * 2);
      ctx.fill();

      // Selection Ring
      if (isSelected) {
        ctx.beginPath();
        ctx.strokeStyle = theme.glow;
        ctx.lineWidth = 1.5;
        ctx.arc(px, py, 10, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Label
      ctx.font = isSelected ? 'bold 11px "Space Mono", monospace' : '9px "Space Mono", monospace';
      ctx.fillStyle = isSelected ? '#ffffff' : 'rgba(226, 232, 240, 0.7)';
      ctx.fillText(star.name, px + 8, py + 3);
    });

  }, [stars, lines, selectedStarIndex, colorTheme]);

  // Click handler on studio canvas: create or connect stars
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;

    // Check if clicked an existing star
    const hitIdx = stars.findIndex(s => {
      const dx = (s.x - clickX) * rect.width;
      const dy = (s.y - clickY) * rect.height;
      return Math.hypot(dx, dy) < 18;
    });

    if (hitIdx !== -1) {
      // Star clicked
      if (selectedStarIndex === null) {
        // Select first star
        setSelectedStarIndex(hitIdx);
        celestialAudio.playStarTone(stars[hitIdx].spectralType, stars[hitIdx].mag, 0.3);
      } else if (selectedStarIndex === hitIdx) {
        // Deselect
        setSelectedStarIndex(null);
      } else {
        // Connect lines between selectedStarIndex and hitIdx
        const alreadyConnected = lines.some(
          ([a, b]) => (a === selectedStarIndex && b === hitIdx) || (a === hitIdx && b === selectedStarIndex)
        );

        if (alreadyConnected) {
          // Remove connection
          setLines(prev => prev.filter(
            ([a, b]) => !((a === selectedStarIndex && b === hitIdx) || (a === hitIdx && b === selectedStarIndex))
          ));
        } else {
          // Add connection
          setLines(prev => [...prev, [selectedStarIndex, hitIdx]]);
          celestialAudio.playStarTone(stars[hitIdx].spectralType, stars[hitIdx].mag, 0.3);
        }
        setSelectedStarIndex(hitIdx);
      }
    } else {
      // Empty space clicked: place a new star!
      const spectralTypes: SpectralClass[] = ['O', 'B', 'A', 'F', 'G', 'K', 'M'];
      const randomType = spectralTypes[Math.floor(Math.random() * spectralTypes.length)];
      const GreekNames = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa', 'Lambda', 'Mu'];
      const starName = `${GreekNames[stars.length % GreekNames.length]} ${name.split(' ')[0] || 'Astra'}`;

      const newStar: CustomStarNode = {
        id: `cs_${Date.now()}`,
        x: clickX,
        y: clickY,
        name: starName,
        mag: 1.0 + Math.random() * 2.5,
        spectralType: randomType,
      };

      const newIndex = stars.length;
      setStars(prev => [...prev, newStar]);
      
      if (selectedStarIndex !== null) {
        setLines(prev => [...prev, [selectedStarIndex, newIndex]]);
      }
      setSelectedStarIndex(newIndex);
      celestialAudio.playStarTone(randomType, newStar.mag, 0.35);
    }
  };

  const handleSave = () => {
    if (stars.length === 0) return;

    const newConstellation: CustomConstellation = {
      id: `custom_${Date.now()}`,
      name: name || 'Untitled Asterism',
      latinName: latinName || name,
      creatorName: creatorName || 'Celestial Stargazer',
      symbol: symbol || '✨',
      myth: myth || 'A newly discovered celestial asterism etched into the eternal sky.',
      season,
      stars,
      lines,
      createdAt: new Date().toLocaleDateString(),
      colorTheme,
    };

    onSaveToGallery(newConstellation);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 }
    });

    celestialAudio.playConstellationChord(stars.length);
  };

  // Export high-resolution antique astronomical chart card as PNG
  const handleExportPNG = () => {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 1200;
    exportCanvas.height = 1200;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#050816';
    ctx.fillRect(0, 0, 1200, 1200);

    // Antique border rings & coordinate frames
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.strokeRect(40, 40, 1120, 1120);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(55, 55, 1090, 1090);

    // Title Header
    ctx.font = 'bold 44px "Cinzel", serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(name.toUpperCase(), 600, 120);

    ctx.font = 'italic 22px "Cinzel", serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(latinName, 600, 160);

    // Chart Center Area (800x800 offset)
    const offsetX = 200;
    const offsetY = 220;
    const chartW = 800;
    const chartH = 800;

    // Center background circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(600, 620, 380, 0, Math.PI * 2);
    ctx.fillStyle = '#080d28';
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 8]);
    ctx.stroke();
    ctx.restore();

    // Render Lines
    const theme = THEME_CONFIGS[colorTheme];
    ctx.strokeStyle = theme.hex;
    ctx.lineWidth = 4;
    ctx.shadowColor = theme.hex;
    ctx.shadowBlur = 12;

    lines.forEach(([i1, i2]) => {
      const s1 = stars[i1];
      const s2 = stars[i2];
      if (s1 && s2) {
        ctx.beginPath();
        ctx.moveTo(offsetX + s1.x * chartW, offsetY + s1.y * chartH);
        ctx.lineTo(offsetX + s2.x * chartW, offsetY + s2.y * chartH);
        ctx.stroke();
      }
    });

    // Render Stars
    stars.forEach(s => {
      const sx = offsetX + s.x * chartW;
      const sy = offsetY + s.y * chartH;
      ctx.beginPath();
      ctx.fillStyle = '#ffffff';
      ctx.arc(sx, sy, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = 'bold 16px "Space Mono", monospace';
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(s.name, sx + 14, sy + 5);
    });

    // Footer Lore & Credits
    ctx.font = 'italic 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText(`"${myth}"`, 600, 1070);

    ctx.font = '14px "Space Mono", monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`Catalogued by ${creatorName || 'Celestial Stargazer'} • Constelletion Sky Atlas`, 600, 1115);

    // Trigger download
    const link = document.createElement('a');
    link.download = `${name.toLowerCase().replace(/\s+/g, '_')}_celestial_chart.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/60 text-xs font-mono-astronomy mb-2">
            <PenTool className="w-3.5 h-3.5" />
            <span>Interactive Celestial Cartography Studio</span>
          </div>
          <h1 className="font-cinzel text-3xl font-black text-slate-100 tracking-wide">
            Constellation Studio
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Draw and connect stars on the celestial canvas, compose ancient folklore, and export your personal celestial star chart.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={generateDefaultStarfield}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 text-slate-300 hover:text-slate-100 border border-slate-800 text-xs font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Preset Asterism</span>
          </button>

          <button
            onClick={clearCanvas}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/30 text-rose-300 hover:bg-rose-950/60 border border-rose-900/40 text-xs font-medium transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Sky</span>
          </button>

          <button
            onClick={handleExportPNG}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold shadow-md transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Chart PNG</span>
          </button>

          <button
            onClick={handleSave}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all ${
              isSaved
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:brightness-110'
            }`}
          >
            {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{isSaved ? 'Saved to Gallery!' : 'Save Constellation'}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Workspace: Left Canvas + Right Metadata Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Starry Canvas */}
        <div className="lg:col-span-8 flex flex-col space-y-3">
          <div className="relative rounded-3xl bg-[#050818] border border-cyan-800/40 overflow-hidden shadow-2xl p-2 aspect-[4/3] flex items-center justify-center">
            
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              onClick={handleCanvasClick}
              className="w-full h-full rounded-2xl cursor-crosshair block"
            />

            {/* Instruction Overlay Pill */}
            <div className="absolute top-4 left-4 pointer-events-none bg-[#090e24]/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/60 text-[11px] text-slate-300 font-mono-astronomy">
              ✦ Click to place stars • Click 2 stars to link/unlink lines
            </div>

            {/* Star & Line Count */}
            <div className="absolute top-4 right-4 pointer-events-none bg-[#090e24]/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/60 text-[11px] text-slate-300 font-mono-astronomy flex items-center gap-3">
              <span>Stars: <strong className="text-cyan-300">{stars.length}</strong></span>
              <span>Lines: <strong className="text-amber-300">{lines.length}</strong></span>
            </div>
          </div>

          {/* Quick theme colors */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#080d26] border border-slate-800 text-xs">
            <span className="text-slate-400 font-mono-astronomy text-[11px]">Constellation Glow Theme:</span>
            <div className="flex items-center gap-2">
              {(['cyan', 'gold', 'purple', 'emerald'] as const).map(th => (
                <button
                  key={th}
                  onClick={() => setColorTheme(th)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs transition-all ${
                    colorTheme === th
                      ? 'bg-slate-800 text-slate-100 border-cyan-400 font-bold'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span 
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: THEME_CONFIGS[th].hex }}
                  />
                  <span>{THEME_CONFIGS[th].label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Constellation Information & Lore Form */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-3xl bg-[#080d26] border border-slate-800/90 shadow-xl space-y-4">
            <h3 className="font-cinzel text-base font-bold text-slate-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Constellation Registry</span>
            </h3>

            {/* Constellation Name */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono-astronomy text-slate-400 uppercase">Constellation Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Novastella, Phoenix Solaris"
                className="w-full bg-[#050818] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            {/* Latin Name & Glyph */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 space-y-1.5">
                <label className="text-[11px] font-mono-astronomy text-slate-400 uppercase">Latin Designation</label>
                <input
                  type="text"
                  value={latinName}
                  onChange={e => setLatinName(e.target.value)}
                  placeholder="e.g. Stella Nova"
                  className="w-full bg-[#050818] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono-astronomy text-slate-400 uppercase">Glyph</label>
                <input
                  type="text"
                  value={symbol}
                  onChange={e => setSymbol(e.target.value)}
                  className="w-full bg-[#050818] border border-slate-800 rounded-xl px-3 py-2 text-center text-sm text-slate-100 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            {/* Season & Cartographer */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono-astronomy text-slate-400 uppercase">Season</label>
                <select
                  value={season}
                  onChange={e => setSeason(e.target.value)}
                  className="w-full bg-[#050818] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
                >
                  <option value="Spring">Spring</option>
                  <option value="Summer">Summer</option>
                  <option value="Autumn">Autumn</option>
                  <option value="Winter">Winter</option>
                  <option value="Circumpolar">Circumpolar</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono-astronomy text-slate-400 uppercase">Cartographer</label>
                <input
                  type="text"
                  value={creatorName}
                  onChange={e => setCreatorName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full bg-[#050818] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            {/* Mythology Story */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono-astronomy text-slate-400 uppercase">Mythology & Lore</label>
              <textarea
                value={myth}
                onChange={e => setMyth(e.target.value)}
                rows={4}
                placeholder="Write the origin myth, ancient folklore, or sacred tale behind your constellation..."
                className="w-full bg-[#050818] border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-amber-500/50 resize-none leading-relaxed"
              />
            </div>

          </div>
        </div>

      </div>

      {/* User Custom Constellation Gallery */}
      {savedCustomConstellations.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <h3 className="font-cinzel text-xl font-bold text-slate-100">Your Celestial Creations</h3>
            <span className="text-xs font-mono-astronomy text-slate-400">{savedCustomConstellations.length} catalogued</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedCustomConstellations.map(c => (
              <div
                key={c.id}
                className="p-4 rounded-2xl bg-[#080d26] border border-slate-800 space-y-3 shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{c.symbol}</span>
                      <h4 className="font-cinzel font-bold text-slate-100">{c.name}</h4>
                    </div>
                    <p className="text-[11px] text-slate-400 italic">{c.latinName}</p>
                  </div>
                  <button
                    onClick={() => onDeleteCustomConstellation(c.id)}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded-lg"
                    title="Delete custom constellation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 bg-[#050818]/60 p-2.5 rounded-xl border border-slate-800">
                  {c.myth}
                </p>

                <div className="flex items-center justify-between text-[10px] font-mono-astronomy text-slate-400 pt-2 border-t border-slate-800">
                  <span>By {c.creatorName}</span>
                  <span>{c.stars.length} Stars • {c.lines.length} Lines</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
