import React, { useState } from 'react';
import { Play, Pause, RotateCcw, Mountain, Droplets, CloudRain, Sun, Snowflake, AlertCircle, ArrowUpRight, ShieldAlert, Check, Layers, Cpu, Compass, Rotate3d } from 'lucide-react';
import { SiteConditions, EquipmentRecommendation } from '../types';
import { Simulation3D } from './Simulation3D';

interface TerrainSimulationSVGProps {
  site: SiteConditions;
  setSite: React.Dispatch<React.SetStateAction<SiteConditions>>;
  topChoice?: EquipmentRecommendation;
}

export const TerrainSimulationSVG: React.FC<TerrainSimulationSVGProps> = ({
  site,
  setSite,
  topChoice
}) => {
  const [activeViewMode, setActiveViewMode] = useState<'profile' | 'cad_stability' | '3d_simulation'>('3d_simulation');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [operationalStage, setOperationalStage] = useState<number>(3); // 1: Setup, 2: Priming, 3: Pumping, 4: Washdown
  const [hasBaffles, setHasBaffles] = useState<boolean>(true);
  const [hasLowComChassis, setHasLowComChassis] = useState<boolean>(true);

  // Calculations for profile SVG geometry
  const slope = site.slope_degrees;
  const groundStartY = 280;
  const elevationRiseSvg = Math.tan((slope * Math.PI) / 180) * 320;
  const clampedRiseSvg = Math.max(-100, Math.min(180, elevationRiseSvg));
  
  const eqX = 140;
  const eqY = groundStartY;
  
  const pitX = 640;
  const pitY = groundStartY - clampedRiseSvg;

  const hosePath = `M ${eqX + 40} ${eqY - 20} C ${eqX + 180} ${eqY - 10}, ${pitX - 180} ${pitY + 20}, ${pitX + 25} ${pitY + 30}`;

  const stages = [
    { num: 1, name: 'Deployment & Anchor', desc: 'Secure wheel chocks, deadman anchor, setup spill trays' },
    { num: 2, name: 'Gas Test & Priming', desc: '4-gas headspace check, water injection & vacuum seal' },
    { num: 3, name: 'Sludge Extraction', desc: 'Masticating suction, high dynamic head pumping' },
    { num: 4, name: 'Purge & Washdown', desc: 'Hose compressed air purge, 0.5% bleach decontamination' },
  ];

  // Slosh dynamics metrics for CAD stability view
  const criticalRolloverAngle = hasBaffles && hasLowComChassis ? 34.2 : 21.8;
  const safeRatedThreshold = 28.0;
  const isOperatingSafe = slope <= safeRatedThreshold && hasBaffles && hasLowComChassis;

  return (
    <div className="space-y-6">
      {/* Simulation Header and Mode Switcher */}
      <div className="bg-slate-850 rounded-xl border border-slate-800 p-5 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-700/50 px-2 py-0.5 rounded">
                Multi-Physics Simulation
              </span>
              <span className="text-xs text-slate-400 font-mono">Mountain Slope: {site.slope_degrees}°</span>
            </div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2 mt-1">
              <Mountain className="w-5 h-5 text-emerald-400" />
              <span>Terrain Stability &amp; Rollover Prevention Analysis</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Kinematic slope analysis on 20°–30° inclines, free-surface liquid sludge surge, and anti-slosh baffle verification
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setActiveViewMode('3d_simulation')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition ${
                activeViewMode === '3d_simulation'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Rotate3d className="w-3.5 h-3.5" />
              <span>Interactive 3D Simulation</span>
            </button>
            <button
              onClick={() => setActiveViewMode('cad_stability')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeViewMode === 'cad_stability'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              CAD 28° Slope &amp; Anti-Slosh View
            </button>
            <button
              onClick={() => setActiveViewMode('profile')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeViewMode === 'profile'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Field Elevation &amp; Hose Hydraulic Profile
            </button>
          </div>
        </div>

        {/* View Specific Controls */}
        {activeViewMode === 'cad_stability' && (
          <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center space-x-2 cursor-pointer bg-slate-900 px-3 py-1.5 rounded border border-slate-700">
                <input
                  type="checkbox"
                  checked={hasBaffles}
                  onChange={(e) => setHasBaffles(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-0"
                />
                <span className="text-slate-200 font-medium">Dual Longitudinal Anti-Slosh Baffles</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer bg-slate-900 px-3 py-1.5 rounded border border-slate-700">
                <input
                  type="checkbox"
                  checked={hasLowComChassis}
                  onChange={(e) => setHasLowComChassis(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-0"
                />
                <span className="text-slate-200 font-medium">Under-Chassis Low CoM Battery Placement</span>
              </label>
            </div>

            <div className="flex items-center space-x-2 font-mono">
              <span className="text-slate-400">Sludge Payload:</span>
              <span className="text-emerald-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                400L Liquid Slurry (~440 kg)
              </span>
            </div>
          </div>
        )}

        {activeViewMode === 'profile' && (
          /* Profile Mode Stepper */
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {stages.map((st) => (
              <button
                key={st.num}
                onClick={() => setOperationalStage(st.num)}
                className={`p-2 rounded-lg border text-left transition-all ${
                  operationalStage === st.num
                    ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>Stage {st.num}</span>
                  {operationalStage === st.num && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </div>
                <div className="text-xs font-medium text-slate-200 mt-0.5 truncate">{st.name}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3D WebGL Canvas or SVG Canvas Area */}
      {activeViewMode === '3d_simulation' ? (
        <Simulation3D site={site} setSite={setSite} topChoice={topChoice} />
      ) : (
        <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 shadow-2xl relative overflow-hidden">
          {activeViewMode === 'cad_stability' ? (
          /* =========================================================================
             CAD MODEL VIEW: 28° TILTED GRID + SIDE-VIEW & REAR-VIEW WITH COM CROSSHAIR
             ========================================================================= */
          <div className="space-y-4">
            {/* Slide Header & Key Metrics Overlay */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-xl backdrop-blur">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Engineering CAD Verification Slide
                </span>
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Terrain Stability &amp; Rollover Prevention Analysis
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  Analysis of 400L liquid sludge dynamic surge on 28° mountain ramp (Shimla / Mussoorie)
                </p>
              </div>

              {/* Key Metric Banner */}
              <div className="bg-slate-950 border border-emerald-600/50 rounded-lg p-3 text-right font-mono">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Key Metric</div>
                <div className="text-sm font-black text-emerald-300">
                  Critical Rollover Angle: {criticalRolloverAngle.toFixed(1)}°
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5">
                  Operating threshold safely rated at 28.0° with full 400L sludge payload
                </div>
              </div>
            </div>

            {/* Design Feature Highlight Callout */}
            <div className="bg-gradient-to-r from-emerald-950/60 to-slate-900 border-l-4 border-emerald-500 p-3 rounded-r-lg text-xs flex items-center justify-between">
              <div>
                <span className="font-bold text-emerald-300">Design Feature Highlight: </span>
                <span className="text-slate-200">
                  "Low Center-of-Gravity achieved by under-chassis battery placement + dual longitudinal anti-slosh baffles inside the holding tank."
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ml-2 whitespace-nowrap ${
                hasBaffles ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-rose-950 text-rose-300 border border-rose-700 animate-pulse'
              }`}>
                {hasBaffles ? 'ANTI-SLOSH ACTIVE' : 'UNBAFFLED SURGE HAZARD'}
              </span>
            </div>

            {/* Dual CAD Viewport (Side View + Rear View) on 28° Tilted Grid */}
            <svg
              viewBox="0 0 880 440"
              className="w-full h-auto max-h-[520px] select-none rounded-lg bg-[#070b12]"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* 28° Tilted CAD Coordinate Grid Pattern */}
                <pattern id="cadGrid28" width="25" height="25" patternUnits="userSpaceOnUse" patternTransform="rotate(-28)">
                  <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#172554" strokeWidth="0.6" strokeDasharray="1,3" />
                </pattern>

                {/* Sludge liquid gradient */}
                <linearGradient id="sludgeLiquidGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a16207" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#713f12" stopOpacity="0.95" />
                </linearGradient>

                {/* Battery heavy mass gradient */}
                <linearGradient id="batteryGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#1e3a8a" />
                  <stop offset="100%" stopColor="#172554" />
                </linearGradient>
              </defs>

              {/* Tilted CAD Grid Background */}
              <rect width="880" height="440" fill="url(#cadGrid28)" />

              {/* Ramp Ground Incline Plane at exactly 28° */}
              <g transform="translate(0, 0)">
                {/* Road surface inclined at 28 degrees */}
                <path
                  d="M 20 400 L 860 400 L 860 435 L 20 435 Z"
                  fill="#0f172a"
                  stroke="#334155"
                  strokeWidth="1.5"
                  transform="rotate(-28, 440, 360)"
                />
              </g>

              {/* =========================================================
                  CAD VIEWPORT 1: SIDE VIEW (LONGITUDINAL PITCH STABILITY)
                  ========================================================= */}
              <g transform="translate(220, 260) rotate(-28)">
                {/* Viewport Label */}
                <text x="-90" y="-140" fill="#94a3b8" fontSize="11" fontWeight="bold" fontFamily="monospace">
                  VIEWPORT 1: SIDE PROFILE (28° INCLINE)
                </text>
                <text x="-90" y="-126" fill="#64748b" fontSize="9" fontFamily="monospace">
                  Longitudinal Surge &amp; Pitch-Back Prevention
                </text>

                {/* 28° Ramp baseline indicator line */}
                <line x1="-140" y1="35" x2="140" y2="35" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4,4" />
                <text x="80" y="50" fill="#38bdf8" fontSize="9" fontFamily="monospace">Ramp: 28.0°</text>

                {/* Front and Rear Wheels / Running Gear */}
                {/* Rear wheels (downslope on right) */}
                <circle cx="70" cy="20" r="15" fill="#0f172a" stroke="#64748b" strokeWidth="3" />
                <circle cx="70" cy="20" r="5" fill="#38bdf8" />
                {/* Front wheels (upslope on left) */}
                <circle cx="-70" cy="20" r="15" fill="#0f172a" stroke="#64748b" strokeWidth="3" />
                <circle cx="-70" cy="20" r="5" fill="#38bdf8" />

                {/* Low-slung structural chassis frame */}
                <rect x="-85" y="-5" width="170" height="12" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="2" />

                {/* UNDER-CHASSIS BATTERY PLACEMENT (Feature Highlight) */}
                {hasLowComChassis ? (
                  <g>
                    <rect x="-40" y="7" width="80" height="14" rx="2" fill="url(#batteryGrad)" stroke="#38bdf8" strokeWidth="1.5" />
                    <text x="-32" y="17" fill="#93c5fd" fontSize="7" fontWeight="bold" fontFamily="monospace">
                      UNDER-CHASSIS BATTERY (Low CoM)
                    </text>
                  </g>
                ) : (
                  <g>
                    {/* Top mounted heavy battery (Causes High CoM) */}
                    <rect x="-20" y="-105" width="40" height="16" fill="#dc2626" stroke="#fca5a5" strokeWidth="1.5" />
                    <text x="-16" y="-94" fill="#fff" fontSize="6" fontFamily="monospace">TOP BATTERY</text>
                  </g>
                )}

                {/* 400L Holding Tank Shell (L=1.2m scale, H=0.5m scale) */}
                <rect x="-75" y="-75" width="150" height="68" rx="8" fill="#0f172a" stroke="#10b981" strokeWidth="2" />
                <text x="-65" y="-60" fill="#10b981" fontSize="9" fontWeight="bold" fontFamily="monospace">
                  400L TANK (L=1.2m)
                </text>

                {/* INTERNAL ANTI-SLOSH BAFFLES CUTAWAY */}
                {hasBaffles ? (
                  <g>
                    {/* Baffle Plate 1 (Transverse / Longitudinal divider) */}
                    <line x1="-25" y1="-75" x2="-25" y2="-10" stroke="#f59e0b" strokeWidth="3" />
                    {/* Baffle Plate 2 */}
                    <line x1="25" y1="-75" x2="25" y2="-10" stroke="#f59e0b" strokeWidth="3" />
                    
                    {/* Slosh Fluid segmented into 3 stable compartments */}
                    <rect x="-73" y="-50" width="46" height="42" fill="url(#sludgeLiquidGrad)" opacity="0.8" />
                    <rect x="-23" y="-50" width="46" height="42" fill="url(#sludgeLiquidGrad)" opacity="0.8" />
                    <rect x="27" y="-50" width="46" height="42" fill="url(#sludgeLiquidGrad)" opacity="0.8" />

                    {/* Baffle annotations */}
                    <text x="-30" y="-80" fill="#f59e0b" fontSize="8" fontWeight="bold" fontFamily="monospace">
                      BAFFLE 1
                    </text>
                    <text x="20" y="-80" fill="#f59e0b" fontSize="8" fontWeight="bold" fontFamily="monospace">
                      BAFFLE 2
                    </text>
                  </g>
                ) : (
                  /* UNBAFFLED SLOSH SURGE: Liquid surges to rear compartment pulling vehicle backwards! */
                  <g>
                    {/* Free-surface liquid tilts severely toward rear */}
                    <path
                      d="M -73 -20 L 73 -68 L 73 -8 L -73 -8 Z"
                      fill="#ef4444"
                      opacity="0.85"
                    />
                    <text x="-40" y="-30" fill="#fee2e2" fontSize="9" fontWeight="bold" fontFamily="monospace">
                      SEVERE LIQUID SURGE (Rearward)
                    </text>
                    {/* Surge arrow */}
                    <line x1="-20" y1="-35" x2="40" y2="-55" stroke="#fff" strokeWidth="2.5" />
                    <polygon points="40,-55 30,-58 35,-48" fill="#fff" />
                  </g>
                )}

                {/* CENTER OF MASS (CoM) CROSSHAIR */}
                {/* Stabilized Position with Baffles + Low Chassis */}
                {hasBaffles && hasLowComChassis ? (
                  <g transform="translate(4, -18)">
                    {/* Green Crosshair */}
                    <circle cx="0" cy="0" r="10" fill="none" stroke="#22c55e" strokeWidth="2" />
                    <line x1="-14" y1="0" x2="14" y2="0" stroke="#22c55e" strokeWidth="2" />
                    <line x1="0" y1="-14" x2="0" y2="14" stroke="#22c55e" strokeWidth="2" />
                    {/* Fill quadrants */}
                    <path d="M 0 0 L 10 0 A 10 10 0 0 1 0 10 Z" fill="#22c55e" />
                    <path d="M 0 0 L -10 0 A 10 10 0 0 1 0 -10 Z" fill="#22c55e" />
                    <text x="16" y="4" fill="#22c55e" fontSize="9" fontWeight="bold" fontFamily="monospace">
                      CoM (Low &amp; Stabilized: hcg=0.42m)
                    </text>
                  </g>
                ) : (
                  /* Hazardous Rearward-Shifted CoM without Baffles */
                  <g transform="translate(38, -48)">
                    {/* Red Crosshair shifted rearward and upward */}
                    <circle cx="0" cy="0" r="10" fill="none" stroke="#ef4444" strokeWidth="2.5" />
                    <line x1="-14" y1="0" x2="14" y2="0" stroke="#ef4444" strokeWidth="2.5" />
                    <line x1="0" y1="-14" x2="0" y2="14" stroke="#ef4444" strokeWidth="2.5" />
                    <path d="M 0 0 L 10 0 A 10 10 0 0 1 0 10 Z" fill="#ef4444" />
                    <path d="M 0 0 L -10 0 A 10 10 0 0 1 0 -10 Z" fill="#ef4444" />
                    <text x="16" y="4" fill="#ef4444" fontSize="9" fontWeight="bold" fontFamily="monospace">
                      CoM (Shifted Rearward Δx=11.8cm!)
                    </text>
                  </g>
                )}
              </g>

              {/* =========================================================
                  CAD VIEWPORT 2: REAR VIEW (LATERAL ROLLOVER STABILITY)
                  ========================================================= */}
              <g transform="translate(680, 260) rotate(-28)">
                {/* Viewport Label */}
                <text x="-80" y="-140" fill="#94a3b8" fontSize="11" fontWeight="bold" fontFamily="monospace">
                  VIEWPORT 2: REAR VIEW (TRANSVERSE)
                </text>
                <text x="-80" y="-126" fill="#64748b" fontSize="9" fontFamily="monospace">
                  Lateral Rollover &amp; Baffle Chambering
                </text>

                {/* Transverse track plane */}
                <line x1="-80" y1="35" x2="80" y2="35" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4,4" />

                {/* Left & Right Wheels (Track Width w = 0.85m) */}
                <circle cx="-50" cy="20" r="15" fill="#0f172a" stroke="#64748b" strokeWidth="3" />
                <circle cx="50" cy="20" r="15" fill="#0f172a" stroke="#64748b" strokeWidth="3" />

                {/* Under-chassis frame */}
                <rect x="-60" y="-5" width="120" height="12" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="2" />

                {/* Under-chassis battery */}
                {hasLowComChassis && (
                  <rect x="-35" y="7" width="70" height="14" rx="2" fill="url(#batteryGrad)" stroke="#38bdf8" strokeWidth="1.5" />
                )}

                {/* Cylindrical / Rectangular Tank Body Rear Cross-Section */}
                <rect x="-48" y="-75" width="96" height="68" rx="8" fill="#0f172a" stroke="#10b981" strokeWidth="2" />

                {/* Dual Longitudinal Baffles (visible in rear cutaway) */}
                {hasBaffles ? (
                  <g>
                    {/* Longitudinal dividing baffle wall 1 */}
                    <line x1="-16" y1="-75" x2="-16" y2="-10" stroke="#f59e0b" strokeWidth="2.5" />
                    {/* Longitudinal dividing baffle wall 2 */}
                    <line x1="16" y1="-75" x2="16" y2="-10" stroke="#f59e0b" strokeWidth="2.5" />
                    
                    {/* Liquid chamber levels */}
                    <rect x="-46" y="-52" width="28" height="44" fill="url(#sludgeLiquidGrad)" opacity="0.8" />
                    <rect x="-14" y="-52" width="28" height="44" fill="url(#sludgeLiquidGrad)" opacity="0.8" />
                    <rect x="18" y="-52" width="28" height="44" fill="url(#sludgeLiquidGrad)" opacity="0.8" />
                  </g>
                ) : (
                  <rect x="-46" y="-52" width="92" height="44" fill="#ef4444" opacity="0.85" />
                )}

                {/* Center of Mass Crosshair in Rear View */}
                {hasBaffles && hasLowComChassis ? (
                  <g transform="translate(0, -18)">
                    <circle cx="0" cy="0" r="9" fill="none" stroke="#22c55e" strokeWidth="2" />
                    <line x1="-12" y1="0" x2="12" y2="0" stroke="#22c55e" strokeWidth="2" />
                    <line x1="0" y1="-12" x2="0" y2="12" stroke="#22c55e" strokeWidth="2" />
                    <path d="M 0 0 L 9 0 A 9 9 0 0 1 0 9 Z" fill="#22c55e" />
                    <path d="M 0 0 L -9 0 A 9 9 0 0 1 0 -9 Z" fill="#22c55e" />
                  </g>
                ) : (
                  <g transform="translate(0, -48)">
                    <circle cx="0" cy="0" r="9" fill="none" stroke="#ef4444" strokeWidth="2" />
                    <line x1="-12" y1="0" x2="12" y2="0" stroke="#ef4444" strokeWidth="2" />
                    <line x1="0" y1="-12" x2="0" y2="12" stroke="#ef4444" strokeWidth="2" />
                    <path d="M 0 0 L 9 0 A 9 9 0 0 1 0 9 Z" fill="#ef4444" />
                    <path d="M 0 0 L -9 0 A 9 9 0 0 1 0 -9 Z" fill="#ef4444" />
                  </g>
                )}

                {/* Rollover limit vector */}
                <line x1="0" y1="-18" x2="42" y2="35" stroke="#eab308" strokeWidth="1.5" strokeDasharray="3,3" />
                <text x="18" y="25" fill="#eab308" fontSize="8" fontFamily="monospace">θcrit: 34.2°</text>
              </g>

              {/* Status footer bar inside SVG */}
              <g transform="translate(20, 405)">
                <rect x="0" y="0" width="840" height="25" rx="4" fill="#0f172a" stroke="#1e293b" />
                <text x="20" y="16" fill="#94a3b8" fontSize="10" fontFamily="monospace">
                  FREE-SURFACE MOMENT OF INERTIA: {hasBaffles ? 'REDUCED BY 88.9% (I_baffled = I_0 / 9)' : 'UNCONTROLLED (I_0 = W·L³/12)'}
                </text>
                <text x="560" y="16" fill={isOperatingSafe ? '#22c55e' : '#ef4444'} fontSize="10" fontWeight="bold" fontFamily="monospace">
                  STATUS: {isOperatingSafe ? 'VERIFIED STABLE ON 28° INCLINE' : 'CRITICAL ROLLOVER DANGER'}
                </text>
              </g>
            </svg>

            {/* Technical Stability Explanation Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                <span className="text-slate-400 block text-[10px] uppercase">The Sloshing Liquid Danger</span>
                <span className="text-slate-200 font-sans block mt-1">
                  When climbing 20°–30° slopes in mountain towns (Shimla, Mussoorie), 400L sludge surges to the rear, shifting CoM backward and flipping standard vehicles.
                </span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                <span className="text-slate-400 block text-[10px] uppercase">Anti-Slosh Baffle Mechanics</span>
                <span className="text-emerald-400 font-bold text-sm block mt-0.5">88.9% Surge Suppression</span>
                <span className="text-slate-400 text-[11px] block mt-0.5">
                  Dual longitudinal and transverse dividing plates break the free-surface moment ($I_0 / 9$), limiting longitudinal CoM displacement to 1.3 cm.
                </span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                <span className="text-slate-400 block text-[10px] uppercase">Under-Chassis Battery CoM</span>
                <span className="text-cyan-400 font-bold text-sm block mt-0.5">hcg = 0.42 m (Low-Slung)</span>
                <span className="text-slate-400 text-[11px] block mt-0.5">
                  Heavy battery pack positioned below axle line pulls total vehicle CoM down, securing a 34.2° critical tip limit.
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* =========================================================================
             FIELD PROFILE VIEW (HYDRAULICS, ELEVATION HEAD & WEATHER OVERLAY)
             ========================================================================= */
          <div className="space-y-3">
            {/* Environment Badge */}
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              <span className="bg-slate-900/90 backdrop-blur border border-slate-700 px-2.5 py-1 rounded text-slate-300 flex items-center space-x-1">
                <Mountain className="w-3.5 h-3.5 text-emerald-400" />
                <span>Terrain: {site.terrain_type} ({site.slope_degrees}°)</span>
              </span>
              <span className="bg-slate-900/90 backdrop-blur border border-slate-700 px-2.5 py-1 rounded text-slate-300 flex items-center space-x-1">
                {site.climate_zone === 'cold_freezing' && <Snowflake className="w-3.5 h-3.5 text-cyan-400" />}
                {site.climate_zone === 'monsoon_heavy' && <CloudRain className="w-3.5 h-3.5 text-blue-400" />}
                {site.climate_zone === 'hot_arid' && <Sun className="w-3.5 h-3.5 text-amber-400" />}
                {site.climate_zone !== 'cold_freezing' && site.climate_zone !== 'monsoon_heavy' && site.climate_zone !== 'hot_arid' && (
                  <Droplets className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>{site.temperature_c}°C · {site.rainfall_mm_h} mm/h</span>
              </span>
              {topChoice && (
                <span className="bg-emerald-950/80 backdrop-blur border border-emerald-600/50 px-2.5 py-1 rounded text-emerald-300 font-semibold flex items-center space-x-1">
                  <span>Model: {topChoice.equipment.name}</span>
                </span>
              )}
            </div>

            {/* Dynamic SVG Diagram */}
            <svg
              viewBox="0 0 800 420"
              className="w-full h-auto max-h-[500px] select-none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#090d16" />
                  <stop offset="100%" stopColor="#111827" />
                </linearGradient>

                <linearGradient id="groundGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="50%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#020617" />
                </linearGradient>

                <linearGradient id="sludgeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#854d0e" />
                  <stop offset="50%" stopColor="#713f12" />
                  <stop offset="100%" stopColor="#451a03" />
                </linearGradient>

                <linearGradient id="crustGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3f2e1a" />
                  <stop offset="50%" stopColor="#543d22" />
                  <stop offset="100%" stopColor="#3f2e1a" />
                </linearGradient>
              </defs>

              {/* Background Sky */}
              <rect width="800" height="420" fill="url(#skyGrad)" />

              {/* Weather Particles */}
              {site.rainfall_mm_h > 0 && isPlaying && (
                <g className="animate-pulse opacity-70">
                  {Array.from({ length: Math.min(30, Math.floor(site.rainfall_mm_h * 1.5)) }).map((_, i) => (
                    <line
                      key={i}
                      x1={(i * 35) % 800}
                      y1={(i * 19) % 250}
                      x2={((i * 35) % 800) - 8}
                      y2={((i * 19) % 250) + 16}
                      stroke="#38bdf8"
                      strokeWidth="1.2"
                      strokeDasharray="2,2"
                    />
                  ))}
                </g>
              )}

              {site.climate_zone === 'cold_freezing' && (
                <g opacity="0.4">
                  {Array.from({ length: 15 }).map((_, i) => (
                    <circle
                      key={i}
                      cx={(i * 54) % 800}
                      cy={(i * 27) % 220}
                      r="1.8"
                      fill="#e0f2fe"
                    />
                  ))}
                </g>
              )}

              {/* Ground Terrain */}
              <path
                d={`M 0 ${groundStartY} 
                   L ${eqX - 30} ${groundStartY} 
                   L ${eqX + 70} ${groundStartY} 
                   L ${pitX - 50} ${pitY} 
                   L ${pitX + 110} ${pitY} 
                   L 800 ${pitY + 10} 
                   L 800 420 
                   L 0 420 Z`}
                fill="url(#groundGrad)"
                stroke="#334155"
                strokeWidth="2"
              />

              {/* Road / Trail surface layer */}
              <path
                d={`M 0 ${groundStartY} L ${eqX + 70} ${groundStartY} L ${pitX - 50} ${pitY} L ${pitX + 110} ${pitY}`}
                stroke={
                  site.road_surface === 'paved' ? '#64748b' :
                  site.road_surface === 'mud' ? '#78350f' :
                  site.road_surface === 'rough_trail' ? '#b45309' : '#94a3b8'
                }
                strokeWidth="5"
                strokeDasharray={site.road_surface === 'rough_trail' ? '6,4' : undefined}
                fill="none"
              />

              {/* Equipment Station */}
              <g transform={`translate(${eqX - 30}, ${eqY - 65})`}>
                <rect x="0" y="20" width="75" height="40" rx="4" fill="#1e293b" stroke="#10b981" strokeWidth="1.5" />
                <rect x="5" y="25" width="48" height="25" rx="3" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                <text x="12" y="42" fill="#38bdf8" fontSize="8" fontWeight="bold" fontFamily="monospace">VAC-UNIT</text>
                <circle cx="15" cy="62" r="7" fill="#0f172a" stroke="#64748b" strokeWidth="2" />
                <circle cx="60" cy="62" r="7" fill="#0f172a" stroke="#64748b" strokeWidth="2" />
                {slope > 15 && (
                  <g>
                    <line x1="5" y1="35" x2="-25" y2="60" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2,2" />
                    <polygon points="-25,60 -30,68 -20,68" fill="#f59e0b" />
                    <text x="-40" y="55" fill="#f59e0b" fontSize="8" fontFamily="monospace">Winch Anchor</text>
                  </g>
                )}
              </g>

              {/* Containment Pit */}
              <g transform={`translate(${pitX}, ${pitY})`}>
                <rect x="0" y="0" width="90" height="95" rx="2" fill="#090d16" stroke="#475569" strokeWidth="2" />
                <rect x="-8" y="-4" width="106" height="6" rx="1" fill="#64748b" />
                <rect x="18" y="-4" width="30" height="6" fill="#10b981" opacity="0.6" />
                <rect x="2" y="2" width="86" height="24" fill="#450a0a" opacity="0.3" />
                <text x="6" y="16" fill="#f87171" fontSize="7" fontFamily="monospace">Headspace H₂S/CH₄</text>
                <rect x="2" y="26" width="86" height="12" fill="url(#crustGrad)" />
                <rect x="2" y="38" width="86" height="55" fill="url(#sludgeGrad)" />
                <text x="6" y="65" fill="#fed7aa" fontSize="8" fontWeight="bold" fontFamily="monospace">
                  {site.containment_volume_liters.toFixed(0)}L
                </text>
                <line x1="28" y1="-8" x2="28" y2="82" stroke="#38bdf8" strokeWidth="4" />
                <polygon points="24,82 32,82 28,88" fill="#10b981" />
              </g>

              {/* Hose line */}
              <path
                d={hosePath}
                fill="none"
                stroke="#0284c7"
                strokeWidth="5"
                strokeLinecap="round"
              />

              {isPlaying && operationalStage === 3 && (
                <path
                  d={hosePath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeDasharray="6,12"
                  className="animate-[dash_1s_linear_infinite]"
                  style={{ strokeDashoffset: '24' }}
                />
              )}
            </svg>
          </div>
        )}
      </div>
      )}

      {/* Quick Parameter Sliders below Simulation */}
      {activeViewMode !== '3d_simulation' && (
      <div className="bg-slate-850 rounded-xl border border-slate-800 p-5 shadow-md">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center space-x-2">
          <span>Live Terrain Incline &amp; Sludge Parameters</span>
          <span className="text-[10px] text-emerald-400 font-mono">(Directly tests 20°–30° mountain alley ramps)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-xs">
          {/* Slope Slider */}
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Terrain Incline Slope:</span>
              <span className={`font-mono font-bold ${site.slope_degrees > 28 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {site.slope_degrees}° {site.slope_degrees >= 20 && '(Steep Alley)'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              step="1"
              value={site.slope_degrees}
              onChange={(e) => setSite((prev) => ({ ...prev, slope_degrees: parseFloat(e.target.value) }))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>0° (Flat)</span>
              <span className="text-emerald-400 font-bold">28° (Rated Threshold)</span>
              <span className="text-rose-400 font-bold">34.2° (Critical Tip)</span>
            </div>
          </div>

          {/* Access Width Slider */}
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Access Road Width:</span>
              <span className="font-mono text-emerald-400 font-bold">{site.access_width_m} m</span>
            </div>
            <input
              type="range"
              min="0.6"
              max="4.0"
              step="0.1"
              value={site.access_width_m}
              onChange={(e) => setSite((prev) => ({ ...prev, access_width_m: parseFloat(e.target.value) }))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>0.6m (Alley)</span>
              <span>1.3m (Mountain)</span>
              <span>4.0m (Highway)</span>
            </div>
          </div>

          {/* Containment Volume Slider */}
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Containment Volume:</span>
              <span className="font-mono text-emerald-400 font-bold">{site.containment_volume_liters} L</span>
            </div>
            <input
              type="range"
              min="400"
              max="10000"
              step="200"
              value={site.containment_volume_liters}
              onChange={(e) => setSite((prev) => ({ ...prev, containment_volume_liters: parseFloat(e.target.value) }))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>400L (Baseline)</span>
              <span>3000L</span>
              <span>10000L</span>
            </div>
          </div>

          {/* Temperature Slider */}
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Temperature:</span>
              <span className="font-mono text-emerald-400 font-bold">{site.temperature_c}°C</span>
            </div>
            <input
              type="range"
              min="-15"
              max="50"
              step="1"
              value={site.temperature_c}
              onChange={(e) => setSite((prev) => ({ ...prev, temperature_c: parseFloat(e.target.value) }))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>-15°C (Freezing)</span>
              <span>20°C (Mild)</span>
              <span>50°C (Arid)</span>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
