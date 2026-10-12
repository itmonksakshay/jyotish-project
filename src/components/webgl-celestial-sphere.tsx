"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { useAstrologyStore } from "@/store/use-astrology";
import { 
  getHeliocentricCoords, 
  getGeocentricLonLat, 
  getMoonCoords,
  getLahiriAyanamsa,
  normalizeDeg,
  RASHI_NAMES,
  rad,
  deg
} from "@/utils/astrology-math";
import { 
  createIdentity, 
  createPerspective, 
  createLookAt, 
  rotateX, 
  rotateY, 
  multiply,
  Mat4, 
  Vec3 
} from "@/utils/matrix";

const PI = Math.PI;

// GLSL Shader Source Codes
const vertexShaderSource = `
  attribute vec3 position;
  attribute vec4 color;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  varying vec4 vColor;
  void main() {
    vColor = color;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = 10.0;
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  varying vec4 vColor;
  uniform bool isPoint;
  void main() {
    if (isPoint) {
      vec2 circCoord = gl_PointCoord - vec2(0.5);
      if (dot(circCoord, circCoord) > 0.25) {
        discard;
      }
    }
    gl_FragColor = vColor;
  }
`;

interface ProjectedLabel {
  name: string;
  x: number;
  y: number;
  color: string;
  type: "planet" | "zodiac" | "origin";
}

export default function WebGLCelestialSphere() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Zustand store variables
  const { 
    birthDetails, 
    kundliData, 
    webglViewMode, 
    selectedSandboxPlanet 
  } = useAstrologyStore();

  // WebGL camera / rotation state
  const [rotX, setRotX] = useState<number>(0.5); // Radians rotation X
  const [rotY, setRotY] = useState<number>(-0.5); // Radians rotation Y
  const [zoom, setZoom] = useState<number>(6.5); // Distance from center
  const [labels, setLabels] = useState<ProjectedLabel[]>([]);
  const isDragging = useRef<boolean>(false);
  const previousMouse = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Handle resizing
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 500 });
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setCanvasSize({ 
          width: Math.max(width, 300), 
          height: Math.max(height, 350) 
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Project a 3D coordinate to 2D screen coordinates
  const project3DTo2D = useCallback((
    point: [number, number, number], 
    mvp: Mat4, 
    width: number, 
    height: number
  ): { x: number; y: number; z: number } => {
    const [x, y, z] = point;
    // Apply matrix transformation
    const px = mvp[0] * x + mvp[4] * y + mvp[8] * z + mvp[12];
    const py = mvp[1] * x + mvp[5] * y + mvp[9] * z + mvp[13];
    const pz = mvp[2] * x + mvp[6] * y + mvp[10] * z + mvp[14];
    const pw = mvp[3] * x + mvp[7] * y + mvp[11] * z + mvp[15];

    if (pw === 0) return { x: -999, y: -999, z: 999 };

    // Normalized Device Coordinates
    const ndcX = px / pw;
    const ndcY = py / pw;

    // Convert to screen space
    const screenX = (ndcX * 0.5 + 0.5) * width;
    const screenY = (-ndcY * 0.5 + 0.5) * height;

    return { x: screenX, y: screenY, z: pz };
  }, []);

  // WebGL rendering logic loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) {
      console.error("WebGL not supported");
      return;
    }

    // Set canvas sizes
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    gl.viewport(0, 0, canvas.width, canvas.height);

    // 1. Compile Shaders
    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, vertexShaderSource);
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      console.error("VS compilation error:", gl.getShaderInfoLog(vs));
      return;
    }

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, fragmentShaderSource);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      console.error("FS compilation error:", gl.getShaderInfoLog(fs));
      return;
    }

    // 2. Link Program
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Uniform and Attribute locations
    const posAttrib = gl.getAttribLocation(program, "position");
    const colAttrib = gl.getAttribLocation(program, "color");
    const uModelView = gl.getUniformLocation(program, "modelViewMatrix");
    const uProjection = gl.getUniformLocation(program, "projectionMatrix");
    const uIsPoint = gl.getUniformLocation(program, "isPoint");

    gl.enableVertexAttribArray(posAttrib);
    gl.enableVertexAttribArray(colAttrib);

    // Enable depth testing
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    // Setup projection and modelview matrices
    const aspect = canvas.width / canvas.height;
    const projMatrix = createPerspective(rad(45), aspect, 0.1, 100.0);
    
    const eye: Vec3 = [0, 0, zoom];
    const center: Vec3 = [0, 0, 0];
    const up: Vec3 = [0, 1, 0];
    let viewMatrix = createLookAt(eye, center, up);

    // Rotate camera based on user state
    viewMatrix = rotateX(viewMatrix, rotX);
    viewMatrix = rotateY(viewMatrix, rotY);

    gl.uniformMatrix4fv(uProjection, false, projMatrix);
    gl.uniformMatrix4fv(uModelView, false, viewMatrix);

    // Compute combined Model-View-Projection matrix for SVG labels projection
    const mvpMatrix = multiply(projMatrix, viewMatrix);

    // Calculate Julian Centuries for time coordinate calculations
    const birthJD = kundliData.julianDay;
    const T = (birthJD - 2451545.0) / 36525.0;
    const ayan = getLahiriAyanamsa(T);

    // Color definitions
    const cGold = [0.83, 0.69, 0.22, 1.0];
    const cIndigo = [0.27, 0.35, 0.93, 0.4];
    const cPurple = [0.63, 0.13, 0.94, 0.3];
    const cWhite = [1.0, 1.0, 1.0, 0.8];
    const cGray = [0.5, 0.5, 0.5, 0.2];
    const cOrange = [1.0, 0.5, 0.0, 1.0];
    const cAqua = [0.0, 0.8, 0.8, 0.8];

    // Buffers and vertices list
    const vertices: number[] = [];
    const colors: number[] = [];

    const addLine = (p1: Vec3, p2: Vec3, color: number[]) => {
      vertices.push(...p1, ...p2);
      colors.push(...color, ...color);
    };

    const addPoint = (p: Vec3, color: number[]) => {
      vertices.push(...p);
      colors.push(...color);
    };

    // --- DRAW GEOMETRY SCENE ---

    // 1. Draw Starfield background (random points on sphere boundary)
    const starCount = 150;
    // Use a fixed seed for stars so they don't jump around
    let seed = 42;
    const random = () => {
      let x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };
    for (let s = 0; s < starCount; s++) {
      const theta = random() * PI * 2;
      const phi = Math.acos((random() * 2) - 1);
      const r = 20.0; // Distant shell
      const sx = r * Math.sin(phi) * Math.cos(theta);
      const sy = r * Math.sin(phi) * Math.sin(theta);
      const sz = r * Math.cos(phi);
      addPoint([sx, sy, sz], [0.8, 0.8, 1.0, 0.4]);
    }
    const starsVertexCount = starCount;

    // 2. Draw origin center point
    addPoint([0, 0, 0], webglViewMode === "geocentric" ? [0.2, 0.6, 1.0, 1.0] : cOrange);
    const originVertexCount = 1;

    // 3. Draw grid system (Ecliptic plane and houses lines)
    const gridVerticesOffset = vertices.length / 6;
    const circleResolution = 72;
    const gridRadius = 3.0;

    // Ecliptic plane circle
    for (let c = 0; c < circleResolution; c++) {
      const th1 = (c / circleResolution) * PI * 2;
      const th2 = ((c + 1) / circleResolution) * PI * 2;
      const p1: Vec3 = [gridRadius * Math.cos(th1), 0, gridRadius * Math.sin(th1)];
      const p2: Vec3 = [gridRadius * Math.cos(th2), 0, gridRadius * Math.sin(th2)];
      addLine(p1, p2, cIndigo);
    }

    // 12 Zodiac division lines on Ecliptic plane
    for (let z = 0; z < 12; z++) {
      const angle = rad(z * 30 - ayan); // Sidereal boundary
      const pOuter: Vec3 = [gridRadius * Math.cos(angle), 0, gridRadius * Math.sin(angle)];
      addLine([0, 0, 0], pOuter, cGray);
    }
    const gridVertexCount = (vertices.length / 6) - gridVerticesOffset;

    // 4. Draw Planetary Orbits & Coordinate points
    const newLabels: ProjectedLabel[] = [];
    const orbitVerticesOffset = vertices.length / 6;
    
    // Add origin label
    const originLabelProj = project3DTo2D([0, 0, 0], mvpMatrix, canvas.width, canvas.height);
    newLabels.push({
      name: webglViewMode === "geocentric" ? "Earth" : "Sun",
      x: originLabelProj.x,
      y: originLabelProj.y,
      color: webglViewMode === "geocentric" ? "#3b82f6" : "#f59e0b",
      type: "origin"
    });

    if (webglViewMode === "heliocentric") {
      // HELIOCENTRIC: Draw orbits around the Sun at (0,0,0)
      const helioPlanets = ["Earth", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];
      
      helioPlanets.forEach((pName) => {
        // Generate Heliocentric orbit path (ellipse)
        const points = 72;
        const orbitalPoints: Vec3[] = [];
        
        for (let pt = 0; pt <= points; pt++) {
          const M_deg = (pt / points) * 360.0;
          // Calculate Heliocentric position of planet at this Mean Anomaly step
          // We can approximate it by offsetting time coordinate T proportionally
          const dayFraction = (pt / points) * 365.25; // approximate orbital period
          const simulatedT = T + (dayFraction / 36525.0);
          const pos = getHeliocentricCoords(pName, simulatedT);
          orbitalPoints.push([pos.x, pos.y, pos.z]);
        }

        // Draw orbital loop lines
        for (let pt = 0; pt < points; pt++) {
          addLine(orbitalPoints[pt], orbitalPoints[pt + 1], cAqua);
        }

        // Current actual position of the planet
        const currentPos = getHeliocentricCoords(pName, T);
        const pColor = pName === "Earth" ? [0.2, 0.6, 1.0, 1.0] : cGold;
        addPoint([currentPos.x, currentPos.y, currentPos.z], pColor);

        // Project coordinate to screen for labels
        const proj = project3DTo2D([currentPos.x, currentPos.y, currentPos.z], mvpMatrix, canvas.width, canvas.height);
        newLabels.push({
          name: pName,
          x: proj.x,
          y: proj.y,
          color: pName === "Earth" ? "#3b82f6" : "#d4af37",
          type: "planet"
        });
      });

    } else {
      // GEOCENTRIC: Planets coordinates relative to Earth at (0,0,0)
      const geocentricPlanets = ["Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Moon"];

      geocentricPlanets.forEach((pName) => {
        // Find geocentric longitude and latitude
        let pLon = 0, pLat = 0, pDist = 0;
        if (pName === "Sun") {
          const earth = getHeliocentricCoords("Earth", T);
          pLon = normalizeDeg(deg(Math.atan2(-earth.y, -earth.x)));
          pLat = deg(Math.atan2(-earth.z, Math.sqrt(earth.x*earth.x + earth.y*earth.y)));
          pDist = 1.8; // Set scaled distance for visual balance on sphere
        } else if (pName === "Moon") {
          const m = getMoonCoords(T);
          pLon = m.lon;
          pLat = m.lat;
          pDist = 1.2; // Closer orbit
        } else {
          const p = getGeocentricLonLat(pName, T);
          pLon = p.lon;
          pLat = p.lat;
          // Scale distance logarithmically to fit inside our sphere boundary
          pDist = 1.5 + Math.log(p.dist + 1) * 0.4;
        }

        // Draw planet as point in 3D (geocentric spherical coordinates)
        const radLon = rad(pLon);
        const radLat = rad(pLat);
        const px = pDist * Math.cos(radLat) * Math.cos(radLon);
        const py = pDist * Math.sin(radLat);
        const pz = pDist * Math.cos(radLat) * Math.sin(radLon);

        const isSelected = pName === selectedSandboxPlanet;
        const pColor = isSelected ? [1.0, 0.3, 0.3, 1.0] : (pName === "Moon" ? cWhite : (pName === "Sun" ? cOrange : cGold));
        addPoint([px, py, pz], pColor);

        // Project coordinate to screen for labels
        const proj = project3DTo2D([px, py, pz], mvpMatrix, canvas.width, canvas.height);
        newLabels.push({
          name: pName,
          x: proj.x,
          y: proj.y,
          color: isSelected ? "#ef4444" : (pName === "Moon" ? "#ffffff" : (pName === "Sun" ? "#f97316" : "#d4af37")),
          type: "planet"
        });

        // GEOCENTRIC PATH: For the selected sandbox planet, draw its epicycle track (last 180 days to next 180 days)
        if (isSelected) {
          const pathSteps = 100;
          const geocentricPath: Vec3[] = [];

          for (let step = -50; step <= 50; step++) {
            const simulatedT = T + (step * 3) / 36525.0; // 3-day steps
            let simulatedLon = 0, simulatedLat = 0, simulatedDist = 0;
            
            if (pName === "Sun") {
              const earth = getHeliocentricCoords("Earth", simulatedT);
              simulatedLon = normalizeDeg(deg(Math.atan2(-earth.y, -earth.x)));
              simulatedLat = deg(Math.atan2(-earth.z, Math.sqrt(earth.x*earth.x + earth.y*earth.y)));
              simulatedDist = 1.8;
            } else if (pName === "Moon") {
              const m = getMoonCoords(simulatedT);
              simulatedLon = m.lon;
              simulatedLat = m.lat;
              simulatedDist = 1.2;
            } else {
              const p = getGeocentricLonLat(pName, simulatedT);
              simulatedLon = p.lon;
              simulatedLat = p.lat;
              simulatedDist = 1.5 + Math.log(p.dist + 1) * 0.4;
            }

            const rL = rad(simulatedLon);
            const rLat = rad(simulatedLat);
            const sx = simulatedDist * Math.cos(rLat) * Math.cos(rL);
            const sy = simulatedDist * Math.sin(rLat);
            const sz = simulatedDist * Math.cos(rLat) * Math.sin(rL);
            geocentricPath.push([sx, sy, sz]);
          }

          // Draw trailing path lines in red/orange
          for (let step = 0; step < pathSteps; step++) {
            addLine(geocentricPath[step], geocentricPath[step + 1], [1.0, 0.2, 0.2, 0.4]);
          }
        }
      });

      // Draw Zodiac ring text anchor points on Ecliptic boundaries
      for (let z = 0; z < 12; z++) {
        // Middle of each zodiac sign
        const angle = rad(z * 30 + 15 - ayan);
        const labelPos: Vec3 = [gridRadius * 1.05 * Math.cos(angle), 0, gridRadius * 1.05 * Math.sin(angle)];
        const proj = project3DTo2D(labelPos, mvpMatrix, canvas.width, canvas.height);
        newLabels.push({
          name: RASHI_NAMES[z].split(" ")[0], // Aries, Taurus, etc.
          x: proj.x,
          y: proj.y,
          color: "#818cf8",
          type: "zodiac"
        });
      }
    }

    const orbitVertexCount = (vertices.length / 6) - orbitVerticesOffset;

    // --- WRITE BUFFERS & DRAW ---
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    // Bind Attributes
    const FSIZE = Float32Array.BYTES_PER_ELEMENT;

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(posAttrib, 3, gl.FLOAT, false, 3 * FSIZE, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(colAttrib, 4, gl.FLOAT, false, 4 * FSIZE, 0);

    // Clear canvas
    gl.clearColor(0.04, 0.04, 0.09, 0.9); // Dark blue background
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Draw Call: Stars background (drawn as Points)
    gl.uniform1i(uIsPoint, 1);
    gl.drawArrays(gl.POINTS, 0, starsVertexCount);

    // Draw Call: Origin (glowing sun/earth center point)
    gl.uniform1i(uIsPoint, 1);
    gl.drawArrays(gl.POINTS, starsVertexCount, originVertexCount);

    // Draw Call: Grid lines (drawn as Lines)
    gl.uniform1i(uIsPoint, 0);
    gl.drawArrays(gl.LINES, starsVertexCount + originVertexCount, gridVertexCount);

    // Draw Call: Orbit paths (Lines) and Planet nodes (Points)
    // The geometry alternates between lines (orbit segments) and points (planet positions)
    // To keep it simple, we draw all lines first, then all points
    // Let's do selective drawing ranges:
    gl.uniform1i(uIsPoint, 0);
    gl.drawArrays(gl.LINES, starsVertexCount + originVertexCount + gridVertexCount, orbitVertexCount);

    // We also draw the planet coordinate nodes as circle points
    gl.uniform1i(uIsPoint, 1);
    gl.drawArrays(gl.POINTS, starsVertexCount + originVertexCount + gridVertexCount, orbitVertexCount);

    // Update screen projection labels state
    setLabels(newLabels);

    // Cleanup resources
    return () => {
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(vertexBuffer);
      gl.deleteBuffer(colorBuffer);
      gl.deleteProgram(program);
    };

  }, [
    rotX, 
    rotY, 
    zoom, 
    webglViewMode, 
    selectedSandboxPlanet, 
    kundliData, 
    canvasSize,
    project3DTo2D
  ]);

  // Drag interaction handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    previousMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - previousMouse.current.x;
    const deltaY = e.clientY - previousMouse.current.y;
    
    setRotY((prev) => prev + deltaX * 0.007);
    setRotX((prev) => Math.max(-Math.PI / 2, Math.min(Math.PI / 2, prev + deltaY * 0.007)));
    
    previousMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUpOrLeave = () => {
    isDragging.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    setZoom((prev) => Math.max(2.0, Math.min(25.0, prev + e.deltaY * 0.005)));
  };

  return (
    <div ref={containerRef} className="relative w-full h-[400px] md:h-[500px] rounded-xl overflow-hidden border border-white/10 bg-slate-950/80 shadow-2xl">
      
      {/* 3D WebGL Canvas Rendering */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onWheel={handleWheel}
        className="w-full h-full block cursor-grab active:cursor-grabbing"
      />

      {/* Responsive SVG HTML Crisp Labels Overlay */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none select-none">
        {labels.map((lbl, idx) => {
          // Prevent drawing labels out of viewport bounds or behind camera clipping
          if (lbl.x < 10 || lbl.x > canvasSize.width - 10 || lbl.y < 10 || lbl.y > canvasSize.height - 10) return null;
          
          if (lbl.type === "planet") {
            const isSelected = lbl.name === selectedSandboxPlanet;
            return (
              <g key={idx}>
                <circle 
                  cx={lbl.x} 
                  cy={lbl.y} 
                  r={isSelected ? 6 : 4} 
                  className={`${isSelected ? "stroke-red-500 animate-ping" : ""} fill-none stroke-2`}
                  stroke={lbl.color}
                />
                <text
                  x={lbl.x + 8}
                  y={lbl.y + 4}
                  fill={lbl.color}
                  className="font-mono text-xs font-semibold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                >
                  {lbl.name}
                </text>
              </g>
            );
          } else if (lbl.type === "zodiac") {
            return (
              <text
                key={idx}
                x={lbl.x}
                y={lbl.y}
                fill={lbl.color}
                textAnchor="middle"
                className="font-serif text-[10px] italic font-semibold opacity-60 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
              >
                {lbl.name}
              </text>
            );
          } else {
            // Origin (Center node)
            return (
              <text
                key={idx}
                x={lbl.x + 10}
                y={lbl.y - 6}
                fill={lbl.color}
                className="font-mono text-[10px] font-bold tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
              >
                [{lbl.name}]
              </text>
            );
          }
        })}
      </svg>

      {/* Drag & Zoom Hint Overlay */}
      <div className="absolute bottom-4 left-4 pointer-events-none select-none font-mono text-[10px] text-white/40 bg-black/40 px-2 py-1 rounded border border-white/5 backdrop-blur-sm">
        Drag: Rotate view | Scroll: Zoom
      </div>
    </div>
  );
}
