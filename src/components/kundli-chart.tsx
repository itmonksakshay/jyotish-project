"use client";

import React, { useState } from "react";
import { useAstrologyStore } from "@/store/use-astrology";
import { PlanetPosition } from "@/utils/astrology-math";

interface HouseSignificance {
  title: string;
  significance: string;
  bodyParts: string;
}

const HOUSE_SIGNIFICANCES: Record<number, HouseSignificance> = {
  1: { title: "1st House (Lagna / Ascendant)", significance: "Self, physical body, appearance, character, health, new beginnings.", bodyParts: "Head, brain" },
  2: { title: "2nd House (Dhana Bhava)", significance: "Wealth, family, speech, primary education, values, assets, food.", bodyParts: "Face, throat, right eye" },
  3: { title: "3rd House (Sahaja Bhava)", significance: "Courage, mental strength, younger siblings, short travels, communication.", bodyParts: "Hands, arms, shoulders" },
  4: { title: "4th House (Bandhu Bhava)", significance: "Mother, home, comfort, emotions, land, vehicle, happiness, peace.", bodyParts: "Chest, lungs, heart" },
  5: { title: "5th House (Putra Bhava)", significance: "Creativity, children, romance, intelligence, past karma, speculation.", bodyParts: "Stomach, upper abdomen" },
  6: { title: "6th House (Ari Bhava)", significance: "Enemies, obstacles, debts, disease, daily routines, service, disputes.", bodyParts: "Kidneys, intestines" },
  7: { title: "7th House (Yuvati Bhava)", significance: "Spouse, marriage, partnerships, business relations, public image.", bodyParts: "Pelvis, lower abdomen" },
  8: { title: "8th House (Randhra Bhava)", significance: "Longevity, sudden events, secrets, research, occult, transformations, inheritance.", bodyParts: "Genitals, reproductive system" },
  9: { title: "9th House (Dharma Bhava)", significance: "Luck, religion, higher wisdom, father, long travel, philosophy, teachers.", bodyParts: "Thighs, hips" },
  10: { title: "10th House (Karma Bhava)", significance: "Career, status, power, fame, authority, actions, public profession.", bodyParts: "Knees, bones" },
  11: { title: "11th House (Labha Bhava)", significance: "Gains, cash flow, friends, elder siblings, desires, achievements.", bodyParts: "Calves, ankles" },
  12: { title: "12th House (Vyaya Bhava)", significance: "Expenses, losses, isolation, foreign travel, subconscious, sleep, spirituality.", bodyParts: "Feet, left eye" }
};

// Map planets to short 2-character codes
const PLANET_CODES: Record<string, string> = {
  Sun: "Su", Moon: "Mo", Mercury: "Me", Venus: "Ve",
  Mars: "Ma", Jupiter: "Ju", Saturn: "Sa", Rahu: "Ra", Ketu: "Ke"
};

export default function KundliChart() {
  const { kundliData } = useAstrologyStore();
  const [hoveredHouse, setHoveredHouse] = useState<number | null>(null);

  const lagnaRashiIndex = kundliData.lagna.rashiIndex;

  // Function to get sign number (1-12) for a given house (1-12)
  const getSignNumForHouse = (houseIndex: number) => {
    return ((lagnaRashiIndex + houseIndex - 1) % 12) + 1;
  };

  // SVG dimensions
  const size = 380;
  const center = size / 2;

  // Geometry points for North Indian chart
  // Outer corners
  const A = { x: 0, y: 0 };
  const B = { x: size, y: 0 };
  const C = { x: size, y: size };
  const D = { x: 0, y: size };
  // Center
  const E = { x: center, y: center };
  // Midpoints
  const Mt = { x: center, y: 0 };
  const Mr = { x: size, y: center };
  const Mb = { x: center, y: size };
  const Ml = { x: 0, y: center };
  // Diagonal intersections
  const I1 = { x: size / 4, y: size / 4 }; // Top-left intersection
  const I2 = { x: (size * 3) / 4, y: size / 4 }; // Top-right
  const I3 = { x: (size * 3) / 4, y: (size * 3) / 4 }; // Bottom-right
  const I4 = { x: size / 4, y: (size * 3) / 4 }; // Bottom-left

  // House polygon coordinate definitions
  const housePoints: Record<number, string> = {
    1: `${Mt.x},${Mt.y} ${I2.x},${I2.y} ${E.x},${E.y} ${I1.x},${I1.y}`, // 1st
    2: `${Mt.x},${Mt.y} ${B.x},${B.y} ${I2.x},${I2.y}`, // 2nd
    3: `${Mr.x},${Mr.y} ${B.x},${B.y} ${I2.x},${I2.y}`, // 3rd
    4: `${Mr.x},${Mr.y} ${I2.x},${I2.y} ${E.x},${E.y} ${I3.x},${I3.y}`, // 4th
    5: `${Mr.x},${Mr.y} ${C.x},${C.y} ${I3.x},${I3.y}`, // 5th
    6: `${Mb.x},${Mb.y} ${C.x},${C.y} ${I3.x},${I3.y}`, // 6th
    7: `${Mb.x},${Mb.y} ${I3.x},${I3.y} ${E.x},${E.y} ${I4.x},${I4.y}`, // 7th
    8: `${Mb.x},${Mb.y} ${D.x},${D.y} ${I4.x},${I4.y}`, // 8th
    9: `${Ml.x},${Ml.y} ${D.x},${D.y} ${I4.x},${I4.y}`, // 9th
    10: `${Ml.x},${Ml.y} ${I4.x},${I4.y} ${E.x},${E.y} ${I1.x},${I1.y}`, // 10th
    11: `${Ml.x},${Ml.y} ${A.x},${A.y} ${I1.x},${I1.y}`, // 11th
    12: `${Mt.x},${Mt.y} ${A.x},${A.y} ${I1.x},${I1.y}`, // 12th
  };

  // Center points of houses to render text
  const houseTextCenters: Record<number, { cx: number; cy: number }> = {
    1: { cx: center, cy: size * 0.17 },
    2: { cx: size * 0.68, cy: size * 0.08 },
    3: { cx: size * 0.92, cy: size * 0.32 },
    4: { cx: size * 0.83, cy: center },
    5: { cx: size * 0.92, cy: size * 0.68 },
    6: { cx: size * 0.68, cy: size * 0.92 },
    7: { cx: center, cy: size * 0.83 },
    8: { cx: size * 0.32, cy: size * 0.92 },
    9: { cx: size * 0.08, cy: size * 0.68 },
    10: { cx: size * 0.17, cy: center },
    11: { cx: size * 0.08, cy: size * 0.32 },
    12: { cx: size * 0.32, cy: size * 0.08 },
  };

  // Sign number positions (drawn offset from center)
  const signPositions: Record<number, { sx: number; sy: number }> = {
    1: { sx: center, sy: center - 45 },
    2: { sx: size * 0.58, sy: size * 0.12 },
    3: { sx: size * 0.88, sy: size * 0.18 },
    4: { sx: center + 45, sy: center },
    5: { sx: size * 0.88, sy: size * 0.82 },
    6: { sx: size * 0.58, sy: size * 0.88 },
    7: { sx: center, sy: center + 45 },
    8: { sx: size * 0.42, sy: size * 0.88 },
    9: { sx: size * 0.12, sy: size * 0.82 },
    10: { sx: center - 45, sy: center },
    11: { sx: size * 0.12, sy: size * 0.18 },
    12: { sx: size * 0.42, sy: size * 0.12 },
  };

  // Group planets by house (1-12)
  const planetsInHouses: Record<number, PlanetPosition[]> = {};
  for (let i = 1; i <= 12; i++) planetsInHouses[i] = [];
  kundliData.planets.forEach((p) => {
    if (p.house >= 1 && p.house <= 12) {
      planetsInHouses[p.house].push(p);
    }
  });

  const getPlanetTextNode = (planets: PlanetPosition[], hc: { cx: number; cy: number }) => {
    if (planets.length === 0) return null;
    return (
      <text
        x={hc.cx}
        y={hc.cy + 10}
        textAnchor="middle"
        className="font-mono text-[11px] font-bold fill-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
      >
        {planets.map((p, idx) => {
          const deg = Math.floor(p.siderealLon % 30);
          return (
            <tspan key={idx} x={hc.cx} dy={idx > 0 ? 13 : 0}>
              {PLANET_CODES[p.name]}
              {p.isRetrograde ? "R" : ""}
              <tspan className="text-[9px] font-normal text-white/50">{deg}°</tspan>
            </tspan>
          );
        })}
      </text>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-start w-full">
      {/* SVG Interactive Chart Box */}
      <div className="relative border border-white/10 rounded-xl overflow-hidden p-4 bg-slate-950/80 shadow-2xl flex-shrink-0">
        <svg
          width={size}
          height={size}
          className="w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] md:w-[380px] md:h-[380px]"
        >
          {/* Base Background grid elements */}
          <rect width={size} height={size} fill="none" />

          {/* Interactive House Polygons */}
          {Object.entries(housePoints).map(([houseStr, pts]) => {
            const hNum = parseInt(houseStr);
            const isHovered = hoveredHouse === hNum;
            return (
              <polygon
                key={hNum}
                points={pts}
                className={`transition-colors duration-200 cursor-pointer ${
                  isHovered ? "fill-indigo-950/30 stroke-indigo-500" : "fill-slate-900/10 stroke-white/10"
                }`}
                strokeWidth={1}
                onMouseEnter={() => setHoveredHouse(hNum)}
                onMouseLeave={() => setHoveredHouse(null)}
              />
            );
          })}

          {/* Core Grid Boundaries Lines (North Indian Layout style) */}
          {/* Diagonals */}
          <line x1={A.x} y1={A.y} x2={C.x} y2={C.y} className="stroke-white/20" strokeWidth={1.5} />
          <line x1={B.x} y1={B.y} x2={D.x} y2={D.y} className="stroke-white/20" strokeWidth={1.5} />
          {/* Midpoint diamond */}
          <line x1={Mt.x} y1={Mt.y} x2={Mr.x} y2={Mr.y} className="stroke-white/20" strokeWidth={1.5} />
          <line x1={Mr.x} y1={Mr.y} x2={Mb.x} y2={Mb.y} className="stroke-white/20" strokeWidth={1.5} />
          <line x1={Mb.x} y1={Mb.y} x2={Ml.x} y2={Ml.y} className="stroke-white/20" strokeWidth={1.5} />
          <line x1={Ml.x} y1={Ml.y} x2={Mt.x} y2={Mt.y} className="stroke-white/20" strokeWidth={1.5} />

          {/* Outer Border */}
          <rect width={size} height={size} className="fill-none stroke-white/30" strokeWidth={2} />

          {/* Render Rashi Sign Numbers in each house */}
          {Object.entries(signPositions).map(([houseStr, pos]) => {
            const hNum = parseInt(houseStr);
            const signNum = getSignNumForHouse(hNum);
            return (
              <text
                key={hNum}
                x={pos.sx}
                y={pos.sy}
                textAnchor="middle"
                dominantBaseline="middle"
                className="font-serif text-[10px] font-medium fill-indigo-300 pointer-events-none select-none opacity-80"
              >
                {signNum}
              </text>
            );
          })}

          {/* Render Planets in each house */}
          {Object.entries(houseTextCenters).map(([houseStr, hc]) => {
            const hNum = parseInt(houseStr);
            const planets = planetsInHouses[hNum];
            return (
              <g key={hNum} className="pointer-events-none select-none">
                {getPlanetTextNode(planets, hc)}
              </g>
            );
          })}
        </svg>
      </div>

      {/* House Meaning & Interpretation Panel */}
      <div className="flex-1 w-full bg-slate-900/50 backdrop-blur-md border border-white/10 p-6 rounded-xl self-stretch flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-indigo-400 font-sans tracking-wide mb-4">
            Interactive Kundli Guide
          </h3>
          
          {hoveredHouse ? (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-xl font-serif text-amber-400 font-semibold">
                  {HOUSE_SIGNIFICANCES[hoveredHouse].title}
                </span>
                <span className="text-xs bg-indigo-900/40 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded">
                  Sign: {getSignNumForHouse(hoveredHouse)} ({
                    ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"][
                      getSignNumForHouse(hoveredHouse) - 1
                    ]
                  })
                </span>
              </div>
              <div>
                <span className="block text-xs uppercase font-mono tracking-widest text-white/40 mb-1">
                  Traditional Meanings
                </span>
                <p className="text-sm text-white/80 leading-relaxed font-sans">
                  {HOUSE_SIGNIFICANCES[hoveredHouse].significance}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs uppercase font-mono tracking-widest text-white/40 mb-1">
                    Anatomical Body Parts
                  </span>
                  <span className="text-sm font-sans text-white/80">
                    {HOUSE_SIGNIFICANCES[hoveredHouse].bodyParts}
                  </span>
                </div>
                <div>
                  <span className="block text-xs uppercase font-mono tracking-widest text-white/40 mb-1">
                    Sign Ruler (Lord)
                  </span>
                  <span className="text-sm font-sans text-amber-400">
                    {
                      [
                        "Mars (Aries)", "Venus (Taurus)", "Mercury (Gemini)", "Moon (Cancer)",
                        "Sun (Leo)", "Mercury (Virgo)", "Venus (Libra)", "Mars (Scorpio)",
                        "Jupiter (Sagittarius)", "Saturn (Capricorn)", "Saturn (Aquarius)", "Jupiter (Pisces)"
                      ][getSignNumForHouse(hoveredHouse) - 1].split(" ")[0]
                    }
                  </span>
                </div>
              </div>
              <div className="border-t border-white/5 pt-3">
                <span className="block text-xs uppercase font-mono tracking-widest text-white/40 mb-2">
                  Planets in this House ({planetsInHouses[hoveredHouse].length})
                </span>
                {planetsInHouses[hoveredHouse].length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {planetsInHouses[hoveredHouse].map((p, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-slate-950 border border-white/10 px-2 py-1 rounded flex items-center gap-1.5"
                      >
                        <span className="font-bold text-amber-300">{p.name}</span>
                        <span className="text-[10px] text-white/60">
                          {Math.floor(p.siderealLon % 30)}° in {p.nakshatraName}
                        </span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-white/30 italic">No planets in this house</span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center h-[200px] text-white/40">
              <svg
                className="w-12 h-12 mb-3 stroke-current opacity-30 animate-pulse"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                />
              </svg>
              <p className="text-sm font-sans">
                Hover over any house in the birth chart diagram <br />
                to reveal its astrological significances, ruling signs, and planets.
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 border-t border-white/10 pt-4 flex items-center justify-between">
          <div>
            <span className="block text-[9px] uppercase font-mono tracking-widest text-white/30">
              Ascendant (Lagna) Sign
            </span>
            <span className="text-sm font-serif font-semibold text-white/90">
              {kundliData.lagna.rashiName}
            </span>
          </div>
          <div>
            <span className="block text-[9px] uppercase font-mono tracking-widest text-white/30 text-right">
              Ayanamsa Offset (Lahiri)
            </span>
            <span className="text-sm font-mono text-amber-400 block text-right">
              {Math.floor(kundliData.ayanamsa)}° {Math.floor((kundliData.ayanamsa % 1) * 60)}&apos; {Math.floor(((kundliData.ayanamsa % 1) * 60 % 1) * 60)}&quot;
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
