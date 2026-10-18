import React from 'react';
import {
  Compass,
  Cpu,
  Truck,
  Wrench,
  CheckCircle2,
  Clock,
  Layers,
  ShieldAlert,
  Scale,
  IndianRupee,
  FileSpreadsheet,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface BomItem {
  id: string;
  subsystem: string;
  component: string;
  specification: string;
  material: string;
  qty: number;
  weightKg: number;
  estCostInr: number;
  status: 'Procured' | 'In Fabrication' | 'Design Frozen' | 'Pending Vendor Quote';
}

const BOM_DATA: BomItem[] = [
  {
    id: 'BOM-01',
    subsystem: 'Mobility Platform',
    component: 'Articulated Box Chassis',
    specification: 'Narrow-gauge 1.35m track width, dual steering pivots',
    material: 'IS 2062 Grade E250 Structural Steel',
    qty: 1,
    weightKg: 180,
    estCostInr: 65000,
    status: 'In Fabrication'
  },
  {
    id: 'BOM-02',
    subsystem: 'Mobility Platform',
    component: 'Hydraulic Outrigger Legs',
    specification: '4x telescopic outriggers with self-aligning ball pads',
    material: 'High-Tensile ST52 Seamless Tubing',
    qty: 4,
    weightKg: 68,
    estCostInr: 42000,
    status: 'Design Frozen'
  },
  {
    id: 'BOM-03',
    subsystem: 'Mobility Platform',
    component: 'Agricultural Deep-Lug Tires',
    specification: '26x12.00-12 8-ply rated for loose mountain scree',
    material: 'Heavy-Duty Synthetic Elastomer',
    qty: 4,
    weightKg: 52,
    estCostInr: 28000,
    status: 'Procured'
  },
  {
    id: 'BOM-04',
    subsystem: 'Hydraulic Vacuum Core',
    component: 'Tri-Lobe Positive Displacement Pump',
    specification: '36 m³/h nominal displacement, -88 kPa continuous vacuum',
    material: 'Nodular Ductile Iron GGG-40 / PU Rotors',
    qty: 1,
    weightKg: 95,
    estCostInr: 125000,
    status: 'In Fabrication'
  },
  {
    id: 'BOM-05',
    subsystem: 'Hydraulic Vacuum Core',
    component: 'Direct Drive Electric Motor',
    specification: '11.0 kW 3-phase IE3 high-efficiency inverter duty',
    material: 'Cast Iron Frame / Copper Windings',
    qty: 1,
    weightKg: 65,
    estCostInr: 48000,
    status: 'Procured'
  },
  {
    id: 'BOM-06',
    subsystem: 'Containment Vessel',
    component: '2,400L Pressure-Vacuum Tank',
    specification: 'Cylindrical shell with anti-slosh internal baffles & optical level tube',
    material: 'SA 516 Grade 70 Pressure Vessel Plate',
    qty: 1,
    weightKg: 195,
    estCostInr: 110000,
    status: 'Design Frozen'
  },
  {
    id: 'BOM-07',
    subsystem: 'Hose Management',
    component: 'Powered Hydraulic Hose Reel',
    specification: 'Orbit hydraulic motor spooling 35m of Ø100mm suction umbilical',
    material: 'Galvanized Structural Steel Frame',
    qty: 1,
    weightKg: 55,
    estCostInr: 35000,
    status: 'Design Frozen'
  },
  {
    id: 'BOM-08',
    subsystem: 'Hose Management',
    component: 'Articulated Dual-Joint Boom Crane',
    specification: '4.2m reach arm with twin hydraulic lifting rams',
    material: 'DOM Tubing with Bronze Bushings',
    qty: 1,
    weightKg: 72,
    estCostInr: 46000,
    status: 'In Fabrication'
  },
  {
    id: 'BOM-09',
    subsystem: 'Safety & Automation Pod',
    component: 'ATEX Zone-1 Control Enclosure',
    specification: 'Integrated PLC, E-Stop latch, H2S/CH4 telemetry transmitters',
    material: 'IP66 Die-Cast Aluminum Enclosure',
    qty: 1,
    weightKg: 18,
    estCostInr: 85000,
    status: 'In Fabrication'
  }
];

export const PrototypePlanningView: React.FC = () => {
  const totalDryWeightKg = BOM_DATA.reduce((acc, item) => acc + item.weightKg, 0);
  const totalEstCostInr = BOM_DATA.reduce((acc, item) => acc + item.estCostInr, 0);

  const trlStages = [
    { trl: 'TRL 1', title: 'Basic Principles', status: 'Completed', date: 'M1' },
    { trl: 'TRL 2', title: 'Concept Formulation', status: 'Completed', date: 'M2' },
    { trl: 'TRL 3', title: 'Digital Twin Kinematics', status: 'Completed (Active)', date: 'M3-M4' },
    { trl: 'TRL 4', title: 'Lab Flow Rig Bench Trial', status: 'In Progress', date: 'M5' },
    { trl: 'TRL 5', title: 'Integrated Prototype Build', status: 'Pending Machining', date: 'M6' },
    { trl: 'TRL 6', title: 'Municipal Hilly Field Pilot', status: 'Pending TRL 5', date: 'M8' }
  ];

  return (
    <div className="flex-1 p-4 sm:p-6 space-y-5 overflow-y-auto bg-graphite-950 select-none">
      {/* Header Banner */}
      <div className="bg-graphite-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Compass className="w-5 h-5 text-safety-500" />
            <h2 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider font-mono">
              Hardware Prototype Architecture & Fabrication Planning
            </h2>
            <Badge variant="safety" size="sm">
              SIH 26258 HARDWARE ROADMAP
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Modular engineering specifications, detailed Bill of Materials (BOM), weight budget for restricted-access
            man-portability, and Technology Readiness Level (TRL) roadmap.
          </p>
        </div>

        {/* High-level status badge */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-slate-400">TRL Phase:</span>
          <Badge variant="cyan" size="md">
            TRL 3/4 ACTIVE
          </Badge>
        </div>
      </div>

      {/* TRL Stage Progression Stepper */}
      <div className="bg-graphite-900 border border-slate-800 rounded-xl p-3.5 shadow-md">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2.5">
          <span className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-safety-500" />
            Technology Readiness Level (TRL) Milestone Roadmap
          </span>
          <span className="text-[10px] text-emerald-400">Digital Twin Target: TRL 6 Field Demonstration</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 font-mono text-xs">
          {trlStages.map((stage) => {
            const isCompleted = stage.status.includes('Completed');
            const isInProgress = stage.status.includes('In Progress');
            return (
              <div
                key={stage.trl}
                className={`p-2.5 rounded-lg border text-center transition-all ${
                  isCompleted
                    ? 'border-emerald-600/50 bg-emerald-950/20 text-emerald-300'
                    : isInProgress
                    ? 'border-safety-500 bg-safety-500/15 text-safety-400 font-bold animate-pulse'
                    : 'border-slate-800 bg-graphite-950 text-slate-400'
                }`}
              >
                <div className="text-[10px] uppercase font-bold">{stage.trl}</div>
                <div className="text-xs font-semibold text-white mt-0.5 truncate">{stage.title}</div>
                <div className="text-[9px] text-slate-400 mt-1">{stage.status}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modular Packaging & Man-Portability Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        <div className="p-4 rounded-xl bg-graphite-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 uppercase text-[10px] font-bold">Total Prototype Dry Weight</span>
            <Scale className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalDryWeightKg} kg</div>
          <p className="text-[11px] text-slate-400">
            Engineered below 850 kg limit to allow 4-wheel tractive traversal on 14° mountain grades.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-graphite-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 uppercase text-[10px] font-bold">Modular 3-Part Disassembly</span>
            <Truck className="w-4 h-4 text-safety-400" />
          </div>
          <div className="text-2xl font-bold text-safety-400">&lt; 250 kg / segment</div>
          <p className="text-[11px] text-slate-400">
            Can be uncoupled into 3 sub-assemblies (Chassis, Pump Core, Tank) for manual hauling across pedestrian stairways.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-graphite-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 uppercase text-[10px] font-bold">Estimated Prototype BOM Cost</span>
            <IndianRupee className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">₹{(totalEstCostInr / 100000).toFixed(2)} Lakhs</div>
          <p className="text-[11px] text-slate-400">
            Domestic component sourcing across Indian MSME fabrication clusters for cost optimization.
          </p>
        </div>
      </div>

      {/* Bill of Materials (BOM) Table */}
      <Card title="Physical Hardware Prototype — Bill of Materials (BOM)">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                <th className="py-2.5 px-3">Item ID</th>
                <th className="py-2.5 px-3">Subsystem</th>
                <th className="py-2.5 px-3">Component Name</th>
                <th className="py-2.5 px-3">Engineering Specification</th>
                <th className="py-2.5 px-3">Material Grade</th>
                <th className="py-2.5 px-3 text-right">Weight (kg)</th>
                <th className="py-2.5 px-3 text-right">Est. Cost (₹)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {BOM_DATA.map((item) => (
                <tr key={item.id} className="hover:bg-graphite-850/50 transition">
                  <td className="py-2.5 px-3 text-slate-400">{item.id}</td>
                  <td className="py-2.5 px-3 text-slate-300 font-semibold">{item.subsystem}</td>
                  <td className="py-2.5 px-3 text-white font-bold">{item.component}</td>
                  <td className="py-2.5 px-3 text-slate-400 text-[11px] max-w-xs">{item.specification}</td>
                  <td className="py-2.5 px-3 text-slate-400 text-[11px]">{item.material}</td>
                  <td className="py-2.5 px-3 text-right text-slate-200">{item.weightKg}</td>
                  <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                    ₹{item.estCostInr.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <Badge
                      variant={
                        item.status === 'Procured'
                          ? 'success'
                          : item.status === 'In Fabrication'
                          ? 'safety'
                          : 'slate'
                      }
                      size="sm"
                    >
                      {item.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Clear Pending Work & Remaining Tasks Indicator */}
      <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-600/50 text-xs font-mono text-amber-200/90 space-y-2">
        <div className="flex items-center gap-2 text-amber-400 font-bold uppercase text-[11px]">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Hardware Fabrication Readiness & Pending Bench Tasks:
        </div>
        <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-300/80 pl-2">
          <li>
            <strong>CNC Milling of Tri-Lobe Impellers:</strong> Scheduled at precision tooling workshop (Pending cutter path clearance).
          </li>
          <li>
            <strong>Hydraulic Cylinder Load Testing:</strong> Lab pressure test bench verification for outrigger leveling under 1.5x design overload.
          </li>
          <li>
            <strong>High-Altitude Motor Derating Test:</strong> Bench simulation of cold-weather battery / power unit performance at -5°C.
          </li>
          <li>
            <strong>Municipal Pilot Integration (TRL 6):</strong> Demonstration in steep hill ward with municipal sanitation staff scheduled post-TRL 5 assembly.
          </li>
        </ul>
      </div>
    </div>
  );
};
