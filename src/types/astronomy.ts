export type SpectralClass = 'O' | 'B' | 'A' | 'F' | 'G' | 'K' | 'M';

export interface Star {
  id: string;
  name: string;
  bayer?: string;
  flamsteed?: string;
  spectralType: SpectralClass;
  mag: number; // Apparent magnitude (lower = brighter)
  absMag?: number;
  ra: number; // Right Ascension in decimal hours (0 to 24)
  dec: number; // Declination in decimal degrees (-90 to +90)
  distLy: number; // Distance in Light Years
  constellationId: string;
  color: string;
  luminosity?: number; // Solar luminosities (L☉)
  temperatureK?: number;
  radiusSolar?: number;
  notes?: string;
  historicalName?: string;
}

export interface DeepSkyObject {
  id: string;
  name: string;
  catalogNum: string; // e.g. M31, NGC 7000
  type: 'Nebula' | 'Galaxy' | 'Star Cluster' | 'Supernova Remnant' | 'Planetary Nebula';
  mag: number;
  distLy: number;
  ra: number;
  dec: number;
  constellationId: string;
  description: string;
  iconType?: string;
}

export interface MeteorShower {
  name: string;
  peakDate: string; // e.g. "Aug 12-13"
  ratePerHour: number; // ZHR
  parentBody: string;
  velocityKmS: number;
}

export interface ConstellationMyth {
  culture: string;
  title: string;
  story: string;
}

export interface Constellation {
  id: string;
  name: string;
  latinName: string;
  englishName: string;
  abbreviation: string;
  genitive: string;
  family: 'Zodiac' | 'Ursa Major' | 'Perseus' | 'Hercules' | 'Orion' | 'Heavenly Waters' | 'Bayer' | 'La Caille';
  season: 'Spring' | 'Summer' | 'Autumn' | 'Winter' | 'Circumpolar';
  hemisphere: 'Northern' | 'Southern' | 'Equatorial';
  areaSqDeg: number;
  rankByArea: number;
  brightestStarName: string;
  brightestStarMag: number;
  raCenter: number; // approximate center RA (hours)
  decCenter: number; // approximate center Dec (deg)
  description: string;
  lore: string;
  myths: ConstellationMyth[];
  stars: Star[];
  lines: [string, string][]; // Star ID pairs to connect
  deepSkyObjects: DeepSkyObject[];
  meteorShowers: MeteorShower[];
  zodiacSymbol?: string;
  zodiacDates?: string;
  visibilityNote?: string;
  artSilhouettePath?: string;
}

export interface CustomStarNode {
  id: string;
  x: number; // 0 to 1 relative
  y: number; // 0 to 1 relative
  name: string;
  mag: number;
  spectralType: SpectralClass;
}

export interface CustomConstellation {
  id: string;
  name: string;
  latinName: string;
  creatorName: string;
  symbol: string;
  myth: string;
  season: string;
  stars: CustomStarNode[];
  lines: [number, number][]; // Index pairs
  createdAt: string;
  colorTheme: string;
}

export interface ObservationLocation {
  id: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  bortleClass: number; // 1 to 9
  skyQualityDesc: string;
}
