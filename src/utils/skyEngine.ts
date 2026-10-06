/**
 * SkyEngine — Deterministic celestial math and daily astronomical generator for Constellation
 */
import { StarCategory, StarEntry, CAT_COLORS } from '../types/constellation';

// Mulberry32 32-bit deterministic PRNG
export function createRng(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Convert date string YYYY-MM-DD into a numerical seed
export function dateToSeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) + 1337;
}

export interface AmbientStar {
  x: number;
  y: number;
  r: number;
  opacity: number;
  twinkleDelay: number;
  twinkleDuration: number;
}

export interface DailySkyAtmosphere {
  nebulaA: string;
  nebulaB: string;
  skyGradientTop: string;
  skyGradientMid: string;
  skyGradientBottom: string;
  celestialAngle: number;
  moon: {
    phaseName: string;
    symbol: string;
    illumination: number;
  };
}

/**
 * Generate deterministic ambient stars for a specific date
 */
export function generateDailyAmbientStars(dateStr: string, pctLived: number): AmbientStar[] {
  const seed = dateToSeed(dateStr);
  const rng = createRng(seed);
  const count = Math.round(35 + pctLived * 2.5);
  const stars: AmbientStar[] = [];

  for (let i = 0; i < count; i++) {
    stars.push({
      x: rng() * 800,
      y: rng() * 620,
      r: 0.5 + rng() * 1.5,
      opacity: 0.25 + rng() * 0.7,
      twinkleDelay: rng() * 5,
      twinkleDuration: 2.5 + rng() * 3.5,
    });
  }
  return stars;
}

/**
 * Generate subtle daily atmospheric shifts (nebula tones, moon phase, angle)
 */
export function getDailySkyAtmosphere(dateStr: string): DailySkyAtmosphere {
  const seed = dateToSeed(dateStr);
  const rng = createRng(seed);

  // Subtle nebula hue palettes based on day
  const nebulaPalettes = [
    {
      a: 'rgba(90, 60, 160, 0.22)',
      b: 'rgba(30, 110, 110, 0.16)',
      top: '#0C1030',
      mid: '#131A45',
      bot: '#05060F',
    },
    {
      a: 'rgba(50, 80, 160, 0.24)',
      b: 'rgba(110, 60, 130, 0.18)',
      top: '#0A122E',
      mid: '#121C42',
      bot: '#04050E',
    },
    {
      a: 'rgba(120, 70, 130, 0.20)',
      b: 'rgba(35, 120, 140, 0.15)',
      top: '#100E2C',
      mid: '#19153E',
      bot: '#060611',
    },
    {
      a: 'rgba(40, 110, 130, 0.22)',
      b: 'rgba(85, 50, 140, 0.16)',
      top: '#081428',
      mid: '#10203D',
      bot: '#03060D',
    },
    {
      a: 'rgba(100, 50, 120, 0.22)',
      b: 'rgba(45, 95, 135, 0.17)',
      top: '#120E2E',
      mid: '#1B1740',
      bot: '#050510',
    },
  ];

  const paletteIndex = Math.floor(rng() * nebulaPalettes.length);
  const palette = nebulaPalettes[paletteIndex];

  // Moon phase calculation for the date
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, (month || 1) - 1, day || 1);
  
  // Approximate synodic month lunar phase (29.53 days cycle)
  const knownNewMoon = new Date(2000, 0, 6, 18, 14, 0).getTime();
  const diffDays = (d.getTime() - knownNewMoon) / (1000 * 60 * 60 * 24);
  const phaseCycle = ((diffDays % 29.53058867) + 29.53058867) % 29.53058867;
  const phaseNormalized = phaseCycle / 29.53058867; // 0 to 1

  let phaseName = 'New Moon';
  let symbol = '🌑';
  let illumination = 0;

  if (phaseNormalized < 0.03 || phaseNormalized > 0.97) {
    phaseName = 'New Moon';
    symbol = '🌑';
    illumination = 2;
  } else if (phaseNormalized < 0.22) {
    phaseName = 'Waxing Crescent';
    symbol = '🌒';
    illumination = Math.round(phaseNormalized * 4 * 50);
  } else if (phaseNormalized < 0.28) {
    phaseName = 'First Quarter';
    symbol = '🌓';
    illumination = 50;
  } else if (phaseNormalized < 0.47) {
    phaseName = 'Waxing Gibbous';
    symbol = '🌔';
    illumination = Math.round(50 + (phaseNormalized - 0.25) * 4 * 50);
  } else if (phaseNormalized < 0.53) {
    phaseName = 'Full Moon';
    symbol = '🌕';
    illumination = 100;
  } else if (phaseNormalized < 0.72) {
    phaseName = 'Waning Gibbous';
    symbol = '🌖';
    illumination = Math.round(100 - (phaseNormalized - 0.5) * 4 * 50);
  } else if (phaseNormalized < 0.78) {
    phaseName = 'Last Quarter';
    symbol = '🌗';
    illumination = 50;
  } else {
    phaseName = 'Waning Crescent';
    symbol = '🌘';
    illumination = Math.round(50 - (phaseNormalized - 0.75) * 4 * 50);
  }

  return {
    nebulaA: palette.a,
    nebulaB: palette.b,
    skyGradientTop: palette.top,
    skyGradientMid: palette.mid,
    skyGradientBottom: palette.bot,
    celestialAngle: Math.floor(rng() * 360),
    moon: {
      phaseName,
      symbol,
      illumination,
    },
  };
}

/**
 * Generate stable, organic star node coordinates for logged entries on a given date
 */
export function generateDailyStarPositions(entries: StarEntry[], dateStr: string): { x: number; y: number }[] {
  if (entries.length === 0) return [];
  const seed = dateToSeed(dateStr);
  const rng = createRng(seed + 999);

  // Define dynamic astronomical center anchor for this date's asterism
  const centerX = 490 + (rng() - 0.5) * 70;
  const centerY = 240 + (rng() - 0.5) * 70;
  const spreadRadius = 115 + rng() * 55;

  return entries.map((_, i) => {
    // Distribute sequentially in an astronomical wandering curve
    const angle = (i / Math.max(1, entries.length)) * Math.PI * 1.5 + (rng() - 0.5) * 0.35;
    const radial = (0.25 + (i / Math.max(1, entries.length)) * 0.75) * spreadRadius;
    const jitterX = (rng() - 0.5) * 35;
    const jitterY = (rng() - 0.5) * 35;

    // Guaranteed safe margins away from screen boundaries & hero text
    const x = Math.max(260, Math.min(670, centerX + Math.cos(angle) * radial + jitterX));
    const y = Math.max(70, Math.min(470, centerY + Math.sin(angle) * radial * 0.75 + jitterY));

    return { x, y };
  });
}

// Date helpers
export function shiftDate(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, (month || 1) - 1, day || 1);
  d.setDate(d.getDate() + days);
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

export function formatDateLong(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, (month || 1) - 1, day || 1);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateShort(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, (month || 1) - 1, day || 1);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
