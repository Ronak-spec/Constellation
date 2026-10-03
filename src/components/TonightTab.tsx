import React, { useState } from 'react';
import { StarCategory, StarEntry, MeteorSub, CAT_COLORS, CONST_NAMES } from '../types/constellation';
import { audio } from '../utils/audio';

interface TonightTabProps {
  entries: StarEntry[];
  subs: MeteorSub[];
  wage: number;
  viewingArchiveIdx: number | null;
  onAddEntry: (activity: string, mins: number, cat: StarCategory) => void;
  onRemoveEntry: (index: number) => void;
  onCloseNight: () => void;
  onAddSub: (name: string, cost: number) => void;
  onToggleSub: (index: number) => void;
  onRemoveSub: (index: number) => void;
  onUpdateWage: (wage: number) => void;
  onLaunchShootingStar: () => void;
}

export function TonightTab({
  entries,
  subs,
  wage,
  viewingArchiveIdx,
  onAddEntry,
  onRemoveEntry,
  onCloseNight,
  onAddSub,
  onToggleSub,
  onRemoveSub,
  onUpdateWage,
  onLaunchShootingStar,
}: TonightTabProps) {
  const [activity, setActivity] = useState('');
  const [mins, setMins] = useState('');
  const [activeCat, setActiveCat] = useState<StarCategory>('Work');

  const [subName, setSubName] = useState('');
  const [subCost, setSubCost] = useState('');

  const [priceInput, setPriceInput] = useState('120');

  const readOnly = viewingArchiveIdx !== null;

  // Format hours helper
  const formatHours = (hrs: number) => {
    if (hrs < 0) hrs = 0;
    const totalMinutes = Math.round(hrs * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h >= 24 * 30) return (h / (24 * 30)).toFixed(1) + ' months';
    if (h >= 24) return (h / 24).toFixed(1) + ' days';
    if (h === 0) return m + 'm';
    return `${h}h ${m}m`;
  };

  // Constellation Name
  const getConstellationName = () => {
    if (entries.length === 0) {
      return readOnly ? 'No stars that night.' : 'Awaiting its first star.';
    }
    const totals: Record<string, number> = {};
    entries.forEach((e) => {
      totals[e.cat] = (totals[e.cat] || 0) + e.mins;
    });
    let topCat = 'Work';
    let topMins = -1;
    Object.keys(totals).forEach((k) => {
      if (totals[k] > topMins) {
        topMins = totals[k];
        topCat = k;
      }
    });
    const name = CONST_NAMES[topCat] || 'The Wanderer';
    return `${entries.length} ${entries.length === 1 ? 'star' : 'stars'} ${
      readOnly ? 'that night — “' : 'tonight — forming “'
    }${name}.”`;
  };

  // Coverage Stats
  const totalMins = entries.reduce((s, e) => s + e.mins, 0);
  const wakingMins = 16 * 60;
  const coveragePct = Math.min(100, (totalMins / wakingMins) * 100);

  const handleAddStar = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    const trimmed = activity.trim();
    const parsedMins = parseInt(mins, 10);
    if (!trimmed || !parsedMins || parsedMins <= 0) return;

    onAddEntry(trimmed, parsedMins, activeCat);
    audio.chimeAddStar();
    setActivity('');
    setMins('');
  };

  const handleAddSub = (e: React.FormEvent) => {
    e.preventDefault();
    const name = subName.trim();
    const cost = parseFloat(subCost);
    if (!name || isNaN(cost) || cost < 0) return;

    onAddSub(name, cost);
    setSubName('');
    setSubCost('');
    onLaunchShootingStar();
  };

  const keptSubs = subs.map((s, i) => ({ ...s, originalIdx: i })).filter((s) => s.kept);
  const driftingSubs = subs.map((s, i) => ({ ...s, originalIdx: i })).filter((s) => !s.kept);

  // Appraisal
  const appraisedCost = parseFloat(priceInput) || 0;
  const appraisedTime = wage > 0 ? formatHours(appraisedCost / wage) : 'set a rate';

  return (
    <div className="tab-panel active space-y-[54px] pt-[26px]">
      
      {/* SECTION 1: TONIGHT'S STARS */}
      <section className="panel">
        <div className="flex justify-between items-baseline mb-5 gap-3.5 flex-wrap">
          <h2 className="font-serif-cormorant font-medium text-[26px] m-0">Tonight's stars</h2>
          <span className="text-xs text-[#8890AE] italic">log it after it happens, not before</span>
        </div>

        <div className="font-serif-cormorant italic text-[#F2C572] text-[15px] -mt-2 mb-[18px]">
          {getConstellationName()}
        </div>

        {/* Coverage Bar */}
        {!readOnly && (
          <div className="-mt-2 mb-[22px]">
            <div className="flex justify-between text-[11px] text-[#8890AE] mb-1.5">
              <span>{formatHours(totalMins / 60)} logged of ~16 waking hours</span>
              <span>{Math.round(coveragePct)}%</span>
            </div>
            <div className="h-1 bg-white/6 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#A9C0F0] to-[#F2C572] rounded-full transition-all duration-700 ease-out"
                style={{ width: `${coveragePct.toFixed(1)}%` }}
              />
            </div>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleAddStar}
          className={`flex gap-2.5 flex-wrap items-center mb-[22px] transition-opacity ${
            readOnly ? 'opacity-35 pointer-events-none' : ''
          }`}
        >
          <input
            type="text"
            placeholder="what just happened?"
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            className="flex-1 min-w-[220px] bg-white/4 border border-white/9 text-[#EDEFF7] font-sans-manrope text-sm p-[11px_14px] rounded-lg outline-none focus:border-[#F2C572] transition-colors"
          />
          <input
            type="number"
            placeholder="mins"
            min="1"
            value={mins}
            onChange={(e) => setMins(e.target.value)}
            className="w-[74px] bg-white/4 border border-white/9 text-[#EDEFF7] font-sans-manrope text-sm p-[11px_14px] rounded-lg outline-none focus:border-[#F2C572] transition-colors"
          />

          {/* Category Picker */}
          <div className="flex gap-[7px]">
            {(['Work', 'Chores', 'Connection', 'Rest', 'Joy', 'Scroll'] as StarCategory[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCat(cat)}
                title={cat === 'Scroll' ? 'Scroll / waste' : cat}
                className={`w-[30px] h-[30px] rounded-full border-[1.5px] cursor-pointer flex items-center justify-center bg-transparent transition-transform duration-150 hover:scale-110 ${
                  activeCat === cat ? 'border-[#EDEFF7]' : 'border-white/10'
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: CAT_COLORS[cat] }}
                />
              </button>
            ))}
          </div>

          <button
            type="submit"
            className="bg-[#F2C572] text-[#1A1408] border-none font-sans-manrope font-bold text-[13px] px-5 py-[11px] rounded-lg cursor-pointer hover:bg-[#f5d38c] hover:-translate-y-0.5 hover:shadow-[0_4px_14px_rgba(242,197,114,0.25)] active:translate-y-0 transition-all"
          >
            Add to sky
          </button>
        </form>

        {/* Star List */}
        <ul className="list-none m-0 p-0">
          {entries.length === 0 ? (
            <li className="text-[#8890AE] text-[13px] italic py-3 px-1">
              Nothing placed yet tonight. Click any star above to see what it was.
            </li>
          ) : (
            entries.map((e, i) => (
              <li
                key={e.id || i}
                className="flex items-center gap-3 py-[11px] px-1 border-b border-white/10 text-sm"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: CAT_COLORS[e.cat] }}
                />
                <span className="flex-1 text-[#EDEFF7]">{e.activity}</span>
                <span className="text-[#8890AE] text-[12.5px]">{e.mins}m · {e.cat}</span>
                {!readOnly && (
                  <button
                    onClick={() => onRemoveEntry(i)}
                    className="bg-transparent border-none text-[#8890AE] hover:text-[#E0654A] cursor-pointer text-xs transition-colors"
                  >
                    remove
                  </button>
                )}
              </li>
            ))
          )}
        </ul>

        {/* Close Night Card */}
        <div className="flex items-center justify-between gap-3.5 flex-wrap -mx-0 mt-5 p-3 px-4 bg-white/4 border border-white/10 rounded-[9px]">
          <span className="text-[12.5px] text-[#8890AE]">
            Ready to let tonight settle? <b className="text-[#EDEFF7] font-semibold">Close the night</b> archives this
            sky into the atlas and opens a fresh one.
          </span>
          <button
            disabled={entries.length === 0 || readOnly}
            onClick={() => {
              onCloseNight();
              audio.chimeCloseNight();
            }}
            className="bg-transparent border border-[rgba(242,197,114,0.4)] text-[#F2C572] font-sans-manrope text-xs font-semibold px-4 py-2 rounded-[7px] cursor-pointer whitespace-nowrap hover:bg-[rgba(242,197,114,0.1)] hover:-translate-y-0.5 disabled:opacity-30 disabled:cursor-default disabled:hover:translate-y-0 transition-all"
          >
            Close the night
          </button>
        </div>
      </section>

      {/* SECTION 2: METEOR WATCH */}
      <section className="panel">
        <div className="flex justify-between items-baseline mb-5 gap-3.5 flex-wrap">
          <h2 className="font-serif-cormorant font-medium text-[26px] m-0">Meteor watch</h2>
          <span className="text-xs text-[#8890AE] italic">most drift past — a few, you keep lit on purpose</span>
        </div>

        <form onSubmit={handleAddSub} className="flex gap-2.5 flex-wrap items-center mb-[22px]">
          <input
            type="text"
            placeholder="subscription name"
            value={subName}
            onChange={(e) => setSubName(e.target.value)}
            className="flex-1 min-w-[200px] bg-white/4 border border-white/10 text-[#EDEFF7] font-sans-manrope text-sm p-[11px_14px] rounded-lg outline-none focus:border-[#F2C572] transition-colors"
          />
          <input
            type="number"
            placeholder="$ / mo"
            min="0"
            step="0.5"
            value={subCost}
            onChange={(e) => setSubCost(e.target.value)}
            className="w-[90px] bg-white/4 border border-white/10 text-[#EDEFF7] font-sans-manrope text-sm p-[11px_14px] rounded-lg outline-none focus:border-[#F2C572] transition-colors"
          />
          <button
            type="submit"
            className="bg-[#F2C572] text-[#1A1408] border-none font-sans-manrope font-bold text-[13px] px-5 py-[11px] rounded-lg cursor-pointer hover:bg-[#f5d38c] hover:-translate-y-0.5 transition-all"
          >
            Set in motion
          </button>
        </form>

        <ul className="list-none m-0 p-0 space-y-1">
          {subs.length === 0 ? (
            <li className="text-[#8890AE] text-[13px] italic py-3">Nothing on watch.</li>
          ) : (
            <>
              {keptSubs.length > 0 && (
                <div>
                  <div className="text-[10.5px] tracking-[0.1em] uppercase text-[#8890AE] mt-[18px] mb-1 opacity-70 first:mt-0">
                    Steady — kept on purpose
                  </div>
                  {keptSubs.map((s) => {
                    const yearly = s.cost * 12;
                    const hrs = wage > 0 ? yearly / wage : 0;
                    return (
                      <li
                        key={s.id || s.originalIdx}
                        className="flex items-center gap-3.5 py-3 px-1 border-b border-white/10 text-sm"
                      >
                        <span className="w-[9px] h-[9px] rounded-full shrink-0 bg-[#F2C572] shadow-[0_0_8px_3px_rgba(242,197,114,0.35)] animate-[beaconSweep_3.2s_ease-in-out_infinite]" />
                        <span className="flex-1 text-[#EDEFF7]">{s.name}</span>
                        <span className="text-[#8890AE] text-[12.5px] w-[70px]">${s.cost.toFixed(2)}/mo</span>
                        <span className="text-[#F2C572] font-serif-cormorant text-base w-[90px] text-right">
                          {formatHours(hrs)}/yr
                        </span>
                        <button
                          onClick={() => onToggleSub(s.originalIdx)}
                          className="bg-transparent border-none text-[#8890AE] hover:text-[#EDEFF7] cursor-pointer text-xs whitespace-nowrap"
                        >
                          let it drift
                        </button>
                        <button
                          onClick={() => onRemoveSub(s.originalIdx)}
                          className="bg-transparent border-none text-[#8890AE] hover:text-[#E0654A] cursor-pointer text-xs"
                        >
                          remove
                        </button>
                      </li>
                    );
                  })}
                </div>
              )}

              {driftingSubs.length > 0 && (
                <div>
                  <div className="text-[10.5px] tracking-[0.1em] uppercase text-[#8890AE] mt-[18px] mb-1 opacity-70 first:mt-0">
                    {keptSubs.length ? 'Drifting' : 'Drifting — nothing kept yet'}
                  </div>
                  {!keptSubs.length && (
                    <div className="text-[11.5px] text-[#8890AE] italic font-serif-cormorant -mt-0.5 mb-2">
                      Everything falls past by default. Keep one on purpose if it’s worth it.
                    </div>
                  )}
                  {driftingSubs.map((s) => {
                    const yearly = s.cost * 12;
                    const hrs = wage > 0 ? yearly / wage : 0;
                    return (
                      <li
                        key={s.id || s.originalIdx}
                        className="flex items-center gap-3.5 py-3 px-1 border-b border-white/10 text-sm"
                      >
                        <span className="w-[22px] h-[2px] bg-gradient-to-r from-transparent to-[#F2C572] shrink-0 -rotate-[25deg]" />
                        <span className="flex-1 text-[#EDEFF7]">{s.name}</span>
                        <span className="text-[#8890AE] text-[12.5px] w-[70px]">${s.cost.toFixed(2)}/mo</span>
                        <span className="text-[#F2C572] font-serif-cormorant text-base w-[90px] text-right">
                          {formatHours(hrs)}/yr
                        </span>
                        <button
                          onClick={() => onToggleSub(s.originalIdx)}
                          className="bg-transparent border-none text-[#F2C572] opacity-75 hover:opacity-100 cursor-pointer text-xs whitespace-nowrap"
                        >
                          keep this light
                        </button>
                        <button
                          onClick={() => onRemoveSub(s.originalIdx)}
                          className="bg-transparent border-none text-[#8890AE] hover:text-[#E0654A] cursor-pointer text-xs"
                        >
                          remove
                        </button>
                      </li>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </ul>
      </section>

      {/* SECTION 3: APPRAISE A PURCHASE */}
      <section className="panel">
        <div className="flex justify-between items-baseline mb-5 gap-3.5 flex-wrap">
          <h2 className="font-serif-cormorant font-medium text-[26px] m-0">Appraise a purchase</h2>
          <span className="text-xs text-[#8890AE] italic">what would it actually cost you</span>
        </div>

        <div className="flex items-center gap-[18px] flex-wrap">
          <input
            type="number"
            min="0"
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            onBlur={onLaunchShootingStar}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onLaunchShootingStar();
            }}
            className="bg-white/4 border border-white/10 text-[#EDEFF7] font-serif-cormorant text-[22px] p-[10px_14px] rounded-lg w-[150px] outline-none focus:border-[#F2C572] transition-colors"
          />

          <span className="text-xs text-[#8890AE] flex items-center gap-1.5">
            at
            <input
              type="number"
              min="0"
              step="0.5"
              value={wage}
              onChange={(e) => onUpdateWage(parseFloat(e.target.value) || 0)}
              className="bg-white/4 border border-white/10 text-[#EDEFF7] font-sans-manrope text-[13px] w-[60px] p-[6px_8px] rounded outline-none focus:border-[#F2C572] transition-colors"
            />
            /hr
          </span>

          <div className="font-serif-cormorant text-[22px] text-[#F2C572]">
            <span>{appraisedTime}</span>
            <span className="block font-sans-manrope text-[11px] text-[#8890AE] mt-1">
              of your remaining sky
            </span>
          </div>
        </div>
      </section>

    </div>
  );
}
