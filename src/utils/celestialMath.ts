import { SpectralClass } from '../types/astronomy';

// Spectral type to realistic stellar color (blackbody radiation approximation)
export const SPECTRAL_COLORS: Record<SpectralClass, { main: string; glow: string; tempK: number; desc: string }> = {
  O: { main: '#9bb0ff', glow: 'rgba(155, 176, 255, 0.4)', tempK: 35000, desc: 'Hot Blue Supergiant' },
  B: { main: '#bbccff', glow: 'rgba(187, 204, 255, 0.35)', tempK: 20000, desc: 'Luminous Blue-White' },
  A: { main: '#f8f9ff', glow: 'rgba(248, 249, 255, 0.3)', tempK: 8500, desc: 'Pure White Star' },
  F: { main: '#ffffed', glow: 'rgba(255, 255, 237, 0.25)', tempK: 6500, desc: 'Yellow-White Star' },
  G: { main: '#fff4e8', glow: 'rgba(255, 244, 232, 0.25)', tempK: 5700, desc: 'Yellow Dwarf (Solar-like)' },
  K: { main: '#ffd2a1', glow: 'rgba(255, 210, 161, 0.3)', tempK: 4500, desc: 'Orange Giant/Dwarf' },
  M: { main: '#ff9980', glow: 'rgba(255, 153, 128, 0.4)', tempK: 3200, desc: 'Cool Red Giant / Dwarf' },
};

export function getSpectralColor(type: SpectralClass): string {
  return SPECTRAL_COLORS[type]?.main || '#f8f9ff';
}

export function getSpectralGlow(type: SpectralClass): string {
  return SPECTRAL_COLORS[type]?.glow || 'rgba(255, 255, 255, 0.25)';
}

// Convert RA (hours 0-24) and Dec (degrees -90 to +90) into spherical 3D unit coordinates
export function raDecToSphere(raHours: number, decDeg: number): { x: number; y: number; z: number } {
  const raRad = (raHours / 24) * (2 * Math.PI);
  const decRad = (decDeg * Math.PI) / 180;
  
  // Right ascension increases eastward
  const x = Math.cos(decRad) * Math.cos(raRad);
  const y = Math.sin(decRad); // +y is North celestial pole
  const z = Math.cos(decRad) * Math.sin(raRad);
  return { x, y, z };
}

// Stereographic / Orthographic projection with user azimuth/pitch rotation & zoom
export function project3DTo2D(
  point3D: { x: number; y: number; z: number },
  width: number,
  height: number,
  yawRad: number, // Azimuth rotation
  pitchRad: number, // Altitude tilt
  zoom: number
): { x: number; y: number; visible: boolean; depth: number } {
  // Rotate around Y-axis (Yaw)
  const cosY = Math.cos(yawRad);
  const sinY = Math.sin(yawRad);
  const x1 = point3D.x * cosY - point3D.z * sinY;
  const z1 = point3D.x * sinY + point3D.z * cosY;
  const y1 = point3D.y;

  // Rotate around X-axis (Pitch)
  const cosP = Math.cos(pitchRad);
  const sinP = Math.sin(pitchRad);
  const y2 = y1 * cosP - z1 * sinP;
  const z2 = y1 * sinP + z1 * cosP;
  const x2 = x1;

  // Check if facing front hemisphere or in wide-sky dome
  const radius = Math.min(width, height) * 0.42 * zoom;
  const centerX = width / 2;
  const centerY = height / 2;

  // Stereographic projection for hemispherical sky dome
  // z2 ranges from -1 (behind observer) to +1 (facing observer)
  const visible = z2 > -0.3; // allow slight wrap-around for wide constellations
  const perspective = 1 / (1.5 - z2 * 0.5);

  const screenX = centerX + x2 * radius * perspective;
  const screenY = centerY - y2 * radius * perspective; // Flip Y for celestial north up

  return {
    x: screenX,
    y: screenY,
    visible,
    depth: z2,
  };
}

// Convert apparent magnitude to visual star radius and opacity
export function magToVisuals(mag: number, zoom: number = 1) {
  // Sirius is -1.46, Vega is 0.03, Polaris is 1.98, dim stars are ~5-6
  // Normalize magnitude to radius: brighter stars (smaller/negative mag) = larger radius
  const clampedMag = Math.max(-2, Math.min(6.5, mag));
  const normalized = (6.5 - clampedMag) / 8.5; // 0 (dimmest) to 1 (brightest)
  
  const baseRadius = 0.8 + Math.pow(normalized, 2.2) * 5.5;
  const radius = Math.max(1, baseRadius * Math.min(1.8, Math.max(0.7, Math.sqrt(zoom))));
  const opacity = 0.35 + Math.pow(normalized, 1.4) * 0.65;
  const glowRadius = radius * (1.8 + normalized * 3.5);

  return { radius, opacity, glowRadius };
}

// Local Sidereal Time and celestial positions
export function calculateLST(date: Date, longitudeDeg: number): number {
  // Julian Date calculation
  const time = date.getTime();
  const jd = time / 86400000 + 2440587.5;
  const d = jd - 2451545.0; // days since J2000.0
  
  // Greenwich Mean Sidereal Time in hours
  let gmst = 18.697374558 + 24.06570982441908 * d;
  gmst = ((gmst % 24) + 24) % 24;
  
  // Local Sidereal Time in hours
  let lst = gmst + longitudeDeg / 15.0;
  lst = ((lst % 24) + 24) % 24;
  return lst;
}

// Calculate horizontal Altitude and Azimuth for an object (RA/Dec) from an observer location
export function getAltAz(
  raHours: number,
  decDeg: number,
  latDeg: number,
  lstHours: number
): { altitude: number; azimuth: number } {
  // Hour Angle in degrees
  let haDeg = (lstHours - raHours) * 15;
  haDeg = ((haDeg % 360) + 360) % 360;

  const latRad = (latDeg * Math.PI) / 180;
  const decRad = (decDeg * Math.PI) / 180;
  const haRad = (haDeg * Math.PI) / 180;

  // Altitude
  const sinAlt = Math.sin(decRad) * Math.sin(latRad) + Math.cos(decRad) * Math.cos(latRad) * Math.cos(haRad);
  const altRad = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  const altitude = (altRad * 180) / Math.PI;

  // Azimuth
  const cosAz = (Math.sin(decRad) - Math.sin(latRad) * sinAlt) / (Math.cos(latRad) * Math.cos(altRad));
  let azRad = Math.acos(Math.max(-1, Math.min(1, cosAz)));
  let azimuth = (azRad * 180) / Math.PI;

  if (Math.sin(haRad) > 0) {
    azimuth = 360 - azimuth;
  }

  return { altitude, azimuth };
}

// Calculate exact Moon phase, illumination %, and phase name
export function calculateMoonPhase(date: Date): {
  phaseIndex: number; // 0 to 1
  illuminationPct: number; // 0 to 100
  phaseName: string;
  ageDays: number;
  iconName: string;
} {
  const synodicMonth = 29.53058867;
  // Known reference new moon: Jan 6, 2000 18:14 UTC
  const refDate = new Date(Date.UTC(2000, 0, 6, 18, 14, 0)).getTime();
  const diffDays = (date.getTime() - refDate) / (1000 * 60 * 60 * 24);
  const ageDays = ((diffDays % synodicMonth) + synodicMonth) % synodicMonth;
  const phaseIndex = ageDays / synodicMonth; // 0 to 1

  // Illumination percentage (0% at New Moon, 100% at Full Moon)
  const illuminationPct = Math.round((1 - Math.cos(phaseIndex * 2 * Math.PI)) * 50);

  let phaseName = 'New Moon';
  let iconName = 'Moon';

  if (ageDays < 1.84) {
    phaseName = 'New Moon';
  } else if (ageDays < 5.53) {
    phaseName = 'Waxing Crescent';
  } else if (ageDays < 9.22) {
    phaseName = 'First Quarter';
  } else if (ageDays < 12.91) {
    phaseName = 'Waxing Gibbous';
  } else if (ageDays < 16.61) {
    phaseName = 'Full Moon';
  } else if (ageDays < 20.3) {
    phaseName = 'Waning Gibbous';
  } else if (ageDays < 23.99) {
    phaseName = 'Last Quarter';
  } else if (ageDays < 27.68) {
    phaseName = 'Waning Crescent';
  } else {
    phaseName = 'New Moon';
  }

  return {
    phaseIndex,
    illuminationPct,
    phaseName,
    ageDays: Math.round(ageDays * 10) / 10,
    iconName,
  };
}
