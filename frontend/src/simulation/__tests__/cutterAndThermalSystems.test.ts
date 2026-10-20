import { describe, it, expect, beforeEach } from 'vitest';
import { useSimulationStore } from '../../store/useSimulationStore';
import { calculateCutterPhysics } from '../../utils/cutterPhysics';
import { calculateThermalPhysics } from '../../utils/thermalPhysics';
import { DEFAULT_CUTTER_PARAMS } from '../../types/cutterSystem';
import { DEFAULT_THERMAL_PARAMS } from '../../types/thermalManagement';

describe('Rotary Macerator & Thermal Management Multi-Physics Integration', () => {
  beforeEach(() => {
    useSimulationStore.getState().resetSimulation();
  });

  describe('Cutter & Rotary Macerator Physics', () => {
    it('calculates mechanical torque and PMAC electrical draw as function of speed', () => {
      // Nominal speed 1450 RPM at standard 8.5% total solids
      const phys = calculateCutterPhysics(true, 1450, false, 8.5, DEFAULT_CUTTER_PARAMS);
      expect(phys.enabled).toBe(true);
      expect(phys.rpm).toBe(1450);
      expect(phys.isReversed).toBe(false);
      expect(phys.torqueNm).toBeCloseTo(28.98, 1);
      expect(phys.powerKw).toBeGreaterThan(4.0);
      expect(phys.shearRateS).toBe(1160);
      expect(phys.shearThinningFactor).toBeLessThan(0.3);
      expect(phys.particleSizeMm).toBeLessThan(6.0); // Shreds non-biodegradables to <6mm
    });

    it('returns zero load when cutter is disabled', () => {
      const phys = calculateCutterPhysics(false, 1450, false, 8.5, DEFAULT_CUTTER_PARAMS);
      expect(phys.enabled).toBe(false);
      expect(phys.rpm).toBe(0);
      expect(phys.torqueNm).toBe(0);
      expect(phys.powerKw).toBe(0);
      expect(phys.particleSizeMm).toBe(25.0);
    });

    it('toggles direction between forward and reverse anti-jam mode in store', () => {
      const store = useSimulationStore.getState();
      expect(store.cutterTelemetry.isReversed).toBe(false);

      // Trigger anti-jam reverse
      store.toggleCutterReverse();
      let t = useSimulationStore.getState().cutterTelemetry;
      expect(t.isReversed).toBe(true);
      expect(t.mode).toBe('anti_jam');

      // Return forward
      store.toggleCutterReverse();
      t = useSimulationStore.getState().cutterTelemetry;
      expect(t.isReversed).toBe(false);
      expect(t.mode).toBe('continuous');
    });

    it('sets operating modes and synchronizes digital twin speed parameters', () => {
      const store = useSimulationStore.getState();

      store.setCutterMode('shredding');
      let state = useSimulationStore.getState();
      expect(state.cutterTelemetry.rpm).toBe(1800);
      expect(state.cutterTelemetry.mode).toBe('shredding');
      expect(state.parameters.cutterHeadSpeedRpm).toBe(1800);

      store.setCutterMode('standby');
      state = useSimulationStore.getState();
      expect(state.cutterTelemetry.enabled).toBe(false);
      expect(state.cutterTelemetry.rpm).toBe(0);
      expect(state.parameters.cutterHeadEnabled).toBe(false);
    });
  });

  describe('Thermal Management & Sub-Zero Sludge Liquefaction', () => {
    it('demonstrates extreme sub-zero lipid viscosity spike when heater is OFF', () => {
      // Sub-zero ambient temperature at Leh, Ladakh (-12°C)
      const unheated = calculateThermalPhysics(false, -12.0, 18.0, 0, false, DEFAULT_THERMAL_PARAMS);
      expect(unheated.heaterEnabled).toBe(false);
      expect(unheated.effectiveTempC).toBe(-12.0);
      expect(unheated.unheatedViscosityCp).toBeGreaterThan(3000); // Viscosity exceeds 3,000 cP
      expect(unheated.currentViscosityCp).toBe(unheated.unheatedViscosityCp);
      expect(unheated.freezeWarning).toBe(true);
      expect(unheated.compensatedFlowRateM3h).toBe(0);
    });

    it('demonstrates 85%+ apparent viscosity reduction when PTC heating jacket is ENGAGED', () => {
      // Same -12°C sub-zero ambient with PTC heating engaged
      const heated = calculateThermalPhysics(true, -12.0, 18.0, 1450, true, DEFAULT_THERMAL_PARAMS);
      expect(heated.heaterEnabled).toBe(true);
      expect(heated.effectiveTempC).toBeGreaterThanOrEqual(16.0); // Boundary layer warmed to >=16°C
      expect(heated.currentViscosityCp).toBeLessThan(400); // Viscosity drops to <400 cP
      expect(heated.freezeWarning).toBe(false);
      expect(heated.heatingPowerKw).toBe(3.2);
      expect(heated.liquefactionEfficiencyPct).toBeGreaterThan(85.0);
      expect(heated.compensatedFlowRateM3h).toBeGreaterThan(11.0); // Full volumetric flow restored
    });

    it('updates ambient temperature and target setpoints through store actions', () => {
      const store = useSimulationStore.getState();

      store.setAmbientTempC(-8.0);
      expect(useSimulationStore.getState().thermalTelemetry.ambientTempC).toBe(-8.0);
      expect(useSimulationStore.getState().parameters.ambientTempC).toBe(-8.0);

      store.setHeaterEnabled(false);
      expect(useSimulationStore.getState().thermalTelemetry.heaterEnabled).toBe(false);
      expect(useSimulationStore.getState().thermalTelemetry.freezeWarning).toBe(true);

      store.setHeaterEnabled(true);
      expect(useSimulationStore.getState().thermalTelemetry.heaterEnabled).toBe(true);
      expect(useSimulationStore.getState().thermalTelemetry.freezeWarning).toBe(false);
    });
  });

  describe('Unified Navigation and Subsystem View Routing', () => {
    it('supports all primary navigation views without errors', () => {
      const store = useSimulationStore.getState();
      const validViews = [
        'overview',
        'simulation3d',
        'operations',
        'thermal',
        'cutter',
        'compaction',
        'telemetry',
        'terrain',
        'analysis',
        'prototype',
        'reports'
      ] as const;

      validViews.forEach((view) => {
        store.setActiveView(view);
        expect(useSimulationStore.getState().activeView).toBe(view);
      });
    });
  });
});
