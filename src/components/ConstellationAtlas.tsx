import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Sparkles, 
  BookOpen, 
  Compass, 
  ArrowUpDown, 
  Star as StarIcon, 
  Globe, 
  Volume2,
  Calendar,
  Layers
} from 'lucide-react';
import { Constellation, Star } from '../types/astronomy';
import { CONSTELLATIONS } from '../data/constellationsData';
import { celestialAudio } from '../utils/audioSynth';

interface ConstellationAtlasProps {
  onSelectConstellation: (c: Constellation) => void;
  onJumpToSkyDome: (c: Constellation) => void;
}

export function ConstellationAtlas({ onSelectConstellation, onJumpToSkyDome }: ConstellationAtlasProps) {
  const [search, setSearch] = useState('');
  const [selectedSeason, setSelectedSeason] = useState<string>('All');
  const [selectedHemisphere, setSelectedHemisphere] = useState<string>('All');
  const [selectedFamily, setSelectedFamily] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'name' | 'area' | 'brightness'>('name');

  const filteredConstellations = useMemo(() => {
    return CONSTELLATIONS.filter(c => {
      const matchSearch = search.trim() === '' || 
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.englishName.toLowerCase().includes(search.toLowerCase()) ||
        c.brightestStarName.toLowerCase().includes(search.toLowerCase()) ||
        c.genitive.toLowerCase().includes(search.toLowerCase());

      const matchSeason = selectedSeason === 'All' || c.season === selectedSeason;
      const matchHemisphere = selectedHemisphere === 'All' || c.hemisphere === selectedHemisphere;
      const matchFamily = selectedFamily === 'All' || c.family === selectedFamily;

      return matchSearch && matchSeason && matchHemisphere && matchFamily;
    }).sort((a, b) => {
      if (sortBy === 'area') return b.areaSqDeg - a.areaSqDeg;
      if (sortBy === 'brightness') return a.brightestStarMag - b.brightestStarMag;
      return a.name.localeCompare(b.name);
    });
  }, [search, selectedSeason, selectedHemisphere, selectedFamily, sortBy]);

  const handlePlayChord = (e: React.MouseEvent, c: Constellation) => {
    e.stopPropagation();
    celestialAudio.playConstellationChord(c.stars.length);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#0c133b] via-[#09102e] to-[#150f38] border border-cyan-800/40 p-6 sm:p-8 overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 text-xs font-mono-astronomy">
            <Globe className="w-3.5 h-3.5" />
            <span>IAU Celestial Catalogue & Folklore Atlas</span>
          </div>
          <h1 className="font-cinzel text-3xl sm:text-4xl font-black text-slate-100 tracking-wide">
            The Constellation Atlas
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Explore 88 official constellations, their ancient mythological lineages across Greek, Arabic, Egyptian, and Chinese traditions, and their stellar astrophysics.
          </p>
        </div>

        {/* Decorative celestial watermark background */}
        <div className="absolute right-4 -bottom-10 opacity-10 text-[180px] pointer-events-none select-none font-cinzel">
          ✦
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#080d24]/90 border border-slate-800/90 shadow-xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search constellations, English names, or bright stars..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#050818] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-200"
              >
                ✕
              </button>
            )}
          </div>

          {/* Season Filter */}
          <div className="relative">
            <select
              value={selectedSeason}
              onChange={e => setSelectedSeason(e.target.value)}
              className="w-full bg-[#050818] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer"
            >
              <option value="All">All Seasons</option>
              <option value="Spring">Spring Skies</option>
              <option value="Summer">Summer Skies</option>
              <option value="Autumn">Autumn Skies</option>
              <option value="Winter">Winter Skies</option>
              <option value="Circumpolar">Circumpolar (All Year)</option>
            </select>
          </div>

          {/* Hemisphere Filter */}
          <div className="relative">
            <select
              value={selectedHemisphere}
              onChange={e => setSelectedHemisphere(e.target.value)}
              className="w-full bg-[#050818] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer"
            >
              <option value="All">All Hemispheres</option>
              <option value="Northern">Northern Hemisphere</option>
              <option value="Southern">Southern Hemisphere</option>
              <option value="Equatorial">Equatorial (Both)</option>
            </select>
          </div>

        </div>

        {/* Secondary Quick Filter Pills & Sorting */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
          
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500 font-mono-astronomy text-[10px] uppercase mr-1">Family:</span>
            {['All', 'Zodiac', 'Ursa Major', 'Perseus', 'Hercules', 'Orion', 'Heavenly Waters'].map(fam => (
              <button
                key={fam}
                onClick={() => setSelectedFamily(fam)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedFamily === fam
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                }`}
              >
                {fam}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-mono-astronomy text-[10px]">Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'name' | 'area' | 'brightness')}
              className="bg-[#050818] border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="name">Alphabetical (A-Z)</option>
              <option value="area">Sky Area (Largest)</option>
              <option value="brightness">Brightest Star Mag</option>
            </select>
          </div>

        </div>
      </div>

      {/* Constellation Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredConstellations.map(c => (
          <div
            key={c.id}
            onClick={() => onSelectConstellation(c)}
            className="group relative rounded-2xl bg-[#080d26]/80 hover:bg-[#0c143d]/90 border border-slate-800 hover:border-cyan-500/50 p-5 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-cyan-950/40 flex flex-col justify-between"
          >
            {/* Top Bar */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{c.zodiacSymbol || '✨'}</span>
                    <h3 className="font-cinzel text-lg font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                      {c.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {c.englishName} • <span className="italic">{c.latinName}</span>
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handlePlayChord(e, c)}
                    className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-cyan-950 text-slate-400 hover:text-cyan-300 border border-slate-800 transition-colors"
                    title="Play Constellation Harmonic Frequency"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-mono-astronomy px-2 py-0.5 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-800/40 font-semibold">
                    {c.abbreviation}
                  </span>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5 text-[10px] font-mono-astronomy">
                <span className="px-2 py-0.5 rounded bg-slate-900 text-emerald-300 border border-emerald-900/40">
                  {c.season}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-900 text-indigo-300 border border-indigo-900/40">
                  {c.hemisphere}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                  {c.areaSqDeg} sq°
                </span>
              </div>

              {/* Lore Excerpt */}
              <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 bg-[#050818]/60 p-3 rounded-xl border border-slate-800/80">
                {c.lore}
              </p>
            </div>

            {/* Bottom Info & Action Buttons */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <div className="text-[11px] font-mono-astronomy text-slate-400">
                ★ <span className="text-cyan-300 font-semibold">{c.brightestStarName.split('(')[0]}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onJumpToSkyDome(c);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/50 text-[11px] font-medium transition-colors"
                >
                  <Compass className="w-3 h-3" />
                  <span>Sky Dome</span>
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {filteredConstellations.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-[#080d24] border border-slate-800 space-y-3">
          <p className="text-slate-400 text-sm">No constellations found matching your filter criteria.</p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedSeason('All');
              setSelectedHemisphere('All');
              setSelectedFamily('All');
            }}
            className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-semibold hover:bg-cyan-500"
          >
            Reset All Filters
          </button>
        </div>
      )}

    </div>
  );
}
