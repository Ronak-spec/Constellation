import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Orbit, 
  BookOpen, 
  Compass, 
  Flame, 
  Volume2, 
  Layers, 
  Star as StarIcon, 
  Info,
  Calendar,
  Globe,
  Radio
} from 'lucide-react';
import { Constellation, Star, DeepSkyObject } from '../types/astronomy';
import { celestialAudio } from '../utils/audioSynth';
import { SPECTRAL_COLORS } from '../utils/celestialMath';

interface ConstellationDrawerProps {
  constellation: Constellation | null;
  selectedStar: Star | null;
  onClose: () => void;
  onSelectStar: (star: Star | null) => void;
  onFocusConstellation: (c: Constellation) => void;
}

export function ConstellationDrawer({
  constellation,
  selectedStar,
  onClose,
  onSelectStar,
  onFocusConstellation
}: ConstellationDrawerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'stars' | 'myths' | 'deepsky'>('overview');

  if (!constellation && !selectedStar) return null;

  const handlePlayChord = () => {
    if (constellation) {
      celestialAudio.playConstellationChord(constellation.stars.length);
    }
  };

  const handlePlayStarSound = (star: Star) => {
    onSelectStar(star);
    celestialAudio.playStarTone(star.spectralType, star.mag, 0.35);
  };

  return (
    <div className="fixed top-16 right-0 bottom-0 w-full sm:w-[460px] z-40 bg-[#070b1e]/95 backdrop-blur-2xl border-l border-cyan-900/40 shadow-2xl flex flex-col transition-transform duration-300">
      
      {/* Header with Title & Close */}
      <div className="p-5 border-b border-slate-800/80 bg-[#090f2b]/80 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">{constellation?.zodiacSymbol || '✨'}</span>
            <h2 className="font-cinzel text-xl font-bold text-slate-100 tracking-wide">
              {constellation ? constellation.name : selectedStar?.name}
            </h2>
            {constellation && (
              <span className="text-[10px] font-mono-astronomy px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50">
                {constellation.abbreviation}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {constellation ? `${constellation.englishName} • ${constellation.genitive}` : `Star in ${selectedStar?.constellationId}`}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {constellation && (
            <button
              onClick={handlePlayChord}
              className="p-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/50 text-cyan-300 transition-colors"
              title="Play Constellation Harmonic Chord"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
            title="Close Drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      {constellation && (
        <div className="flex items-center border-b border-slate-800/80 bg-[#070c24] px-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 py-3 px-3 border-b-2 text-xs font-medium transition-all ${
              activeTab === 'overview'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('stars')}
            className={`flex items-center gap-1.5 py-3 px-3 border-b-2 text-xs font-medium transition-all ${
              activeTab === 'stars'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <StarIcon className="w-3.5 h-3.5" />
            <span>Stars ({constellation.stars.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('myths')}
            className={`flex items-center gap-1.5 py-3 px-3 border-b-2 text-xs font-medium transition-all ${
              activeTab === 'myths'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Myths ({constellation.myths.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('deepsky')}
            className={`flex items-center gap-1.5 py-3 px-3 border-b-2 text-xs font-medium transition-all ${
              activeTab === 'deepsky'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Deep Sky & Showers</span>
          </button>
        </div>
      )}

      {/* Content Scroll Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">

        {/* Selected Star Details Card (if star is active) */}
        {selectedStar && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-[#0d1436] border border-cyan-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono-astronomy text-cyan-400 tracking-wider">Selected Star</span>
                <h3 className="text-base font-cinzel font-bold text-slate-100">{selectedStar.name}</h3>
                {selectedStar.bayer && <span className="text-xs text-slate-400 font-mono-astronomy">{selectedStar.bayer}</span>}
              </div>
              <button
                onClick={() => handlePlayStarSound(selectedStar)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-medium hover:bg-cyan-500/30 transition-all"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Hear Frequency</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono-astronomy">
              <div className="p-2 rounded-xl bg-slate-900/70 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Spectral Class</span>
                <span 
                  className="font-bold text-sm"
                  style={{ color: selectedStar.color }}
                >
                  Type {selectedStar.spectralType}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-slate-900/70 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Apparent Mag</span>
                <span className="font-bold text-sm text-cyan-300">{selectedStar.mag.toFixed(2)}</span>
              </div>

              <div className="p-2 rounded-xl bg-slate-900/70 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Distance</span>
                <span className="font-bold text-sm text-slate-200">{selectedStar.distLy} ly</span>
              </div>

              {selectedStar.temperatureK && (
                <div className="p-2 rounded-xl bg-slate-900/70 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Temperature</span>
                  <span className="font-bold text-sm text-amber-300">{selectedStar.temperatureK.toLocaleString()} K</span>
                </div>
              )}

              {selectedStar.luminosity && (
                <div className="p-2 rounded-xl bg-slate-900/70 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Luminosity</span>
                  <span className="font-bold text-sm text-indigo-300">{selectedStar.luminosity.toLocaleString()} L☉</span>
                </div>
              )}

              {selectedStar.radiusSolar && (
                <div className="p-2 rounded-xl bg-slate-900/70 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Radius</span>
                  <span className="font-bold text-sm text-emerald-300">{selectedStar.radiusSolar} R☉</span>
                </div>
              )}
            </div>

            {selectedStar.notes && (
              <p className="text-xs text-slate-300 italic bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/80">
                "{selectedStar.notes}"
              </p>
            )}
          </div>
        )}

        {/* Tab 1: Overview */}
        {constellation && activeTab === 'overview' && (
          <div className="space-y-5">
            {/* Quick Astronomical Stats */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono-astronomy">
              <div className="p-3 rounded-xl bg-[#0a102e] border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Family</span>
                <span className="font-medium text-slate-200">{constellation.family}</span>
              </div>

              <div className="p-3 rounded-xl bg-[#0a102e] border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Hemisphere</span>
                <span className="font-medium text-slate-200">{constellation.hemisphere}</span>
              </div>

              <div className="p-3 rounded-xl bg-[#0a102e] border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Prime Season</span>
                <span className="font-medium text-emerald-300">{constellation.season}</span>
              </div>

              <div className="p-3 rounded-xl bg-[#0a102e] border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Sky Area</span>
                <span className="font-medium text-cyan-300">{constellation.areaSqDeg} sq deg</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-cinzel font-bold text-slate-300 uppercase tracking-wider">Astrophysical Profile</h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-[#0a102e]/60 p-3.5 rounded-xl border border-slate-800">
                {constellation.description}
              </p>
            </div>

            {/* Main Lore */}
            <div className="space-y-2">
              <h4 className="text-xs font-cinzel font-bold text-slate-300 uppercase tracking-wider">Celestial Lore</h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-[#0a102e]/60 p-3.5 rounded-xl border border-slate-800">
                {constellation.lore}
              </p>
            </div>

            {/* Visibility Note */}
            {constellation.visibilityNote && (
              <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/40 flex items-start gap-2.5">
                <Globe className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <p className="text-xs text-cyan-200">{constellation.visibilityNote}</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Stars in Constellation */}
        {constellation && activeTab === 'stars' && (
          <div className="space-y-3">
            <p className="text-[11px] text-slate-400 font-mono-astronomy">
              Click any star to highlight on the sky dome and synthesize its frequency:
            </p>

            <div className="space-y-2">
              {constellation.stars.map((star) => {
                const isSelected = selectedStar?.id === star.id;
                const specData = SPECTRAL_COLORS[star.spectralType];

                return (
                  <div
                    key={star.id}
                    onClick={() => handlePlayStarSound(star)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-cyan-950/80 border-cyan-500 shadow-md shadow-cyan-950'
                        : 'bg-[#0a102e]/70 border-slate-800 hover:border-slate-700 hover:bg-[#0d1436]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3.5 h-3.5 rounded-full shadow-sm"
                        style={{ backgroundColor: star.color, boxShadow: `0 0 8px ${star.color}` }}
                      />
                      <div>
                        <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                          <span>{star.name}</span>
                          {star.bayer && <span className="text-[10px] text-slate-400 font-mono-astronomy">{star.bayer}</span>}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono-astronomy">
                          Mag: <span className="text-cyan-300">{star.mag.toFixed(2)}</span> • Dist: <span className="text-slate-300">{star.distLy} ly</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span 
                        className="text-[9px] font-mono-astronomy px-1.5 py-0.5 rounded font-bold"
                        style={{ backgroundColor: `${star.color}18`, color: star.color }}
                      >
                        Class {star.spectralType}
                      </span>
                      <Volume2 className="w-3.5 h-3.5 text-slate-500 hover:text-cyan-300" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Cultural Myths */}
        {constellation && activeTab === 'myths' && (
          <div className="space-y-4">
            {constellation.myths.map((m, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-[#0a102e]/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono-astronomy text-cyan-400 tracking-wider">
                    {m.culture}
                  </span>
                  <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <h4 className="text-xs font-cinzel font-bold text-slate-100">{m.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {m.story}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Tab 4: Deep Sky & Meteor Showers */}
        {constellation && activeTab === 'deepsky' && (
          <div className="space-y-5">
            {/* Deep Sky Objects */}
            <div className="space-y-3">
              <h4 className="text-xs font-cinzel font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                <span>Deep Sky Objects</span>
              </h4>

              {constellation.deepSkyObjects.length > 0 ? (
                <div className="space-y-2">
                  {constellation.deepSkyObjects.map(dso => (
                    <div key={dso.id} className="p-3.5 rounded-xl bg-[#0a102e]/70 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-100">{dso.name}</span>
                        <span className="text-[10px] font-mono-astronomy px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                          {dso.catalogNum}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono-astronomy text-slate-400">
                        Type: <span className="text-cyan-300">{dso.type}</span> • Mag: <span className="text-slate-300">{dso.mag}</span> • Dist: <span className="text-slate-300">{dso.distLy.toLocaleString()} ly</span>
                      </div>
                      <p className="text-xs text-slate-300">{dso.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic p-3 bg-[#0a102e]/40 rounded-xl">
                  No major Messier deep-sky objects catalogued in this specific sector.
                </p>
              )}
            </div>

            {/* Meteor Showers */}
            <div className="space-y-3">
              <h4 className="text-xs font-cinzel font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Associated Meteor Showers</span>
              </h4>

              {constellation.meteorShowers.length > 0 ? (
                <div className="space-y-2">
                  {constellation.meteorShowers.map((ms, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-900/40 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-200">{ms.name}</span>
                        <span className="text-[10px] font-mono-astronomy px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                          Peak: {ms.peakDate}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono-astronomy text-slate-400 grid grid-cols-2 gap-1 pt-1">
                        <div>ZHR Rate: <span className="text-amber-300 font-bold">{ms.ratePerHour} / hr</span></div>
                        <div>Velocity: <span className="text-slate-300">{ms.velocityKmS} km/s</span></div>
                        <div className="col-span-2">Parent Body: <span className="text-slate-300">{ms.parentBody}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic p-3 bg-[#0a102e]/40 rounded-xl">
                  No major annual meteor shower radiants anchored in this constellation.
                </p>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Footer Action */}
      {constellation && (
        <div className="p-4 border-t border-slate-800/80 bg-[#090f2b]/80 flex items-center gap-2">
          <button
            onClick={() => onFocusConstellation(constellation)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-medium text-xs shadow-lg shadow-cyan-950 hover:brightness-110 transition-all"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Center in Sky Dome</span>
          </button>
        </div>
      )}

    </div>
  );
}
