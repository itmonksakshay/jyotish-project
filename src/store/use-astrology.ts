import { create } from "zustand";
import { 
  BirthDetails, 
  castKundli, 
  KundliData,
  DashaPeriod,
  calculateVimshottariDashas,
  calculateCompatibility,
  KootaScore
} from "@/utils/astrology-math";

// Standard city coordinates presets (for ease of use)
export interface CityPreset {
  name: string;
  latitude: number;
  longitude: number;
  timezone: number;
}

export const CITY_PRESETS: CityPreset[] = [
  { name: "New Delhi, India", latitude: 28.6139, longitude: 77.2090, timezone: 5.5 },
  { name: "Mumbai, India", latitude: 19.0760, longitude: 72.8777, timezone: 5.5 },
  { name: "New York, USA", latitude: 40.7128, longitude: -74.0060, timezone: -4 },
  { name: "London, UK", latitude: 51.5074, longitude: -0.1278, timezone: 1 },
  { name: "Tokyo, Japan", latitude: 35.6762, longitude: 139.6503, timezone: 9 },
  { name: "Sydney, Australia", latitude: -33.8688, longitude: 151.2093, timezone: 10 },
];

interface AstrologyState {
  // Birth chart inputs & output
  birthDetails: BirthDetails;
  setBirthDetails: (details: Partial<BirthDetails>) => void;
  kundliData: KundliData;
  dashas: DashaPeriod[];
  recalculateKundli: () => void;

  // Compatibility (Matching) inputs & output
  matchGroomDetails: BirthDetails;
  matchBrideDetails: BirthDetails;
  setMatchGroomDetails: (details: Partial<BirthDetails>) => void;
  setMatchBrideDetails: (details: Partial<BirthDetails>) => void;
  compatibilityResult: KootaScore | null;
  calculateMatchResult: () => void;

  // UI state
  selectedPresetIndex: number;
  selectPreset: (index: number) => void;
  selectedSandboxPlanet: string;
  setSelectedSandboxPlanet: (planet: string) => void;
  webglViewMode: "geocentric" | "heliocentric";
  setWebglViewMode: (mode: "geocentric" | "heliocentric") => void;
  webglOrbitSpeed: number;
  setWebglOrbitSpeed: (speed: number) => void;
}

const defaultBirthDetails: BirthDetails = {
  year: 1995,
  month: 5,
  day: 15,
  hour: 14,
  minute: 30,
  second: 0,
  latitude: 28.6139,
  longitude: 77.2090,
  timezone: 5.5
};

const defaultMatchGroomDetails: BirthDetails = {
  year: 1993,
  month: 8,
  day: 20,
  hour: 9,
  minute: 15,
  second: 0,
  latitude: 28.6139,
  longitude: 77.2090,
  timezone: 5.5
};

const defaultMatchBrideDetails: BirthDetails = {
  year: 1995,
  month: 5,
  day: 15,
  hour: 14,
  minute: 30,
  second: 0,
  latitude: 28.6139,
  longitude: 77.2090,
  timezone: 5.5
};

export const useAstrologyStore = create<AstrologyState>((set, get) => {
  // Initial calculation
  const initialKundli = castKundli(defaultBirthDetails);
  const initialMoon = initialKundli.planets.find(p => p.name === "Moon")?.siderealLon ?? 0;
  const initialBirthDate = new Date(
    defaultBirthDetails.year,
    defaultBirthDetails.month - 1,
    defaultBirthDetails.day,
    defaultBirthDetails.hour,
    defaultBirthDetails.minute,
    defaultBirthDetails.second
  );
  const initialDashas = calculateVimshottariDashas(initialBirthDate, initialMoon);

  return {
    birthDetails: defaultBirthDetails,
    kundliData: initialKundli,
    dashas: initialDashas,
    selectedPresetIndex: 0,

    setBirthDetails: (details) => {
      set((state) => ({
        birthDetails: { ...state.birthDetails, ...details }
      }));
      get().recalculateKundli();
    },

    selectPreset: (index) => {
      if (index < 0 || index >= CITY_PRESETS.length) return;
      const preset = CITY_PRESETS[index];
      set({ selectedPresetIndex: index });
      get().setBirthDetails({
        latitude: preset.latitude,
        longitude: preset.longitude,
        timezone: preset.timezone
      });
    },

    recalculateKundli: () => {
      const details = get().birthDetails;
      const result = castKundli(details);
      const moon = result.planets.find(p => p.name === "Moon")?.siderealLon ?? 0;
      const birthDate = new Date(
        details.year,
        details.month - 1,
        details.day,
        details.hour,
        details.minute,
        details.second
      );
      const dashas = calculateVimshottariDashas(birthDate, moon);
      set({ kundliData: result, dashas });
    },

    // Compatibility
    matchGroomDetails: defaultMatchGroomDetails,
    matchBrideDetails: defaultMatchBrideDetails,
    compatibilityResult: null,

    setMatchGroomDetails: (details) => {
      set((state) => ({
        matchGroomDetails: { ...state.matchGroomDetails, ...details }
      }));
    },

    setMatchBrideDetails: (details) => {
      set((state) => ({
        matchBrideDetails: { ...state.matchBrideDetails, ...details }
      }));
    },

    calculateMatchResult: () => {
      const groom = castKundli(get().matchGroomDetails);
      const bride = castKundli(get().matchBrideDetails);
      const groomMoon = groom.planets.find(p => p.name === "Moon")?.siderealLon ?? 0;
      const brideMoon = bride.planets.find(p => p.name === "Moon")?.siderealLon ?? 0;

      const score = calculateCompatibility(groomMoon, brideMoon);
      set({ compatibilityResult: score });
    },

    // UI Store states
    selectedSandboxPlanet: "Mercury",
    setSelectedSandboxPlanet: (planet) => set({ selectedSandboxPlanet: planet }),
    webglViewMode: "geocentric",
    setWebglViewMode: (mode) => set({ webglViewMode: mode }),
    webglOrbitSpeed: 0.1,
    setWebglOrbitSpeed: (speed) => set({ webglOrbitSpeed: speed })
  };
});
