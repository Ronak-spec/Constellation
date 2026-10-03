/**
 * svgExporter.ts — Generates high-resolution, publication-quality standalone SVG maps
 * of the user's constellation and celestial sky state.
 */
import { StarEntry, StarCategory, CAT_COLORS, CONST_NAMES } from '../types/constellation';
import { 
  generateDailyAmbientStars, 
  getDailySkyAtmosphere, 
  generateDailyStarPositions, 
  formatDateLong 
} from './skyEngine';

export interface SvgExportOptions {
  dateStr: string;
  isToday: boolean;
  entries: StarEntry[];
  birthYear: number;
  lifeExp: number;
  constellationName?: string;
  userName?: string;
}

/**
 * Escapes XML/SVG special characters in text strings
 */
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

/**
 * Build a complete, self-contained SVG string of the constellation sky
 */
export function generateConstellationSvgString({
  dateStr,
  isToday,
  entries,
  birthYear,
  lifeExp,
  constellationName,
  userName = 'Stargazer',
}: SvgExportOptions): string {
  const currentYear = new Date().getFullYear();
  const age = Math.max(0, currentYear - birthYear);
  const pctLived = Math.min(100, Math.max(0, (age / lifeExp) * 100));

  // Determine dominant constellation
  let dominantName = constellationName;
  if (!dominantName) {
    if (entries.length === 0) {
      dominantName = isToday ? 'Awaiting its first star' : 'A Quiet Starlit Sky';
    } else {
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
      dominantName = CONST_NAMES[topCat] || 'The Wanderer';
    }
  }

  const atmosphere = getDailySkyAtmosphere(dateStr);
  const ambientStars = generateDailyAmbientStars(dateStr, pctLived);
  const starCoords = generateDailyStarPositions(entries, dateStr);

  // Scaled dimensions for a 1200x900 high-res celestial canvas
  const scaleX = 1200 / 800;
  const scaleY = 900 / 620;

  // Calculate totals
  let totalMinutes = 0;
  const catTotals: Record<StarCategory, number> = {
    Work: 0,
    Chores: 0,
    Connection: 0,
    Rest: 0,
    Joy: 0,
    Scroll: 0,
  };

  entries.forEach((e) => {
    totalMinutes += e.mins;
    catTotals[e.cat] = (catTotals[e.cat] || 0) + e.mins;
  });

  const totalHoursFormatted = (totalMinutes / 60).toFixed(1);
  const dateFormatted = formatDateLong(dateStr);

  // Build lines SVG
  let linesSvg = '';
  for (let i = 1; i < starCoords.length; i++) {
    const prev = starCoords[i - 1];
    const curr = starCoords[i];
    const x1 = prev.x * scaleX;
    const y1 = prev.y * scaleY;
    const x2 = curr.x * scaleX;
    const y2 = curr.y * scaleY;
    linesSvg += `
      <line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="rgba(242, 197, 114, 0.45)" stroke-width="1.8" stroke-linecap="round" filter="url(#glowLine)" />
      <line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="rgba(255, 255, 255, 0.7)" stroke-width="0.7" stroke-linecap="round" />
    `;
  }

  // Build ambient stars SVG
  let ambientSvg = '';
  ambientStars.forEach((s) => {
    const ax = s.x * scaleX;
    const ay = s.y * scaleY;
    ambientSvg += `<circle cx="${ax.toFixed(1)}" cy="${ay.toFixed(1)}" r="${(s.r * 1.1).toFixed(1)}" fill="#ffffff" opacity="${s.opacity.toFixed(2)}" />\n`;
  });

  // Build primary stars SVG & Labels
  let starsSvg = '';
  let labelsSvg = '';

  entries.forEach((e, i) => {
    const coord = starCoords[i];
    if (!coord) return;
    const cx = coord.x * scaleX;
    const cy = coord.y * scaleY;
    const color = CAT_COLORS[e.cat] || '#F2C572';
    const radius = (4.5 + Math.min(6, e.mins / 30)).toFixed(1);

    // Star halo & core
    starsSvg += `
      <g id="star-${i}">
        <!-- Outer Halo -->
        <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(parseFloat(radius) * 2.2).toFixed(1)}" fill="${color}" opacity="0.22" filter="url(#glowStar)" />
        <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(parseFloat(radius) * 1.5).toFixed(1)}" fill="${color}" opacity="0.45" />
        <!-- Core Star -->
        <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${radius}" fill="${color}" stroke="#FFFFFF" stroke-width="1.2" />
        <!-- Sparkle Center -->
        <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="1.5" fill="#FFFFFF" />
      </g>
    `;

    // Star Activity Callout Label (staggered slightly to prevent overlap)
    const isRight = cx > 600;
    const labelX = isRight ? cx - 14 : cx + 14;
    const anchor = isRight ? 'end' : 'start';
    const labelY = cy - 8;

    labelsSvg += `
      <g opacity="0.92">
        <text x="${labelX.toFixed(1)}" y="${labelY.toFixed(1)}" fill="#F2C572" font-family="'Cormorant Garamond', Georgia, serif" font-size="14" font-weight="600" text-anchor="${anchor}">
          ${escapeXml(e.activity)}
        </text>
        <text x="${labelX.toFixed(1)}" y="${(labelY + 13).toFixed(1)}" fill="#8890AE" font-family="'Manrope', -apple-system, sans-serif" font-size="10" font-weight="500" text-anchor="${anchor}">
          ${escapeXml(e.cat)} · ${e.mins}m
        </text>
      </g>
    `;
  });

  // Active Category Legend items
  let legendSvg = '';
  let activeCats = (Object.keys(catTotals) as StarCategory[]).filter((c) => catTotals[c] > 0);
  if (activeCats.length === 0) activeCats = ['Work', 'Chores', 'Connection', 'Rest', 'Joy', 'Scroll'];

  activeCats.forEach((cat, idx) => {
    const lx = 60 + idx * 150;
    const ly = 840;
    const col = CAT_COLORS[cat];
    const mins = catTotals[cat];
    legendSvg += `
      <g transform="translate(${lx}, ${ly})">
        <circle cx="0" cy="0" r="4.5" fill="${col}" stroke="#FFFFFF" stroke-width="0.8" />
        <text x="10" y="3" fill="#EDEFF7" font-family="'Manrope', sans-serif" font-size="11" font-weight="500">
          ${cat} <tspan fill="#8890AE" font-size="10">(${mins}m)</tspan>
        </text>
      </g>
    `;
  });

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="1200" height="900" viewBox="0 0 1200 900" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <!-- Embedded Google Web Fonts -->
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&amp;family=Manrope:wght@400;500;600;700&amp;family=DM+Mono:wght@400;500&amp;display=swap');
      
      .const-title { font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 600; }
      .const-sub { font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; }
      .const-mono { font-family: 'DM Mono', monospace; }
      .const-sans { font-family: 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif; }
    </style>

    <!-- Deep Space Sky Gradient -->
    <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${atmosphere.skyGradientTop}" />
      <stop offset="45%" stop-color="${atmosphere.skyGradientMid}" />
      <stop offset="100%" stop-color="${atmosphere.skyGradientBottom}" />
    </linearGradient>

    <!-- Nebula Glow A -->
    <radialGradient id="nebulaGlowA" cx="20%" cy="15%" r="55%">
      <stop offset="0%" stop-color="${atmosphere.nebulaA}" />
      <stop offset="100%" stop-color="transparent" stop-opacity="0" />
    </radialGradient>

    <!-- Nebula Glow B -->
    <radialGradient id="nebulaGlowB" cx="80%" cy="40%" r="50%">
      <stop offset="0%" stop-color="${atmosphere.nebulaB}" />
      <stop offset="100%" stop-color="transparent" stop-opacity="0" />
    </radialGradient>

    <!-- Glow Filters -->
    <filter id="glowStar" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="5" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <filter id="glowLine" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Sky Canvas Background -->
  <rect width="1200" height="900" fill="url(#skyGrad)" />
  <rect width="1200" height="900" fill="url(#nebulaGlowA)" />
  <rect width="1200" height="900" fill="url(#nebulaGlowB)" />

  <!-- Celestial Grid & Meridian Coordinate Lines -->
  <g opacity="0.12" stroke="#A9C0F0" stroke-width="0.8" fill="none">
    <!-- Concentric Celestial Circles -->
    <circle cx="600" cy="450" r="160" stroke-dasharray="3,6" />
    <circle cx="600" cy="450" r="300" stroke-dasharray="4,8" />
    <circle cx="600" cy="450" r="440" stroke-dasharray="5,10" />
    <!-- Meridian Crosshairs -->
    <line x1="600" y1="40" x2="600" y2="860" stroke-dasharray="4,6" />
    <line x1="50" y1="450" x2="1150" y2="450" stroke-dasharray="4,6" />
    <!-- Diagonal Guides -->
    <line x1="160" y1="130" x2="1040" y2="770" stroke-dasharray="2,8" />
    <line x1="1040" y1="130" x2="160" y2="770" stroke-dasharray="2,8" />
  </g>

  <!-- Ambient Stars Field -->
  <g id="ambientStars">
    ${ambientSvg}
  </g>

  <!-- Constellation Connecting Lines -->
  <g id="constellationLines">
    ${linesSvg}
  </g>

  <!-- Star Nodes -->
  <g id="starNodes">
    ${starsSvg}
  </g>

  <!-- Star Text Callouts -->
  <g id="starLabels">
    ${labelsSvg}
  </g>

  <!-- Astro Frame Border with Corner Accents -->
  <rect x="24" y="24" width="1152" height="852" fill="none" stroke="rgba(242, 197, 114, 0.35)" stroke-width="1.2" />
  <rect x="30" y="30" width="1140" height="840" fill="none" stroke="rgba(255, 255, 255, 0.08)" stroke-width="0.8" />
  
  <!-- Corner Star Glyphs -->
  <text x="24" y="22" fill="#F2C572" font-size="14" text-anchor="middle">✦</text>
  <text x="1176" y="22" fill="#F2C572" font-size="14" text-anchor="middle">✦</text>
  <text x="24" y="884" fill="#F2C572" font-size="14" text-anchor="middle">✦</text>
  <text x="1176" y="884" fill="#F2C572" font-size="14" text-anchor="middle">✦</text>

  <!-- Top Title Cartouche -->
  <g transform="translate(60, 75)">
    <text x="0" y="0" fill="#8890AE" class="const-mono" font-size="11" letter-spacing="3">
      CELESTIAL ATLAS · CONSTELLATION MAP
    </text>
    <text x="0" y="32" fill="#EDEFF7" class="const-title" font-size="34">
      ${escapeXml(dateFormatted)}
    </text>
    <text x="0" y="58" fill="#F2C572" class="const-sub" font-size="21">
      “${escapeXml(dominantName)}” · ${atmosphere.moon.symbol} ${escapeXml(atmosphere.moon.phaseName)}
    </text>
  </g>

  <!-- Top-Right Astrometric Summary Badge -->
  <g transform="translate(940, 75)">
    <rect x="-20" y="-12" width="220" height="74" rx="10" fill="rgba(8, 10, 28, 0.85)" stroke="rgba(242, 197, 114, 0.25)" stroke-width="1" />
    <text x="0" y="14" fill="#F2C572" class="const-title" font-size="22">
      ${totalHoursFormatted} <tspan fill="#8890AE" font-size="14" class="const-sans">hours logged</tspan>
    </text>
    <text x="0" y="34" fill="#EDEFF7" class="const-sans" font-size="12">
      ${entries.length} stars charted tonight
    </text>
    <text x="0" y="50" fill="#8890AE" class="const-mono" font-size="10">
      ${pctLived.toFixed(1)}% of horizon written
    </text>
  </g>

  <!-- Bottom Legend & Citation Banner -->
  <g id="bottomBar">
    <!-- Category Legend -->
    ${legendSvg}

    <!-- Watermark & Signature -->
    <text x="1140" y="843" fill="#8890AE" class="const-sans" font-size="11" text-anchor="end" opacity="0.8">
      Charted by <tspan fill="#F2C572" font-weight="600">${escapeXml(userName)}</tspan> · Constellation
    </text>
  </g>
</svg>`;
}

/**
 * Triggers a browser download of the SVG file
 */
export function downloadConstellationSvg(options: SvgExportOptions): void {
  const svgString = generateConstellationSvgString(options);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const sanitizedDate = options.dateStr.replace(/[^a-zA-Z0-9-]/g, '_');
  const filename = `constellation-map-${sanitizedDate}.svg`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copies the raw SVG string to clipboard
 */
export async function copyConstellationSvgToClipboard(options: SvgExportOptions): Promise<boolean> {
  try {
    const svgString = generateConstellationSvgString(options);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(svgString);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to copy SVG to clipboard:', err);
    return false;
  }
}
