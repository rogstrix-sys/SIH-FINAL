import { DemoStageInfo } from '../types/digitalTwin';

export const DEMO_STAGES: DemoStageInfo[] = [
  {
    id: 'idle_staging',
    stepNumber: 1,
    title: 'Stage 1: Machine Staging & Terrain Clearance Verification',
    subtitle: 'Pre-operational verification and geometric clearance checks',
    operatingStateTarget: 'IDLE',
    cameraPreset: 'iso',
    selectedComponent: 'chassis',
    durationSec: 8,
    overview:
      'The compact mechanized desludging unit arrives at the staging position. The engineering control system evaluates ground clearance, terrain slope, and passage margins.',
    engineeringContext:
      'A simplified kinematic feasibility model evaluates chassis inclination against the 15.0° caution threshold and confirms passage width exceeds the 1.35m machine track.',
    keyMetrics: [
      'Chassis Staging Angle: 1.5° (Level Paved)',
      'Lateral Passage Margin: 1.22 m',
      'Safety Interlocks: ARMED & VERIFIED'
    ],
    sensors: [
      'S4: Dual-Axis Chassis Inclinometer',
      'Safety Limit Switches: 100% OK'
    ]
  },
  {
    id: 'deploy_stabilizers',
    stepNumber: 2,
    title: 'Stage 2: Hydraulic Outrigger Leveling & Boom Articulation',
    subtitle: 'Active chassis leveling and articulated hose positioning',
    operatingStateTarget: 'DEPLOY',
    cameraPreset: 'boom',
    selectedComponent: 'boom',
    durationSec: 9,
    overview:
      'Four heavy-duty hydraulic outrigger pads extend to ground contact, lifting and leveling the chassis. The articulated dual-joint crane arm slews and swings the suction hose over the vault manhole.',
    engineeringContext:
      'Outrigger deployment widens the tipping baseline and counteracts reactive suction forces. On slopes, cylinder stroke automatically compensates for up to 8.0° of terrain incline.',
    keyMetrics: [
      'Stabilizer Extension: 100% (Locked)',
      'Boom Slew Angle: 38.0° Slew',
      'Effective Chassis Tilt: 0.0° Level'
    ],
    sensors: [
      'S4: Inclinometer Auto-Leveling Active',
      'Boom Cylinder Pressure: 160 bar'
    ]
  },
  {
    id: 'prime_pump',
    stepNumber: 3,
    title: 'Stage 3: Rotary Vacuum Priming & Suction Seal Verification',
    subtitle: 'Establishing negative pressure seal and verifying vacuum integrity',
    operatingStateTarget: 'PRIME',
    cameraPreset: 'side',
    selectedComponent: 'pump',
    durationSec: 8,
    overview:
      'The direct-drive tri-lobe positive-displacement vacuum pump accelerates to 1,850 RPM. Manifold isolation valves open, evacuating air to pull an airtight negative pressure seal in the umbilical hose.',
    engineeringContext:
      'Rotary lobe pumps evacuate air without requiring liquid pre-flooding. The system tests the umbilical hose for collapse resistance and verifies that inlet vacuum approaches target suction (-72 kPa).',
    keyMetrics: [
      'Pump Shaft Speed: 1,850 RPM',
      'Suction Vacuum: -72.0 kPa (Sealed)',
      'Cavitation Index: 0.12 (Nominal)'
    ],
    sensors: [
      'S1: Inlet Vacuum Transducer',
      'S5: Motor Current CT: 18.5 A (34% Load)'
    ]
  },
  {
    id: 'extract_sludge',
    stepNumber: 4,
    title: 'Stage 4: Mechanized Slurry Extraction & High-Pressure Agitation',
    subtitle: 'High-vacuum evacuation of stratified viscous fecal sludge',
    operatingStateTarget: 'EXTRACT',
    cameraPreset: 'cutaway',
    selectedComponent: 'nozzle',
    durationSec: 16,
    overview:
      'Viscous fecal sludge is drawn up the reinforced umbilical hose at ~450 L/min into the on-board containment vessel. High-pressure hydro-jetting nozzles fluidize and shear consolidated sludge layers.',
    engineeringContext:
      'Darcy-Weisbach friction head and hydrostatic elevation head dictate dynamic vacuum demand. Mass balance conservation guarantees that every liter drawn from the vault enters on-board containment.',
    keyMetrics: [
      'Suction Flow Rate: ~450 L/min (27 m³/h)',
      'Source Vault Depth: Decreasing',
      'Collection Containment Fill: Rising'
    ],
    sensors: [
      'S2: Optical Sludge Interface Detector',
      'S3: Borosilicate Sight Glass Hydrostatic Sensor'
    ]
  },
  {
    id: 'discharge_transfer',
    stepNumber: 5,
    title: 'Stage 5: Positive-Displacement Transfer to External Tanker',
    subtitle: 'High-rate evacuation through 4-inch discharge port',
    operatingStateTarget: 'DISCHARGE',
    cameraPreset: 'side',
    selectedComponent: 'receiver',
    durationSec: 12,
    overview:
      'Upon reaching target extraction volume, the machine opens its rear 4-inch discharge gate valve, pumping collected waste at high volume (~560 L/min) into the external road tanker.',
    engineeringContext:
      'Positive-displacement discharge empties the on-board vessel rapidly, readying the machine for subsequent pit cycles without requiring demobilization or causing open-air spillage.',
    keyMetrics: [
      'Discharge Flow Rate: ~560 L/min',
      'Collection Vessel: Evacuating to 0 L',
      'External Tanker: Receiving transferred volume'
    ],
    sensors: [
      'S3: Containment Vessel Level: 0%',
      'S6: External Tanker Fill Level: +2,400 L'
    ]
  },
  {
    id: 'complete_summary',
    stepNumber: 6,
    title: 'Stage 6: Cycle Complete & Telemetry Reconciliation',
    subtitle: 'Mass balance validation, energy logging, and report readiness',
    operatingStateTarget: 'COMPLETE',
    cameraPreset: 'iso',
    selectedComponent: 'tank',
    durationSec: 10,
    overview:
      'Mechanized desludging cycle finished successfully. The automation system verifies zero mass balance discrepancy, records power consumption, and archives environmental compliance telemetry.',
    engineeringContext:
      'Net mass balance discrepancy: 0.00 Liters. Electrical energy consumption (kWh), cycle duration, and atmospheric gas monitoring data (H2S, CH4) are archived and ready for audit export.',
    keyMetrics: [
      'Total Volume Extracted: 2,400 Liters',
      'Mass Discrepancy: 0.00 Liters (Exact)',
      'Operating State: COMPLETE & SECURED'
    ],
    sensors: [
      'Audit Event Log: 100% Reconciled',
      'Atmospheric Safety: H2S & CH4 Nominal'
    ]
  }
];
