"use client";

import React, { useMemo } from "react";
import { useAstrologyStore } from "@/store/use-astrology";
import { getNakshatraInfo, normalizeDeg } from "@/utils/astrology-math";

const TITHI_NAMES = [
  "Pratipada (1)", "Dwitiya (2)", "Tritiya (3)", "Chaturthi (4)", "Panchami (5)",
  "Shashti (6)", "Saptami (7)", "Ashtami (8)", "Navami (9)", "Dashami (10)",
  "Ekadashi (11)", "Dwadashi (12)", "Trayodashi (13)", "Chaturdashi (14)",
  "Purnima (Full Moon / 15)",
  "Pratipada (1)", "Dwitiya (2)", "Tritiya (3)", "Chaturthi (4)", "Panchami (5)",
  "Shashti (6)", "Saptami (7)", "Ashtami (8)", "Navami (9)", "Dashami (10)",
  "Ekadashi (11)", "Dwadashi (12)", "Trayodashi (13)", "Chaturdashi (14)",
  "Amavasya (New Moon / 30)"
];

const YOGA_NAMES = [
  "Vishkumbha", "Preeti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda",
  "Sukarma", "Dhriti", "Shoola", "Ganda", "Vriddhi", "Dhruva",
  "Vyaghata", "Harshana", "Vajra", "Siddhi", "Vyatipata", "Variyan",
  "Parigha", "Shiva", "Siddha", "Sadhya", "Shubha", "Shukla",
  "Brahma", "Indra", "Vaidhriti"
];

const KARANA_NAMES = [
  "Kimstughna", "Bava", "Balava", "Kaulava", "Taitila", "Gara",
  "Vanija", "Vishti (Bhadra)", "Shakuni", "Chatushpada", "Naga"
];

const WEEKDAY_NAMES = [
  "Sunday (Ravivara)", "Monday (Somavara)", "Tuesday (Mangalavara)",
  "Wednesday (Budhavara)", "Thursday (Guruvara)", "Friday (Shukravara)",
  "Saturday (Shanivara)"
];

export default function PanchangDetails() {
  const { kundliData, birthDetails } = useAstrologyStore();

  const panchang = useMemo(() => {
    const sun = kundliData.planets.find(p => p.name === "Sun");
    const moon = kundliData.planets.find(p => p.name === "Moon");

    if (!sun || !moon) return null;

    // 1. Tithi (Lunar day): angle difference Moon - Sun. Each tithi is 12 degrees.
    const diff = normalizeDeg(moon.tropicalLon - sun.tropicalLon);
    const tithiIndex = Math.floor(diff / 12);
    const tithiName = TITHI_NAMES[tithiIndex];
    const paksha = diff < 180 ? "Shukla Paksha (Bright Half)" : "Krishna Paksha (Dark Half)";

    // 2. Nakshatra (Moon position)
    const moonNak = getNakshatraInfo(moon.siderealLon);

    // 3. Yoga: Moon sidereal + Sun sidereal. Each yoga is 13.33 degrees.
    const yogaSum = normalizeDeg(moon.siderealLon + sun.siderealLon);
    const yogaIndex = Math.floor(yogaSum / 13.333333333) % 27;
    const yogaName = YOGA_NAMES[yogaIndex];

    // 4. Karana: half a tithi (6 degrees)
    let karanaIndex = 0;
    if (tithiIndex === 0) {
      karanaIndex = 0; // Kimstughna (first half of 1st tithi)
    } else if (tithiIndex === 29) {
      karanaIndex = 8; // Shakuni
    } else if (tithiIndex === 59) {
      // Wait, 59 is last index
      karanaIndex = 9; // Chatushpada
    } else {
      // Repeating mobile karanas (Bava, Balava, Kaulava, Taitila, Gara, Vanija, Vishti)
      const karanaSubNum = Math.floor((diff - 6) / 6);
      karanaIndex = (karanaSubNum % 7) + 1;
    }
    const karanaName = KARANA_NAMES[karanaIndex];

    // 5. Vara (Weekday)
    const date = new Date(birthDetails.year, birthDetails.month - 1, birthDetails.day);
    const weekdayName = WEEKDAY_NAMES[date.getDay()];

    return {
      tithiName,
      paksha,
      tithiDegrees: diff,
      nakshatra: moonNak.name,
      pada: moonNak.pada,
      lord: moonNak.lord,
      yogaName,
      karanaName,
      weekdayName
    };

  }, [kundliData, birthDetails]);

  if (!panchang) return null;

  return (
    <div className="w-full bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-indigo-400 font-sans tracking-wide">
          Vedic Panchangam (Daily Astrological Calendar)
        </h3>
        <p className="text-xs text-white/40 font-mono mt-1">
          Calculated for coordinates: {birthDetails.latitude.toFixed(4)}°N, {birthDetails.longitude.toFixed(4)}°E
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Tithi */}
        <div className="bg-slate-950/40 border border-white/5 p-4 rounded-lg flex flex-col justify-between hover:border-indigo-500/20 transition-colors">
          <div>
            <span className="block text-[9px] uppercase font-mono tracking-widest text-white/40 mb-1">
              1. Tithi (Lunar Phase)
            </span>
            <span className="text-base font-serif font-bold text-amber-300">
              {panchang.tithiName}
            </span>
          </div>
          <div className="mt-3">
            <span className="text-[10px] text-white/60 block font-sans">
              {panchang.paksha}
            </span>
            <span className="text-[9px] font-mono text-white/30 block mt-0.5">
              Diff: {panchang.tithiDegrees.toFixed(1)}°
            </span>
          </div>
        </div>

        {/* Nakshatra */}
        <div className="bg-slate-950/40 border border-white/5 p-4 rounded-lg flex flex-col justify-between hover:border-indigo-500/20 transition-colors">
          <div>
            <span className="block text-[9px] uppercase font-mono tracking-widest text-white/40 mb-1">
              2. Nakshatra (Star Constellation)
            </span>
            <span className="text-base font-serif font-bold text-indigo-300">
              {panchang.nakshatra}
            </span>
          </div>
          <div className="mt-3">
            <span className="text-[10px] text-white/60 block font-sans">
              Pada {panchang.pada} | Lord: {panchang.lord}
            </span>
            <span className="text-[9px] font-mono text-white/30 block mt-0.5">
              Moon Constellation
            </span>
          </div>
        </div>

        {/* Yoga */}
        <div className="bg-slate-950/40 border border-white/5 p-4 rounded-lg flex flex-col justify-between hover:border-indigo-500/20 transition-colors">
          <div>
            <span className="block text-[9px] uppercase font-mono tracking-widest text-white/40 mb-1">
              3. Yoga (Solar-Lunar Angle Sum)
            </span>
            <span className="text-base font-serif font-bold text-amber-300">
              {panchang.yogaName}
            </span>
          </div>
          <div className="mt-3">
            <span className="text-[10px] text-white/60 block font-sans">
              Union of Sun & Moon
            </span>
            <span className="text-[9px] font-mono text-white/30 block mt-0.5">
              Reflects spiritual temperament
            </span>
          </div>
        </div>

        {/* Karana */}
        <div className="bg-slate-950/40 border border-white/5 p-4 rounded-lg flex flex-col justify-between hover:border-indigo-500/20 transition-colors">
          <div>
            <span className="block text-[9px] uppercase font-mono tracking-widest text-white/40 mb-1">
              4. Karana (Half Tithi)
            </span>
            <span className="text-base font-serif font-bold text-indigo-300">
              {panchang.karanaName}
            </span>
          </div>
          <div className="mt-3">
            <span className="text-[10px] text-white/60 block font-sans">
              Active influence
            </span>
            <span className="text-[9px] font-mono text-white/30 block mt-0.5">
              Reflects daily tasks productivity
            </span>
          </div>
        </div>

        {/* Vara */}
        <div className="bg-slate-950/40 border border-white/5 p-4 rounded-lg flex flex-col justify-between hover:border-indigo-500/20 transition-colors">
          <div>
            <span className="block text-[9px] uppercase font-mono tracking-widest text-white/40 mb-1">
              5. Vara (Astronomical Weekday)
            </span>
            <span className="text-base font-serif font-bold text-amber-300">
              {panchang.weekdayName}
            </span>
          </div>
          <div className="mt-3">
            <span className="text-[10px] text-white/60 block font-sans">
              Ruler planet: {
                panchang.weekdayName.startsWith("Sunday") ? "Sun (Surya)" :
                panchang.weekdayName.startsWith("Monday") ? "Moon (Chandra)" :
                panchang.weekdayName.startsWith("Tuesday") ? "Mars (Mangal)" :
                panchang.weekdayName.startsWith("Wednesday") ? "Mercury (Budha)" :
                panchang.weekdayName.startsWith("Thursday") ? "Jupiter (Guru)" :
                panchang.weekdayName.startsWith("Friday") ? "Venus (Shukra)" : "Saturn (Shani)"
              }
            </span>
            <span className="text-[9px] font-mono text-white/30 block mt-0.5">
              Weekday Lord
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
