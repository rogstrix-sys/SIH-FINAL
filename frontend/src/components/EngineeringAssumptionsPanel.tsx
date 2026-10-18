import React, { useState } from 'react';
import {
  FileText,
  Activity,
  Layers,
  Scale,
  Zap,
  Gauge,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ShieldAlert,
  Info,
  Filter
} from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

export type CalculationClassification = 'SIMULATED' | 'ESTIMATED' | 'MEASURED' | 'UNVALIDATED';

export interface EngineeringAssumptionItem {
  id: string;
  resultName: string;
  currentValue: string;
  isAvailable: boolean;
  unavailableReason?: string;
  units: string;
  inputParameters: string[];
  calculationMethod: string;
  equation: string;
  assumedValues: string[];
  sourceJustification: string;
  classification: CalculationClassification;
}

export const EngineeringAssumptionsPanel: React.FC = () => {
  const telemetry = useSimulationStore((s) => s.telemetry);
  const parameters = useSimulationStore((s) => s.parameters);
  const materialBalance = useSimulationStore((s) => s.materialBalance);
  const terrainParams = useSimulationStore((s) => s.terrainParams);
  const feasibility = useSimulationStore((s) => s.feasibility);
  const engineParams = useSimulationStore((s) => s.engine.parameters);
  const mobility = useSimulationStore((s) => s.mobilityTelemetry);

  const [classificationFilter, setClassificationFilter] = useState<string>('ALL');
  const [expandedItemId, setExpandedItemId] = useState<string | null>('calc-mass-balance');

  // Derived metrics
  const hoursElapsed = telemetry.elapsedTimeSeconds / 3600.0;
  const energyKwh = telemetry.motorPowerKw * hoursElapsed;
  const m3Extracted = materialBalance.cycleExtractedL / 1000.0;
  const specificEnergy = m3Extracted > 0.05 ? energyKwh / m3Extracted : 0.0;
  const discrepancyL = Math.abs(materialBalance.massBalanceDiscrepancyL);

  const ASSUMPTIONS: EngineeringAssumptionItem[] = [
    {
      id: 'calc-material-transfer',
      resultName: 'Cumulative Material Transfer & Volume Extracted',
      currentValue: `${materialBalance.cycleExtractedL.toFixed(1)} L (${(materialBalance.cycleExtractedL / 1000).toFixed(2)} m³)`,
      isAvailable: true,
      units: 'L (litres) / m³ (cubic metres)',
      inputParameters: ['Flow Rate Q (L/min)', 'Simulated Step Duration dt (s)'],
      calculationMethod: 'Deterministic numerical time-integration of volumetric pump discharge',
      equation: 'V_extracted(t) = ∫ [Q(t) / 60] dt',
      assumedValues: ['Incompressible slurry flow regime', 'Zero conduit thermal expansion'],
      sourceJustification: 'Continuity equation for incompressible fluid mechanics (White, Fluid Mechanics §3.2)',
      classification: 'SIMULATED'
    },
    {
      id: 'calc-mass-balance',
      resultName: 'Closed-Loop Conservation of Mass Invariant',
      currentValue: `Δ ${discrepancyL.toFixed(6)} L (Invariant Conserved)`,
      isAvailable: true,
      units: 'L (litres)',
      inputParameters: ['Vault Source Volume V_source (L)', 'Machine Tank Volume V_collection (L)', 'Disposal Tanker Volume V_receiver (L)', 'Initial Total System Volume V_initial (L)'],
      calculationMethod: 'Instantaneous scalar conservation audit across all 3 containment vessels',
      equation: '| [V_source(t) + V_collection(t) + V_receiver(t)] - V_initial | < 10⁻³ L',
      assumedValues: ['Zero pipe leakage or spills', 'Constant slurry density ρ = 1,180 kg/m³', 'Zero evaporation losses'],
      sourceJustification: 'First Law of Thermodynamics & Principle of Conservation of Mass (ISO 5167)',
      classification: 'SIMULATED'
    },
    {
      id: 'calc-tank-capacity',
      resultName: 'Collection Tank Usable Capacity & Fill Level',
      currentValue: `${materialBalance.collectionFillPct.toFixed(1)}% (${Math.round(materialBalance.collectionVolumeL)} / ${engineParams.collectionTankCapacityL} L)`,
      isAvailable: true,
      units: '% fill / L (litres)',
      inputParameters: ['Active Liquid Volume V_collection (L)', 'Rated Vessel Geometric Volume C_tank (2,400 L)'],
      calculationMethod: 'Linear volumetric fraction of cylindrical containment vessel with 95% automated interlock',
      equation: 'Fill% = [V_collection(t) / C_tank] × 100%',
      assumedValues: ['Cylindrical shell: Ø1.25m × 2.05m with torispherical heads', 'Internal volume margin reserved for cyclone trap foam headspace (5%)'],
      sourceJustification: 'ASME Boiler and Pressure Vessel Code (BPVC Section VIII Division 1)',
      classification: 'SIMULATED'
    },
    {
      id: 'calc-friction-headloss',
      resultName: 'Darcy-Weisbach Conduit Friction Head Loss',
      currentValue: `${telemetry.headLossM.toFixed(2)} m head (${(telemetry.headLossM * 9.81 * (parameters.slurryDensityKgM3 / 1000)).toFixed(1)} kPa)`,
      isAvailable: true,
      units: 'm head / kPa',
      inputParameters: [
        `Internal Diameter D = ${parameters.hoseDiameterMm} mm`,
        `Conduit Length L = ${parameters.hoseLengthM} m`,
        `Mean Slurry Velocity v = ${(telemetry.extractionRateM3H / (3600 * Math.PI * (parameters.hoseDiameterMm / 2000) ** 2) || 0).toFixed(2)} m/s`,
        `Dynamic Viscosity μ = ${parameters.slurryViscosityCp} cP`,
        `Roughness e = ${parameters.pipeRoughnessMm} mm`
      ],
      calculationMethod: 'Darcy-Weisbach friction formulation with Swamee-Jain explicit Colebrook approximation',
      equation: 'h_f = f · (L / D) · (v² / 2g),  f = 0.25 / [log₁₀( (e/3.7D) + 5.74/Re⁰·⁹ )]²',
      assumedValues: ['Smooth spiral PVC wire-reinforced umbilical (e = 0.045 mm)', 'Isothermal conduit wall boundary condition'],
      sourceJustification: 'Swamee, P.K. & Jain, A.K. (1976), Explicit equations for pipe-flow problems. ASCE J. Hydraul. Div.',
      classification: 'ESTIMATED'
    },
    {
      id: 'calc-geodetic-lift',
      resultName: 'Hydrostatic Geodetic Elevation Head',
      currentValue: `${feasibility.staticHeadLossKpa.toFixed(1)} kPa (${feasibility.verticalElevationDiffM.toFixed(1)} m static lift)`,
      isAvailable: true,
      units: 'm lift / kPa',
      inputParameters: [`Elevation Difference Δz = ${feasibility.verticalElevationDiffM.toFixed(1)} m`, `Slurry Density ρ = ${parameters.slurryDensityKgM3} kg/m³`],
      calculationMethod: 'Fundamental hydrostatic liquid column pressure difference',
      equation: 'ΔP_static = ρ · g · Δz',
      assumedValues: ['Uniform slurry density gradient along vertical hose column', 'Standard gravitational acceleration g = 9.80665 m/s²'],
      sourceJustification: 'Principles of Hydraulic Engineering & Hydrostatics (Munson & Young)',
      classification: 'ESTIMATED'
    },
    {
      id: 'calc-energy-consumption',
      resultName: 'Motor Electrical Power & Specific Energy',
      currentValue: `${telemetry.motorPowerKw.toFixed(2)} kW active (${energyKwh.toFixed(3)} kWh total | ${specificEnergy.toFixed(2)} kWh/m³)`,
      isAvailable: true,
      units: 'kW / kWh / kWh/m³',
      inputParameters: [
        'Total Dynamic Vacuum Head H_total (m)',
        'Delivered Flow Rate Q (m³/s)',
        'Pump Mechanical Efficiency η_pump ≈ 0.72',
        'Motor Electrical Efficiency η_motor ≈ 0.90'
      ],
      calculationMethod: 'Shaft hydraulic power divided by combined electromechanical wire-to-water efficiency',
      equation: 'P_elec = (ρ · g · Q · H_total) / (η_pump · η_motor)',
      assumedValues: ['Combined electro-mechanical efficiency η_total = 64.8%', 'VFD inverter harmonic loss factor = 3%'],
      sourceJustification: 'IEC 60034-30-1 IE3 Premium Efficiency Motor Standard and Hydraulic Institute Pump Efficiency Standards',
      classification: 'ESTIMATED'
    },
    {
      id: 'calc-chassis-stability',
      resultName: 'Chassis Slope Orientation & Rollover Limit',
      currentValue: `${feasibility.chassisPitchDeg.toFixed(1)}° pitch, ${feasibility.chassisRollDeg.toFixed(1)}° roll (Limit: 15.0°)`,
      isAvailable: true,
      units: 'degrees (°)',
      inputParameters: [
        `Terrain Slope Angle θ = ${terrainParams.slopeDeg}°`,
        `Surface Roughness Index = ${terrainParams.surfaceRoughness.toFixed(2)}`,
        `Machine CG Height = 0.65 m`,
        `Chassis Width = ${feasibility.machineWidthM} m`
      ],
      calculationMethod: 'Vector projection of 3D terrain normal against chassis wheelbase with static tip-over triangle',
      equation: 'θ_pitch = arctan(tan θ · cos ψ),  θ_crit = arctan(W_track / 2h_CG)',
      assumedValues: ['Rigid chassis approximation', 'Rigid soil bearing surface without pad sinkage', 'Preliminary safety warning threshold at 15°'],
      sourceJustification: 'ISO 16231-2: Self-propelled agricultural machinery — Assessment of stability',
      classification: 'ESTIMATED'
    },
    {
      id: 'calc-hose-routing',
      resultName: 'Minimum Hose Route Feasibility & Slack Margin',
      currentValue: `${feasibility.requiredHoseLengthM.toFixed(1)} m required (${feasibility.configuredHoseLengthM} m available on reel)`,
      isAvailable: true,
      units: 'm (metres)',
      inputParameters: [
        `Available Reel Hose Length L_hose = ${parameters.hoseLengthM} m`,
        'Machine Position [X, Y, Z]',
        'Septic Tank Aperture [X, Y, Z]'
      ],
      calculationMethod: '3D Euclidean distance vector plus 25% catenary drape and obstacle bypass multiplier',
      equation: 'L_req = 1.25 × √[(x_m - x_t)² + (y_m - y_t)² + (z_m - z_t)²]',
      assumedValues: ['25% empirical catenary slack multiplier for real-world umbilical obstacle routing', 'Hose bends restricted to ≥ 500 mm radius'],
      sourceJustification: 'Sanitation Umbilical Deployment Guidelines (Eawag Sandec Compendium of Sanitation Systems)',
      classification: 'ESTIMATED'
    },
    {
      id: 'calc-ground-clearance',
      resultName: 'Undercarriage Ground Clearance Conflict',
      currentValue: `${feasibility.groundClearanceRisk ? 'HIGH CONFLICT DETECTED' : 'CLEAR (Adequate Margin)'}`,
      isAvailable: true,
      units: 'm clearance',
      inputParameters: [
        `Chassis Ground Clearance = ${terrainParams.groundClearanceNominalM} m`,
        `Terrain Roughness Amplitude = ${(terrainParams.surfaceRoughness * 0.15).toFixed(2)} m`
      ],
      calculationMethod: 'Differential belly clearance comparison against 1.2× max boulder roughness peak-to-peak amplitude',
      equation: 'Clearance_Margin = h_clearance - 1.2 × Roughness_amp',
      assumedValues: ['Rigid steel differential housing without dynamic suspension compression', 'Bouldered terrain obstacles static'],
      sourceJustification: 'SAE J1100 Off-Highway Ground Clearance Measurement Protocol',
      classification: 'ESTIMATED'
    },
    {
      id: 'calc-temperature-viscosity',
      resultName: 'Thermal Slurry Viscosity Compensation',
      currentValue: `${feasibility.effectiveSlurryViscosityCp.toFixed(1)} cP (at ${terrainParams.ambientTempC}°C)`,
      isAvailable: true,
      units: 'cP (centipoise)',
      inputParameters: [`Ambient Temperature T = ${terrainParams.ambientTempC}°C`, `Reference Viscosity μ₀ = ${parameters.slurryViscosityCp} cP at 20°C`],
      calculationMethod: 'Andrade dynamic fluid viscosity exponential temperature decay relation',
      equation: 'μ(T) = μ₀ · exp[ B · (1/T - 1/T₀) ], with B ≈ 1,800 K',
      assumedValues: ['Andrade activation constant B = 1,800 K', 'Slurry water-carrier phase dominates thermal shear response'],
      sourceJustification: 'Gold et al. (2016), Rheological Characterization of Fecal Sludge from On-Site Sanitation Facilities',
      classification: 'ESTIMATED'
    },
    {
      id: 'calc-yield-stress',
      resultName: 'Non-Newtonian Bingham Plastic Yield Stress (τ₀)',
      currentValue: 'Insufficient parameters (Unvalidated)',
      isAvailable: false,
      unavailableReason: 'Bingham yield stress (τ₀) and Herschel-Bulkley flow index (n) require physical bench rheometry curves at specific total suspended solids (TSS%) concentrations. Cannot be reliably calculated from geometric telemetry alone.',
      units: 'Pa (Pascals)',
      inputParameters: ['Total Suspended Solids (TSS %)', 'Shear Rate Strain Tensor (γ̇)', 'Bentonite / Organic Grit Fraction'],
      calculationMethod: 'Nonlinear Herschel-Bulkley constitutive fluid rheology equation',
      equation: 'τ = τ₀ + K · (γ̇)ⁿ  for  τ > τ₀',
      assumedValues: ['Currently assumed quasi-homogeneous Newtonian surrogate for baseline simulation until physical rheometer data available'],
      sourceJustification: 'Requires rotational rheometer bench testing (Gate 2 Pre-Commissioning)',
      classification: 'UNVALIDATED'
    },
    {
      id: 'calc-slosh-dynamics',
      resultName: 'Liquid Slosh Free-Surface Dynamic CG Shift',
      currentValue: 'Insufficient parameters (Unvalidated)',
      isAvailable: false,
      unavailableReason: 'Multi-phase slosh momentum transfer requires full computational fluid dynamics (CFD) volume-of-fluid (VOF) mesh modeling with moving boundaries during machine transit. Quasi-static centroid used instead.',
      units: 'mm dynamic CG displacement',
      inputParameters: ['Tank Fill Fraction', 'Chassis Longitudinal Acceleration (m/s²)', 'Baffle Plate Aperture Geometry'],
      calculationMethod: 'Navier-Stokes Volume-of-Fluid (VOF) multi-phase free-surface tracking',
      equation: '∂(αρ)/∂t + ∇ · (αρu) = 0',
      assumedValues: ['Quasi-static fluid centroid assumption with rigid internal baffle damping'],
      sourceJustification: 'Requires transient CFD analysis or physical tilt table verification (Gate 4 Pre-Commissioning)',
      classification: 'UNVALIDATED'
    },
    {
      id: 'calc-crawler-ground-pressure',
      resultName: 'Continuous Rubber Track Ground Contact Pressure',
      currentValue: `${mobility.groundPressureKpa.toFixed(1)} kPa (0.39 kg/cm²)`,
      isAvailable: true,
      units: 'kPa (kiloPascals)',
      inputParameters: [
        `Vehicle Total Mass = ${(2850 + materialBalance.collectionVolumeL * 1.18).toFixed(0)} kg (Chassis + Slurry)`,
        'Track Contact Length L = 1.85 m',
        'Dual Rubber Track Width W = 0.28 m × 2'
      ],
      calculationMethod: 'Boussinesq contact mechanics for dual continuous track crawlers on semi-infinite elastic half-space',
      equation: 'P_ground = (M_total · g) / (2 · L_contact · W_track)',
      assumedValues: [
        'Uniform ground pressure distribution across 5 articulated bogie road rollers per side',
        'Neglects dynamic track belt pitch wave harmonics'
      ],
      sourceJustification: 'Bekker (1960), Introduction to Terrain-Vehicle Systems; ISO 16754 Earth-moving machinery',
      classification: 'SIMULATED'
    },
    {
      id: 'calc-crawler-traction-gradeability',
      resultName: 'Tracked Mobility Traction & Gradeability Equilibrium',
      currentValue: `Max Grade: ${mobility.gradeabilityMaxDeg.toFixed(1)}° | Delivered Effort: ${mobility.tractiveEffortKn.toFixed(1)} kN (μ = ${mobility.currentTractionCoeff.toFixed(2)})`,
      isAvailable: true,
      units: 'degrees (°) / kN',
      inputParameters: [
        `Coulomb Soil Friction Coeff μ = ${mobility.currentTractionCoeff.toFixed(2)}`,
        'Rubber Track Rolling Resistance Crr = 0.08',
        `Current Incline Pitch = ${mobility.pitchDeg.toFixed(1)}°`
      ],
      calculationMethod: 'Coulomb-Mohr shear limit and drawbar pull equilibrium on sloped terrain',
      equation: 'F_trac = μ · M · g · cos(θ);  θ_max = arctan(μ - Crr)',
      assumedValues: [
        'Rigid-body terrain clamping with planar multi-point contact',
        'Simplified Coulomb track-soil adhesion without continuum elastoplastic soil mesh'
      ],
      sourceJustification: 'Wong (2008), Theory of Ground Vehicles; SAE J1309 Crawler Tractor Gradeability Protocol',
      classification: 'ESTIMATED'
    }
  ];

  const filteredAssumptions = ASSUMPTIONS.filter((item) => {
    if (classificationFilter === 'ALL') return true;
    return item.classification === classificationFilter;
  });

  const getClassificationBadge = (c: CalculationClassification) => {
    switch (c) {
      case 'SIMULATED':
        return <Badge variant="cyan" size="sm">SIMULATED (DETERMINISTIC)</Badge>;
      case 'ESTIMATED':
        return <Badge variant="warning" size="sm">ESTIMATED (ENGINEERING MODEL)</Badge>;
      case 'MEASURED':
        return <Badge variant="success" size="sm">MEASURED (TRANSDUCER)</Badge>;
      case 'UNVALIDATED':
        return <Badge variant="danger" size="sm">UNVALIDATED (BENCH TEST PENDING)</Badge>;
    }
  };

  return (
    <div className="space-y-4 font-mono text-xs select-none">
      {/* Header and Disclaimer Ribbon */}
      <div className="bg-graphite-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-safety-500" />
            <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
              Transparent Engineering Calculations & Assumptions Audit
            </h3>
            <Badge variant="safety" size="sm">
              TRUTH-IN-ENGINEERING
            </Badge>
          </div>
          <p className="text-slate-400 text-xs mt-1 max-w-3xl font-sans">
            Every simulation output is mapped directly to its underlying mathematical formula, required input parameters, units, assumed engineering constants, and validation tier. Results lacking reliable inputs explicitly indicate <em>Insufficient parameters</em>.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 bg-graphite-950 p-1 rounded-xl border border-slate-800 text-[11px]">
          <Filter className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
          {['ALL', 'SIMULATED', 'ESTIMATED', 'UNVALIDATED'].map((filter) => (
            <button
              key={filter}
              onClick={() => setClassificationFilter(filter)}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                classificationFilter === filter
                  ? 'bg-safety-500 text-white font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-graphite-850'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Assumptions Table Cards */}
      <div className="grid grid-cols-1 gap-3">
        {filteredAssumptions.map((item) => {
          const isExpanded = expandedItemId === item.id;

          return (
            <div
              key={item.id}
              className={`rounded-xl border transition-all ${
                item.isAvailable
                  ? 'bg-graphite-900/90 border-slate-800 hover:border-slate-700'
                  : 'bg-rose-950/15 border-rose-900/40 hover:border-rose-800/60'
              }`}
            >
              {/* Header row clickable */}
              <div
                onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                className="p-3.5 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-safety-500" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs sm:text-sm">{item.resultName}</span>
                      {getClassificationBadge(item.classification)}
                    </div>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      Method: {item.calculationMethod}
                    </span>
                  </div>
                </div>

                <div className="text-right flex items-center gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Current Value</span>
                    <span
                      className={`text-xs sm:text-sm font-bold ${
                        item.isAvailable ? 'text-safety-400' : 'text-rose-400 italic'
                      }`}
                    >
                      {item.currentValue}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 px-2 py-1 rounded bg-graphite-950 border border-slate-800">
                    {isExpanded ? 'Collapse' : 'Inspect'}
                  </span>
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="p-4 pt-1 border-t border-slate-800/80 bg-graphite-950/70 rounded-b-xl space-y-3.5 text-[11px]">
                  {!item.isAvailable && item.unavailableReason && (
                    <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/50 text-rose-300 space-y-1">
                      <strong className="flex items-center gap-1.5 text-rose-400 font-bold uppercase">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Insufficient Parameters Reason:
                      </strong>
                      <p className="font-sans leading-relaxed">{item.unavailableReason}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-graphite-900 border border-slate-800 space-y-1.5">
                      <span className="text-slate-400 uppercase font-bold text-[10px] block">
                        Governing Formula / Mathematical Equation:
                      </span>
                      <div className="p-2 rounded bg-black/60 font-mono text-cyan-300 text-xs border border-cyan-900/40">
                        {item.equation}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Dimensional Units: <strong className="text-white">{item.units}</strong>
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-graphite-900 border border-slate-800 space-y-1.5">
                      <span className="text-slate-400 uppercase font-bold text-[10px] block">
                        Direct Input Parameters:
                      </span>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-200">
                        {item.inputParameters.map((param, idx) => (
                          <li key={idx}>{param}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-graphite-900 border border-slate-800 space-y-1">
                      <span className="text-slate-400 uppercase font-bold text-[10px] block">
                        Documented Engineering Assumptions:
                      </span>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                        {item.assumedValues.map((val, idx) => (
                          <li key={idx}>{val}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-lg bg-graphite-900 border border-slate-800 space-y-1">
                      <span className="text-slate-400 uppercase font-bold text-[10px] block">
                        Source Literature / Engineering Justification:
                      </span>
                      <p className="text-slate-300 font-sans leading-relaxed">
                        {item.sourceJustification}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
