import { useState, useEffect } from 'react';
import { 
  Compass, 
  Sparkles, 
  BookOpen, 
  PenTool, 
  Eye, 
  Volume2, 
  VolumeX, 
  HelpCircle,
  Search,
  Orbit,
  Flame,
  Award
} from 'lucide-react';
import { celestialAudio } from '../utils/audioSynth';
import { CONSTELLATIONS } from '../data/constellationsData';
import { Constellation } from '../types/astronomy';

interface NavigationProps {
  activeTab: 'skydome' | 'atlas' | 'studio' | 'planner' | 'quiz';
  setActiveTab: (tab: 'skydome' | 'atlas' | 'studio' | 'planner' | 'quiz') => void;
  onSelectConstellation: (c: Constellation) => void;
}

export function Navigation({ activeTab, setActiveTab, onSelectConstellation }: NavigationProps) {
  const [isAudioActive, setIsAudioActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [currentTimeUTC, setCurrentTimeUTC] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeUTC(now.toUTCString().slice(17, 25) + ' UTC');
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleAudio = () => {
    const active = celestialAudio.toggleMute();
    setIsAudioActive(active);
  };

  const filteredConstellations = searchQuery.trim() === '' ? [] : CONSTELLATIONS.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.brightestStarName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.family.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 6);

  return (
    <header className="sticky top-0 z-40 bg-[#050711]/90 backdrop-blur-md border-b border-cyan-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Brand & Identity */}
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setActiveTab('skydome')}>
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-amber-400 p-[1px] shadow-lg shadow-cyan-950/50">
            <div className="w-full h-full bg-[#050711] rounded-xl flex items-center justify-center">
              <Orbit className="w-5 h-5 text-cyan-400 animate-spin" style={{ animationDuration: '30s' }} />
            </div>
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping opacity-75" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-cinzel font-bold text-xl tracking-wider text-slate-100 bg-gradient-to-r from-cyan-200 via-indigo-200 to-amber-200 bg-clip-text text-transparent">
                CONSTELLETION
              </span>
              <span className="text-[10px] uppercase font-mono-astronomy px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/50">
                v2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Celestial Planetarium & Sky Atlas</p>
          </div>
        </div>

        {/* Center Nav Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-[#090e24]/80 p-1 rounded-xl border border-indigo-950/70">
          <button
            id="nav-tab-skydome"
            onClick={() => setActiveTab('skydome')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'skydome'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Sky Dome</span>
          </button>

          <button
            id="nav-tab-atlas"
            onClick={() => setActiveTab('atlas')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'atlas'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm shadow-indigo-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Constellation Atlas</span>
          </button>

          <button
            id="nav-tab-studio"
            onClick={() => setActiveTab('studio')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'studio'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Star Studio</span>
          </button>

          <button
            id="nav-tab-planner"
            onClick={() => setActiveTab('planner')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'planner'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Stargazing Planner</span>
          </button>

          <button
            id="nav-tab-quiz"
            onClick={() => setActiveTab('quiz')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'quiz'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Sky Spotter Quiz</span>
          </button>
        </nav>

        {/* Right Tools & Sound & Search */}
        <div className="flex items-center gap-2">
          
          {/* Quick Search */}
          <div className="relative">
            <button
              id="search-btn-toggle"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-300 transition-colors"
              title="Search Constellations & Stars"
            >
              <Search className="w-4 h-4" />
            </button>

            {isSearchOpen && (
              <div className="absolute right-0 top-12 w-80 bg-[#090e24] border border-cyan-800/40 rounded-xl shadow-2xl p-3 z-50 backdrop-blur-xl">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Search className="w-3.5 h-3.5 text-cyan-400" />
                  <input
                    type="text"
                    placeholder="Search Orion, Polaris, Andromeda..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="text-xs text-slate-500 hover:text-slate-300 px-1"
                  >
                    ✕
                  </button>
                </div>

                {filteredConstellations.length > 0 ? (
                  <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
                    {filteredConstellations.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          onSelectConstellation(c);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                          setActiveTab('skydome');
                        }}
                        className="p-2 rounded-lg hover:bg-cyan-950/50 cursor-pointer flex items-center justify-between group transition-colors"
                      >
                        <div>
                          <div className="text-xs font-medium text-slate-200 group-hover:text-cyan-300">
                            {c.name} <span className="text-[10px] text-slate-400">({c.englishName})</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono-astronomy">
                            ★ {c.brightestStarName}
                          </div>
                        </div>
                        <span className="text-xs">{c.zodiacSymbol || '✨'}</span>
                      </div>
                    ))}
                  </div>
                ) : searchQuery ? (
                  <p className="text-xs text-slate-500 py-3 text-center">No constellations found matching "{searchQuery}"</p>
                ) : (
                  <div className="py-2 text-[11px] text-slate-400">
                    <p className="text-slate-500 mb-1 font-mono-astronomy uppercase text-[9px]">Popular quick jumps:</p>
                    <div className="flex flex-wrap gap-1">
                      {['Orion', 'Ursa Major', 'Cassiopeia', 'Cygnus', 'Scorpius', 'Crux'].map((name) => {
                        const constell = CONSTELLATIONS.find(x => x.name === name);
                        return (
                          <button
                            key={name}
                            onClick={() => {
                              if (constell) {
                                onSelectConstellation(constell);
                                setIsSearchOpen(false);
                                setActiveTab('skydome');
                              }
                            }}
                            className="px-2 py-0.5 text-[10px] rounded bg-slate-800/80 hover:bg-cyan-900/60 text-slate-300 hover:text-cyan-200 border border-slate-700"
                          >
                            {name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ambient Synthesizer Audio Toggle */}
          <button
            id="audio-synth-toggle"
            onClick={handleToggleAudio}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              isAudioActive
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-900/30 animate-pulse'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Harmonia Macrocosmica Cosmic Audio Synthesizer (432Hz)"
          >
            {isAudioActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline font-mono-astronomy text-[11px]">
              {isAudioActive ? 'Harmonics ON' : 'Audio OFF'}
            </span>
          </button>

          {/* UTC Stargazer Clock */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-800/80 text-slate-400 font-mono-astronomy text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>{currentTimeUTC}</span>
          </div>

        </div>

      </div>

      {/* Mobile bottom tabs */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800/60 bg-[#050711] py-2 px-1">
        <button
          onClick={() => setActiveTab('skydome')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] ${
            activeTab === 'skydome' ? 'text-cyan-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Dome</span>
        </button>

        <button
          onClick={() => setActiveTab('atlas')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] ${
            activeTab === 'atlas' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Atlas</span>
        </button>

        <button
          onClick={() => setActiveTab('studio')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] ${
            activeTab === 'studio' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <PenTool className="w-4 h-4" />
          <span>Studio</span>
        </button>

        <button
          onClick={() => setActiveTab('planner')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] ${
            activeTab === 'planner' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Plan</span>
        </button>

        <button
          onClick={() => setActiveTab('quiz')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] ${
            activeTab === 'quiz' ? 'text-purple-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Quiz</span>
        </button>
      </div>
    </header>
  );
}
