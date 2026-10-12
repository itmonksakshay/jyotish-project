/**
 * Astrology and Astronomy Mathematics Engine (Vedic Astrology / Jyotish)
 * Written from scratch without any external astronomical dependencies.
 *
 * Implements Keplerian orbital elements, Kepler's equation solver,
 * solar/lunar perturbations, Sidereal Lahiri Ayanamsa, oblique ascendant projection,
 * Vimshottari Dasha timeline, and Ashta Koota compatibility matching.
 */

// Math constants
const PI = Math.PI;
const RAD = PI / 180;
const DEG = 180 / PI;

/** Helper to convert degrees to radians */
export const rad = (deg: number) => deg * RAD;
/** Helper to convert radians to degrees */
export const deg = (radVal: number) => radVal * DEG;

/** Normalize degrees to the range [0, 360) */
export const normalizeDeg = (d: number): number => {
  let val = d % 360;
  if (val < 0) val += 360;
  return val;
};

// Types
export interface BirthDetails {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  latitude: number;  // Positive for North, Negative for South
  longitude: number; // Positive for East, Negative for West
  timezone: number;  // Hours offset from UTC (e.g. +5.5 for IST)
}

export interface PlanetPosition {
  name: string;
  tropicalLon: number;
  siderealLon: number;
  lat: number;
  distance: number;
  rashiIndex: number; // 0 = Aries, 1 = Taurus, ...
  rashiName: string;
  nakshatraIndex: number; // 0 = Ashwini, ...
  nakshatraName: string;
  pada: number; // 1, 2, 3, 4
  house: number; // 1-12 relative to Ascendant
  isRetrograde: boolean;
}

export interface KundliData {
  julianDay: number;
  ayanamsa: number;
  lagna: {
    tropicalLon: number;
    siderealLon: number;
    rashiIndex: number;
    rashiName: string;
  };
  planets: PlanetPosition[];
}

// Astrological static names
export const RASHI_NAMES = [
  "Aries (Mesha)", "Taurus (Vrishabha)", "Gemini (Mithuna)", "Cancer (Karka)",
  "Leo (Simha)", "Virgo (Kanya)", "Libra (Tula)", "Scorpio (Vrischika)",
  "Sagittarius (Dhanu)", "Capricorn (Makara)", "Aquarius (Kumbha)", "Pisces (Meena)"
];

export const NAKSHATRA_NAMES = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
  "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
  "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
];

export const NAKSHATRA_LORDS = [
  "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"
];

// Vimshottari period durations (years)
export const VIMSHOTTARI_PERIODS: Record<string, number> = {
  "Ketu": 7, "Venus": 20, "Sun": 6, "Moon": 10, "Mars": 7, "Rahu": 18,
  "Jupiter": 16, "Saturn": 19, "Mercury": 17
};

export const VIMSHOTTARI_ORDER = [
  "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"
];

/**
 * 1. Julian Date Calculation from Calendar Date/Time
 * JD is the standard baseline count of days since January 1, 4713 BC.
 */
export const calculateJulianDay = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timezoneOffsetHours: number
): number => {
  // Convert local time to UTC
  let hourUTC = hour - timezoneOffsetHours + (minute / 60.0) + (second / 3600.0);
  let y = year;
  let m = month;
  
  if (m <= 2) {
    y -= 1;
    m += 12;
  }

  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);

  const dayFraction = hourUTC / 24.0;
  
  // Julian Date formula for Gregorian Calendar
  const jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + (day + dayFraction) + B - 1524.5;
  return jd;
};

/**
 * 2. Obliquity of the Ecliptic (Earth's axial tilt)
 * Formula based on Julian Centuries (T) from J2000.
 */
export const getObliquity = (T: number): number => {
  // Angle in degrees
  return 23.4392911 - 0.0130042 * T - 0.00000016 * T * T + 0.000000504 * T * T * T;
};

/**
 * 3. Lahiri Ayanamsa Precession Calculation
 * Anchor point: J2000.0 Ayanamsa = 23.85708 degrees.
 */
export const getLahiriAyanamsa = (T: number): number => {
  // Linearly increases by ~50.29 arcseconds per year (1.39697 degrees per century)
  return 23.85708 + 1.39697 * T + 0.0003086 * T * T;
};

/**
 * 4. Greenwich Mean Sidereal Time (GMST) and Local Sidereal Time (LST)
 * LST is required to compute the Lagna (Ascendant).
 */
export const calculateLST = (jd: number, longitude: number): number => {
  const T = (jd - 2451545.0) / 36525.0;
  
  // Greenwich Mean Sidereal Time in degrees
  let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) +
             0.000387933 * T * T - (T * T * T) / 38710000.0;
  gmst = normalizeDeg(gmst);
  
  // Local Sidereal Time = GMST + Longitude (positive East)
  return normalizeDeg(gmst + longitude);
};

/**
 * 5. Solve Kepler's Equation: E - e * sin(E) = M
 * Solved via Newton-Raphson iteration.
 */
export const solveKepler = (M_deg: number, ecc: number): { eccentricAnomalyRad: number; iterations: number } => {
  const M_rad = rad(normalizeDeg(M_deg));
  let E = M_rad + ecc * Math.sin(M_rad); // Initial guess
  
  let diff = 1.0;
  let iterations = 0;
  const tolerance = 1e-7;
  const maxIterations = 100;

  while (Math.abs(diff) > tolerance && iterations < maxIterations) {
    diff = M_rad - (E - ecc * Math.sin(E));
    E = E + diff / (1.0 - ecc * Math.cos(E));
    iterations++;
  }

  return { eccentricAnomalyRad: E, iterations };
};

/**
 * 6. Standard Keplerian Planetary Elements Table (J2000.0)
 * Sourced from NASA JPL "Approximate Positions of the Planets" (1800-2050).
 */
interface KeplerElements {
  name: string;
  a0: number; aDot: number; // Semi-major axis (au, au/cy)
  e0: number; eDot: number; // Eccentricity (rad, rad/cy)
  i0: number; iDot: number; // Inclination (deg, deg/cy)
  L0: number; LDot: number; // Mean Longitude (deg, deg/cy)
  w0: number; wDot: number; // Longitude of perihelion (deg, deg/cy)
  node0: number; nodeDot: number; // Longitude of ascending node (deg, deg/cy)
}

const PLANETS_DB: Record<string, KeplerElements> = {
  Mercury: {
    name: "Mercury",
    a0: 0.38709927, aDot: 0.00000037,
    e0: 0.20563593, eDot: 0.00001906,
    i0: 7.00497902, iDot: -0.00594749,
    L0: 252.25032350, LDot: 149472.67411175,
    w0: 77.45779628, wDot: 0.16047689,
    node0: 48.33076593, nodeDot: -0.12534081
  },
  Venus: {
    name: "Venus",
    a0: 0.72333566, aDot: 0.00000390,
    e0: 0.00677672, eDot: -0.00004107,
    i0: 3.39467605, iDot: -0.00078890,
    L0: 181.97909950, LDot: 58517.81538729,
    w0: 131.60246718, wDot: 0.00268329,
    node0: 76.67984255, nodeDot: -0.27769418
  },
  Earth: {
    name: "Earth",
    a0: 1.00000261, aDot: 0.00000562,
    e0: 0.01671123, eDot: -0.00004392,
    i0: -0.00001531, iDot: -0.01294668,
    L0: 100.46457166, LDot: 35999.37244981,
    w0: 102.93768193, wDot: 0.32327364,
    node0: 0.0, nodeDot: 0.0
  },
  Mars: {
    name: "Mars",
    a0: 1.52371034, aDot: 0.00001847,
    e0: 0.09339410, eDot: 0.00007882,
    i0: 1.84969142, iDot: -0.00813131,
    L0: -4.55343205, LDot: 19140.30268499,
    w0: -23.94362959, wDot: 0.44441088,
    node0: 49.55953891, nodeDot: -0.29257343
  },
  Jupiter: {
    name: "Jupiter",
    a0: 5.20288700, aDot: -0.00011607,
    e0: 0.04838624, eDot: -0.00013253,
    i0: 1.30439695, iDot: -0.00183714,
    L0: 34.39644051, LDot: 3034.74612775,
    w0: 14.72847983, wDot: 0.21252668,
    node0: 100.47390909, nodeDot: 0.20469106
  },
  Saturn: {
    name: "Saturn",
    a0: 9.53667594, aDot: -0.00125060,
    e0: 0.05386179, eDot: -0.00050991,
    i0: 2.48599187, iDot: 0.00193609,
    L0: 49.95424423, LDot: 1222.49362201,
    w0: 92.59887831, wDot: -0.41897216,
    node0: 113.66242448, nodeDot: -0.28867794
  }
};

/** Calculates Heliocentric Ecliptic coordinates [x, y, z] for a planet */
export const getHeliocentricCoords = (planetName: string, T: number): { x: number; y: number; z: number; details: any } => {
  const db = PLANETS_DB[planetName];
  if (!db) return { x: 0, y: 0, z: 0, details: {} };

  const a = db.a0 + db.aDot * T;
  const e = db.e0 + db.eDot * T;
  const i = db.i0 + db.iDot * T;
  const L = db.L0 + db.LDot * T;
  const w = db.w0 + db.wDot * T;
  const node = db.node0 + db.nodeDot * T;

  const wArg = normalizeDeg(w - node);
  const M = normalizeDeg(L - w);

  const { eccentricAnomalyRad: E, iterations } = solveKepler(M, e);

  // Position in orbital plane
  const xPrime = a * (Math.cos(E) - e);
  const yPrime = a * Math.sqrt(1.0 - e * e) * Math.sin(E);

  // Rotate to J2000 Ecliptic
  const cosW = Math.cos(rad(wArg));
  const sinW = Math.sin(rad(wArg));
  const cosNode = Math.cos(rad(node));
  const sinNode = Math.sin(rad(node));
  const cosI = Math.cos(rad(i));
  const sinI = Math.sin(rad(i));

  const xEcl = xPrime * (cosW * cosNode - sinW * sinNode * cosI) - yPrime * (sinW * cosNode + cosW * sinNode * cosI);
  const yEcl = xPrime * (cosW * sinNode + sinW * cosNode * cosI) - yPrime * (sinW * sinNode - cosW * cosNode * cosI);
  const zEcl = xPrime * (sinW * sinI) + yPrime * (cosW * sinI);

  return {
    x: xEcl,
    y: yEcl,
    z: zEcl,
    details: { a, e, i, L, w, node, M, E: deg(E), iterations }
  };
};

/**
 * Calculates Geocentric Coordinates for a planet
 * Geocentric = Planet Heliocentric - Earth Heliocentric
 */
export const getGeocentricLonLat = (planetName: string, T: number): { lon: number; lat: number; dist: number; details: any } => {
  const p = getHeliocentricCoords(planetName, T);
  const e = getHeliocentricCoords("Earth", T);

  // Vector subtraction
  const x = p.x - e.x;
  const y = p.y - e.y;
  const z = p.z - e.z;

  const lon = normalizeDeg(deg(Math.atan2(y, x)));
  const dist = Math.sqrt(x*x + y*y + z*z);
  const lat = deg(Math.atan2(z, Math.sqrt(x*x + y*y)));

  return {
    lon,
    lat,
    dist,
    details: {
      planetHelio: [p.x, p.y, p.z],
      earthHelio: [e.x, e.y, e.z],
      geoVector: [x, y, z],
      planetMath: p.details
    }
  };
};

/**
 * 7. Moon's Geocentric Longitude & Latitude from Perturbations
 * Includes 4 major solar-gravitational perturbations (Equation of Center, Evection, Variation, Annual Equation).
 */
export const getMoonCoords = (T: number): { lon: number; lat: number; dist: number; details: any } => {
  // Mean elements for the Moon in degrees
  const L0 = normalizeDeg(218.3164477 + 481267.88123421 * T); // Mean longitude
  const M_moon = normalizeDeg(134.963396 + 477198.867505 * T); // Mean anomaly of Moon
  const M_sun = normalizeDeg(357.529109 + 35999.05029 * T); // Mean anomaly of Sun
  const D = normalizeDeg(297.850192 + 445267.111403 * T); // Mean elongation
  const F = normalizeDeg(93.272095 + 483202.017538 * T); // Argument of latitude

  // Perturbative terms in degrees
  const eqOfCenter = 6.289 * Math.sin(rad(M_moon));
  const evection = 1.274 * Math.sin(rad(2 * D - M_moon));
  const variation = 0.658 * Math.sin(rad(2 * D));
  const annualEq = -0.186 * Math.sin(rad(M_sun));

  const totalLonCorrection = eqOfCenter + evection + variation + annualEq;
  const lon = normalizeDeg(L0 + totalLonCorrection);
  
  // Approximate latitude (tilt angle of 5.14 degrees)
  const lat = 5.128 * Math.sin(rad(F));
  
  const dist = 0.00257; // Orbit distance in AU (approx 384,400 km)

  return {
    lon,
    lat,
    dist,
    details: { L0, M_moon, M_sun, D, F, corrections: { eqOfCenter, evection, variation, annualEq } }
  };
};

/**
 * 8. Ascendant (Lagna) Cusp calculation
 */
export const calculateAscendant = (lst: number, latitude: number, epsilon: number): number => {
  const RAMC = rad(lst);
  const latRad = rad(latitude);
  const epsRad = rad(epsilon);

  const y = Math.sin(RAMC);
  const x = -Math.cos(RAMC) * Math.cos(epsRad) - Math.tan(latRad) * Math.sin(epsRad);

  let asc = deg(Math.atan2(y, x));
  return normalizeDeg(asc);
};

/**
 * Helper to identify Nakshatra details from a longitude
 */
export const getNakshatraInfo = (lon: number): { index: number; name: string; pada: number; lord: string } => {
  const span = 13.333333333333334; // 13 degrees 20 minutes
  const index = Math.floor(lon / span) % 27;
  const remainder = lon % span;
  const pada = Math.floor(remainder / (span / 4)) + 1;
  const lord = NAKSHATRA_LORDS[index % 9];
  return { index, name: NAKSHATRA_NAMES[index], pada, lord };
};

/**
 * Helper to identify Rashi (Vedic Sign) details from a longitude
 */
export const getRashiInfo = (lon: number): { index: number; name: string } => {
  const index = Math.floor(lon / 30) % 12;
  return { index, name: RASHI_NAMES[index] };
};

/**
 * Main function to cast a complete birth chart
 */
export const castKundli = (details: BirthDetails): KundliData => {
  const jd = calculateJulianDay(
    details.year,
    details.month,
    details.day,
    details.hour,
    details.minute,
    details.second,
    details.timezone
  );

  const T = (jd - 2451545.0) / 36525.0;
  const ayanamsa = getLahiriAyanamsa(T);
  const eps = getObliquity(T);
  const lst = calculateLST(jd, details.longitude);

  // Lagna
  const lagnaTropical = calculateAscendant(lst, details.latitude, eps);
  const lagnaSidereal = normalizeDeg(lagnaTropical - ayanamsa);
  const lagnaRashi = getRashiInfo(lagnaSidereal);

  // Cast Planets
  const planetList = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Rahu", "Ketu"];
  const planets: PlanetPosition[] = [];

  planetList.forEach((name) => {
    let tropicalLon = 0;
    let lat = 0;
    let distance = 0;
    let detailsLog: any = null;

    if (name === "Sun") {
      // Earth geocentric vector flipped is Sun geocentric vector
      const e = getHeliocentricCoords("Earth", T);
      const sx = -e.x;
      const sy = -e.y;
      const sz = -e.z;
      tropicalLon = normalizeDeg(deg(Math.atan2(sy, sx)));
      distance = Math.sqrt(sx*sx + sy*sy + sz*sz);
      lat = deg(Math.atan2(sz, Math.sqrt(sx*sx + sy*sy)));
      detailsLog = { planetHelio: [0,0,0], earthHelio: [e.x, e.y, e.z], geoVector: [sx, sy, sz] };
    } else if (name === "Moon") {
      const m = getMoonCoords(T);
      tropicalLon = m.lon;
      lat = m.lat;
      distance = m.dist;
      detailsLog = m.details;
    } else if (name === "Rahu") {
      // Mean ascending node formula
      tropicalLon = normalizeDeg(125.04452 - 1934.136261 * T + 0.0020708 * T * T);
      lat = 0;
      distance = 1.0;
      detailsLog = { nodeFormula: true };
    } else if (name === "Ketu") {
      // Ketu is opposite node
      const rNode = normalizeDeg(125.04452 - 1934.136261 * T + 0.0020708 * T * T);
      tropicalLon = normalizeDeg(rNode + 180);
      lat = 0;
      distance = 1.0;
      detailsLog = { nodeFormulaOpposite: true };
    } else {
      // Mercury, Venus, Mars, Jupiter, Saturn
      const p = getGeocentricLonLat(name, T);
      tropicalLon = p.lon;
      lat = p.lat;
      distance = p.dist;
      detailsLog = p.details;
    }

    const siderealLon = normalizeDeg(tropicalLon - ayanamsa);
    const rashi = getRashiInfo(siderealLon);
    const nakshatra = getNakshatraInfo(siderealLon);
    
    // House position is relative to Lagna Rashi. 1st house is Lagna sign.
    // Whole sign system.
    const house = (rashi.index - lagnaRashi.index + 12) % 12 + 1;

    // Simple Retrograde approximation by checking velocity over a 1-day step
    let isRetrograde = false;
    if (name !== "Sun" && name !== "Moon" && name !== "Rahu" && name !== "Ketu") {
      const dt = 1.0 / 36525.0; // 1 day in Julian centuries
      const pNext = getGeocentricLonLat(name, T + dt);
      let diff = pNext.lon - tropicalLon;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;
      if (diff < 0) isRetrograde = true;
    } else if (name === "Rahu" || name === "Ketu") {
      // Nodes are always retrograde in Mean motion
      isRetrograde = true;
    }

    planets.push({
      name,
      tropicalLon,
      siderealLon,
      lat,
      distance,
      rashiIndex: rashi.index,
      rashiName: rashi.name,
      nakshatraIndex: nakshatra.index,
      nakshatraName: nakshatra.name,
      pada: nakshatra.pada,
      house,
      isRetrograde
    });
  });

  return {
    julianDay: jd,
    ayanamsa,
    lagna: {
      tropicalLon: lagnaTropical,
      siderealLon: lagnaSidereal,
      rashiIndex: lagnaRashi.index,
      rashiName: lagnaRashi.name
    },
    planets
  };
};

/**
 * 9. Vimshottari Dasha calculation
 * Calculates 120-year Mahadasha dates starting from the birth date.
 */
export interface DashaPeriod {
  lord: string;
  startDate: Date;
  endDate: Date;
  subPeriods?: DashaPeriod[];
}

export const calculateVimshottariDashas = (birthDate: Date, moonSiderealLon: number): DashaPeriod[] => {
  const moonNak = getNakshatraInfo(moonSiderealLon);
  const startLordIndex = moonNak.index % 9;
  
  // Calculate remaining balance of the first Dasha
  const nakSpan = 13.333333333333334;
  const elapsedInNak = moonSiderealLon % nakSpan;
  const fractionRemaining = (nakSpan - elapsedInNak) / nakSpan;
  
  const dashaLordsSequence = [
    ...VIMSHOTTARI_ORDER.slice(startLordIndex),
    ...VIMSHOTTARI_ORDER,
    ...VIMSHOTTARI_ORDER
  ].slice(0, 9); // Create the 9 lord sequence starting with the birth lord

  const dashaPeriods: DashaPeriod[] = [];
  let currentDate = new Date(birthDate.getTime());

  dashaLordsSequence.forEach((lord, seqIdx) => {
    let years = VIMSHOTTARI_PERIODS[lord];
    if (seqIdx === 0) {
      // first lord is fractioned
      years = years * fractionRemaining;
    }

    const durationMs = years * 365.25 * 24 * 60 * 60 * 1000;
    const endDate = new Date(currentDate.getTime() + durationMs);

    // Compute Antardashas within this Mahadasha
    const subPeriods: DashaPeriod[] = [];
    const mainPeriodYears = VIMSHOTTARI_PERIODS[lord];
    
    // Antardashas sequence starts with the Mahadasha lord itself
    const startSubLordIdx = VIMSHOTTARI_ORDER.indexOf(lord);
    const subLordsSequence = [
      ...VIMSHOTTARI_ORDER.slice(startSubLordIdx),
      ...VIMSHOTTARI_ORDER
    ].slice(0, 9);

    let currentSubDate = new Date(currentDate.getTime());
    
    subLordsSequence.forEach((subLord) => {
      const subYears = mainPeriodYears * (VIMSHOTTARI_PERIODS[subLord] / 120.0);
      let adjustedSubYears = subYears;
      if (seqIdx === 0) {
        // Adjust subperiods of the first dasha proportionally
        adjustedSubYears = subYears * fractionRemaining;
      }
      const subDurationMs = adjustedSubYears * 365.25 * 24 * 60 * 60 * 1000;
      const endSubDate = new Date(currentSubDate.getTime() + subDurationMs);

      subPeriods.push({
        lord: subLord,
        startDate: new Date(currentSubDate.getTime()),
        endDate: new Date(endSubDate.getTime())
      });

      currentSubDate = endSubDate;
    });

    dashaPeriods.push({
      lord,
      startDate: new Date(currentDate.getTime()),
      endDate: new Date(endDate.getTime()),
      subPeriods
    });

    currentDate = endDate;
  });

  return dashaPeriods;
};

/**
 * 10. Ashta Koota Compatibility Calculation
 * Groom and Bride Moon-sign match points out of 36 gunas.
 */
export interface KootaScore {
  varna: { max: 1; score: number; details: string };
  vashya: { max: 2; score: number; details: string };
  tara: { max: 3; score: number; details: string };
  yoni: { max: 4; score: number; details: string };
  maitri: { max: 5; score: number; details: string };
  gana: { max: 6; score: number; details: string };
  bhakoot: { max: 7; score: number; details: string };
  nadi: { max: 8; score: number; details: string };
  totalScore: number;
  warnings: string[];
}

// 27 Nakshatras Yoni animals list
const YONI_ANIMALS = [
  "Horse", "Elephant", "Sheep", "Serpent", "Serpent", "Dog",
  "Cat", "Cat", "Sheep", "Rat", "Rat", "Cow",
  "Buffalo", "Tiger", "Tiger", "Buffalo", "Hare", "Hare",
  "Dog", "Monkey", "Mongoose", "Monkey", "Lion", "Horse",
  "Lion", "Cow", "Elephant"
];

// Nadi categories: 0 = Adi (Vata), 1 = Madhya (Pitta), 2 = Antya (Kapha)
const NAKSHATRA_NADI = [
  0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2
];

// Gana categories: 0 = Deva (Divine), 1 = Manushya (Human), 2 = Rakshasa (Demon)
const NAKSHATRA_GANA = [
  0, 1, 2, 1, 0, 1, 0, 0, 2, 2, 1, 1, 0, 2, 0, 2, 0, 2, 2, 1, 2, 0, 2, 2, 2, 1, 0
];

// Planetary friendships (Maitri table)
// 0 = Enemy, 1 = Neutral, 2 = Friend
const PLANET_FRIENDSHIP: Record<string, Record<string, number>> = {
  Sun: { Sun: 2, Moon: 2, Mars: 2, Mercury: 1, Jupiter: 2, Venus: 0, Saturn: 0 },
  Moon: { Sun: 2, Moon: 2, Mars: 1, Mercury: 2, Jupiter: 1, Venus: 1, Saturn: 1 },
  Mars: { Sun: 2, Moon: 2, Mars: 2, Mercury: 0, Jupiter: 2, Venus: 1, Saturn: 1 },
  Mercury: { Sun: 2, Moon: 0, Mars: 1, Mercury: 2, Jupiter: 1, Venus: 2, Saturn: 1 },
  Jupiter: { Sun: 2, Moon: 2, Mars: 2, Mercury: 0, Jupiter: 2, Venus: 0, Saturn: 1 },
  Venus: { Sun: 0, Moon: 0, Mars: 1, Mercury: 2, Jupiter: 1, Venus: 2, Saturn: 2 },
  Saturn: { Sun: 0, Moon: 0, Mars: 0, Mercury: 2, Jupiter: 1, Venus: 2, Saturn: 2 }
};

const RASHI_LORDS = [
  "Mars", // Aries
  "Venus", // Taurus
  "Mercury", // Gemini
  "Moon", // Cancer
  "Sun", // Leo
  "Mercury", // Virgo
  "Venus", // Libra
  "Mars", // Scorpio
  "Jupiter", // Sagittarius
  "Saturn", // Capricorn
  "Saturn", // Aquarius
  "Jupiter" // Pisces
];

export const calculateCompatibility = (groomMoonSidereal: number, brideMoonSidereal: number): KootaScore => {
  const gNak = getNakshatraInfo(groomMoonSidereal);
  const bNak = getNakshatraInfo(brideMoonSidereal);
  
  const gRashi = getRashiInfo(groomMoonSidereal);
  const bRashi = getRashiInfo(brideMoonSidereal);

  const warnings: string[] = [];

  // --- 1. VARNA (Caste match - 1 Point) ---
  // Castes: Water (Brahmin) = 4, Fire (Kshatriya) = 3, Earth (Vaishya) = 2, Air (Shudra) = 1
  const getCaste = (rashiIndex: number) => {
    if ([3, 7, 11].includes(rashiIndex)) return 4; // Brahmin (Water signs)
    if ([0, 4, 8].includes(rashiIndex)) return 3;  // Kshatriya (Fire signs)
    if ([1, 5, 9].includes(rashiIndex)) return 2;  // Vaishya (Earth signs)
    return 1;                                      // Shudra (Air signs)
  };
  const gCaste = getCaste(gRashi.index);
  const bCaste = getCaste(bRashi.index);
  const varnaScore = (gCaste >= bCaste) ? 1 : 0;
  const varnaDetails = `Groom caste (${gCaste}) match against Bride caste (${bCaste})`;

  // --- 2. VASHYA (Control - 2 Points) ---
  // Simplified: Same sign or friendly group
  let vashyaScore = 0;
  if (gRashi.index === bRashi.index) {
    vashyaScore = 2;
  } else if (Math.abs(gRashi.index - bRashi.index) === 6) {
    vashyaScore = 0; // Opposite is incompatible
  } else {
    vashyaScore = 1; // Default neutral compatibility
  }
  const vashyaDetails = `Rashi difference: ${Math.abs(gRashi.index - bRashi.index)} signs`;

  // --- 3. TARA (Star count - 3 Points) ---
  const boyToGirlDist = (bNak.index - gNak.index + 27) % 9;
  const girlToBoyDist = (gNak.index - bNak.index + 27) % 9;
  
  const isTaraAuspicious = (dist: number) => [2, 4, 6, 8, 0].includes((dist + 1) % 9);
  
  let taraScore = 0;
  if (isTaraAuspicious(boyToGirlDist)) taraScore += 1.5;
  if (isTaraAuspicious(girlToBoyDist)) taraScore += 1.5;
  const taraDetails = `Groom-to-Bride distance remainder: ${(boyToGirlDist + 1) % 9}. Bride-to-Groom remainder: ${(girlToBoyDist + 1) % 9}`;

  // --- 4. YONI (Sexual compatibility - 4 Points) ---
  const gAnimal = YONI_ANIMALS[gNak.index];
  const bAnimal = YONI_ANIMALS[bNak.index];
  
  // Yoni relations matrix (Simplified lookup: same animal = 4 points, friendly = 3, enemy = 0)
  const YONI_FRIENDS: Record<string, string[]> = {
    Horse: ["Monkey", "Elephant"],
    Elephant: ["Horse", "Lion"],
    Serpent: ["Hare", "Cow"],
    Tiger: ["Lion", "Cow"],
    Cat: ["Hare", "Rat"],
    Dog: ["Cat", "Cow"],
    Mongoose: ["Serpent"]
  };
  const YONI_ENEMIES: Record<string, string[]> = {
    Horse: ["Buffalo"],
    Serpent: ["Mongoose"],
    Cat: ["Rat"],
    Cow: ["Tiger"],
    Elephant: ["Lion"],
    Dog: ["Hare"],
    Sheep: ["Monkey"]
  };
  
  let yoniScore = 2; // Default neutral
  if (gAnimal === bAnimal) {
    yoniScore = 4;
  } else if (YONI_ENEMIES[gAnimal]?.includes(bAnimal) || YONI_ENEMIES[bAnimal]?.includes(gAnimal)) {
    yoniScore = 0;
    warnings.push("Yoni Vairya (sexual incompatibility): " + gAnimal + " vs " + bAnimal);
  } else if (YONI_FRIENDS[gAnimal]?.includes(bAnimal) || YONI_FRIENDS[bAnimal]?.includes(gAnimal)) {
    yoniScore = 3;
  }
  const yoniDetails = `Groom animal: ${gAnimal}, Bride animal: ${bAnimal}`;

  // --- 5. MAITRI (Sign Lord Friendship - 5 Points) ---
  const gLord = RASHI_LORDS[gRashi.index];
  const bLord = RASHI_LORDS[bRashi.index];
  
  const gToBFriendship = PLANET_FRIENDSHIP[gLord]?.[bLord] ?? 1;
  const bToGFriendship = PLANET_FRIENDSHIP[bLord]?.[gLord] ?? 1;
  
  let maitriScore = 1;
  const totalFriendshipVal = gToBFriendship + bToGFriendship;
  if (totalFriendshipVal === 4) maitriScore = 5; // Mutual friends
  else if (totalFriendshipVal === 3) maitriScore = 4;
  else if (totalFriendshipVal === 2) maitriScore = 3;
  else if (totalFriendshipVal === 1) maitriScore = 1;
  else if (totalFriendshipVal === 0) {
    maitriScore = 0;
    warnings.push("Maitri Vairya (mutual hostility between planetary lords: " + gLord + " & " + bLord + ")");
  }
  const maitriDetails = `Groom Lord: ${gLord}, Bride Lord: ${bLord}`;

  // --- 6. GANA (Temperament match - 6 Points) ---
  const gGana = NAKSHATRA_GANA[gNak.index]; // 0=Deva, 1=Manushya, 2=Rakshasa
  const bGana = NAKSHATRA_GANA[bNak.index];
  
  let ganaScore = 0;
  if (gGana === bGana) {
    ganaScore = 6;
  } else if ((gGana === 0 && bGana === 1) || (gGana === 1 && bGana === 0)) {
    ganaScore = 5; // Deva & Manushya compatible
  } else if ((gGana === 0 && bGana === 2) || (gGana === 2 && bGana === 0)) {
    ganaScore = 1; // Deva & Rakshasa minimal compatibility
  } else {
    ganaScore = 0; // Manushya & Rakshasa incompatibility
    if (gGana === 2) {
      warnings.push("Gana Dosha: Groom is Rakshasa (Demon) and Bride is Manushya (Human)");
    }
  }
  const ganaNames = ["Deva (Divine)", "Manushya (Human)", "Rakshasa (Demon)"];
  const ganaDetails = `Groom temperament: ${ganaNames[gGana]}, Bride temperament: ${ganaNames[bGana]}`;

  // --- 7. BHAKOOT (Relative Sign position - 7 Points) ---
  const bhakootDiff = (gRashi.index - bRashi.index + 12) % 12;
  
  // Unfavorable pairs: 2-12, 6-8, 5-9
  let bhakootScore = 7;
  if ([1, 11].includes(bhakootDiff)) {
    bhakootScore = 0; // 2/12 Dwirwadasa
    warnings.push("Bhakoot Dosha (2/12 positioning): Moon signs are adjacent");
  } else if ([5, 7].includes(bhakootDiff)) {
    bhakootScore = 0; // 6-8 Shadashtaka
    warnings.push("Bhakoot Dosha (6/8 positioning): Moon signs are in 6th/8th relations");
  } else if ([4, 8].includes(bhakootDiff)) {
    bhakootScore = 0; // 5-9 Navapanchama
    warnings.push("Bhakoot Dosha (5/9 positioning): Moon signs are in trine relations");
  }
  const bhakootDetails = `Rashi relative index: ${bhakootDiff}`;

  // --- 8. NADI (Physiology type - 8 Points) ---
  const gNadi = NAKSHATRA_NADI[gNak.index]; // 0=Vata (Adi), 1=Pitta (Madhya), 2=Kapha (Antya)
  const bNadi = NAKSHATRA_NADI[bNak.index];
  
  let nadiScore = 8;
  if (gNadi === bNadi) {
    nadiScore = 0; // Same Nadi is bad (Nadi Dosha)
    warnings.push("Nadi Dosha: Groom and Bride share the same physiological type (" + ["Vata (Adi)", "Pitta (Madhya)", "Kapha (Antya)"][gNadi] + ")");
  }
  const nadiNames = ["Vata (Adi)", "Pitta (Madhya)", "Kapha (Antya)"];
  const nadiDetails = `Groom Nadi: ${nadiNames[gNadi]}, Bride Nadi: ${nadiNames[bNadi]}`;

  const totalScore = varnaScore + vashyaScore + taraScore + yoniScore + maitriScore + ganaScore + bhakootScore + nadiScore;

  return {
    varna: { max: 1, score: varnaScore, details: varnaDetails },
    vashya: { max: 2, score: vashyaScore, details: vashyaDetails },
    tara: { max: 3, score: taraScore, details: taraDetails },
    yoni: { max: 4, score: yoniScore, details: yoniDetails },
    maitri: { max: 5, score: maitriScore, details: maitriDetails },
    gana: { max: 6, score: ganaScore, details: ganaDetails },
    bhakoot: { max: 7, score: bhakootScore, details: bhakootDetails },
    nadi: { max: 8, score: nadiScore, details: nadiDetails },
    totalScore,
    warnings
  };
};
