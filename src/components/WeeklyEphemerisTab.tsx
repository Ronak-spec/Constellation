import React, { useState, useMemo } from 'react';
import { 
  StarCategory, 
  StarEntry, 
  ArchivedNight, 
  CAT_COLORS, 
  CONST_NAMES 
} from '../types/constellation';
import { shiftDate, formatDateLong, formatDateShort } from '../utils/skyEngine';

interface WeeklyEphemerisTabProps {
  currentEntries: StarEntry[];
  archive: ArchivedNight[];
  currentViewingDate: string;
  onSelectDate: (dateStr: string) => void;
  onJumpToToday: () => void;
}

interface DayEphemeris {
  date: string;
  dayLabel: string;
  dateShort: string;
  isToday: boolean;
  entries: StarEntry[];
  totalMins: number;
  totalStars: number;
  dominantCategory: StarCategory | null;
  constellationName: string;
  categoryMins: Record<StarCategory, number>;
}

const ALL_CATEGORIES: StarCategory[] = ['Work', 'Chores', 'Connection', 'Rest', 'Joy', 'Scroll'];

export function WeeklyEphemerisTab({
  currentEntries,
  archive,
  currentViewingDate,
  onSelectDate,
  onJumpToToday,
}: WeeklyEphemerisTabProps) {
  // Anchor date for the 7-day ephemeris (default to currentViewingDate or today)
  const [anchorDate, setAnchorDate] = useState<string>(currentViewingDate);
  const [selectedCategory, setSelectedCategory] = useState<StarCategory | 'ALL'>('ALL');
  const [searchFilter, setSearchFilter] = useState('');
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Sync anchorDate if currentViewingDate changes and user hasn't explicitly navigated weeks
  React.useEffect(() => {
    setAnchorDate(currentViewingDate);
  }, [currentViewingDate]);

  // Generate 7-day list ending at anchorDate
  const sevenDayDates = useMemo(() => {
    const dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      dates.push(shiftDate(anchorDate, -i));
    }
    return dates;
  }, [anchorDate]);

  // Aggregate daily data for each of the 7 days
  const weeklyData: DayEphemeris[] = useMemo(() => {
    const archiveMap = new Map<string, StarEntry[]>();
    archive.forEach((item) => {
      archiveMap.set(item.date, item.entries);
    });

    const todayStr = (() => {
      const d = new Date();
      return (
        d.getFullYear() +
        '-' +
        String(d.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(d.getDate()).padStart(2, '0')
      );
    })();

    return sevenDayDates.map((dateStr) => {
      const isToday = dateStr === todayStr;
      // If it's today and we have currentEntries in active state, use currentEntries
      let entriesForDate: StarEntry[] = [];
      if (isToday) {
        entriesForDate = currentEntries;
      } else if (archiveMap.has(dateStr)) {
        entriesForDate = archiveMap.get(dateStr) || [];
      }

      const categoryMins: Record<StarCategory, number> = {
        Work: 0,
        Chores: 0,
        Connection: 0,
        Rest: 0,
        Joy: 0,
        Scroll: 0,
      };

      let totalMins = 0;
      entriesForDate.forEach((e) => {
        categoryMins[e.cat] = (categoryMins[e.cat] || 0) + e.mins;
        totalMins += e.mins;
      });

      // Find dominant category
      let maxMins = 0;
      let dominant: StarCategory | null = null;
      ALL_CATEGORIES.forEach((cat) => {
        if (categoryMins[cat] > maxMins) {
          maxMins = categoryMins[cat];
          dominant = cat;
        }
      });

      const [year, month, day] = dateStr.split('-').map(Number);
      const d = new Date(year, (month || 1) - 1, day || 1);
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dateShort = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const constellationName = dominant ? CONST_NAMES[dominant] : 'The Quiet Void';

      return {
        date: dateStr,
        dayLabel,
        dateShort,
        isToday,
        entries: entriesForDate,
        totalMins,
        totalStars: entriesForDate.length,
        dominantCategory: dominant,
        constellationName,
        categoryMins,
      };
    });
  }, [sevenDayDates, archive, currentEntries]);

  // Overall 7-day category totals
  const aggregateTotals = useMemo(() => {
    const categoryTotals: Record<StarCategory, { mins: number; count: number }> = {
      Work: { mins: 0, count: 0 },
      Chores: { mins: 0, count: 0 },
      Connection: { mins: 0, count: 0 },
      Rest: { mins: 0, count: 0 },
      Joy: { mins: 0, count: 0 },
      Scroll: { mins: 0, count: 0 },
    };

    let grandTotalMins = 0;
    let grandTotalStars = 0;
    let activeDaysCount = 0;

    weeklyData.forEach((day) => {
      if (day.totalStars > 0) activeDaysCount++;
      day.entries.forEach((e) => {
        categoryTotals[e.cat].mins += e.mins;
        categoryTotals[e.cat].count += 1;
        grandTotalMins += e.mins;
        grandTotalStars += 1;
      });
    });

    // Find dominant weekly category
    let dominantCat: StarCategory = 'Work';
    let maxCategoryMins = -1;
    ALL_CATEGORIES.forEach((cat) => {
      if (categoryTotals[cat].mins > maxCategoryMins) {
        maxCategoryMins = categoryTotals[cat].mins;
        dominantCat = cat;
      }
    });

    // Luminous Balance Score: (Connection + Rest + Joy) vs (Work + Chores + Scroll)
    const nourishingMins = categoryTotals.Connection.mins + categoryTotals.Rest.mins + categoryTotals.Joy.mins;
    const demandingMins = categoryTotals.Work.mins + categoryTotals.Chores.mins;
    const driftMins = categoryTotals.Scroll.mins;

    const balancePct = grandTotalMins > 0 ? Math.round((nourishingMins / grandTotalMins) * 100) : 0;
    const focusRatio = grandTotalMins > 0 ? Math.max(0, Math.round(((grandTotalMins - driftMins) / grandTotalMins) * 100)) : 100;

    return {
      categoryTotals,
      grandTotalMins,
      grandTotalStars,
      activeDaysCount,
      dominantCat,
      nourishingMins,
      demandingMins,
      driftMins,
      balancePct,
      focusRatio,
    };
  }, [weeklyData]);

  // Week date range label
  const weekRangeLabel = useMemo(() => {
    if (sevenDayDates.length === 0) return '';
    const startStr = formatDateShort(sevenDayDates[0]);
    const endStr = formatDateLong(sevenDayDates[sevenDayDates.length - 1]);
    return `${startStr} – ${endStr}`;
  }, [sevenDayDates]);

  // Format hours & minutes nicely
  const formatMins = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  // Week navigation
  const handlePrevWeek = () => {
    setAnchorDate((prev) => shiftDate(prev, -7));
  };

  const handleNextWeek = () => {
    setAnchorDate((prev) => shiftDate(prev, 7));
  };

  const handleResetToCurrent = () => {
    setAnchorDate(currentViewingDate);
  };

  // All stars in this 7-day window for list view
  const allWeeklyStars = useMemo(() => {
    const list: { star: StarEntry; date: string; dayLabel: string }[] = [];
    weeklyData.forEach((d) => {
      d.entries.forEach((star) => {
        list.push({ star, date: d.date, dayLabel: d.dayLabel });
      });
    });
    return list;
  }, [weeklyData]);

  const filteredStars = useMemo(() => {
    return allWeeklyStars.filter((item) => {
      const matchCat = selectedCategory === 'ALL' || item.star.cat === selectedCategory;
      const matchSearch =
        !searchFilter ||
        item.star.activity.toLowerCase().includes(searchFilter.toLowerCase()) ||
        item.star.cat.toLowerCase().includes(searchFilter.toLowerCase()) ||
        item.dayLabel.toLowerCase().includes(searchFilter.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [allWeeklyStars, selectedCategory, searchFilter]);

  // Copy Ephemeris summary to clipboard
  const handleCopySummary = () => {
    const lines = [
      `✦ CONSTELLATION WEEKLY EPHEMERIS (${weekRangeLabel}) ✦`,
      `Total Logged: ${formatMins(aggregateTotals.grandTotalMins)} across ${aggregateTotals.grandTotalStars} stars (${aggregateTotals.activeDaysCount}/7 active nights)`,
      `Dominant Asterism: ${CONST_NAMES[aggregateTotals.dominantCat] || 'The Wanderer'} (${aggregateTotals.dominantCat})`,
      `Luminous Balance: ${aggregateTotals.balancePct}% Nourishing · Focus Index: ${aggregateTotals.focusRatio}%`,
      '',
      '--- CATEGORY BREAKDOWN ---',
      ...ALL_CATEGORIES.map((cat) => {
        const data = aggregateTotals.categoryTotals[cat];
        const pct = aggregateTotals.grandTotalMins > 0 ? Math.round((data.mins / aggregateTotals.grandTotalMins) * 100) : 0;
        return `• ${cat}: ${formatMins(data.mins)} (${pct}%, ${data.count} stars)`;
      }),
      '',
      '--- 7-NIGHT RHYTHM ---',
      ...weeklyData.map((d) => {
        return `• ${d.dayLabel} (${d.dateShort}): ${d.totalStars} stars, ${formatMins(d.totalMins)} [${d.constellationName}]`;
      }),
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  return (
    <div className="pt-8 pb-12 animate-[driftIn_0.35s_ease-out]">
      
      {/* Ephemeris Header & Time Window Controls */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 mb-7 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block w-2 h-2 rounded-full bg-[#F2C572] shadow-[0_0_8px_#F2C572]" />
              <h2 className="font-serif-cormorant text-2xl italic font-normal text-[#EDEFF7] tracking-wide m-0">
                Weekly Celestial Ephemeris
              </h2>
            </div>
            <p className="font-mono-dm text-[12px] text-[#8890AE] tracking-wider uppercase m-0">
              {weekRangeLabel}
            </p>
          </div>

          {/* Week Navigation Arrows */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
            <button
              onClick={handlePrevWeek}
              className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-mono-dm text-[#C9D6F5] hover:text-white transition-colors flex items-center gap-1.5"
              title="View previous 7-day period"
            >
              <span>←</span>
              <span>Prev Week</span>
            </button>

            <button
              onClick={handleResetToCurrent}
              className="px-2.5 py-1.5 rounded-lg bg-[#F2C572]/10 hover:bg-[#F2C572]/20 border border-[#F2C572]/30 text-[11px] font-mono-dm text-[#F2C572] transition-colors"
              title="Jump to current week"
            >
              Current
            </button>

            <button
              onClick={handleNextWeek}
              className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-mono-dm text-[#C9D6F5] hover:text-white transition-colors flex items-center gap-1.5"
              title="View next 7-day period"
            >
              <span>Next Week</span>
              <span>→</span>
            </button>
          </div>
        </div>

        {/* Quick Vital Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3">
            <div className="font-mono-dm text-[10px] text-[#8890AE] uppercase tracking-wider mb-1">
              Active Starlight
            </div>
            <div className="font-serif-cormorant text-2xl text-[#EDEFF7] font-semibold leading-tight">
              {formatMins(aggregateTotals.grandTotalMins)}
            </div>
            <div className="font-sans-manrope text-[11px] text-[#8890AE] mt-0.5">
              {aggregateTotals.grandTotalStars} stars lit in 7 nights
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3">
            <div className="font-mono-dm text-[10px] text-[#8890AE] uppercase tracking-wider mb-1">
              Dominant Asterism
            </div>
            <div className="font-serif-cormorant text-xl text-[#F2C572] font-semibold italic leading-tight truncate">
              {CONST_NAMES[aggregateTotals.dominantCat] || 'The Wanderer'}
            </div>
            <div className="font-sans-manrope text-[11px] text-[#8890AE] mt-0.5">
              {aggregateTotals.dominantCat} archetype
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3">
            <div className="font-mono-dm text-[10px] text-[#8890AE] uppercase tracking-wider mb-1">
              Nourishing Balance
            </div>
            <div className="font-serif-cormorant text-2xl text-[#A9C0F0] font-semibold leading-tight">
              {aggregateTotals.balancePct}%
            </div>
            <div className="font-sans-manrope text-[11px] text-[#8890AE] mt-0.5">
              Joy, Rest & Connection
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3">
            <div className="font-mono-dm text-[10px] text-[#8890AE] uppercase tracking-wider mb-1">
              Nightly Consistency
            </div>
            <div className="font-serif-cormorant text-2xl text-[#EDEFF7] font-semibold leading-tight">
              {aggregateTotals.activeDaysCount}/7
            </div>
            <div className="font-sans-manrope text-[11px] text-[#8890AE] mt-0.5">
              {aggregateTotals.activeDaysCount >= 5 ? 'Vibrant Sky rhythm' : 'Sparse wandering'}
            </div>
          </div>
        </div>
      </div>

      {/* 7-Night Daily Distribution Heat-strip & Day-by-Day Cards */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="font-serif-cormorant text-xl italic text-[#EDEFF7] font-normal m-0">
            7-Night Ephemeris Rhythm
          </h3>
          <span className="font-mono-dm text-[11px] text-[#8890AE]">
            Click any night to jump to its sky
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-7 gap-2.5">
          {weeklyData.map((day) => {
            const isCurrentViewing = day.date === currentViewingDate;
            const hasStars = day.totalStars > 0;
            return (
              <div
                key={day.date}
                onClick={() => onSelectDate(day.date)}
                className={`group relative flex flex-col justify-between p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                  isCurrentViewing
                    ? 'bg-[#F2C572]/10 border-[#F2C572]/60 shadow-[0_0_15px_rgba(242,197,114,0.15)]'
                    : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.08] hover:border-white/20'
                }`}
              >
                {/* Top: Day & Date */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-mono-dm text-[11px] font-bold ${day.isToday ? 'text-[#F2C572]' : 'text-[#C9D6F5]'}`}>
                      {day.dayLabel}
                    </span>
                    {day.isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F2C572] animate-ping" />
                    )}
                  </div>
                  <div className="font-sans-manrope text-[10px] text-[#8890AE] mb-2.5">
                    {day.dateShort}
                  </div>
                </div>

                {/* Center: Constellation & Star Visual */}
                <div className="my-2 text-center">
                  {hasStars ? (
                    <>
                      <div className="flex items-center justify-center gap-1 mb-1.5 flex-wrap max-h-12 overflow-hidden">
                        {day.entries.slice(0, 6).map((star, idx) => (
                          <span
                            key={star.id || idx}
                            className="inline-block w-2 h-2 rounded-full transition-transform group-hover:scale-125"
                            style={{
                              backgroundColor: CAT_COLORS[star.cat],
                              boxShadow: `0 0 6px ${CAT_COLORS[star.cat]}99`,
                            }}
                            title={`${star.activity} (${star.cat}, ${star.mins}m)`}
                          />
                        ))}
                        {day.entries.length > 6 && (
                          <span className="text-[9px] font-mono-dm text-[#8890AE]">
                            +{day.entries.length - 6}
                          </span>
                        )}
                      </div>
                      <div className="font-serif-cormorant text-[13px] text-[#EDEFF7] italic font-medium truncate">
                        {day.constellationName}
                      </div>
                      <div className="font-mono-dm text-[10px] text-[#A9C0F0]">
                        {formatMins(day.totalMins)}
                      </div>
                    </>
                  ) : (
                    <div className="py-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/20 mx-auto mb-1 opacity-40" />
                      <div className="font-mono-dm text-[10px] text-[#8890AE]/60 italic">
                        Quiet Sky
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom: Stacked Category Ribbon */}
                <div className="mt-2 pt-2 border-t border-white/[0.06]">
                  {hasStars ? (
                    <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden flex">
                      {ALL_CATEGORIES.map((cat) => {
                        const mins = day.categoryMins[cat];
                        if (mins === 0) return null;
                        const widthPct = (mins / Math.max(1, day.totalMins)) * 100;
                        return (
                          <div
                            key={cat}
                            style={{
                              width: `${widthPct}%`,
                              backgroundColor: CAT_COLORS[cat],
                            }}
                            title={`${cat}: ${mins}m`}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="w-full h-1.5 bg-white/[0.04] rounded-full" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Breakdown & Luminous Balance Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        
        {/* Left 2 Cols: Category Spectrum & Star Counts */}
        <div className="md:col-span-2 bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif-cormorant text-xl italic text-[#EDEFF7] font-normal m-0">
              Activity Category Spectrum
            </h3>
            <span className="font-mono-dm text-[11px] text-[#8890AE]">
              7-Day Cumulative
            </span>
          </div>

          {/* Aggregate Category Progress Bar */}
          {aggregateTotals.grandTotalMins > 0 && (
            <div className="w-full h-3 rounded-full bg-black/50 overflow-hidden flex mb-5 border border-white/10 p-[1px]">
              {ALL_CATEGORIES.map((cat) => {
                const data = aggregateTotals.categoryTotals[cat];
                if (data.mins === 0) return null;
                const widthPct = (data.mins / aggregateTotals.grandTotalMins) * 100;
                return (
                  <div
                    key={cat}
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: CAT_COLORS[cat],
                    }}
                    className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-300"
                    title={`${cat}: ${formatMins(data.mins)} (${Math.round(widthPct)}%)`}
                  />
                );
              })}
            </div>
          )}

          {/* Category Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {ALL_CATEGORIES.map((cat) => {
              const data = aggregateTotals.categoryTotals[cat];
              const pct = aggregateTotals.grandTotalMins > 0 ? Math.round((data.mins / aggregateTotals.grandTotalMins) * 100) : 0;
              const isSelected = selectedCategory === cat;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(isSelected ? 'ALL' : cat)}
                  className={`text-left p-3 rounded-xl border transition-all duration-200 ${
                    isSelected
                      ? 'bg-white/[0.09] border-[#F2C572] shadow-sm'
                      : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: CAT_COLORS[cat], boxShadow: `0 0 6px ${CAT_COLORS[cat]}88` }}
                      />
                      <span className="font-sans-manrope text-xs font-semibold text-[#EDEFF7]">
                        {cat}
                      </span>
                    </div>
                    <span className="font-mono-dm text-[10px] text-[#8890AE]">
                      {pct}%
                    </span>
                  </div>

                  <div className="font-serif-cormorant text-lg text-[#EDEFF7] font-semibold leading-tight">
                    {formatMins(data.mins)}
                  </div>
                  <div className="font-sans-manrope text-[10px] text-[#8890AE] mt-0.5 flex items-center justify-between">
                    <span>{data.count} {data.count === 1 ? 'star' : 'stars'}</span>
                    <span className="text-[9px] font-mono-dm opacity-80">{CONST_NAMES[cat]}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedCategory !== 'ALL' && (
            <div className="mt-3 text-right">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className="text-xs font-mono-dm text-[#F2C572] hover:underline"
              >
                Clear category filter (Showing {selectedCategory} only)
              </button>
            </div>
          )}
        </div>

        {/* Right 1 Col: Astronomical Ephemeris Reflection */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono-dm text-[11px] text-[#F2C572] uppercase tracking-wider">
                ✦ Astrological Reading
              </span>
            </div>
            <h4 className="font-serif-cormorant text-xl text-[#EDEFF7] italic font-normal mb-2 leading-snug">
              Week of {CONST_NAMES[aggregateTotals.dominantCat] || 'The Uncharted'}
            </h4>
            <p className="font-sans-manrope text-xs text-[#8890AE] leading-relaxed mb-4">
              {aggregateTotals.grandTotalMins === 0 ? (
                'The night sky has been clear and restful. Log your waking hours tonight to seed new constellations in your weekly ephemeris.'
              ) : aggregateTotals.balancePct > 45 ? (
                `A luminous, restorative constellation holds your week. ${aggregateTotals.balancePct}% of your charted time went into Connection, Joy, and Rest.`
              ) : aggregateTotals.driftMins > aggregateTotals.grandTotalMins * 0.25 ? (
                `The flickering light of the screen accounted for ${formatMins(aggregateTotals.driftMins)}. Consider anchoring unlit intentions to guide your evening orbit.`
              ) : (
                `A focused and productive orbit dominated by ${aggregateTotals.dominantCat} (${formatMins(aggregateTotals.categoryTotals[aggregateTotals.dominantCat].mins)}). Remember to kindle quiet rest.`
              )}
            </p>
          </div>

          {/* Copy Summary Action */}
          <div className="pt-3 border-t border-white/[0.08]">
            <button
              onClick={handleCopySummary}
              className="w-full py-2 px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-mono-dm text-[#C9D6F5] hover:text-[#EDEFF7] transition-all flex items-center justify-center gap-2"
            >
              <span>{copiedNotification ? '✓ Ephemeris Copied!' : '📋 Copy Weekly Ephemeris'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Week's Star Chronicle / Activity List */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-serif-cormorant text-xl italic text-[#EDEFF7] font-normal m-0">
              7-Day Star Chronicle
            </h3>
            <p className="font-mono-dm text-[11px] text-[#8890AE] m-0">
              {filteredStars.length} {filteredStars.length === 1 ? 'star' : 'stars'} recorded during this period
            </p>
          </div>

          {/* Quick Filter Input */}
          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Search weekly stars or category..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-[#EDEFF7] placeholder-[#8890AE]/60 focus:outline-none focus:border-[#F2C572]/60"
            />
          </div>
        </div>

        {filteredStars.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {filteredStars.map(({ star, date, dayLabel }, idx) => (
              <div
                key={star.id || `${date}-${idx}`}
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: CAT_COLORS[star.cat],
                      boxShadow: `0 0 8px ${CAT_COLORS[star.cat]}aa`,
                    }}
                  />
                  <div>
                    <div className="font-sans-manrope text-sm font-medium text-[#EDEFF7]">
                      {star.activity}
                    </div>
                    <div className="flex items-center gap-2 font-mono-dm text-[10px] text-[#8890AE]">
                      <span className="text-[#C9D6F5]">{dayLabel} ({date})</span>
                      <span>·</span>
                      <span style={{ color: CAT_COLORS[star.cat] }}>{star.cat}</span>
                      {star.time && <span>· {star.time}</span>}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono-dm text-xs text-[#F2C572] font-semibold">
                    {formatMins(star.mins)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-[#8890AE]">
            <p className="font-serif-cormorant text-lg italic text-[#EDEFF7]/70 mb-1">
              No stars match your filter in this 7-day window.
            </p>
            <p className="font-sans-manrope text-xs">
              Log activities in the "Tonight" tab or select another week.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
