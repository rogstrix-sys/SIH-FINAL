import { DemoStageInfo } from '../types/digitalTwin';

export const DEMO_STAGES: DemoStageInfo[] = [
  // 1. Project objective and machine overview
  {
    id: 'project_objective',
    stepNumber: 1,
    title: 'Stage 1: Project Objective & Machine Overview',
    subtitle: 'Mechanized sanitation model for varied climatic zones and hilly terrains (SIH 26258)',
    operatingStateTarget: 'IDLE',
    activeViewTarget: 'overview',
    cameraPreset: 'iso',
    selectedComponent: 'chassis',
    durationSec: 10,
    overview:
      'SIH 26258 addresses the urgent national challenge of mechanized sanitation in inaccessible mountain settlements, informal urban alleyways, and extreme weather zones where conventional vacuum tankers cannot maneuver.',
    engineeringContext:
      'The digital twin demonstrates a purpose-built, narrow-gauge (1.35m track width) mobile system with 2,400 L containment, 4WD traction, deployable hydraulic stabilizers, and a 500 L/min positive displacement lobe vacuum pump.',
    keyMetrics: [
      'Problem Statement: SIH 26258 Sanitation Mechanization',
      'Track Width: 1.35 m (Navigates 1.6m Pedestrian Alleys)',
      'Primary Core: Tri-Lobe Rotary Vacuum Pump (30 m³/h)',
      'State: IDLE Baseline (Interlocks Armed)'
    ],
    sensors: [
      'Chassis Staging Sensor: Nominal',
      'Safety Contactor Loop: ARMED'
    ]
  },

  // 2. Machine component inspection
  {
    id: 'component_inspection',
    stepNumber: 2,
    title: 'Stage 2: Machine Subsystem & Component Inspection',
    subtitle: 'Interactive inspection of vacuum core, articulated boom crane, and powered hose reel',
    operatingStateTarget: 'IDLE',
    activeViewTarget: 'simulation3d',
    cameraPreset: 'boom',
    selectedComponent: 'pump',
    durationSec: 9,
    overview:
      'Operators can inspect every mechanical and electrical subsystem: the 11 kW inverter-duty motor, tri-lobe pump, 4-roller hydraulic hose reel, articulated boom crane, and 2,400 L SA 516 boiler-plate containment vessel.',
    engineeringContext:
      'Modular sub-assemblies can be decoupled into 3 man-portable segments (< 250 kg each) for manual hauling across steep stone staircases where vehicular passage is completely blocked.',
    keyMetrics: [
      'Pump Assembly: 11 kW IE3 Motor + Ductile Lobe Pump',
      'Articulated Boom: 4.2m Radius, 270° Slew Ring',
      'Hose Reel: 35m Ø100mm Spiral Wire-Reinforced Umbilical',
      'Containment Tank: 2,400 L Pressure-Vacuum Vessel'
    ],
    sensors: [
      'Bearing Vibration: 0.8 mm/s RMS (ISO 10816 Nominal)',
      'Motor Temperature: 28.5°C'
    ]
  },

  // 3. Selection of a hilly or constrained-access scenario
  {
    id: 'scenario_selection',
    stepNumber: 3,
    title: 'Stage 3: Selection of Hilly & Constrained-Access Scenario',
    subtitle: 'Simulating steep slope (14°) and boulder scree in mountain sanitation wards',
    operatingStateTarget: 'IDLE',
    activeViewTarget: 'terrain',
    scenarioTarget: 'hilly_sloped',
    cameraPreset: 'side',
    selectedComponent: 'chassis',
    durationSec: 9,
    overview:
      'The operator selects Scenario 2 (Hilly & Sloped Terrain, 14° incline). The 3D environment updates to render realistic sloped terrain, surface gravel, vehicle pitch heading, and septic vault placement.',
    engineeringContext:
      'Chassis orientation on sloped ground introduces pitch and roll angles that threaten tip-over unless counteracted by articulated stabilizer outriggers.',
    keyMetrics: [
      'Operating Scenario: 2. Hilly or Sloping Ground',
      'Terrain Slope: 14.0° (24.9% Gradient)',
      'Surface Roughness: 0.45 (Loose Mountain Scree)',
      'Static Suction Elevation Difference: 4.2 m Lift'
    ],
    sensors: [
      'S4: Dual-Axis MEMS Inclinometer Active',
      'Traction Slip Monitor: Monitoring Grade'
    ]
  },

  // 4. Terrain and machine feasibility assessment
  {
    id: 'feasibility_assessment',
    stepNumber: 4,
    title: 'Stage 4: Terrain & Machine Feasibility Assessment',
    subtitle: 'Simplified engineering model evaluating tilt, friction loss, and clearance conflicts',
    operatingStateTarget: 'IDLE',
    activeViewTarget: 'terrain',
    scenarioTarget: 'hilly_sloped',
    cameraPreset: 'iso',
    selectedComponent: 'chassis',
    durationSec: 10,
    overview:
      'The embedded feasibility model automatically computes compensated chassis tilt, required hose length, static lift head loss, and lateral corridor margins before initiating physical deployment.',
    engineeringContext:
      'If tilt exceeds 15.0° or required hose exceeds the 35m drum capacity, active warning banners guide operator repositioning. Darcy-Weisbach calculations estimate dynamic vacuum losses.',
    keyMetrics: [
      'Effective Chassis Tilt: 6.0° (Compensated by Outriggers)',
      'Required Hose Length: 22.0 m (35m Configured — ADEQUATE)',
      'Calculated Suction Loss: 44.2 kPa (Darcy-Weisbach + Lift)',
      'Stability Status: NOMINAL / CAUTION CLEAR'
    ],
    sensors: [
      'Feasibility Gate: PASS (Pre-Deployment Cleared)',
      'Ground Clearance Margin: 260 mm (Clear of Boulders)'
    ]
  },

  // 5. Machine deployment and hose positioning
  {
    id: 'deployment_positioning',
    stepNumber: 5,
    title: 'Stage 5: Machine Positioning, Outrigger Stabilization & Hose Deployment',
    subtitle: 'Stationary halting, 4x outrigger leveling, and dual-joint crane boom placement over vault opening',
    operatingStateTarget: 'DEPLOY',
    activeViewTarget: 'overview',
    cameraPreset: 'boom',
    selectedComponent: 'boom',
    durationSec: 9,
    overview:
      'The vehicle halts at the staging coordinates and applies track brakes. Four telescoping hydraulic outriggers extend to firm ground contact, leveling the chassis. The articulated boom crane slews over the vault and drops the suction nozzle into the sludge bed.',
    engineeringContext:
      'Interlock Enforcement: Machine cannot engage vacuum suction while stabilizers are stowed or boom is transit-locked. Ground contact switches verify level footing before granting pump clearance.',
    keyMetrics: [
      'Operating State: DEPLOY (Stabilize & Position)',
      'Vehicle Speed: 0.00 m/s (Hydraulic Parking Brakes Locked)',
      'Stabilizer Extension: 100% Ground Contact Locked',
      'Boom Crane Slew: 38.0° Over Vault Centerline',
      'Interlock State: DEPLOYED (Priming Permitted)'
    ],
    sensors: [
      'Outrigger Pressure Switches: 4x VERIFIED',
      'Boom Angle Resolver: Aligned with Vault'
    ]
  },

  // 6. Pump priming and extraction
  {
    id: 'priming_extraction',
    stepNumber: 6,
    title: 'Stage 6: Pump Priming & Suction Slurry Extraction',
    subtitle: 'Creating airtight negative vacuum seal and engaging positive displacement lobe pump',
    operatingStateTarget: 'EXTRACT',
    activeViewTarget: 'overview',
    cameraPreset: 'cutaway',
    selectedComponent: 'nozzle',
    durationSec: 14,
    overview:
      'The system initiates automated priming: rotary lobes accelerate to 2100 RPM, pulling -72 kPa vacuum. Suction line check valves open and viscous septage ascends the 35m hose into the on-board containment vessel.',
    engineeringContext:
      'High-pressure water jetting (140 bar) breaks surface scum crust while the cutter head shreds fibrous debris, lowering effective viscosity from 1800 cP to 450 cP.',
    keyMetrics: [
      'Operating State: EXTRACT (Continuous Mass Transfer)',
      'Extraction Flow Rate: ~470 L/min (~28 m³/h)',
      'Inlet Suction Vacuum: -72.4 kPa',
      'Shaft Power: 11.2 kW (15 HP Motor Load ~75%)'
    ],
    sensors: [
      'S1: Ceramic Vacuum Transmitter: -72.4 kPa',
      'S2: Electromagnetic Flowmeter: 470 L/min'
    ]
  },

  // 7. Live dashboard monitoring
  {
    id: 'live_dashboard',
    stepNumber: 7,
    title: 'Stage 7: Live Dashboard, Settling & Hydraulic Platen Dewatering',
    subtitle: 'Real-time telemetry tracking extraction flow, motor power, and in-tank mechanical compression',
    operatingStateTarget: 'EXTRACT',
    activeViewTarget: 'overview',
    cameraPreset: 'tank',
    selectedComponent: 'compactor',
    durationSec: 11,
    overview:
      'The industrial dashboard monitors extraction flow, vacuum, and motor load. As the collection vessel fills, the system initiates the settling and compaction sequence: the guided vertical hydraulic cylinder lowers the porous platen into the sludge bed, expressing liquid filtrate.',
    engineeringContext:
      'The 120mm bore hydraulic cylinder presses up to 140 bar against the sludge bed. The perforated sieve platen allows separated filtrate to accumulate above while compressing the cake below, achieving a 1.45x volume reduction with strict mass conservation.',
    keyMetrics: [
      'Total Extracted Volume: Accumulating live (L)',
      'Piston Stroke: Guided 0 to 600 mm Travel',
      'Hydraulic Compaction Force: ~158 kN (140 bar)',
      'Filtrate Separation: Separated from compressed cake',
      'Compaction Ratio: ~1.45x (~31% Volume Reduction)'
    ],
    sensors: [
      'Piston Position Linear Transducer: Tracking Stroke',
      'Hydraulic Cylinder Pressure Sensor: 140 bar'
    ]
  },

  // 8. Tank-full alarm or emergency-stop demonstration
  {
    id: 'alarm_estop_demo',
    stepNumber: 8,
    title: 'Stage 8: High-Level Alarm & Emergency-Stop (E-Stop) Interlock',
    subtitle: 'Demonstrating fail-safe safety latching and instant actuator de-energization',
    operatingStateTarget: 'FAULT',
    activeViewTarget: 'overview',
    cameraPreset: 'iso',
    selectedComponent: 'chassis',
    durationSec: 9,
    overview:
      'Safety Demonstration: When collection fill reaches 95% or an operator actuates the Emergency Stop mushroom pushbutton, the control system instantly halts material transfer and latches into a FAULT state.',
    engineeringContext:
      'The SIL-2 safety interlock de-energizes the pump motor contactor within ≤ 200 ms and closes the suction valve. Restart is strictly blocked until the operator physically acknowledges and clears the fault.',
    keyMetrics: [
      'Operating State: FAULT / E-STOP LATCHED',
      'Flow Rate: 0.0 L/min (Instantly Halted)',
      'Emergency Stop Latched: TRUE (Hardwired Interlock)',
      'Fault Recovery: Operator Acknowledge Required'
    ],
    sensors: [
      'Safety Contactor: TRIPPED (De-energized)',
      'Alarm Stream: CRITICAL AUDIT EVENT LOGGED'
    ]
  },

  // 9. Discharge and material-balance check
  {
    id: 'discharge_mass_balance',
    stepNumber: 9,
    title: 'Stage 9: Tank Discharge & Mass Balance Reconciliation',
    subtitle: 'Positive displacement transfer to external disposal tanker with strict conservation of mass',
    operatingStateTarget: 'DISCHARGE',
    activeViewTarget: 'overview',
    cameraPreset: 'side',
    selectedComponent: 'receiver',
    durationSec: 12,
    overview:
      'Upon clearing the fault, the machine engages the DISCHARGE cycle, evacuating collected waste at 750 L/min through the DN100 Camlock coupling into an external municipal transport tanker.',
    engineeringContext:
      'Mass Balance Invariant: The simulation verifies V_initial = V_vault + V_collection + V_receiver at every 0.05s integration step, maintaining absolute zero numerical discrepancy (Δ < 0.001 L).',
    keyMetrics: [
      'Operating State: DISCHARGE (High-Speed Transfer)',
      'Discharge Transfer Rate: 750 L/min',
      'Mass Balance Discrepancy: Δ = 0.0000 L (Exact Conservation)',
      'Disposal Tanker Volume: +2,400 L Transferred'
    ],
    sensors: [
      'Collection Vessel Level: Evacuated to 0 L',
      'External Tanker Fill: 2,400 L Received'
    ]
  },

  // 10. Baseline versus alternative configuration comparison
  {
    id: 'scenario_comparison',
    stepNumber: 10,
    title: 'Stage 10: Safe Piston Retention, Transport Readiness & Scenario Analytics',
    subtitle: 'Mechanical lock pin latching, stabilizer retraction, and baseline vs alpine terrain performance comparison',
    operatingStateTarget: 'COMPLETE',
    activeViewTarget: 'analysis',
    cameraPreset: 'iso',
    selectedComponent: 'chassis',
    durationSec: 10,
    overview:
      'Following dewatering, the platen retracts to 0 mm top home position and engages dual mechanical retention pins. Stabilizers and crane boom stow. Transport readiness invariants are verified before departure.',
    engineeringContext:
      'The comparison engine evaluates the standardized 2,400 L task across terrains. In cold alpine terrain (-8°C), Andrade thermal viscosity increases septage viscosity, extending task duration by +42% and increasing specific energy consumption from 0.42 to 0.65 kWh/m³.',
    keyMetrics: [
      'Transport Readiness: VERIFIED ROADWORTHY',
      'Piston Retention Pins: LATCHED (0 mm Home)',
      'Stabilizers & Boom: Fully Stowed (<0.05)',
      'Baseline (Level Paved): 5m 03s, 1.01 kWh',
      'Comparison (Alpine -8°C): 7m 10s, 1.48 kWh (+46.5%)'
    ],
    sensors: [
      'Transport Lock Transducer: LATCHED',
      'Roadworthiness Gate: 100% INVARIANTS SATISFIED'
    ]
  },

  // 11. Preliminary hardware BOM and physical test plan
  {
    id: 'hardware_bom_test_plan',
    stepNumber: 11,
    title: 'Stage 11: Preliminary Hardware BOM & Physical Test Plan',
    subtitle: 'Itemized fabrication costing (₹11.13L) and 8 physical acceptance test procedures',
    operatingStateTarget: 'COMPLETE',
    activeViewTarget: 'prototype',
    cameraPreset: 'iso',
    selectedComponent: 'pump',
    durationSec: 10,
    overview:
      'Supports the transition from digital twin to physical prototype: 15 categorized Bill of Materials line-items with Indian MSME budgetary pricing, machine configuration sizing, candidate sensors, and physical test gates.',
    engineeringContext:
      'Truth-in-Engineering: Direct hardware costs (₹7.02L) are clearly separated from fabrication labour (₹1.20L), sensor calibration, test rig rental, and 15% contingency. Zero physical tests are claimed as passed without real hardware trials.',
    keyMetrics: [
      'Total Estimated Prototype Budget: ₹11.13 Lakhs INR',
      'BOM Categories: Chassis, Mobility, Pump, Motor, Hose, Reel, Tank',
      'Candidate Sensors: 8 Industrial Transducers Defined',
      'Physical Test Gates: 8 Acceptance Procedures Staged'
    ],
    sensors: [
      'BOM Status: BUDGETARY ESTIMATE / VENDOR QUOTED',
      'Physical Test Status: PROCEDURE READY (Awaiting Test Cell)'
    ]
  },

  // 12. Export of the simulated performance report
  {
    id: 'report_export',
    stepNumber: 12,
    title: 'Stage 12: Simulated Performance Report & CSV Data Export',
    subtitle: 'Comprehensive engineering dossier, telemetry CSV export, and audit trail reconciliation',
    operatingStateTarget: 'COMPLETE',
    activeViewTarget: 'reports',
    cameraPreset: 'iso',
    selectedComponent: 'tank',
    durationSec: 9,
    overview:
      'The demonstration concludes with full telemetry export capabilities: Download simulated time-series telemetry CSV, event audit log CSV, and print the comprehensive engineering dossier.',
    engineeringContext:
      'Exported telemetry buffers include cumulative electrical energy (kWh), Darcy-Weisbach vacuum losses, flow rates, and the required "SIMULATED_ENGINE_TWIN" data fidelity tag.',
    keyMetrics: [
      'Telemetry CSV: Formatted with Energy & Fidelity Flags',
      'Event Log CSV: Timestamped Audit Trail',
      'Printable Report: Ready for Municipal Evaluation',
      'Digital Twin Cycle: FULLY VALIDATED & RECONCILED'
    ],
    sensors: [
      'Audit Trail: 100% Sequence Reconciled',
      'SIH 26258 Verification: COMPLETED'
    ]
  }
];
