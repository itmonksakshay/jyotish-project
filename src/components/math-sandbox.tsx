"use client";

import React, { useMemo } from "react";
import { useAstrologyStore } from "@/store/use-astrology";
import { 
  calculateJulianDay, 
  getLahiriAyanamsa, 
  getObliquity, 
  calculateLST, 
  solveKepler, 
  getHeliocentricCoords, 
  getGeocentricLonLat, 
  getMoonCoords,
  RASHI_NAMES,
  getNakshatraInfo
} from "@/utils/astrology-math";

/** Local Helper to format decimal degrees to Degrees, Minutes, Seconds */
const formatLocalDMS = (degVal: number): string => {
  const d = Math.floor(degVal);
  const minFloat = (degVal - d) * 60;
  const m = Math.floor(minFloat);
  const s = Math.floor((minFloat - m) * 60);
  return `${d}° ${m}' ${s}"`;
};

export default function MathSandbox() {
  const { birthDetails, selectedSandboxPlanet } = useAstrologyStore();

  const mathLogs = useMemo(() => {
    // 1. Julian Day and Time parameters
    const jd = calculateJulianDay(
      birthDetails.year,
      birthDetails.month,
      birthDetails.day,
      birthDetails.hour,
      birthDetails.minute,
      birthDetails.second,
      birthDetails.timezone
    );
    const T = (jd - 2451545.0) / 36525.0;
    const ayan = getLahiriAyanamsa(T);
    const eps = getObliquity(T);
    const lst = calculateLST(jd, birthDetails.longitude);

    const logLines: { label: string; formula: string; value: string; desc?: string }[] = [];

    logLines.push({
      label: "Julian Date (JD)",
      formula: "JD = f(Year, Month, Day, Hour UTC)",
      value: jd.toFixed(6),
      desc: "Baseline count of days since Jan 1, 4713 BC. Standard coordinate for orbital theories."
    });

    logLines.push({
      label: "Julian Centuries (T)",
      formula: "T = (JD - 2451545.0) / 36525",
      value: T.toFixed(8) + " centuries",
      desc: "Number of Julian centuries (36,525 days) elapsed since the J2000.0 epoch."
    });

    logLines.push({
      label: "Obliquity of Ecliptic (\u03b5)",
      formula: "\u03b5 = 23.4392911 - 0.0130042 * T ...",
      value: eps.toFixed(6) + "\u00b0 (" + formatLocalDMS(eps) + ")",
      desc: "Axial tilt of the Earth at birth epoch, used for equatorial/ecliptic coordinate shifts."
    });

    logLines.push({
      label: "Lahiri Ayanamsa (\u03b1)",
      formula: "\u03b1 = 23.85708 + 1.39697 * T + 0.0003086 * T\u00b2",
      value: ayan.toFixed(6) + "\u00b0 (" + formatLocalDMS(ayan) + ")",
      desc: "Sidereal shift offset between Western Tropical and Vedic Sidereal zodiacs due to Equinox precession."
    });

    logLines.push({
      label: "Local Sidereal Time (LST)",
      formula: "LST = (GMST + Longitude) % 360",
      value: lst.toFixed(6) + "\u00b0",
      desc: "Astronomical time mapping the observer's meridian against the stars, required for Ascendant (Lagna)."
    });

    // Calculations specific to selected planet
    const pName = selectedSandboxPlanet;
    const detailLogs: string[] = [];

    if (pName === "Rahu" || pName === "Ketu") {
      const meanRahuTrop = normalizeDeg(125.04452 - 1934.136261 * T + 0.0020708 * T * T);
      const targetTrop = pName === "Rahu" ? meanRahuTrop : normalizeDeg(meanRahuTrop + 180);
      const targetSid = normalizeDeg(targetTrop - ayan);

      detailLogs.push(`--- Shadow Node ${pName} Calculation (From Mean Node) ---`);
      detailLogs.push(`Formula: \u03a9_Mean = 125.04452 - 1934.136261 * T + 0.0020708 * T\u00b2`);
      detailLogs.push(`Calculated value: ${meanRahuTrop.toFixed(6)}\u00b0`);
      if (pName === "Ketu") {
        detailLogs.push(`Ketu is opposite to Rahu (+180\u00b0): ${targetTrop.toFixed(6)}\u00b0`);
      }
      detailLogs.push(`Subtract Ayanamsa: ${targetTrop.toFixed(4)}\u00b0 - ${ayan.toFixed(4)}\u00b0 = ${targetSid.toFixed(4)}\u00b0`);
      detailLogs.push(`Vedic Degrees: ${formatLocalDMS(targetSid % 30)} inside ${RASHI_NAMES[Math.floor(targetSid / 30)]}`);

    } else if (pName === "Moon") {
      const m = getMoonCoords(T);
      const L0 = normalizeDeg(218.3164477 + 481267.88123421 * T);
      const M_moon = normalizeDeg(134.963396 + 477198.867505 * T);
      const M_sun = normalizeDeg(357.529109 + 35999.05029 * T);
      const D = normalizeDeg(297.850192 + 445267.111403 * T);
      const F = normalizeDeg(93.272095 + 483202.017538 * T);

      detailLogs.push(`--- Perturbed Lunar Longitude Solver (ELP/Meeus Approximation) ---`);
      detailLogs.push(`Mean Longitude (L0): ${L0.toFixed(4)}\u00b0`);
      detailLogs.push(`Mean Anomaly (M_moon): ${M_moon.toFixed(4)}\u00b0`);
      detailLogs.push(`Mean Anomaly Sun (M_sun): ${M_sun.toFixed(4)}\u00b0`);
      detailLogs.push(`Mean Elongation (D): ${D.toFixed(4)}\u00b0`);
      detailLogs.push(`Argument of Latitude (F): ${F.toFixed(4)}\u00b0`);
      detailLogs.push(`\nCalculated Periodic Perturbation Terms:`);
      detailLogs.push(`  1. Equation of Center: 6.289 * sin(M_moon) = ${(6.289 * Math.sin(rad(M_moon))).toFixed(4)}\u00b0`);
      detailLogs.push(`  2. Evection (Sun pull): 1.274 * sin(2D - M_moon) = ${(1.274 * Math.sin(rad(2*D - M_moon))).toFixed(4)}\u00b0`);
      detailLogs.push(`  3. Variation: 0.658 * sin(2D) = ${(0.658 * Math.sin(rad(2*D))).toFixed(4)}\u00b0`);
      detailLogs.push(`  4. Annual Equation: -0.186 * sin(M_sun) = ${(-0.186 * Math.sin(rad(M_sun))).toFixed(4)}\u00b0`);
      
      const corrSum = m.lon - L0;
      detailLogs.push(`Total Corrections Sum: ${corrSum.toFixed(4)}\u00b0`);
      detailLogs.push(`Tropical Longitude: ${m.lon.toFixed(4)}\u00b0`);
      const sidLon = normalizeDeg(m.lon - ayan);
      detailLogs.push(`Sidereal Longitude (Vedic): (Tropical - Ayanamsa) = ${sidLon.toFixed(4)}\u00b0`);
      detailLogs.push(`Vedic Coordinates: ${formatLocalDMS(sidLon % 30)} inside ${RASHI_NAMES[Math.floor(sidLon / 30)]}`);

    } else if (pName === "Sun") {
      const e = getHeliocentricCoords("Earth", T);
      const sx = -e.x;
      const sy = -e.y;
      const sz = -e.z;
      const tropLon = normalizeDeg(deg(Math.atan2(sy, sx)));
      const sidLon = normalizeDeg(tropLon - ayan);

      detailLogs.push(`--- Geocentric Sun Coordinate Projection ---`);
      detailLogs.push(`In astronomy, Sun position is calculated as the reflection of Earth orbit.`);
      detailLogs.push(`Heliocentric Earth vector: [${e.x.toFixed(6)}, ${e.y.toFixed(6)}, ${e.z.toFixed(6)}] AU`);
      detailLogs.push(`Geocentric Sun vector (-Earth): [${sx.toFixed(6)}, ${sy.toFixed(6)}, ${sz.toFixed(6)}] AU`);
      detailLogs.push(`Tropical Longitude (atan2(y, x)): ${tropLon.toFixed(4)}\u00b0`);
      detailLogs.push(`Subtract Ayanamsa: ${tropLon.toFixed(4)}\u00b0 - ${ayan.toFixed(4)}\u00b0 = ${sidLon.toFixed(4)}\u00b0`);
      detailLogs.push(`Vedic Coordinates: ${formatLocalDMS(sidLon % 30)} inside ${RASHI_NAMES[Math.floor(sidLon / 30)]}`);

    } else {
      // Mercury, Venus, Mars, Jupiter, Saturn (Classical Keplerian bodies)
      const pHelio = getHeliocentricCoords(pName, T);
      const eHelio = getHeliocentricCoords("Earth", T);
      const pGeo = getGeocentricLonLat(pName, T);
      const sidLon = normalizeDeg(pGeo.lon - ayan);

      detailLogs.push(`--- Heliocentric Keplerian Elements for ${pName} at epoch ---`);
      detailLogs.push(`Semi-major axis (a): ${pHelio.details.a.toFixed(6)} AU`);
      detailLogs.push(`Eccentricity (e): ${pHelio.details.e.toFixed(6)}`);
      detailLogs.push(`Inclination (i): ${pHelio.details.i.toFixed(6)}\u00b0`);
      detailLogs.push(`Mean Longitude (L): ${pHelio.details.L.toFixed(4)}\u00b0`);
      detailLogs.push(`Longitude of Perihelion (\u03d6): ${pHelio.details.w.toFixed(4)}\u00b0`);
      detailLogs.push(`Longitude of Asc. Node (\u03a9): ${pHelio.details.node.toFixed(4)}\u00b0`);
      detailLogs.push(`\nMean Anomaly (M = L - \u03d6): ${pHelio.details.M.toFixed(4)}\u00b0`);

      detailLogs.push(`\nSolving Kepler's Transcendental Equation (E - e * sin E = M):`);
      detailLogs.push(`  Initial guess E0: ${pHelio.details.M.toFixed(4)}\u00b0 + e * sin(M)`);
      detailLogs.push(`  Newton-Raphson Iterations: converged in ${pHelio.details.iterations} steps.`);
      detailLogs.push(`  Resolved Eccentric Anomaly (E): ${pHelio.details.E.toFixed(4)}\u00b0`);

      detailLogs.push(`\nOrbital Plane Vector coordinates (x', y'):`);
      const xp = pHelio.details.a * (Math.cos(rad(pHelio.details.E)) - pHelio.details.e);
      const yp = pHelio.details.a * Math.sqrt(1 - pHelio.details.e * pHelio.details.e) * Math.sin(rad(pHelio.details.E));
      detailLogs.push(`  x' = a * (cos E - e) = ${xp.toFixed(6)} AU`);
      detailLogs.push(`  y' = a * sqrt(1 - e\u00b2) * sin E = ${yp.toFixed(6)} AU`);

      detailLogs.push(`\nRotate to Ecliptic Plane via Inclination (i) and Ascending Node (\u03a9):`);
      detailLogs.push(`  Heliocentric ${pName} [X_h, Y_h, Z_h]: [${pHelio.x.toFixed(6)}, ${pHelio.y.toFixed(6)}, ${pHelio.z.toFixed(6)}] AU`);
      detailLogs.push(`  Heliocentric Earth [X_e, Y_e, Z_e]: [${eHelio.x.toFixed(6)}, ${eHelio.y.toFixed(6)}, ${eHelio.z.toFixed(6)}] AU`);

      detailLogs.push(`\nGeocentric Vector Projection (Subtract Earth):`);
      const gx = pHelio.x - eHelio.x;
      const gy = pHelio.y - eHelio.y;
      const gz = pHelio.z - eHelio.z;
      detailLogs.push(`  X_geo = X_h - X_e = ${gx.toFixed(6)} AU`);
      detailLogs.push(`  Y_geo = Y_h - Y_e = ${gy.toFixed(6)} AU`);
      detailLogs.push(`  Z_geo = Z_h - Z_e = ${gz.toFixed(6)} AU`);

      detailLogs.push(`\nFinal Coordinates (Spherical Projection):`);
      detailLogs.push(`  Tropical Longitude (atan2(Y_geo, X_geo)): ${pGeo.lon.toFixed(4)}\u00b0`);
      detailLogs.push(`  Latitude (atan2(Z_geo, projected)): ${pGeo.lat.toFixed(4)}\u00b0`);
      detailLogs.push(`  Subtract Ayanamsa: ${pGeo.lon.toFixed(4)}\u00b0 - ${ayan.toFixed(4)}\u00b0 = ${sidLon.toFixed(4)}\u00b0`);
      detailLogs.push(`  Vedic Coordinates: ${formatLocalDMS(sidLon % 30)} inside ${RASHI_NAMES[Math.floor(sidLon / 30)]}`);
    }

    return {
      logLines,
      detailLogs
    };

  }, [birthDetails, selectedSandboxPlanet]);

  return (
    <div className="w-full bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl p-6 flex flex-col lg:flex-row gap-6">
      
      {/* Left Column: Core Baseline Math Parameters */}
      <div className="flex-1 space-y-4">
        <h3 className="text-base font-bold text-indigo-400 font-sans tracking-wide">
          Educational Math Sandbox: Base Parameters
        </h3>
        
        <div className="space-y-3">
          {mathLogs.logLines.map((log, idx) => (
            <div key={idx} className="border border-white/5 bg-slate-950/50 rounded-lg p-3 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-white/80">{log.label}</span>
                <span className="text-[10px] font-mono text-indigo-400">{log.formula}</span>
              </div>
              <div className="text-sm font-mono text-amber-300 font-semibold">
                {log.value}
              </div>
              {log.desc && (
                <div className="text-[10px] text-white/40 leading-relaxed font-sans pt-0.5">
                  {log.desc}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Console Log calculations details for selected planet */}
      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-bold text-indigo-400 font-mono tracking-wider">
            CONSOLE_LOG://{selectedSandboxPlanet.toUpperCase()}_SOLVER
          </h3>
          <span className="text-[9px] uppercase font-mono bg-red-950/40 text-red-400 border border-red-500/20 px-2 py-0.5 rounded">
            Live Math Trace
          </span>
        </div>
        
        {/* Glowing Console Panel */}
        <div className="flex-1 font-mono text-xs text-emerald-400 bg-black/90 p-4 rounded-lg border border-emerald-500/20 shadow-inner overflow-y-auto max-h-[360px] leading-relaxed custom-scrollbar whitespace-pre-wrap">
          {mathLogs.detailLogs.map((line, idx) => (
            <div key={idx} className="py-0.5">
              {line}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

// Normalize degrees function for local calculation safety
const normalizeDeg = (d: number): number => {
  let val = d % 360;
  if (val < 0) val += 360;
  return val;
};
const rad = (deg: number) => deg * (Math.PI / 180);
const deg = (radVal: number) => radVal * (180 / Math.PI);
