import React, { useState, useEffect, useMemo } from 'react';
import { StarEntry, UnlitTask, ArchivedNight, CAT_COLORS, CONST_NAMES } from '../types/constellation';
import { 
  generateDailyAmbientStars, 
  getDailySkyAtmosphere, 
  generateDailyStarPositions,
  formatDateLong,
  formatDateShort
} from '../utils/skyEngine';

interface SkyHeroProps {
  activeTab: 'tonight' | 'unlit' | 'understory' | 'ephemeris';
  entries: StarEntry[];
  displayEntries: StarEntry[];
  currentViewingDate: string;
  isViewingToday: boolean;
  tasks: UnlitTask[];
  archive: ArchivedNight[];
  birthYear: number;
  lifeExp: number;
  viewingArchiveIdx: number | null;
  onUpdateBirthYear: (y: number) => void;
  onUpdateLifeExp: (e: number) => void;
  onSelectArchiveNight: (idx: number | null) => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  onJumpToToday: () => void;
  onFlashTask: (index: number) => void;
}

export function SkyHero({
  activeTab,
  entries,
  displayEntries,
  currentViewingDate,
  isViewingToday,
  tasks,
  archive,
  birthYear,
  lifeExp,
  viewingArchiveIdx,
  onUpdateBirthYear,
  onUpdateLifeExp,
  onSelectArchiveNight,
  onPrevDay,
  onNextDay,
  onJumpToToday,
  onFlashTask,
}: SkyHeroProps) {
  const [selectedStarTip, setSelectedStarTip] = useState<{
    entry: StarEntry;
    x: number;
    y: number;
  } | null>(null);

  const [driftwoodItem, setDriftwoodItem] = useState<{
    entry: StarEntry;
    nightName: string;
    date: string;
  } | null>(null);

  const [driftwoodDismissed, setDriftwoodDismissed] = useState(false);

  // Life calculations
  const currentYear = new Date().getFullYear();
  const age = Math.max(0, currentYear - birthYear);
  const remainingYears = Math.max(0, lifeExp - age);
  const pctLived = Math.min(100, Math.max(0, (age / lifeExp) * 100));

  // Deterministic daily sky atmosphere & ambient stars
  const skyAtmosphere = useMemo(() => {
    return getDailySkyAtmosphere(currentViewingDate);
  }, [currentViewingDate]);

  const ambientStars = useMemo(() => {
    return generateDailyAmbientStars(currentViewingDate, pctLived);
  }, [currentViewingDate, pctLived]);

  // Deterministic positions for display entries on this night
  const starPositions = useMemo(() => {
    return generateDailyStarPositions(displayEntries, currentViewingDate);
  }, [displayEntries, currentViewingDate]);

  // Unlit hero positions
  const unlitPositions = useMemo(() => {
    return tasks.map((_, i) => ({
      x: 60 + ((i * 137.5) % 680),
      y: 60 + ((i * 89.3) % 460),
    }));
  }, [tasks]);

  // Compute dominant constellation name for the displayed night
  const displayedConstellationName = useMemo(() => {
    if (viewingArchiveIdx !== null && archive[viewingArchiveIdx]) {
      return archive[viewingArchiveIdx].name;
    }
    if (displayEntries.length === 0) {
      return isViewingToday ? 'Awaiting its first star' : 'A Quiet Starlit Sky';
    }
    const totals: Record<string, number> = {};
    displayEntries.forEach((e) => {
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
    return CONST_NAMES[topCat] || 'The Wanderer';
  }, [viewingArchiveIdx, archive, displayEntries, isViewingToday]);

  // Driftwood memory picker
  useEffect(() => {
    if (activeTab !== 'tonight' || !isViewingToday || driftwoodDismissed) {
      setDriftwoodItem(null);
      return;
    }
    const pool: { entry: StarEntry; nightName: string; date: string }[] = [];
    archive.forEach((night) => {
      night.entries.forEach((e) => {
        pool.push({ entry: e, nightName: night.name, date: night.date });
      });
    });

    if (pool.length > 0 && Math.random() > 0.35) {
      const pick = pool[Math.floor(Math.random() * pool.length)];
      setDriftwoodItem(pick);
    } else {
      setDriftwoodItem(null);
    }
  }, [activeTab, isViewingToday, archive, driftwoodDismissed]);

  if (activeTab === 'understory') {
    return null;
  }

  const isUnlitMode = activeTab === 'unlit';

  // Ring atlas geometry
  const cx = 66;
  const cy = 66;
  const outerLimit = 58;
  const innerStart = 9;
  const n = archive.length;
  const gap = Math.max(1.6, Math.min(7, (outerLimit - innerStart - 6) / (n + 1)));
  const tonightR = innerStart + n * gap;

  const computeTotals = (nightEntries: StarEntry[]) => {
    const totals: Record<string, number> = {};
    let sum = 0;
    nightEntries.forEach((e) => {
      totals[e.cat] = (totals[e.cat] || 0) + e.mins;
      sum += e.mins;
    });
    return { totals, sum };
  };

  const tonightData = computeTotals(entries);

  return (
    <div
      className={`relative w-full min-h-[640px] overflow-hidden transition-colors duration-700 select-none ${
        isUnlitMode
          ? 'bg-[radial-gradient(ellipse_700px_400px_at_15%_8%,rgba(90,90,120,0.16),transparent_60%),radial-gradient(ellipse_600px_500px_at_85%_30%,rgba(60,70,100,0.14),transparent_65%),linear-gradient(180deg,#171B30_0%,#10132A_45%,#070812_100%)]'
          : `bg-[radial-gradient(ellipse_700px_400px_at_15%_8%,${skyAtmosphere.nebulaA},transparent_60%),radial-gradient(ellipse_600px_500px_at_85%_30%,${skyAtmosphere.nebulaB},transparent_65%),linear-gradient(180deg,${skyAtmosphere.skyGradientTop}_0%,${skyAtmosphere.skyGradientMid}_45%,${skyAtmosphere.skyGradientBottom}_100%)]`
      }`}
    >
      {/* Dynamic Date Navigation Bar (Arrows & Celestial Status) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-[#080a1c]/85 hover:bg-[#080a1c]/95 backdrop-blur-md border border-white/12 hover:border-[#F2C572]/40 rounded-full px-3 py-1.5 shadow-2xl transition-all duration-200">
        
        {/* Previous Day Arrow Button */}
        <button
          onClick={onPrevDay}
          className="p-1 px-1.5 rounded-full hover:bg-white/10 text-[#8890AE] hover:text-[#F2C572] transition-colors cursor-pointer flex items-center justify-center text-sm"
          title="Previous day's sky (← Left Arrow)"
          aria-label="Previous day's sky"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Date & Moon phase display */}
        <div className="flex items-center gap-2 px-2 text-xs font-sans-manrope">
          <span className="text-sm" title={skyAtmosphere.moon.phaseName}>
            {skyAtmosphere.moon.symbol}
          </span>
          <span className="text-[#EDEFF7] font-medium whitespace-nowrap">
            {formatDateLong(currentViewingDate)}
          </span>
          <span className="text-white/20">·</span>
          <span className="text-[#F2C572] font-serif-cormorant italic text-[14px] whitespace-nowrap">
            {isViewingToday ? 'Tonight' : `“${displayedConstellationName}”`}
          </span>
        </div>

        {/* Next Day Arrow Button */}
        <button
          onClick={onNextDay}
          disabled={isViewingToday}
          className={`p-1 px-1.5 rounded-full text-sm transition-colors flex items-center justify-center ${
            isViewingToday
              ? 'text-white/20 cursor-not-allowed'
              : 'hover:bg-white/10 text-[#8890AE] hover:text-[#F2C572] cursor-pointer'
          }`}
          title={isViewingToday ? 'You are on tonight’s live sky' : 'Next day’s sky (→ Right Arrow)'}
          aria-label="Next day's sky"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Quick jump to tonight pill if in the past */}
        {!isViewingToday && (
          <button
            onClick={onJumpToToday}
            className="ml-1 px-2.5 py-0.5 rounded-full bg-[#F2C572]/15 hover:bg-[#F2C572]/25 text-[#F2C572] border border-[#F2C572]/30 text-[11px] font-mono-dm transition-colors cursor-pointer whitespace-nowrap"
          >
            return to tonight
          </button>
        )}
      </div>

      {/* Main Sky SVG */}
      <svg
        viewBox="0 0 800 620"
        preserveAspectRatio="xMidYMid slice"
        onClick={() => setSelectedStarTip(null)}
        className="absolute inset-0 w-full h-full block"
      >
        {/* Ambient Stars (Generated deterministically for each day) */}
        <g id="ambientLayer">
          {ambientStars.map((s, idx) => (
            <circle
              key={idx}
              cx={s.x}
              cy={s.y}
              r={s.r}
              opacity={s.opacity}
              className="ambient-star"
              style={{
                animationDelay: `${s.twinkleDelay}s`,
                animationDuration: `${s.twinkleDuration}s`,
              }}
            />
          ))}
        </g>

        {!isUnlitMode ? (
          <>
            {/* Constellation Lines */}
            <g id="linesLayer">
              {starPositions.map((pos, i) => {
                if (i === 0) return null;
                const prev = starPositions[i - 1];
                return (
                  <line
                    key={i}
                    x1={prev.x}
                    y1={prev.y}
                    x2={pos.x}
                    y2={pos.y}
                    className="const-line"
                  />
                );
              })}
            </g>

            {/* Logged Stars */}
            <g id="starsLayer">
              {displayEntries.map((e, i) => {
                const pos = starPositions[i];
                if (!pos) return null;
                const r = 3.2 + Math.min(4.5, e.mins / 35);

                return (
                  <circle
                    key={e.id || i}
                    cx={pos.x}
                    cy={pos.y}
                    r={r}
                    fill={CAT_COLORS[e.cat]}
                    className={`log-star ${e.cat === 'Scroll' ? 'ember' : ''}`}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      setSelectedStarTip({ entry: e, x: pos.x, y: pos.y });
                    }}
                  />
                );
              })}

              {/* Star Tooltip */}
              {selectedStarTip && (
                <g id="starTip">
                  {(() => {
                    const w = 156;
                    const h = 58;
                    let tx = selectedStarTip.x + 12;
                    let ty = selectedStarTip.y - h - 10;
                    if (tx + w > 795) tx = selectedStarTip.x - w - 12;
                    if (ty < 5) ty = selectedStarTip.y + 14;

                    return (
                      <>
                        <rect
                          x={tx}
                          y={ty}
                          width={w}
                          height={h}
                          rx="8"
                          fill="rgba(8,10,28,0.94)"
                          stroke="rgba(242,197,114,0.3)"
                          strokeWidth="1"
                        />
                        <text
                          x={tx + 12}
                          y={ty + 22}
                          fill="#F2C572"
                          fontFamily="'Cormorant Garamond', serif"
                          fontSize="15"
                        >
                          {selectedStarTip.entry.activity.length > 18
                            ? selectedStarTip.entry.activity.slice(0, 17) + '…'
                            : selectedStarTip.entry.activity}
                        </text>
                        <text
                          x={tx + 12}
                          y={ty + 39}
                          fill="#EDEFF7"
                          fontFamily="'Manrope', sans-serif"
                          fontSize="11"
                        >
                          {selectedStarTip.entry.cat} · {selectedStarTip.entry.mins} min
                        </text>
                        <text
                          x={tx + 12}
                          y={ty + 51}
                          fill="#8890AE"
                          fontFamily="'Manrope', sans-serif"
                          fontSize="10"
                        >
                          {selectedStarTip.entry.time || currentViewingDate}
                        </text>
                      </>
                    );
                  })()}
                </g>
              )}
            </g>
          </>
        ) : (
          /* Unlit Mode Hero (Hollow pulsing stars) */
          <g id="unlitStarsLayer">
            {tasks.map((t, i) => {
              const pos = unlitPositions[i];
              if (!pos) return null;
              return (
                <circle
                  key={t.id || i}
                  cx={pos.x}
                  cy={pos.y}
                  r="5"
                  stroke={CAT_COLORS[t.cat]}
                  className="unlit-hero-star"
                  style={{ animationDelay: `${(i * 0.7) % 3}s` }}
                  onClick={() => onFlashTask(i)}
                >
                  <title>{t.text}</title>
                </circle>
              );
            })}
          </g>
        )}
      </svg>

      {/* Hero Content Overlay */}
      <div className="relative z-10 pt-16 px-11 max-w-[560px] pointer-events-none sm:pt-16 sm:px-11 max-sm:pt-14 max-sm:px-[22px]">
        <div className="pointer-events-auto">
          <div className="text-xs tracking-[0.14em] text-[#8890AE] mb-2.5">
            {isUnlitMode ? 'NOT YET LIT' : isViewingToday ? 'CONSTELLATION' : 'CELESTIAL ATLAS ARCHIVE'}
          </div>

          <h1
            className="font-serif-cormorant font-medium text-[clamp(38px,5.5vw,58px)] m-0 mb-2 leading-[1.04] text-[#EDEFF7]"
            dangerouslySetInnerHTML={{
              __html: isUnlitMode 
                ? 'Waiting to<br>be earned.' 
                : isViewingToday 
                  ? 'A sky for<br>your life.' 
                  : `Sky of<br>${formatDateShort(currentViewingDate)}.`,
            }}
          />

          <p className="font-serif-cormorant italic text-[18px] text-[#8890AE] m-0 mb-[30px] max-w-[460px]">
            {isUnlitMode
              ? 'These have no light yet. They’re not promises — just shapes traced in the dark until something real fills them in.'
              : isViewingToday
                ? 'Every day you live writes a few more stars. Nothing here is planned — only witnessed.'
                : `Witnessing the asterism written on ${formatDateLong(currentViewingDate)}. Each day possesses its own celestial arrangement.`}
          </p>

          {/* Stats */}
          <div className="flex gap-10 max-sm:gap-6 mb-[26px]">
            <div className="stat">
              <span className="font-serif-cormorant text-[34px] text-[#F2C572] block leading-none">
                {pctLived.toFixed(1)}%
              </span>
              <span className="text-[11px] text-[#8890AE] block mt-1.5 max-w-[130px] leading-[1.4]">
                of an estimated life, already written into the sky
              </span>
            </div>

            <div className="stat">
              <span className="font-serif-cormorant text-[34px] text-[#F2C572] block leading-none">
                {remainingYears}
              </span>
              <span className="text-[11px] text-[#8890AE] block mt-1.5 max-w-[130px] leading-[1.4]">
                years still dark, waiting to be filled
              </span>
            </div>

            <div className="stat">
              <span className="font-serif-cormorant text-[34px] text-[#F2C572] block leading-none">
                {archive.length}
              </span>
              <span className="text-[11px] text-[#8890AE] block mt-1.5 max-w-[130px] leading-[1.4]">
                nights closed into the atlas
              </span>
            </div>
          </div>

          {/* Settings: Birth & Life Expectancy */}
          <div className="flex gap-[22px] flex-wrap text-[13px] text-[#8890AE]">
            <label className="flex items-center gap-2">
              Born{' '}
              <input
                type="number"
                value={birthYear}
                onChange={(e) => onUpdateBirthYear(parseInt(e.target.value, 10) || currentYear)}
                className="bg-transparent border-none border-b border-white/10 text-[#EDEFF7] font-sans-manrope text-[13px] w-[62px] p-[2px_0] outline-none focus:border-[#F2C572] transition-colors"
              />
            </label>

            <label className="flex items-center gap-2">
              Expect to live to{' '}
              <input
                type="number"
                value={lifeExp}
                onChange={(e) => onUpdateLifeExp(parseInt(e.target.value, 10) || 80)}
                className="bg-transparent border-none border-b border-white/10 text-[#EDEFF7] font-sans-manrope text-[13px] w-[62px] p-[2px_0] outline-none focus:border-[#F2C572] transition-colors"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Ring Atlas Caption */}
      {!isUnlitMode && archive.length > 0 && (
        <div className="absolute right-[46px] bottom-[164px] z-20 text-[11px] text-[#8890AE] text-right max-w-[150px] leading-[1.5] italic font-serif-cormorant max-sm:hidden">
          read it like a trunk — width and blend, not numbers
        </div>
      )}

      {/* Ring Atlas (Tree Rings Dendrochronology) */}
      {!isUnlitMode && archive.length > 0 && (
        <div className="absolute right-10 bottom-7 max-sm:right-[22px] max-sm:bottom-[22px] z-20 flex items-center gap-2">
          <div className="flex flex-col gap-1.5">
            <button
              onClick={onPrevDay}
              className="bg-white/5 border border-white/10 text-[#8890AE] hover:text-[#F2C572] hover:border-[#F2C572] w-[22px] h-[22px] rounded-full cursor-pointer text-[11px] flex items-center justify-center transition-colors"
              title="Previous night ring (←)"
            >
              ‹
            </button>
            <button
              onClick={onNextDay}
              disabled={isViewingToday}
              className="bg-white/5 border border-white/10 text-[#8890AE] hover:text-[#F2C572] hover:border-[#F2C572] disabled:opacity-25 disabled:cursor-default w-[22px] h-[22px] rounded-full cursor-pointer text-[11px] flex items-center justify-center transition-colors"
              title="Next night ring (→)"
            >
              ›
            </button>
          </div>

          <svg viewBox="0 0 132 132" className="w-[132px] h-[132px] overflow-visible">
            {/* Historical nights rings */}
            {archive.map((night, idx) => {
              const r = innerStart + idx * gap;
              const { totals, sum } = computeTotals(night.entries);
              const sw = Math.max(1.4, Math.min(gap * 0.85, 1.4 + night.entries.length * 0.4));
              const isSelected = viewingArchiveIdx === idx;

              let cumulative = 0;

              return (
                <g
                  key={idx}
                  onClick={() => onSelectArchiveNight(idx)}
                  className="cursor-pointer"
                >
                  <title>
                    {night.date} — “{night.name}” · {night.entries.length} star
                    {night.entries.length === 1 ? '' : 's'}
                  </title>
                  {sum <= 0 ? (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill="none"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth={sw}
                      className={`ring-seg ${isSelected ? 'selected' : ''}`}
                    />
                  ) : (
                    Object.keys(totals).map((cat) => {
                      const pct = (totals[cat] / sum) * 100;
                      const strokeColor = CAT_COLORS[cat as keyof typeof CAT_COLORS] || '#A9C0F0';
                      const strokeDasharray = `${pct} ${100 - pct}`;
                      const strokeDashoffset = -cumulative;
                      cumulative += pct;

                      return (
                        <circle
                          key={cat}
                          cx={cx}
                          cy={cy}
                          r={r}
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth={sw}
                          pathLength="100"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          transform={`rotate(-90 ${cx} ${cy})`}
                          className={`ring-seg ${isSelected ? 'selected' : ''}`}
                        />
                      );
                    })
                  )}
                </g>
              );
            })}

            {/* Outermost Ring: Tonight */}
            <g
              onClick={() => onSelectArchiveNight(null)}
              className="ring-tonight cursor-pointer"
            >
              <title>Tonight (live)</title>
              {tonightData.sum > 0 ? (
                (() => {
                  let cumulative = 0;
                  return Object.keys(tonightData.totals).map((cat) => {
                    const pct = (tonightData.totals[cat] / tonightData.sum) * 100;
                    const strokeColor = CAT_COLORS[cat as keyof typeof CAT_COLORS] || '#F2C572';
                    const strokeDasharray = `${pct} ${100 - pct}`;
                    const strokeDashoffset = -cumulative;
                    cumulative += pct;

                    return (
                      <circle
                        key={cat}
                        cx={cx}
                        cy={cy}
                        r={tonightR}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="2.4"
                        pathLength="100"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        transform={`rotate(-90 ${cx} ${cy})`}
                        className={`ring-seg ${isViewingToday ? 'selected' : ''}`}
                      />
                    );
                  });
                })()
              ) : (
                <circle
                  cx={cx}
                  cy={cy}
                  r={tonightR}
                  fill="none"
                  stroke="#F2C572"
                  strokeWidth="1.6"
                  strokeDasharray="2 3"
                  className={`ring-seg ${isViewingToday ? 'selected' : ''}`}
                />
              )}
            </g>
          </svg>
        </div>
      )}

      {/* Driftwood: Passive, guilt-free memory */}
      {!isUnlitMode && isViewingToday && driftwoodItem && (
        <div className="absolute left-11 bottom-[34px] max-sm:left-[22px] max-sm:bottom-[22px] max-sm:max-w-[220px] z-20 flex items-center gap-2.5 bg-[#080a1c]/72 border border-white/10 rounded-[20px] p-[8px_14px_8px_10px] max-w-[300px] animate-[driftIn_1.4s_ease_forwards_0.4s,driftBob_6s_ease-in-out_infinite_1.8s]">
          <span
            className="w-[7px] h-[7px] rounded-full shrink-0 opacity-85"
            style={{ backgroundColor: CAT_COLORS[driftwoodItem.entry.cat] }}
          />
          <div className="text-[11.5px] text-[#8890AE] leading-[1.4]">
            <b className="text-[#EDEFF7] font-semibold">
              {driftwoodItem.entry.activity.length > 38
                ? driftwoodItem.entry.activity.slice(0, 37) + '…'
                : driftwoodItem.entry.activity}
            </b>
            <br />
            <span className="italic font-serif-cormorant text-[11px] text-[#8890AE] opacity-80">
              washed up from “{driftwoodItem.nightName}” · {driftwoodItem.date}
            </span>
          </div>
          <button
            onClick={() => setDriftwoodDismissed(true)}
            className="bg-transparent border-none text-[#8890AE] hover:text-[#E0654A] cursor-pointer text-[13px] p-[0_0_0_2px] leading-none opacity-60 hover:opacity-100 shrink-0"
            title="let it drift on"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
