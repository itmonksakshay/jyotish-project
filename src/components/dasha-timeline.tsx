"use client";

import React, { useMemo, useState } from "react";
import { useAstrologyStore } from "@/store/use-astrology";
import { VIMSHOTTARI_PERIODS } from "@/utils/astrology-math";

/** Date formatting helper */
const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};

export default function DashaTimeline() {
  const { dashas, birthDetails } = useAstrologyStore();
  const [expandedLord, setExpandedLord] = useState<string | null>(null);

  const birthDateStr = useMemo(() => {
    return new Date(
      birthDetails.year,
      birthDetails.month - 1,
      birthDetails.day
    ).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }, [birthDetails]);

  const toggleLord = (lord: string) => {
    setExpandedLord((prev) => (prev === lord ? null : lord));
  };

  return (
    <div className="w-full bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl p-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-indigo-400 font-sans tracking-wide">
          Vimshottari Dasha Cycles (120 Years)
        </h3>
        <p className="text-xs text-white/40 font-mono mt-1">
          Chronological periods calculated from Moon Nakshatra position starting from birth: {birthDateStr}
        </p>
      </div>

      <div className="w-full space-y-2">
        {dashas.map((dasha, idx) => {
          const mainLord = dasha.lord;
          const totalYears = VIMSHOTTARI_PERIODS[mainLord];
          const isFirst = idx === 0;
          const isExpanded = expandedLord === mainLord;

          return (
            <div 
              key={mainLord}
              className="border border-white/5 rounded-lg overflow-hidden bg-slate-950/40 px-4 transition-all hover:border-white/15"
            >
              {/* Accordion Trigger Button */}
              <button
                type="button"
                onClick={() => toggleLord(mainLord)}
                className="w-full py-4 flex justify-between items-center text-left focus:outline-none group cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <span className="text-base font-bold text-amber-300 font-mono w-24">
                    {mainLord}
                  </span>
                  <div>
                    <span className="text-xs text-white/50 block font-mono">
                      {isFirst ? "Starting Balance Period" : `Full Period (${totalYears} Years)`}
                    </span>
                    <span className="text-sm font-semibold text-white/80">
                      {formatDate(dasha.startDate)} — {formatDate(dasha.endDate)}
                    </span>
                  </div>
                </div>

                {/* Chevron icon */}
                <svg
                  className={`w-5 h-5 text-white/40 group-hover:text-white/80 transition-transform duration-200 ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Accordion Content Panel */}
              {isExpanded && (
                <div className="pb-4 pt-2 border-t border-white/5 animate-fadeIn">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                    {dasha.subPeriods?.map((sub, sIdx) => (
                      <div 
                        key={sIdx} 
                        className="bg-slate-900 border border-white/5 p-2 rounded flex items-center justify-between text-xs hover:border-indigo-500/30 transition-colors"
                      >
                        <span className="font-mono font-bold text-indigo-400">
                          {mainLord} — {sub.lord}
                        </span>
                        <span className="text-[10px] text-white/60 text-right">
                          {formatDate(sub.startDate)} <br />
                          to {formatDate(sub.endDate)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
