"use client";

import React, { useMemo } from "react";
import { 
  useTable, 
  tableFeatures,
  flexRender 
} from "@tanstack/react-table";
import { useAstrologyStore } from "@/store/use-astrology";
import { PlanetPosition } from "@/utils/astrology-math";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

/** Helper to format decimal degrees to Degrees, Minutes, Seconds */
const formatDMS = (degVal: number): string => {
  const d = Math.floor(degVal);
  const minFloat = (degVal - d) * 60;
  const m = Math.floor(minFloat);
  const s = Math.floor((minFloat - m) * 60);
  return `${d}° ${m}' ${s}"`;
};

// Initialize empty features object for tree-shakable React Table v9
const features = tableFeatures({});

export default function PlanetaryTable() {
  const { kundliData, selectedSandboxPlanet, setSelectedSandboxPlanet } = useAstrologyStore();

  const data = useMemo(() => kundliData.planets, [kundliData]);

  const columns = useMemo(() => [
    {
      header: "Planet / Body",
      accessorKey: "name",
      cell: (info: any) => {
        const name = info.getValue() as string;
        const isSelected = name === selectedSandboxPlanet;
        return (
          <span className={`font-semibold ${isSelected ? "text-red-400 font-bold" : "text-white/95"}`}>
            {name}
            {name === "Sun" && " (Surya)"}
            {name === "Moon" && " (Chandra)"}
            {name === "Mercury" && " (Budha)"}
            {name === "Venus" && " (Shukra)"}
            {name === "Mars" && " (Mangal)"}
            {name === "Jupiter" && " (Guru)"}
            {name === "Saturn" && " (Shani)"}
            {name === "Rahu" && " (Asc. Node)"}
            {name === "Ketu" && " (Desc. Node)"}
          </span>
        );
      }
    },
    {
      header: "Sidereal Longitude",
      accessorKey: "siderealLon",
      cell: (info: any) => {
        const absoluteLon = info.getValue() as number;
        const rashiDegrees = absoluteLon % 30;
        return (
          <span className="font-mono text-xs text-amber-200">
            {formatDMS(rashiDegrees)}
          </span>
        );
      }
    },
    {
      header: "Zodiac (Rashi)",
      accessorKey: "rashiName",
      cell: (info: any) => <span className="font-serif text-indigo-300">{info.getValue() as string}</span>
    },
    {
      header: "Nakshatra",
      accessorKey: "nakshatraName",
      cell: (info: any) => {
        const row = info.row.original as PlanetPosition;
        return (
          <span className="text-white/80 font-medium">
            {row.nakshatraName} <span className="text-[10px] bg-slate-950/60 border border-white/5 px-1 py-0.5 rounded text-indigo-400">Pada {row.pada}</span>
          </span>
        );
      }
    },
    {
      header: "House Position",
      accessorKey: "house",
      cell: (info: any) => {
        const h = info.getValue() as number;
        // Ordinal suffix helper
        const getOrdinal = (n: number) => {
          const s = ["th", "st", "nd", "rd"];
          const v = n % 100;
          return n + (s[(v - 20) % 10] || s[v] || s[0]);
        };
        return (
          <span className="text-xs bg-indigo-950/40 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full font-mono font-semibold">
            {getOrdinal(h)} House
          </span>
        );
      }
    },
    {
      header: "Motion",
      accessorKey: "isRetrograde",
      cell: (info: any) => {
        const isRetro = info.getValue() as boolean;
        return (
          <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded ${
            isRetro 
              ? "bg-rose-950/40 text-rose-400 border border-rose-500/20" 
              : "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20"
          }`}>
            {isRetro ? "Retrograde (Vakri)" : "Direct (Marga)"}
          </span>
        );
      }
    }
  ], [selectedSandboxPlanet]);

  const table: any = useTable({
    features,
    data,
    columns
  });

  return (
    <div className="w-full bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-base font-bold text-indigo-400 font-sans tracking-wide">
          Calculated Planetary Coordinates (Lahiri Ayanamsa)
        </h3>
        <span className="text-xs text-white/40 font-mono">
          Click a row to load its step-by-step orbital calculations in the Sandbox
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-950/50 border-b border-white/10">
            {table.getHeaderGroups().map((headerGroup: any) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header: any) => (
                  <TableHead key={header.id} className="text-white/60 font-sans text-xs uppercase tracking-wider py-3">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row: any) => {
              const isSelected = row.original.name === selectedSandboxPlanet;
              return (
                <TableRow
                  key={row.id}
                  onClick={() => setSelectedSandboxPlanet(row.original.name)}
                  className={`cursor-pointer transition-colors duration-150 border-b border-white/5 last:border-0 ${
                    isSelected 
                      ? "bg-red-500/10 hover:bg-red-500/15" 
                      : "hover:bg-white/5"
                  }`}
                >
                  {row.getVisibleCells().map((cell: any) => (
                    <TableCell key={cell.id} className="py-3.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
