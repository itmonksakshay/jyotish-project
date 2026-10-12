"use client";

import React, { useState } from "react";
import { useAstrologyStore } from "@/store/use-astrology";
import { 
  BirthDetails, 
  RASHI_NAMES, 
  NAKSHATRA_NAMES 
} from "@/utils/astrology-math";

export default function KundliMatching() {
  const {
    birthDetails,
    matchGroomDetails,
    matchBrideDetails,
    setMatchGroomDetails,
    setMatchBrideDetails,
    compatibilityResult,
    calculateMatchResult
  } = useAstrologyStore();

  // Handle local form submission
  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    calculateMatchResult();
  };

  const copyCurrentToGroom = () => {
    setMatchGroomDetails(birthDetails);
  };

  const copyCurrentToBride = () => {
    setMatchBrideDetails(birthDetails);
  };

  // Get compatibility color rating
  const getScoreRating = (score: number) => {
    if (score < 18) return { text: "Incompatible (Rejected)", color: "text-rose-400 bg-rose-950/20 border-rose-500/30" };
    if (score < 24) return { text: "Average Compatibility (Approved)", color: "text-amber-400 bg-amber-950/20 border-amber-500/30" };
    if (score < 32) return { text: "Good Compatibility (Recommended)", color: "text-indigo-400 bg-indigo-950/20 border-indigo-500/30" };
    return { text: "Excellent / Divine Compatibility!", color: "text-emerald-400 bg-emerald-950/20 border-emerald-500/30" };
  };

  return (
    <div className="w-full bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl p-6 space-y-6">
      
      {/* Introduction */}
      <div>
        <h3 className="text-lg font-bold text-indigo-400 font-sans tracking-wide">
          Kundli Matching (Ashta Koota Melapak)
        </h3>
        <p className="text-xs text-white/40 font-mono mt-1">
          Calculate the compatibility points between Bride and Groom Moon charts (Max 36 Gunas).
        </p>
      </div>

      {/* Grid Inputs Forms */}
      <form onSubmit={handleCalculate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Groom (Boy) Input */}
        <div className="bg-slate-950/40 border border-white/5 p-4 rounded-lg space-y-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <span className="text-sm font-bold text-indigo-300 font-serif">Groom (Boy) Details</span>
            <button
              type="button"
              onClick={copyCurrentToGroom}
              className="text-[10px] bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded transition-all"
            >
              Copy Current Birth Details
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-white/40 uppercase block mb-1">Year</label>
              <input
                type="number"
                value={matchGroomDetails.year}
                onChange={(e) => setMatchGroomDetails({ year: parseInt(e.target.value) || 1990 })}
                className="w-full text-xs bg-slate-900 border border-white/10 rounded p-1.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/40 uppercase block mb-1">Month</label>
              <input
                type="number"
                value={matchGroomDetails.month}
                onChange={(e) => setMatchGroomDetails({ month: parseInt(e.target.value) || 1 })}
                className="w-full text-xs bg-slate-900 border border-white/10 rounded p-1.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/40 uppercase block mb-1">Day</label>
              <input
                type="number"
                value={matchGroomDetails.day}
                onChange={(e) => setMatchGroomDetails({ day: parseInt(e.target.value) || 1 })}
                className="w-full text-xs bg-slate-900 border border-white/10 rounded p-1.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-white/40 uppercase block mb-1">Hour (24h)</label>
              <input
                type="number"
                value={matchGroomDetails.hour}
                onChange={(e) => setMatchGroomDetails({ hour: parseInt(e.target.value) || 0 })}
                className="w-full text-xs bg-slate-900 border border-white/10 rounded p-1.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/40 uppercase block mb-1">Minute</label>
              <input
                type="number"
                value={matchGroomDetails.minute}
                onChange={(e) => setMatchGroomDetails({ minute: parseInt(e.target.value) || 0 })}
                className="w-full text-xs bg-slate-900 border border-white/10 rounded p-1.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/40 uppercase block mb-1">Longitude (°E)</label>
              <input
                type="number"
                step="0.0001"
                value={matchGroomDetails.longitude}
                onChange={(e) => setMatchGroomDetails({ longitude: parseFloat(e.target.value) || 0 })}
                className="w-full text-xs bg-slate-900 border border-white/10 rounded p-1.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Bride (Girl) Input */}
        <div className="bg-slate-950/40 border border-white/5 p-4 rounded-lg space-y-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <span className="text-sm font-bold text-indigo-300 font-serif">Bride (Girl) Details</span>
            <button
              type="button"
              onClick={copyCurrentToBride}
              className="text-[10px] bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded transition-all"
            >
              Copy Current Birth Details
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-white/40 uppercase block mb-1">Year</label>
              <input
                type="number"
                value={matchBrideDetails.year}
                onChange={(e) => setMatchBrideDetails({ year: parseInt(e.target.value) || 1990 })}
                className="w-full text-xs bg-slate-900 border border-white/10 rounded p-1.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/40 uppercase block mb-1">Month</label>
              <input
                type="number"
                value={matchBrideDetails.month}
                onChange={(e) => setMatchBrideDetails({ month: parseInt(e.target.value) || 1 })}
                className="w-full text-xs bg-slate-900 border border-white/10 rounded p-1.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/40 uppercase block mb-1">Day</label>
              <input
                type="number"
                value={matchBrideDetails.day}
                onChange={(e) => setMatchBrideDetails({ day: parseInt(e.target.value) || 1 })}
                className="w-full text-xs bg-slate-900 border border-white/10 rounded p-1.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-white/40 uppercase block mb-1">Hour (24h)</label>
              <input
                type="number"
                value={matchBrideDetails.hour}
                onChange={(e) => setMatchBrideDetails({ hour: parseInt(e.target.value) || 0 })}
                className="w-full text-xs bg-slate-900 border border-white/10 rounded p-1.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/40 uppercase block mb-1">Minute</label>
              <input
                type="number"
                value={matchBrideDetails.minute}
                onChange={(e) => setMatchBrideDetails({ minute: parseInt(e.target.value) || 0 })}
                className="w-full text-xs bg-slate-900 border border-white/10 rounded p-1.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/40 uppercase block mb-1">Longitude (°E)</label>
              <input
                type="number"
                step="0.0001"
                value={matchBrideDetails.longitude}
                onChange={(e) => setMatchBrideDetails({ longitude: parseFloat(e.target.value) || 0 })}
                className="w-full text-xs bg-slate-900 border border-white/10 rounded p-1.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="md:col-span-2 flex justify-center pt-2">
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-sans text-xs uppercase tracking-widest font-bold px-8 py-3 rounded-lg border border-indigo-400/20 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            Calculate Ashta Koota Compatibility
          </button>
        </div>
      </form>

      {/* Compatibility Output results */}
      {compatibilityResult && (
        <div className="border-t border-white/10 pt-6 space-y-6 animate-fadeIn">
          
          {/* Main Score Board */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl border border-white/10 bg-slate-950/60 gap-4">
            <div>
              <span className="block text-xs uppercase font-mono tracking-widest text-white/40">
                Total Compatibility Score
              </span>
              <span className="text-3xl font-bold font-serif text-amber-300 block mt-1">
                {compatibilityResult.totalScore} <span className="text-lg text-white/60 font-sans font-medium">/ 36 Gunas</span>
              </span>
            </div>
            
            <div className={`px-4 py-2 rounded-lg border text-xs font-mono font-bold ${getScoreRating(compatibilityResult.totalScore).color}`}>
              {getScoreRating(compatibilityResult.totalScore).text}
            </div>
          </div>

          {/* Warnings (Dosha) Panel */}
          {compatibilityResult.warnings.length > 0 && (
            <div className="bg-rose-950/20 border border-rose-500/30 p-4 rounded-lg space-y-2">
              <span className="block text-xs uppercase font-mono font-bold tracking-widest text-rose-400">
                Critical Compatibility Warnings (Doshas)
              </span>
              <ul className="list-disc pl-4 space-y-1 text-xs text-white/80">
                {compatibilityResult.warnings.map((w, idx) => (
                  <li key={idx} className="font-sans leading-relaxed">
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Table Breakdown of 8 Kootas */}
          <div className="space-y-2">
            <h4 className="text-xs uppercase font-mono tracking-widest text-white/40">
              Ashta Koota Breakdown
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { name: "Varna (Caste)", val: compatibilityResult.varna },
                { name: "Vashya (Control)", val: compatibilityResult.vashya },
                { name: "Tara (Health)", val: compatibilityResult.tara },
                { name: "Yoni (Intimacy)", val: compatibilityResult.yoni },
                { name: "Maitri (Friendship)", val: compatibilityResult.maitri },
                { name: "Gana (Temper)", val: compatibilityResult.gana },
                { name: "Bhakoot (Signs)", val: compatibilityResult.bhakoot },
                { name: "Nadi (Constitution)", val: compatibilityResult.nadi },
              ].map((k, idx) => (
                <div key={idx} className="bg-slate-950/30 border border-white/5 p-3 rounded flex flex-col justify-between hover:border-indigo-500/20 transition-colors">
                  <div>
                    <span className="text-[10px] text-white/40 block font-mono font-bold">{k.name}</span>
                    <span className="text-base font-bold text-amber-300 mt-1 block">
                      {k.val.score} <span className="text-xs text-white/50">/ {k.val.max}</span>
                    </span>
                  </div>
                  <span className="text-[9px] text-white/40 leading-tight block mt-2 pt-2 border-t border-white/5 italic">
                    {k.val.details}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
