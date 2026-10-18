/**
 * Hardware Prototype Planning Data Models & Engineering Baseline Datasets
 * SIH 26258: Mechanized Desludging Models for Challenging Terrain
 * 
 * Strict Truth-in-Engineering Disclaimers:
 * - This section models the transition from digital twin simulation to physical prototyping.
 * - Hardware has NOT yet been constructed or physically validated.
 * - All financial figures are preliminary budgetary estimates in INR (₹) for Indian MSME fabrication.
 * - Test procedures define pre-commissioning verification criteria; no test is certified passed without physical transducer records.
 */

export type VerificationStatus =
  | 'PENDING_REVIEW'
  | 'PRELIMINARY_ESTIMATE'
  | 'VENDOR_QUOTED'
  | 'VERIFIED_SPEC';

export type BomCategory =
  | 'Chassis'
  | 'Mobility'
  | 'Pump'
  | 'Motor'
  | 'Hose'
  | 'Reel'
  | 'Tank'
  | 'Plumbing'
  | 'Electrical Controls'
  | 'Instrumentation'
  | 'Safety Equipment';

export interface BomItem {
  id: string;
  name: string;
  category: BomCategory;
  qty: number;
  function: string;
  proposedSpec: string;
  unitPriceInr: number;
  subtotalInr: number;
  compatibilityNotes: string;
  verificationStatus: VerificationStatus;
}

export interface MachinePrototypeConfig {
  overallLengthM: number;
  overallWidthM: number;
  overallHeightM: number;
  wheelbaseM: number;
  trackWidthM: number;
  groundClearanceMm: number;
  chassisTareMassKg: number;
  equipmentPayloadMassKg: number;
  maxSludgePayloadKg: number;
  grossVehicleWeightKg: number;
  collectionTankCapacityL: number;
  configuredHoseLengthM: number;
  hoseInnerDiameterMm: number;
  pumpRatedFlowLpm: number;
  pumpRatedRpm: number;
  maxStaticSuctionLiftM: number;
}

export type SensorStatus = 'PROPOSED_CANDIDATE' | 'BENCH_EVALUATION' | 'INTEGRATION_PENDING';

export interface ProposedSensorItem {
  id: string;
  measurement: string;
  candidateSensorType: string;
  measurementRange: string;
  interfaceSignal: string;
  installationLocation: string;
  purpose: string;
  calibrationRequirement: string;
  status: SensorStatus;
}

export type PhysicalTestStatus =
  | 'NOT_STARTED'
  | 'PROCEDURE_READY'
  | 'BENCH_IN_PROGRESS'
  | 'AWAITING_PHYSICAL_CELL';

export interface PhysicalTestProcedure {
  id: string;
  name: string;
  category: string;
  purpose: string;
  procedureSteps: string[];
  acceptanceCriteria: string;
  acceptanceLimit: string;
  verificationMethod: string;
  status: PhysicalTestStatus;
  preliminaryNotes: string;
}

export interface BudgetBreakdown {
  hardwareDirectCostInr: number;
  fabricationLabourInr: number;
  sensorInstrumentationInr: number;
  labBenchTestingInr: number;
  logisticsTransportInr: number;
  contingencyInr: number;
  totalPrototypeBudgetInr: number;
}

export const HARDWARE_PLANNING_DISCLAIMER =
  'PRELIMINARY PROTOTYPE SPECIFICATION STAGING — PHYSICAL MACHINE NOT YET CONSTRUCTED OR FIELD-VALIDATED. Financial values are budgetary engineering estimates for Indian MSME sourcing, not factual transactional invoices.';

// ============================================================================
// DEFAULT RESEARCH-GROUNDED BILL OF MATERIALS (BOM)
// ============================================================================
export const DEFAULT_BOM_ITEMS: BomItem[] = [
  // 1. Chassis
  {
    id: 'BOM-01',
    name: 'High-Tensile Tubular Subframe',
    category: 'Chassis',
    qty: 1,
    function: 'Primary perimeter load-bearing framework & outrigger anchor structure',
    proposedSpec: 'IS 2062 Grade E350 hollow rectangular steel (80x40x4mm) with dual-layer anti-corrosive zinc primer',
    unitPriceInr: 75000,
    subtotalInr: 75000,
    compatibilityNotes: 'Mates with articulated central pivot & 4 outrigger mounting bosses',
    verificationStatus: 'PRELIMINARY_ESTIMATE'
  },
  {
    id: 'BOM-02',
    name: 'Articulated Central Oscillating Pivot Joint',
    category: 'Chassis',
    qty: 1,
    function: 'Torsional decoupling between front traction unit & rear tank carrier on steep ground',
    proposedSpec: '±18° oscillation spherical bronze-bushed pivot bearing with grease purge seals',
    unitPriceInr: 38000,
    subtotalInr: 38000,
    compatibilityNotes: 'Engineered for 35 kN dynamic shear load during mountain stair descent',
    verificationStatus: 'PRELIMINARY_ESTIMATE'
  },

  // 2. Mobility (Tracked Engineering Vehicle)
  {
    id: 'BOM-03',
    name: 'Continuous Rubber Track Belts & Bogie Assemblies',
    category: 'Mobility',
    qty: 2,
    function: 'All-terrain tractive propulsion on 18° mud, rocky scree, and narrow stairways',
    proposedSpec: '280 mm wide vulcanized rubber continuous crawler track belts with embedded high-tensile steel cord cores, forged steel drive lugs, and 5 bogie road rollers per side',
    unitPriceInr: 45000,
    subtotalInr: 90000,
    compatibilityNotes: 'Ensures 1.64m track gauge / 1.92m overall width with 38.5 kPa ground contact pressure',
    verificationStatus: 'VENDOR_QUOTED'
  },
  {
    id: 'BOM-04',
    name: 'Dual Closed-Loop Hydrostatic Track Final Drive Motors',
    category: 'Mobility',
    qty: 2,
    function: 'High-torque crawler track propulsion with 360° spin-turn in place and fail-safe holding brake',
    proposedSpec: 'Dual 2-speed variable displacement axial piston hydraulic motors (45 cc/rev) with planetary reduction gearboxes (1:28 ratio) and SAHR park brakes',
    unitPriceInr: 57500,
    subtotalInr: 115000,
    compatibilityNotes: 'Closed-circuit hydrostatic drive with cross-port relief & counter-balance overcenter valves',
    verificationStatus: 'VENDOR_QUOTED'
  },

  // 3. Pump
  {
    id: 'BOM-05',
    name: 'Rotary Tri-Lobe Positive Displacement Vacuum Pump',
    category: 'Pump',
    qty: 1,
    function: 'Continuous vacuum suction & dense slurry transfer without mechanical impaction',
    proposedSpec: '500 L/min (~30 m³/h) displacement at 2100 RPM, -88 kPa peak vacuum, ductile iron GGG-40 casing with polyurethane elastomer rotors',
    unitPriceInr: 145000,
    subtotalInr: 145000,
    compatibilityNotes: 'Includes replaceable 316SS wear liners; handles up to 35mm soft slurry solids',
    verificationStatus: 'VENDOR_QUOTED'
  },

  // 4. Motor
  {
    id: 'BOM-06',
    name: 'High-Efficiency 3-Phase Inverter-Duty Induction Motor',
    category: 'Motor',
    qty: 1,
    function: 'Prime mover powering positive displacement lobe vacuum pump & hydraulic powerpack',
    proposedSpec: '11.0 kW (15 HP continuous), 415V 50Hz, 4-pole 1450 RPM (2:1 step-up timing belt drive), IE3 premium efficiency, IP66 cast iron frame',
    unitPriceInr: 58000,
    subtotalInr: 58000,
    compatibilityNotes: 'VFD-rated insulation (Class H) with thermistor thermal overload protection',
    verificationStatus: 'VENDOR_QUOTED'
  },

  // 5. Hose
  {
    id: 'BOM-07',
    name: 'Heavy-Duty Spiral Wire-Reinforced Suction Umbilical',
    category: 'Hose',
    qty: 35, // meters
    function: 'Full-vacuum septage conduit connecting vault suction nozzle to machine inlet',
    proposedSpec: 'Ø100 mm (4" ID) smooth-bore PVC/NBR compound with embedded high-tensile steel wire helix, -90 kPa vacuum rating, 5 bar burst',
    unitPriceInr: 1200, // per meter
    subtotalInr: 42000,
    compatibilityNotes: 'Ends crimped with genuine Type C/E aluminum/brass quick-camlock couplings',
    verificationStatus: 'VENDOR_QUOTED'
  },
  {
    id: 'BOM-08',
    name: 'High-Pressure Sludge Fluidization Jetting Hose',
    category: 'Hose',
    qty: 40, // meters
    function: 'Pressurized water umbilical to nozzle spray ring for dense crust liquefaction',
    proposedSpec: 'Ø12 mm (1/2" ID) dual-steel-wire braid high-pressure thermoplastic hose, 250 bar working pressure',
    unitPriceInr: 450, // per meter
    subtotalInr: 18000,
    compatibilityNotes: 'Routes coaxially alongside suction hose with quick-snap retainer sleeves',
    verificationStatus: 'PRELIMINARY_ESTIMATE'
  },

  // 6. Reel
  {
    id: 'BOM-09',
    name: 'Powered Hydraulic Hose Reel Mechanism',
    category: 'Reel',
    qty: 1,
    function: 'Assisted deployment and mechanical retrieval of heavy 35m suction umbilical',
    proposedSpec: 'High-torque orbital hydraulic drive with 4-roller fairlead auto-level wind guide and live rotary vacuum swivel union (DN100)',
    unitPriceInr: 38000,
    subtotalInr: 38000,
    compatibilityNotes: 'Rotary swivel rated for continuous -90 kPa vacuum with twin Viton O-rings',
    verificationStatus: 'PRELIMINARY_ESTIMATE'
  },

  // 7. Tank
  {
    id: 'BOM-10',
    name: 'Cylindrical Pressure-Vacuum Containment Vessel',
    category: 'Tank',
    qty: 1,
    function: 'On-board vacuum containment tank for septage batch transfer and separation',
    proposedSpec: '2,400 L gross capacity, 6mm SA 516 Gr 70 boiler-grade steel with torispherical dished ends, 2x anti-slosh internal baffle plates, full-opening rear hydraulic cleanout door',
    unitPriceInr: 125000,
    subtotalInr: 125000,
    compatibilityNotes: 'Hydrostatically proof-tested to 2.5 bar; rated for full -90 kPa vacuum cycling',
    verificationStatus: 'PRELIMINARY_ESTIMATE'
  },

  // 8. Plumbing
  {
    id: 'BOM-11',
    name: 'Quick-Camlock Couplings & Relief Valve Manifold',
    category: 'Plumbing',
    qty: 1,
    function: 'Interconnecting piping, suction check valve, and overpressure/vacuum relief protection',
    proposedSpec: 'DN100 stainless steel quick-release camlock fittings + dual spring-loaded PVRV safety valve (-88 kPa vacuum / +1.5 bar pressure setpoint)',
    unitPriceInr: 26000,
    subtotalInr: 26000,
    compatibilityNotes: 'Standard 4" Camlock Type C/E connects to municipal discharge tankers',
    verificationStatus: 'PRELIMINARY_ESTIMATE'
  },
  {
    id: 'BOM-12',
    name: 'Cyclone Moisture Separator & Scrubber Trap',
    category: 'Plumbing',
    qty: 1,
    function: 'Secondary knockout vessel preventing moisture, foam, and grit carryover into vacuum pump',
    proposedSpec: '35 L stainless steel cyclone vessel with transparent inspection sight bowl and automatic dual-ball float shutoff valve',
    unitPriceInr: 22000,
    subtotalInr: 22000,
    compatibilityNotes: 'Installs in series between main collection vessel suction dome and lobe pump inlet',
    verificationStatus: 'PRELIMINARY_ESTIMATE'
  },

  // 9. Electrical Controls
  {
    id: 'BOM-13',
    name: 'Industrial Micro-PLC & Variable Frequency Drive (VFD)',
    category: 'Electrical Controls',
    qty: 1,
    function: 'Deterministic actuator sequencing, motor speed modulation, and safety interlock enforcement',
    proposedSpec: 'IP66 weather-sealed stainless cabinet with 15 kW VFD, modular micro-PLC (24V DC), 7" sunlight-readable HMI touchscreen, and Modbus RS-485 master',
    unitPriceInr: 78000,
    subtotalInr: 78000,
    compatibilityNotes: 'Operates from portable 3-phase 20 kVA generator or 415V municipal depot grid drop',
    verificationStatus: 'PRELIMINARY_ESTIMATE'
  },

  // 10. Instrumentation
  {
    id: 'BOM-14',
    name: 'Complete Process Instrumentation Transducer Package',
    category: 'Instrumentation',
    qty: 1,
    function: 'Multi-parameter sensory instrumentation for live digital twin telemetry',
    proposedSpec: 'Electromagnetic flowmeter (DN100), hydrostatic tank level transmitter, ceramic vacuum transducer, dual-axis MEMS inclinometer, CT current sensor, and Pt100 RTD',
    unitPriceInr: 64000,
    subtotalInr: 64000,
    compatibilityNotes: 'All transducers equipped with 4-20mA current loop or Modbus RTU for PLC digitization',
    verificationStatus: 'PRELIMINARY_ESTIMATE'
  },

  // 11. Safety Equipment
  {
    id: 'BOM-15',
    name: 'SIL-2 Emergency Stop Stations & Multi-Gas Hazard Monitor',
    category: 'Safety Equipment',
    qty: 1,
    function: 'Immediate mechanical/electrical de-energization and atmospheric toxicity alert',
    proposedSpec: '2x latching mushroom-head E-stop pushbuttons (hardwired contactor loop) + portable ATEX Zone-1 electrochemical H2S (0-100 ppm) & optical CH4 (0-100% LEL) detector',
    unitPriceInr: 29000,
    subtotalInr: 29000,
    compatibilityNotes: 'Hardwired drop-out safety relay satisfies ISO 13849 Category 3 safety architecture',
    verificationStatus: 'VENDOR_QUOTED'
  }
];

// ============================================================================
// DEFAULT MACHINE CONFIGURATION & PHYSICAL DIMENSIONS
// ============================================================================
export const DEFAULT_MACHINE_CONFIG: MachinePrototypeConfig = {
  overallLengthM: 3.85,
  overallWidthM: 1.55,
  overallHeightM: 1.85,
  wheelbaseM: 2.20,
  trackWidthM: 1.35,
  groundClearanceMm: 260,
  chassisTareMassKg: 850,
  equipmentPayloadMassKg: 420,
  maxSludgePayloadKg: 2832, // 2400 L * 1.18 kg/L
  grossVehicleWeightKg: 4102,
  collectionTankCapacityL: 2400,
  configuredHoseLengthM: 35,
  hoseInnerDiameterMm: 100,
  pumpRatedFlowLpm: 500,
  pumpRatedRpm: 2100,
  maxStaticSuctionLiftM: 6.5
};

// ============================================================================
// PROPOSED SENSOR PLAN & INSTRUMENTATION
// ============================================================================
export const DEFAULT_SENSOR_PLAN: ProposedSensorItem[] = [
  {
    id: 'SEN-01',
    measurement: 'Extraction Volumetric Flow Rate',
    candidateSensorType: 'Electromagnetic Flow Meter (Full-Bore DN100)',
    measurementRange: '0 to 1,000 L/min (0 to 60 m³/h)',
    interfaceSignal: '4-20 mA Current Loop & RS-485 Modbus RTU',
    installationLocation: 'Rigid suction discharge manifold between pump and containment tank',
    purpose: 'Real-time volumetric rate measurement, mass transfer accumulation, and Darcy-Weisbach flow validation',
    calibrationRequirement: 'Gravimetric batch water calibration rig comparison (target accuracy ±1.0% of reading)',
    status: 'PROPOSED_CANDIDATE'
  },
  {
    id: 'SEN-02',
    measurement: 'Collection Tank Liquid Fill Level',
    candidateSensorType: 'Hydrostatic Submersible Pressure Transmitter + Ultrasonic Dome Echo Backup',
    measurementRange: '0 to 2.5 m liquid column (0 to 25 kPa static head)',
    interfaceSignal: '4-20 mA loop (Hydrostatic) & IO-Link (Ultrasonic)',
    installationLocation: 'Lower sump drain boss (Hydrostatic) + top dome inspection flange (Ultrasonic)',
    purpose: 'Material balance invariant tracking, continuous volume display, and 95% high-level automated cutoff interlock',
    calibrationRequirement: 'Stepwise volumetric water-filling test across 10-point calibration curve against optical borosilicate tube',
    status: 'PROPOSED_CANDIDATE'
  },
  {
    id: 'SEN-03',
    measurement: 'Pump Suction Inlet Vacuum',
    candidateSensorType: 'Piezoresistive Ceramic Diaphragm Vacuum/Pressure Transmitter',
    measurementRange: '-100 kPa to +100 kPa gauge (-1.0 to +1.0 bar)',
    interfaceSignal: '4-20 mA (2-Wire Loop Powered)',
    installationLocation: 'Hose reel live rotary union intake chamber directly upstream of pump suction port',
    purpose: 'Monitors net suction lift, friction loss accumulation across 35m hose, and cavitation threshold warning',
    calibrationRequirement: 'Deadweight pneumatic vacuum bench test against certified mercury column reference (NABL accredited)',
    status: 'PROPOSED_CANDIDATE'
  },
  {
    id: 'SEN-04',
    measurement: 'Motor Electrical Current & Power Draw',
    candidateSensorType: 'Split-Core Hall-Effect Current Transformer (CT) + 3-Phase Voltage Transducer',
    measurementRange: '0 to 40 A AC (per phase), 0 to 500 V AC Line-to-Line',
    interfaceSignal: 'Modbus RS-485 to PLC CPU',
    installationLocation: 'Main control cabinet between VFD output filter and motor terminal box',
    purpose: 'Calculates active electrical power (kW), cumulative energy (kWh), motor load (%), and over-torque trip',
    calibrationRequirement: 'Precision electrical power analyzer cross-check with 10kW resistive/inductive load bank',
    status: 'PROPOSED_CANDIDATE'
  },
  {
    id: 'SEN-05',
    measurement: 'Chassis Dual-Axis Inclination & Dynamic Tilt',
    candidateSensorType: 'MEMS Dual-Axis Dynamic Inclinometer with Extended Kalman Gyro Compensation',
    measurementRange: '±45° Pitch (Longitudinal) & Roll (Lateral)',
    interfaceSignal: 'CAN 2.0B / Modbus RS-485',
    installationLocation: 'Rigid mounting bracket at geometric center of mass of mobile chassis backbone',
    purpose: 'Provides live roll/pitch tilt feedback on steep slopes and triggers automated 15° tip-over warning',
    calibrationRequirement: 'Precision 3-axis sine bar leveling plate calibration at 0.0°, 5.0°, 10.0°, 15.0°, and 20.0°',
    status: 'PROPOSED_CANDIDATE'
  },
  {
    id: 'SEN-06',
    measurement: 'Slurry Process Stream Temperature',
    candidateSensorType: 'Class-A Pt100 RTD 3-Wire Resistance Thermometer with Stainless Thermowell',
    measurementRange: '-20°C to +80°C',
    interfaceSignal: '4-20 mA linearized temperature transmitter',
    installationLocation: 'Secondary cyclone moisture separator inlet pipe',
    purpose: 'Enables thermal Andrade viscosity compensation and alerts operator to sub-zero freezing risks in high-altitude zones',
    calibrationRequirement: 'Dual-point ice bath (0.0°C) and boiling water bath (100.0°C) verification',
    status: 'PROPOSED_CANDIDATE'
  },
  {
    id: 'SEN-07',
    measurement: 'Atmospheric Toxic Gas Concentration (H2S & CH4)',
    candidateSensorType: 'Electrochemical Toxic Cell (H2S) + Non-Dispersive Infrared NDIR Optical Sensor (CH4)',
    measurementRange: 'H2S: 0 to 100 ppm (0.1 ppm res); CH4: 0 to 100% LEL (0 to 5% Vol)',
    interfaceSignal: '4-20 mA current loop with dual relay alarm contacts',
    installationLocation: 'Articulated boom tip proximity head (near vault opening) + operator console station',
    purpose: 'Occupational health hazard warning, worker exposure monitoring, and automated safety shutdown if explosive limits approached',
    calibrationRequirement: 'Certified span gas cylinder bump-testing (25 ppm H2S, 50% LEL CH4) mandatory every 30 days',
    status: 'PROPOSED_CANDIDATE'
  },
  {
    id: 'SEN-08',
    measurement: 'Pump Drive Bearing Vibration RMS',
    candidateSensorType: 'Industrial Piezoelectric Accelerometer with Integrated Velocity Integrator',
    measurementRange: '0 to 50 mm/s RMS (Bandwidth 10 Hz to 1,000 Hz)',
    interfaceSignal: '4-20 mA loop (ISO 10816 vibration severity standard)',
    installationLocation: 'Drive-end bearing cap of rotary lobe pump casting',
    purpose: 'Monitors mechanical imbalance, cavitation vibration, and bearing wear to prevent catastrophic seizure',
    calibrationRequirement: 'Handheld handheld shaker table reference at 159.2 Hz, 10 m/s² RMS',
    status: 'PROPOSED_CANDIDATE'
  }
];

// ============================================================================
// PHYSICAL TEST PROCEDURES & ACCEPTANCE CRITERIA
// ============================================================================
export const DEFAULT_PHYSICAL_TEST_PLAN: PhysicalTestProcedure[] = [
  {
    id: 'TEST-01',
    name: 'Vacuum Pump Priming & Suction Evacuation Test',
    category: 'Hydraulic Vacuum Subsystem',
    purpose: 'Verify lobe pump capability to evacuate dry 35m suction umbilical and pull water from 2.5m vertical depth without external liquid priming.',
    procedureSteps: [
      'Couple 35m of Ø100mm suction hose to sealed subsurface test reservoir with 2.5m vertical geodetic lift.',
      'Leave suction line completely unprimed (dry air fill).',
      'Energize pump at 2100 RPM; start high-resolution digital timer.',
      'Record time elapsed until inlet vacuum reaches -65 kPa and liquid first enters transparent sight glass.',
      'Measure steady-state suction vacuum over 3 consecutive runs.'
    ],
    acceptanceCriteria: 'Continuous suction vacuum must develop ≥ -65 kPa within 45 seconds; fluid column must ascend to pump inlet without manual priming assistance.',
    acceptanceLimit: 'Evacuation Time ≤ 45 s, Peak Vacuum ≥ -65 kPa (Derived from Swamee-Jain air-evacuation model)',
    verificationMethod: 'Piezoresistive vacuum transmitter + synchronized digital stopwatch logged via PLC audit stream',
    status: 'PROCEDURE_READY',
    preliminaryNotes: 'Laboratory bench test cell required; physical testing pending fabrication of pump-motor assembly.'
  },
  {
    id: 'TEST-02',
    name: 'Full-Scale Volumetric Flow Rate vs RPM Verification',
    category: 'Process Fluid Transfer',
    purpose: 'Quantify actual volumetric throughput across operating RPM range (900 to 2400 RPM) against simulated theoretical lobe displacement.',
    procedureSteps: [
      'Charge source reservoir with 3,000 L of water-based calibration test fluid (1,000 kg/m³, 1.0 cP).',
      'Step pump speed through 900, 1200, 1500, 1800, 2100, and 2400 RPM for 60 seconds each.',
      'Record steady-state flow rate from electromagnetic flowmeter and compare with gravimetric collection tank scale.',
      'Calculate volumetric slip efficiency = Q_actual / Q_theoretical.'
    ],
    acceptanceCriteria: 'Delivered volumetric flow must remain within ±8% of nominal displacement curve across 1200 to 2400 RPM; slip efficiency must exceed 82%.',
    acceptanceLimit: 'Q_flow ≥ 450 L/min at 2100 RPM with water test fluid; Volumetric efficiency η_v ≥ 82%',
    verificationMethod: 'Electromagnetic flowmeter + certified gravimetric weighbridge comparison',
    status: 'PROCEDURE_READY',
    preliminaryNotes: 'Bench trial scheduled upon completion of lobe pump CNC impeller machining.'
  },
  {
    id: 'TEST-03',
    name: 'Tank Usable Capacity & Mass Balance Invariant Verification',
    category: 'Containment Vessel',
    purpose: 'Validate physical containment vessel usable volume, high-level cutoff probe actuation, and verify zero structural deformation under -88 kPa vacuum.',
    procedureSteps: [
      'Tare empty machine on certified 5-tonne vehicle weighbridge.',
      'Transfer water continuously into vessel until automated 95% high-level safety sensor trips.',
      'Record gross weight; compute net fluid volume (V = net mass / fluid density).',
      'Inspect external borosilicate sight glass graduation marks.',
      'Hold vessel under -88 kPa vacuum for 15 minutes to measure shell deflection.'
    ],
    acceptanceCriteria: 'Automated high-level shutoff must trigger within 2,350 L to 2,420 L (98-101% of 2,400L rated); shell radial deflection ≤ 1.5 mm under -88 kPa; zero leakage.',
    acceptanceLimit: 'Usable Volume = 2,400 L ± 2%; Mass balance discrepancy ≤ 0.5%; Vacuum decay ≤ 2 kPa over 15 min',
    verificationMethod: 'Certified vehicle weighbridge + precision laser dial displacement indicator',
    status: 'PROCEDURE_READY',
    preliminaryNotes: 'Requires pressure vessel hydrostatic clearance certificate prior to initial vacuum draw.'
  },
  {
    id: 'TEST-04',
    name: 'Motor Power Draw & Electrical Energy Profile',
    category: 'Electrical Powerpack',
    purpose: 'Measure instantaneous active power (kW), power factor, and specific energy consumption (kWh/m³) during complete 2,400L extraction cycle.',
    procedureSteps: [
      'Connect 3-phase digital power analyzer between VFD output and motor terminals.',
      'Execute continuous 2,400L extraction batch against 60 kPa dynamic vacuum head.',
      'Log voltage, current per phase, total active power (kW), and cumulative energy (kWh) at 10 Hz.',
      'Calculate specific energy = Total kWh / (Volume m³).'
    ],
    acceptanceCriteria: 'Continuous active electrical power must not exceed 13.5 kW (rated 15 kW); specific energy must remain below 0.85 kWh/m³ under nominal head.',
    acceptanceLimit: 'Peak Power ≤ 14.5 kW, Specific Energy ≤ 0.85 kWh/m³ (Derived from hydraulic model)',
    verificationMethod: 'Fluke 435 Series II 3-phase power quality analyzer',
    status: 'PROCEDURE_READY',
    preliminaryNotes: 'Electric motor procured; awaiting VFD control panel wiring assembly.'
  },
  {
    id: 'TEST-05',
    name: 'Umbilical Hose Routing Friction & Bend Radius Assessment',
    category: 'Conduit Management',
    purpose: 'Measure hydrodynamic Darcy-Weisbach head loss across 35m coiled vs straight hose configurations and verify bend flexibility without collapse.',
    procedureSteps: [
      'Route 35m hose in 3 distinct layouts: (A) Straight linear run; (B) 2x 90° bends; (C) S-curve serpentine.',
      'Flow 450 L/min fluid and record differential pressure across inlet and outlet couplings.',
      'Inspect minimum bend radius: verify hose diameter ovality remains ≤ 5% at 500mm bend radius.',
      'Test hose retrieval torque under full water-filled weight on hydraulic reel.'
    ],
    acceptanceCriteria: 'Friction loss through 2x 90° bends must not exceed straight-line loss by more than 12 kPa; no kinking or collapse at 500mm radius.',
    acceptanceLimit: 'Total Routing Loss ≤ 48 kPa at 450 L/min; Minimum bend radius = 500 mm without structural collapse',
    verificationMethod: 'Dual calibrated pressure transmitters at nozzle and reel inlet',
    status: 'PROCEDURE_READY',
    preliminaryNotes: 'Suction hose procured; reel prototype mechanical frame in fabrication.'
  },
  {
    id: 'TEST-06',
    name: 'Restricted Access-Width & Dynamic Corridor Slalom',
    category: 'Mobility & Packaging',
    purpose: 'Validate physical clearance of machine chassis through restricted 1.6m pedestrian alleyway obstacles and check maneuverability envelope.',
    procedureSteps: [
      'Construct wooden test slalom corridor measuring 1.60m width and 2.10m height with 90° corner.',
      'Traverse complete machine at 1.5 km/h under low-speed remote hydrostatic control.',
      'Measure lateral clearance margins between outer wheel hub caps, mirrors, and corridor walls.',
      'Test articulated steering swing-out envelope during 90° turn.'
    ],
    acceptanceCriteria: 'Chassis must traverse 1.60m corridor without wall contact; dynamic lateral clearance margin ≥ 100 mm on both flanks.',
    acceptanceLimit: 'Corridor Width ≥ 1.55 m, Lateral Clearance Margin ≥ 100 mm/side',
    verificationMethod: 'Precision ultrasonic obstacle sensors + high-speed boundary clearance cameras',
    status: 'PROCEDURE_READY',
    preliminaryNotes: 'Wooden test mockup corridor scheduled at workshop proving ground.'
  },
  {
    id: 'TEST-07',
    name: 'Representative Slope Stability & Outrigger Leveling Test',
    category: 'Terrain Adaptation',
    purpose: 'Verify static and dynamic stability on 14° incline, test outrigger hydraulic auto-leveling, and inspect obstacle ground clearance under chassis.',
    procedureSteps: [
      'Position machine on 14° adjustable heavy tilt test ramp with low-traction wet gravel surface.',
      'Log pitch and roll angles from chassis MEMS inclinometer before stabilizer deployment.',
      'Deploy 4x hydraulic stabilizers; measure leveled chassis angle.',
      'Traverse 100mm high obstacle blocks to test breakover clearance under differential casing.'
    ],
    acceptanceCriteria: 'Deployable stabilizers must level chassis within ≤ 3.5° of true horizontal on 14° slope; minimum static ground clearance ≥ 200 mm under all belly points.',
    acceptanceLimit: 'Leveled Tilt ≤ 4.0° on 14° slope, Ground Clearance ≥ 200 mm under full GVW (Derived from stability model)',
    verificationMethod: 'Dual-axis digital inclinometer + precision vernier height scale',
    status: 'PROCEDURE_READY',
    preliminaryNotes: 'Hydraulic outrigger cylinders in fabrication; tilt ramp fixture design complete.'
  },
  {
    id: 'TEST-08',
    name: 'Emergency Stop (E-Stop) & Operational Interlock Response Time',
    category: 'Operational Safety',
    purpose: 'Validate safety-critical E-stop latching, motor de-energization time, suction isolation valve closure, and interlock override prevention.',
    procedureSteps: [
      'Operate pump at full continuous duty (2100 RPM, 450 L/min transfer).',
      'Actuate operator console Emergency Stop mushroom pushbutton.',
      'Capture electrical contactor trip time and fluid flow stoppage time on digital storage oscilloscope.',
      'Attempt restart without physical mechanical reset of E-stop button; verify start command is hard-interlocked.'
    ],
    acceptanceCriteria: 'Motor contactor must open within ≤ 200 milliseconds; suction flow must halt within ≤ 1.0 second; restart must be impossible until E-stop unlatched and operator fault acknowledged.',
    acceptanceLimit: 'Motor De-Energization ≤ 200 ms, Material Flow Stoppage ≤ 1000 ms, Zero restart without reset',
    verificationMethod: 'Rigol 4-channel digital storage oscilloscope connected to contactor auxiliary contacts & flowmeter output',
    status: 'PROCEDURE_READY',
    preliminaryNotes: 'Safety relay architecture follows ISO 13849 Category 3 architecture; bench testing ready.'
  }
];

// ============================================================================
// BUDGET CALCULATION HELPER
// ============================================================================
export function calculatePrototypeBudget(bomItems: BomItem[]): BudgetBreakdown {
  const hardwareDirectCostInr = bomItems.reduce((acc, item) => acc + item.subtotalInr, 0);
  const fabricationLabourInr = 120000;      // Fabrication, welding, CNC machining labour
  const sensorInstrumentationInr = 45000;  // Sensor mounting, breadboard wiring & bench calibration
  const labBenchTestingInr = 65000;        // Test cell rig rental, flow loop, and instrument hire
  const logisticsTransportInr = 35000;     // Crating, packaging, and high-altitude transport
  const subtotalBeforeContingency =
    hardwareDirectCostInr +
    fabricationLabourInr +
    sensorInstrumentationInr +
    labBenchTestingInr +
    logisticsTransportInr;
  const contingencyInr = Math.round(subtotalBeforeContingency * 0.15); // 15% contingency
  const totalPrototypeBudgetInr = subtotalBeforeContingency + contingencyInr;

  return {
    hardwareDirectCostInr,
    fabricationLabourInr,
    sensorInstrumentationInr,
    labBenchTestingInr,
    logisticsTransportInr,
    contingencyInr,
    totalPrototypeBudgetInr
  };
}
