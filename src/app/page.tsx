"use client";

import React from "react";
import { useAstrologyStore, CITY_PRESETS } from "@/store/use-astrology";
import WebGLCelestialSphere from "@/components/webgl-celestial-sphere";
import KundliChart from "@/components/kundli-chart";
import PlanetaryTable from "@/components/planetary-table";
import DashaTimeline from "@/components/dasha-timeline";
import PanchangDetails from "@/components/panchang-details";
import KundliMatching from "@/components/kundli-matching";
import MathSandbox from "@/components/math-sandbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  const {
    birthDetails,
    setBirthDetails,
    selectedPresetIndex,
    selectPreset,
    webglViewMode,
    setWebglViewMode
  } = useAstrologyStore();

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 md:py-12 space-y-8 font-sans">
      
      {/* Header Banner */}
      <div className="text-center md:text-left border-b border-white/10 pb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-serif tracking-widest text-amber-300 font-bold uppercase drop-shadow-[0_2px_10px_rgba(234,179,8,0.2)]">
            Jyotisha 3D
          </h1>
          <p className="text-sm font-mono text-white/50 mt-2 uppercase tracking-widest">
            Interactive Astronomical Orbits & Vedic Astrological Engine
          </p>
        </div>
        <div className="flex flex-col md:items-end gap-1.5">
          <span className="text-[10px] uppercase font-mono tracking-widest text-white/30">
            Current Engine Mode
          </span>
          <span className="text-xs bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-mono font-bold">
            100% Dependency-Free / WebGL Powered
          </span>
        </div>
      </div>

      {/* Natal Birth Details Form */}
      <div className="w-full bg-slate-900/50 backdrop-blur-md border border-white/10 p-6 rounded-xl shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-3 gap-2">
          <h2 className="text-sm font-mono font-bold text-indigo-300 uppercase tracking-widest">
            Enter Natal Birth Details
          </h2>
          
          {/* Presets Select */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40 font-mono">Location Preset:</span>
            <select
              value={selectedPresetIndex}
              onChange={(e) => selectPreset(parseInt(e.target.value))}
              className="text-xs bg-slate-950 border border-white/10 rounded px-2.5 py-1 text-white focus:outline-none focus:border-indigo-500"
            >
              {CITY_PRESETS.map((p, idx) => (
                <option key={idx} value={idx}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Form Inputs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          
          {/* Year */}
          <div>
            <label className="text-[10px] text-white/40 uppercase block mb-1">Year</label>
            <input
              type="number"
              value={birthDetails.year}
              onChange={(e) => setBirthDetails({ year: parseInt(e.target.value) || 1995 })}
              className="w-full text-xs bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Month */}
          <div>
            <label className="text-[10px] text-white/40 uppercase block mb-1">Month</label>
            <input
              type="number"
              min="1"
              max="12"
              value={birthDetails.month}
              onChange={(e) => setBirthDetails({ month: parseInt(e.target.value) || 1 })}
              className="w-full text-xs bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Day */}
          <div>
            <label className="text-[10px] text-white/40 uppercase block mb-1">Day</label>
            <input
              type="number"
              min="1"
              max="31"
              value={birthDetails.day}
              onChange={(e) => setBirthDetails({ day: parseInt(e.target.value) || 1 })}
              className="w-full text-xs bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Time: Hour */}
          <div>
            <label className="text-[10px] text-white/40 uppercase block mb-1">Hour (24h)</label>
            <input
              type="number"
              min="0"
              max="23"
              value={birthDetails.hour}
              onChange={(e) => setBirthDetails({ hour: parseInt(e.target.value) || 0 })}
              className="w-full text-xs bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Time: Minute */}
          <div>
            <label className="text-[10px] text-white/40 uppercase block mb-1">Minute</label>
            <input
              type="number"
              min="0"
              max="59"
              value={birthDetails.minute}
              onChange={(e) => setBirthDetails({ minute: parseInt(e.target.value) || 0 })}
              className="w-full text-xs bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Latitude */}
          <div>
            <label className="text-[10px] text-white/40 uppercase block mb-1">Latitude (°N)</label>
            <input
              type="number"
              step="0.0001"
              value={birthDetails.latitude}
              onChange={(e) => setBirthDetails({ latitude: parseFloat(e.target.value) || 0 })}
              className="w-full text-xs bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Longitude */}
          <div>
            <label className="text-[10px] text-white/40 uppercase block mb-1">Longitude (°E)</label>
            <input
              type="number"
              step="0.0001"
              value={birthDetails.longitude}
              onChange={(e) => setBirthDetails({ longitude: parseFloat(e.target.value) || 0 })}
              className="w-full text-xs bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Timezone */}
          <div>
            <label className="text-[10px] text-white/40 uppercase block mb-1">Timezone (UTC)</label>
            <input
              type="number"
              step="0.5"
              value={birthDetails.timezone}
              onChange={(e) => setBirthDetails({ timezone: parseFloat(e.target.value) || 0 })}
              className="w-full text-xs bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

        </div>
      </div>

      {/* Main Feature Tabs */}
      <Tabs defaultValue="orbit" className="w-full space-y-6">
        
        {/* Tab Selection Row */}
        <div className="flex justify-center sm:justify-start">
          <TabsList className="bg-slate-900 border border-white/10 p-1 flex overflow-x-auto select-none rounded-lg max-w-full">
            <TabsTrigger value="orbit" className="px-4 py-2 font-sans text-xs uppercase tracking-wider font-semibold rounded-md transition-all cursor-pointer">
              3D Orbit Simulator
            </TabsTrigger>
            <TabsTrigger value="chart" className="px-4 py-2 font-sans text-xs uppercase tracking-wider font-semibold rounded-md transition-all cursor-pointer">
              Vedic Birth Chart
            </TabsTrigger>
            <TabsTrigger value="dashas" className="px-4 py-2 font-sans text-xs uppercase tracking-wider font-semibold rounded-md transition-all cursor-pointer">
              Vimshottari Dashas
            </TabsTrigger>
            <TabsTrigger value="panchang" className="px-4 py-2 font-sans text-xs uppercase tracking-wider font-semibold rounded-md transition-all cursor-pointer">
              Daily Panchang
            </TabsTrigger>
            <TabsTrigger value="matching" className="px-4 py-2 font-sans text-xs uppercase tracking-wider font-semibold rounded-md transition-all cursor-pointer">
              Kundli Matching
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: WebGL 3D Orbital Universe */}
        <TabsContent value="orbit" className="space-y-6 outline-none">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* 3D WebGL Canvas Box */}
            <div className="flex-[2] w-full">
              <WebGLCelestialSphere />
            </div>

            {/* Simulation Controls Panel */}
            <div className="flex-1 w-full bg-slate-900/50 backdrop-blur-md border border-white/10 p-6 rounded-xl flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-base font-bold text-indigo-400 font-sans tracking-wide">
                  3D Viewport Controls
                </h3>
                <p className="text-xs text-white/60 leading-relaxed font-sans">
                  Rotate the solar system by clicking and dragging inside the canvas. Pinch or scroll to zoom in/out.
                </p>

                {/* Perspective selector toggles */}
                <div className="space-y-2 border-t border-white/5 pt-3">
                  <span className="block text-[10px] uppercase font-mono tracking-widest text-white/40">
                    Coordinate System Model
                  </span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setWebglViewMode("geocentric")}
                      className={`text-xs px-3 py-2 rounded-lg font-mono border font-semibold tracking-wide transition-all cursor-pointer ${
                        webglViewMode === "geocentric"
                          ? "bg-indigo-600 text-white border-indigo-400"
                          : "bg-slate-950/40 text-white/60 border-white/10 hover:border-white/20"
                      }`}
                    >
                      Geocentric (Vedic)
                    </button>
                    <button
                      onClick={() => setWebglViewMode("heliocentric")}
                      className={`text-xs px-3 py-2 rounded-lg font-mono border font-semibold tracking-wide transition-all cursor-pointer ${
                        webglViewMode === "heliocentric"
                          ? "bg-indigo-600 text-white border-indigo-400"
                          : "bg-slate-950/40 text-white/60 border-white/10 hover:border-white/20"
                      }`}
                    >
                      Heliocentric (Solar)
                    </button>
                  </div>
                </div>

                <div className="text-xs text-white/50 leading-relaxed pt-2 space-y-2 font-sans">
                  {webglViewMode === "geocentric" ? (
                    <>
                      <p>
                        <strong>Geocentric Model (Vedic Astrology Perspective):</strong>
                      </p>
                      <p>
                        The Earth is locked at the center. The orbital trails show the apparent motion of the Sun, Moon, and planets against the sidereal Zodiac ring (30° segments). 
                      </p>
                      <p>
                        Notice the red spiral trail of the selected planet—it shows retrogrades and epicycles relative to the Earth!
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        <strong>Heliocentric Model (Physical Solar System Perspective):</strong>
                      </p>
                      <p>
                        The Sun is locked at the center. Shows the actual elliptical orbits of Mercury, Venus, Earth, Mars, Jupiter, and Saturn under Keplerian physics.
                      </p>
                      <p>
                        Useful to see how the physical orbits tilt and tilt relative to the plane of the ecliptic in 3D.
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="border-t border-white/10 pt-4 mt-6">
                <span className="block text-[9px] uppercase font-mono tracking-widest text-white/30">
                  Target Sandbox Entity
                </span>
                <span className="text-sm font-serif font-bold text-amber-300">
                  useAstrologyStore.selectedSandboxPlanet = &apos;{useAstrologyStore().selectedSandboxPlanet}&apos;
                </span>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Vedic Birth Chart Diagram & Coordinates Table */}
        <TabsContent value="chart" className="space-y-6 outline-none animate-fadeIn">
          <KundliChart />
          <PlanetaryTable />
        </TabsContent>

        {/* Tab 3: Dasha Period Cycles */}
        <TabsContent value="dashas" className="outline-none animate-fadeIn">
          <DashaTimeline />
        </TabsContent>

        {/* Tab 4: Panchang Limb elements */}
        <TabsContent value="panchang" className="outline-none animate-fadeIn">
          <PanchangDetails />
        </TabsContent>

        {/* Tab 5: Love Compatibility Matcher */}
        <TabsContent value="matching" className="outline-none animate-fadeIn">
          <KundliMatching />
        </TabsContent>

      </Tabs>

      {/* Step-by-Step Educational Mathematics Sandbox Console */}
      <MathSandbox />
      
    </main>
  );
}
