import React, { useState, useMemo, useEffect } from 'react';
import { 
  Eye, 
  MapPin, 
  Moon, 
  Sun, 
  Compass, 
  Flame, 
  Clock, 
  Sparkles, 
  Calendar, 
  Globe,
  Sliders,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { ObservationLocation, Constellation } from '../types/astronomy';
import { POPULAR_LOCATIONS } from '../data/locationsData';
import { CONSTELLATIONS } from '../data/constellationsData';
import { calculateLST, getAltAz, calculateMoonPhase } from '../utils/celestialMath';

interface StargazingPlannerProps {
  onSelectConstellation: (c: Constellation) => void;
}

export function StargazingPlanner({ onSelectConstellation }: StargazingPlannerProps) {
  const [selectedLocation, setSelectedLocation] = useState<ObservationLocation>(POPULAR_LOCATIONS[0]);
  const [observationDate, setObservationDate] = useState<Date>(new Date());
  const [hourSlider, setHourSlider] = useState<number>(22); // 10:00 PM default night observation

  // Sync date with hour slider
  const simulatedDateTime = useMemo(() => {
    const d = new Date(observationDate);
    d.setHours(hourSlider, 0, 0, 0);
    return d;
  }, [observationDate, hourSlider]);

  // Calculate Local Sidereal Time
  const currentLST = useMemo(() => {
    return calculateLST(simulatedDateTime, selectedLocation.lng);
  }, [simulatedDateTime, selectedLocation]);

  // Calculate Moon details
  const moonDetails = useMemo(() => {
    return calculateMoonPhase(simulatedDateTime);
  }, [simulatedDateTime]);

  // Calculate Altitude & Azimuth for all constellations
  const visibleConstellations = useMemo(() => {
    return CONSTELLATIONS.map(c => {
      const { altitude, azimuth } = getAltAz(
        c.raCenter,
        c.decCenter,
        selectedLocation.lat,
        currentLST
      );

      // Status: Zenith (>60°), High (30°-60°), Low (10°-30°), Below Horizon (<0°)
      let status = 'Below Horizon';
      if (altitude > 60) status = 'Overhead Zenith';
      else if (altitude > 30) status = 'High in Sky';
      else if (altitude > 0) status = 'Low on Horizon';

      // Compass direction from azimuth
      const compassDirections = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];
      const dirIndex = Math.round(azimuth / 45) % 8;
      const direction = compassDirections[dirIndex];

      return {
        constellation: c,
        altitude,
        azimuth,
        status,
        direction,
        isVisible: altitude > 5,
      };
    }).sort((a, b) => b.altitude - a.altitude);
  }, [selectedLocation, currentLST]);

  // Overall Sky Observation Quality Score (0 - 100)
  const skyScore = useMemo(() => {
    let score = 100;
    // Moon penalty (full moon washes out deep sky)
    score -= (moonDetails.illuminationPct * 0.4);
    // Bortle penalty (class 1 is 0 loss, class 9 is -40 loss)
    score -= (selectedLocation.bortleClass - 1) * 5;
    return Math.max(10, Math.round(score));
  }, [moonDetails, selectedLocation]);

  // All major meteor showers
  const METEOR_SHOWERS = [
    { name: 'Quadrantids', date: 'Jan 3-4', rate: 110, constell: 'Boötes', activeMonth: 0 },
    { name: 'Lyrids', date: 'Apr 22-23', rate: 20, constell: 'Lyra', activeMonth: 3 },
    { name: 'Eta Aquariids', date: 'May 5-6', rate: 50, constell: 'Aquarius', activeMonth: 4 },
    { name: 'Perseids', date: 'Aug 12-13', rate: 100, constell: 'Perseus', activeMonth: 7 },
    { name: 'Orionids', date: 'Oct 21-22', rate: 25, constell: 'Orion', activeMonth: 9 },
    { name: 'Leonids', date: 'Nov 17-18', rate: 15, constell: 'Leo', activeMonth: 10 },
    { name: 'Geminids', date: 'Dec 13-14', rate: 120, constell: 'Gemini', activeMonth: 11 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 text-xs font-mono-astronomy mb-2">
            <Eye className="w-3.5 h-3.5" />
            <span>Real-Time Ephemeris & Stargazing Planner</span>
          </div>
          <h1 className="font-cinzel text-3xl font-black text-slate-100 tracking-wide">
            Tonight's Sky Simulator
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Simulate the night sky for any date, time, and location on Earth to plan your astronomical observation sessions.
          </p>
        </div>

        {/* Observation Quality Badge */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#080d26] border border-slate-800 shadow-xl">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold font-mono-astronomy text-lg ${
            skyScore >= 75 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
            skyScore >= 45 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
            'bg-rose-500/20 text-rose-300 border border-rose-500/40'
          }`}>
            {skyScore}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200">Sky Quality Index</div>
            <div className="text-[11px] text-slate-400">
              {skyScore >= 75 ? 'Excellent Stargazing Conditions' : skyScore >= 45 ? 'Moderate Visibility' : 'High Light Intrusion'}
            </div>
          </div>
        </div>
      </div>

      {/* Observation Controls: Location & Date/Hour Scroller */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Location Picker */}
        <div className="p-5 rounded-3xl bg-[#080d26] border border-slate-800 space-y-4 shadow-xl">
          <h3 className="font-cinzel text-base font-bold text-slate-100 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <span>Observer Location</span>
          </h3>

          <div className="space-y-2">
            <label className="text-[11px] font-mono-astronomy text-slate-400 uppercase">Select Global Site</label>
            <select
              value={selectedLocation.id}
              onChange={e => {
                const found = POPULAR_LOCATIONS.find(l => l.id === e.target.value);
                if (found) setSelectedLocation(found);
              }}
              className="w-full bg-[#050818] border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
            >
              {POPULAR_LOCATIONS.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.country})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono-astronomy">
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Latitude</span>
              <span className="text-cyan-300 font-semibold">{selectedLocation.lat > 0 ? `${selectedLocation.lat}° N` : `${Math.abs(selectedLocation.lat)}° S`}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Longitude</span>
              <span className="text-cyan-300 font-semibold">{selectedLocation.lng > 0 ? `${selectedLocation.lng}° E` : `${Math.abs(selectedLocation.lng)}° W`}</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
            {selectedLocation.skyQualityDesc}
          </p>
        </div>

        {/* Center: Observation Time & Hour Scroller */}
        <div className="p-5 rounded-3xl bg-[#080d26] border border-slate-800 space-y-4 shadow-xl">
          <h3 className="font-cinzel text-base font-bold text-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Observation Time & Hour</span>
          </h3>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono-astronomy uppercase text-[11px]">Simulated Hour:</span>
              <span className="font-mono-astronomy font-bold text-amber-300 text-sm">
                {hourSlider.toString().padStart(2, '0')}:00 {hourSlider >= 12 ? 'PM' : 'AM'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="23"
              step="1"
              value={hourSlider}
              onChange={e => setHourSlider(Number(e.target.value))}
              className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono-astronomy pt-1">
              <span>Sunset (18:00)</span>
              <span>Midnight (00:00)</span>
              <span>Dawn (06:00)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono-astronomy">
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Sidereal Time</span>
              <span className="text-slate-200 font-semibold">{currentLST.toFixed(2)}h LST</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Night Phase</span>
              <span className="text-emerald-300 font-semibold">
                {hourSlider >= 21 || hourSlider <= 4 ? 'Astronomical Dark' : 'Twilight / Daylight'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Moon Phase Widget */}
        <div className="p-5 rounded-3xl bg-[#080d26] border border-slate-800 space-y-4 shadow-xl">
          <h3 className="font-cinzel text-base font-bold text-slate-100 flex items-center gap-2">
            <Moon className="w-4 h-4 text-indigo-400" />
            <span>Lunar Phase & Illumination</span>
          </h3>

          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center shadow-lg">
              <div 
                className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-100 to-amber-200 shadow-md"
                style={{
                  clipPath: moonDetails.illuminationPct > 50 
                    ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' 
                    : `polygon(${100 - moonDetails.illuminationPct}% 0, 100% 0, 100% 100%, ${100 - moonDetails.illuminationPct}% 100%)`
                }}
              />
            </div>
            <div>
              <h4 className="font-cinzel font-bold text-slate-100 text-sm">{moonDetails.phaseName}</h4>
              <p className="text-xs text-cyan-300 font-mono-astronomy mt-0.5">{moonDetails.illuminationPct}% Illuminated</p>
              <p className="text-[10px] text-slate-400 font-mono-astronomy mt-0.5">Moon Age: {moonDetails.ageDays} days</p>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800">
            {moonDetails.illuminationPct > 70 
              ? 'Bright moonlight washes out faint nebulae and galaxies. Ideal for lunar craters and double stars.'
              : 'Dark lunar phase: Optimal for deep-sky imaging and faint celestial asterisms.'}
          </p>
        </div>

      </div>

      {/* Currently Visible Constellations List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-cinzel text-xl font-bold text-slate-100">
              Visible Constellations from {selectedLocation.name}
            </h3>
            <p className="text-xs text-slate-400">
              Calculated for {simulatedDateTime.toLocaleDateString()} at {hourSlider}:00 local time
            </p>
          </div>
          <span className="text-xs font-mono-astronomy text-cyan-300 px-3 py-1 rounded-xl bg-cyan-950/80 border border-cyan-800/40">
            {visibleConstellations.filter(v => v.isVisible).length} Constellations in View
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleConstellations.filter(v => v.isVisible).map(({ constellation, altitude, direction, status }) => (
            <div
              key={constellation.id}
              onClick={() => onSelectConstellation(constellation)}
              className="p-4 rounded-2xl bg-[#080d26]/80 hover:bg-[#0c143d] border border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer shadow-lg space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{constellation.zodiacSymbol || '✨'}</span>
                    <h4 className="font-cinzel font-bold text-slate-100">{constellation.name}</h4>
                  </div>
                  <p className="text-[11px] text-slate-400">{constellation.englishName}</p>
                </div>

                <span className={`text-[10px] font-mono-astronomy px-2 py-0.5 rounded font-medium ${
                  altitude > 55 ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                  altitude > 25 ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                  'bg-slate-900 text-slate-400 border border-slate-800'
                }`}>
                  {status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono-astronomy bg-[#050818]/60 p-2.5 rounded-xl border border-slate-800/80">
                <div>Altitude: <span className="text-cyan-300 font-bold">{altitude.toFixed(1)}°</span></div>
                <div>Direction: <span className="text-amber-300 font-bold">{direction}</span></div>
                <div className="col-span-2 text-[10px] text-slate-400">★ Brightest: {constellation.brightestStarName.split('(')[0]}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Major Annual Meteor Shower Calendar */}
      <div className="p-6 rounded-3xl bg-[#080d26] border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <h3 className="font-cinzel text-lg font-bold text-slate-100">Annual Meteor Showers Calendar</h3>
          </div>
          <span className="text-xs font-mono-astronomy text-slate-400">Peak Zenith Rates (ZHR)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {METEOR_SHOWERS.map((ms, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-[#050818] border border-slate-800/90 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">{ms.name}</span>
                <span className="text-[10px] font-mono-astronomy px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-900">
                  {ms.date}
                </span>
              </div>
              <div className="text-[11px] font-mono-astronomy text-slate-400">
                Radiant: <span className="text-cyan-300">{ms.constell}</span>
              </div>
              <div className="text-[11px] font-mono-astronomy text-slate-400">
                Peak: <span className="text-amber-300 font-bold">{ms.rate} meteors/hr</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
