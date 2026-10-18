import React from 'react';
import {
  Sliders,
  RotateCcw,
  Zap,
  Droplets,
  Layers,
  Thermometer,
  ShieldAlert,
  Gauge
} from 'lucide-react';
import { useSimulationStore, DEFAULT_PARAMETERS } from '../../store/useSimulationStore';
import { Card } from '../ui/Card';
import { Slider } from '../ui/Slider';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { SimulationParameters } from '../../types/digitalTwin';

interface PresetConfig {
  name: string;
  tag: string;
  description: string;
  params: Partial<SimulationParameters>;
}

const PARAMETER_PRESETS: PresetConfig[] = [
  {
    name: 'Municipal Septic Holding Tank',
    tag: 'STANDARD',
    description: '4,200L domestic sewage vault, moderate viscosity (450 cP), 35m hose line.',
    params: {
      containmentVolumeLiters: 4200,
      initialSludgeDepthM: 1.85,
      slurryViscosityCp: 450,
      slurryDensityKgM3: 1180,
      pumpRpm: 1850,
      targetVacuumKpa: -72,
      hoseDiameterMm: 100,
      hoseLengthM: 35,
      waterJetPressureBar: 140,
      waterJetEnabled: true,
      cutterHeadSpeedRpm: 240,
      cutterHeadEnabled: true
    }
  },
  {
    name: 'Heavy Industrial Grease Interceptor',
    tag: 'VISCOUS',
    description: 'High shear resistance sludge (1,600 cP), requires maximum 220 bar hydro-jetting shear.',
    params: {
      containmentVolumeLiters: 6500,
      initialSludgeDepthM: 2.4,
      slurryViscosityCp: 1600,
      slurryDensityKgM3: 1350,
      pumpRpm: 2200,
      targetVacuumKpa: -80,
      hoseDiameterMm: 100,
      hoseLengthM: 45,
      waterJetPressureBar: 220,
      waterJetEnabled: true,
      cutterHeadSpeedRpm: 380,
      cutterHeadEnabled: true
    }
  },
  {
    name: 'Sub-Zero High Altitude Pit',
    tag: 'COLD-CLIMATE',
    description: 'Ambient -8°C mountain station, stiffened boundary layer, cold lift limits.',
    params: {
      containmentVolumeLiters: 3200,
      initialSludgeDepthM: 1.5,
      slurryViscosityCp: 950,
      slurryDensityKgM3: 1220,
      ambientTempC: -8.0,
      pumpRpm: 1950,
      targetVacuumKpa: -76,
      hoseDiameterMm: 75,
      hoseLengthM: 55,
      waterJetPressureBar: 160,
      waterJetEnabled: true,
      cutterHeadSpeedRpm: 280,
      cutterHeadEnabled: true
    }
  },
  {
    name: 'Consolidated Mineralized Bottom Crust',
    tag: 'HIGH-DENSITY',
    description: 'Heavy settled sludge (1,480 kg/m³) with thick crust, max cutter head torque.',
    params: {
      containmentVolumeLiters: 5000,
      initialSludgeDepthM: 2.1,
      slurryViscosityCp: 2400,
      slurryDensityKgM3: 1480,
      pumpRpm: 2400,
      targetVacuumKpa: -82,
      hoseDiameterMm: 150,
      hoseLengthM: 25,
      waterJetPressureBar: 240,
      waterJetEnabled: true,
      cutterHeadSpeedRpm: 520,
      cutterHeadEnabled: true
    }
  }
];

export const ParametersView: React.FC = () => {
  const parameters = useSimulationStore((s) => s.parameters);
  const updateParameter = useSimulationStore((s) => s.updateParameter);
  const batchUpdateParameters = useSimulationStore((s) => s.batchUpdateParameters);
  const addEvent = useSimulationStore((s) => s.addEvent);

  const applyPreset = (preset: PresetConfig) => {
    batchUpdateParameters(preset.params);
    addEvent('info', 'PARAMETER_PRESET', `Applied engineering profile: ${preset.name}`);
  };

  const resetDefaults = () => {
    batchUpdateParameters(DEFAULT_PARAMETERS);
    addEvent('info', 'PARAMETER_RESET', 'Operating parameters restored to factory nominal standards.');
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-safety-500" />
            <span>Operating Parameters & Rheology Configuration</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tune hydraulic vacuum pump kinetics, slurry rheology properties, and umbilical conduit geometry.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={resetDefaults}
          icon={<RotateCcw className="w-3.5 h-3.5" />}
        >
          Reset to Factory Defaults
        </Button>
      </div>

      {/* Preset Profiles Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {PARAMETER_PRESETS.map((preset) => (
          <button
            key={preset.name}
            onClick={() => applyPreset(preset)}
            className="text-left bg-graphite-900 border border-slate-800 hover:border-safety-500/60 rounded-xl p-3.5 transition-all shadow-md group focus:outline-none focus:ring-2 focus:ring-safety-500"
          >
            <div className="flex items-center justify-between mb-1.5">
              <Badge variant="safety" size="sm">
                {preset.tag}
              </Badge>
              <span className="text-[10px] text-slate-400 group-hover:text-safety-400 font-mono transition-colors">
                Apply →
              </span>
            </div>
            <h3 className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">
              {preset.name}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
              {preset.description}
            </p>
          </button>
        ))}
      </div>

      {/* Parameter Categories Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Vacuum & Extraction Pump Mechanics */}
        <Card
          title="Pump & Vacuum Core"
          subtitle="Positive displacement rotary kinetics"
          icon={<Gauge className="w-4 h-4 text-safety-500" />}
        >
          <div className="space-y-4">
            <Slider
              id="param-pump-rpm"
              label="Pump Speed (RPM)"
              value={parameters.pumpRpm}
              min={0}
              max={3600}
              step={50}
              unit="RPM"
              onChange={(val) => updateParameter('pumpRpm', val)}
              dangerThreshold={3200}
              description="Rated speed: 1800-3000 RPM. Excess speed induces rotor cavitation."
            />

            <Slider
              id="param-vacuum-target"
              label="Vacuum Setpoint"
              value={parameters.targetVacuumKpa}
              min={-90}
              max={0}
              step={1}
              unit="kPa"
              onChange={(val) => updateParameter('targetVacuumKpa', val)}
              dangerThreshold={-82}
              description="Deep vacuum setpoint for negative suction head."
            />

            <div className="pt-2 border-t border-slate-800 space-y-2">
              <label className="text-xs font-medium text-slate-300 block">
                Hose Inner Diameter (ID)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[75, 100, 150].map((d) => (
                  <button
                    key={d}
                    onClick={() => updateParameter('hoseDiameterMm', d)}
                    className={`py-2 text-xs font-mono rounded-lg border transition-all ${
                      parameters.hoseDiameterMm === d
                        ? 'bg-safety-500 text-white font-bold border-safety-400'
                        : 'bg-graphite-950 text-slate-400 border-slate-800 hover:text-white hover:bg-graphite-850'
                    }`}
                  >
                    Ø {d} mm ({d === 75 ? '3"' : d === 100 ? '4"' : '6"'})
                  </button>
                ))}
              </div>
            </div>

            <Slider
              id="param-hose-length"
              label="Suction Hose Length"
              value={parameters.hoseLengthM}
              min={10}
              max={100}
              step={5}
              unit="m"
              onChange={(val) => updateParameter('hoseLengthM', val)}
              description="Longer conduits create high friction head loss."
            />
          </div>
        </Card>

        {/* 2. Sludge Rheology & Containment Vault */}
        <Card
          title="Sludge Rheology & Vault"
          subtitle="Non-Newtonian fluid and containment metrics"
          icon={<Droplets className="w-4 h-4 text-cyan-400" />}
        >
          <div className="space-y-4">
            <Slider
              id="param-viscosity"
              label="Sludge Viscosity (cP)"
              value={parameters.slurryViscosityCp}
              min={10}
              max={3000}
              step={50}
              unit="cP"
              onChange={(val) => updateParameter('slurryViscosityCp', val)}
              dangerThreshold={2000}
              description="Dynamic viscosity (1 cP = 1 mPa·s). Water = 1 cP, Septage = 300-2500 cP."
            />

            <Slider
              id="param-density"
              label="Slurry Density"
              value={parameters.slurryDensityKgM3}
              min={1000}
              max={1600}
              step={20}
              unit="kg/m³"
              onChange={(val) => updateParameter('slurryDensityKgM3', val)}
              description="Determines hydrostatic head pressure and solids concentration."
            />

            <Slider
              id="param-volume"
              label="Vault Gross Capacity"
              value={parameters.containmentVolumeLiters}
              min={1000}
              max={10000}
              step={200}
              unit="L"
              onChange={(val) => updateParameter('containmentVolumeLiters', val)}
              description="Total sludge volume inside subterranean holding tank."
            />

            <Slider
              id="param-depth"
              label="Initial Sludge Depth"
              value={parameters.initialSludgeDepthM}
              min={0.5}
              max={3.5}
              step={0.1}
              unit="m"
              onChange={(val) => updateParameter('initialSludgeDepthM', val)}
              description="Starting vertical suction lift from vault bottom."
            />
          </div>
        </Card>

        {/* 3. Agitation, Jetting & Climate */}
        <Card
          title="Submersible Agitation & Climate"
          subtitle="Hydro-shear and robotic cutter assist"
          icon={<Zap className="w-4 h-4 text-amber-400" />}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-medium text-slate-300">Hydro-Jetting Shear</span>
              <Button
                variant={parameters.waterJetEnabled ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => updateParameter('waterJetEnabled', !parameters.waterJetEnabled)}
              >
                {parameters.waterJetEnabled ? 'ENABLED' : 'DISABLED'}
              </Button>
            </div>

            <Slider
              id="param-jet-pressure"
              label="Water Jet Pressure"
              value={parameters.waterJetPressureBar}
              min={0}
              max={250}
              step={5}
              unit="bar"
              disabled={!parameters.waterJetEnabled}
              onChange={(val) => updateParameter('waterJetPressureBar', val)}
              description="High-pressure jetting reduces boundary viscosity by up to 55%."
            />

            <div className="flex items-center justify-between border-b border-slate-800 pb-2 pt-2">
              <span className="text-xs font-medium text-slate-300">Robotic Cutter Drum</span>
              <Button
                variant={parameters.cutterHeadEnabled ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => updateParameter('cutterHeadEnabled', !parameters.cutterHeadEnabled)}
              >
                {parameters.cutterHeadEnabled ? 'ENABLED' : 'DISABLED'}
              </Button>
            </div>

            <Slider
              id="param-cutter-speed"
              label="Cutter Drum RPM"
              value={parameters.cutterHeadSpeedRpm}
              min={0}
              max={600}
              step={20}
              unit="RPM"
              disabled={!parameters.cutterHeadEnabled}
              onChange={(val) => updateParameter('cutterHeadSpeedRpm', val)}
              description="Breaks crust and prevents ragging around intake cowl."
            />

            <Slider
              id="param-ambient-temp"
              label="Ambient Temperature"
              value={parameters.ambientTempC}
              min={-20}
              max={50}
              step={1}
              unit="°C"
              onChange={(val) => updateParameter('ambientTempC', val)}
              description="Low temperatures stiffen hoses and increase motor start current."
            />
          </div>
        </Card>
      </div>
    </div>
  );
};
