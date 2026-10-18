import React, { useState, useMemo } from 'react';
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
  ArrowRight,
  Download,
  Printer,
  Plus,
  Trash2,
  RefreshCw,
  Sliders,
  Activity,
  Gauge,
  Flame,
  FileText,
  Check,
  Zap,
  Info,
  ShieldCheck,
  Search,
  Filter
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';
import { useSimulationStore } from '../../store/useSimulationStore';
import {
  BomItem,
  BomCategory,
  VerificationStatus,
  MachinePrototypeConfig,
  ProposedSensorItem,
  PhysicalTestProcedure,
  DEFAULT_BOM_ITEMS,
  DEFAULT_MACHINE_CONFIG,
  DEFAULT_SENSOR_PLAN,
  DEFAULT_PHYSICAL_TEST_PLAN,
  HARDWARE_PLANNING_DISCLAIMER,
  calculatePrototypeBudget
} from '../../types/prototypePlanning';
import {
  downloadBomCsv,
  downloadSensorPlanCsv,
  downloadTestPlanCsv
} from '../../utils/csvExport';

export const PrototypePlanningView: React.FC = () => {
  // Store actions for simulation parameter propagation
  const updateEngineParameter = useSimulationStore((s) => s.updateEngineParameter);
  const updateParameter = useSimulationStore((s) => s.updateParameter);
  const addEvent = useSimulationStore((s) => s.addEvent);

  // Active navigation tab inside Prototype Planning view
  const [activeTab, setActiveTab] = useState<'bom' | 'config' | 'sensors' | 'tests' | 'report'>('bom');

  // 1. Bill of Materials State
  const [bomItems, setBomItems] = useState<BomItem[]>(DEFAULT_BOM_ITEMS);
  const [bomCategoryFilter, setBomCategoryFilter] = useState<string>('ALL');
  const [bomSearch, setBomSearch] = useState<string>('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // New item draft state
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemCategory, setNewItemCategory] = useState<BomCategory>('Chassis');
  const [newItemName, setNewItemName] = useState('');
  const [newItemFunction, setNewItemFunction] = useState('');
  const [newItemSpec, setNewItemSpec] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState(10000);
  const [newItemNotes, setNewItemNotes] = useState('');
  const [newItemStatus, setNewItemStatus] = useState<VerificationStatus>('PRELIMINARY_ESTIMATE');

  // 2. Machine Prototype Configuration State
  const [machineConfig, setMachineConfig] = useState<MachinePrototypeConfig>(DEFAULT_MACHINE_CONFIG);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'synced'>('idle');

  // 3. Proposed Sensor Plan State
  const [sensorPlan, setSensorPlan] = useState<ProposedSensorItem[]>(DEFAULT_SENSOR_PLAN);
  const [sensorSearch, setSensorSearch] = useState('');

  // 4. Physical Test Plan State
  const [testPlan, setTestPlan] = useState<PhysicalTestProcedure[]>(DEFAULT_PHYSICAL_TEST_PLAN);
  const [testCategoryFilter, setTestCategoryFilter] = useState('ALL');

  // Budget Breakdown calculation
  const budget = useMemo(() => calculatePrototypeBudget(bomItems), [bomItems]);

  // Gross Vehicle Weight derived calculation
  const calculatedSludgeWeightKg = Math.round(machineConfig.collectionTankCapacityL * 1.18);
  const calculatedGvwKg =
    machineConfig.chassisTareMassKg +
    machineConfig.equipmentPayloadMassKg +
    calculatedSludgeWeightKg;

  // Filtered BOM items
  const filteredBom = useMemo(() => {
    return bomItems.filter((item) => {
      const matchCat = bomCategoryFilter === 'ALL' || item.category === bomCategoryFilter;
      const matchSearch =
        bomSearch === '' ||
        item.name.toLowerCase().includes(bomSearch.toLowerCase()) ||
        item.proposedSpec.toLowerCase().includes(bomSearch.toLowerCase()) ||
        item.function.toLowerCase().includes(bomSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [bomItems, bomCategoryFilter, bomSearch]);

  // Filtered Sensors
  const filteredSensors = useMemo(() => {
    return sensorPlan.filter((s) => {
      return (
        sensorSearch === '' ||
        s.measurement.toLowerCase().includes(sensorSearch.toLowerCase()) ||
        s.candidateSensorType.toLowerCase().includes(sensorSearch.toLowerCase()) ||
        s.installationLocation.toLowerCase().includes(sensorSearch.toLowerCase())
      );
    });
  }, [sensorPlan, sensorSearch]);

  // Filtered Tests
  const filteredTests = useMemo(() => {
    return testPlan.filter((t) => {
      return testCategoryFilter === 'ALL' || t.category === testCategoryFilter;
    });
  }, [testPlan, testCategoryFilter]);

  // BOM Categories list
  const categories: BomCategory[] = [
    'Chassis',
    'Mobility',
    'Pump',
    'Motor',
    'Hose',
    'Reel',
    'Tank',
    'Plumbing',
    'Electrical Controls',
    'Instrumentation',
    'Safety Equipment'
  ];

  // Handler: Update BOM item inline
  const handleUpdateBomItem = (id: string, field: keyof BomItem, value: any) => {
    setBomItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'qty' || field === 'unitPriceInr') {
            updated.subtotalInr = updated.qty * updated.unitPriceInr;
          }
          return updated;
        }
        return item;
      })
    );
  };

  // Handler: Delete BOM item
  const handleDeleteBomItem = (id: string) => {
    setBomItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Handler: Add new BOM item
  const handleAddNewItem = () => {
    if (!newItemName.trim()) return;
    const newItem: BomItem = {
      id: `BOM-${(bomItems.length + 1).toString().padStart(2, '0')}`,
      name: newItemName.trim(),
      category: newItemCategory,
      qty: Number(newItemQty) || 1,
      function: newItemFunction.trim() || 'General mechanical assembly component',
      proposedSpec: newItemSpec.trim() || 'Specification pending detailed engineering review',
      unitPriceInr: Number(newItemPrice) || 0,
      subtotalInr: (Number(newItemQty) || 1) * (Number(newItemPrice) || 0),
      compatibilityNotes: newItemNotes.trim() || 'Standard flange / mounting interface',
      verificationStatus: newItemStatus
    };
    setBomItems((prev) => [...prev, newItem]);
    setIsAddingItem(false);
    setNewItemName('');
    setNewItemFunction('');
    setNewItemSpec('');
    setNewItemNotes('');
  };

  // Handler: Reset BOM to defaults
  const handleResetBom = () => {
    if (window.confirm('Reset all Bill of Materials items to engineering baseline estimates?')) {
      setBomItems(DEFAULT_BOM_ITEMS);
    }
  };

  // Handler: Propagate machine configuration to simulation store
  const handlePropagateToSimulation = () => {
    // Propagate parameters
    updateEngineParameter('collectionTankCapacityL', machineConfig.collectionTankCapacityL);
    updateEngineParameter('pumpRatedFlowLpm', machineConfig.pumpRatedFlowLpm);
    updateParameter('hoseLengthM', machineConfig.configuredHoseLengthM);
    updateParameter('hoseDiameterMm', machineConfig.hoseInnerDiameterMm);
    updateParameter('pumpRpm', machineConfig.pumpRatedRpm);

    // Record audit event
    addEvent(
      'info',
      'PROTOTYPE_SYNC',
      `Hardware configuration propagated to simulation engine: Tank=${machineConfig.collectionTankCapacityL}L, Hose=${machineConfig.configuredHoseLengthM}m (Ø${machineConfig.hoseInnerDiameterMm}mm), Pump=${machineConfig.pumpRatedFlowLpm}Lpm @ ${machineConfig.pumpRatedRpm}RPM.`
    );

    setSyncStatus('synced');
    setTimeout(() => setSyncStatus('idle'), 3500);
  };

  // Handler: Update Sensor item status
  const handleUpdateSensorStatus = (id: string, status: any) => {
    setSensorPlan((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
  };

  // Handler: Update Test item status or notes
  const handleUpdateTestItem = (id: string, field: keyof PhysicalTestProcedure, value: any) => {
    setTestPlan((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  // Status badge styling helper
  const getVerificationStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case 'VERIFIED_SPEC':
        return <Badge variant="success" size="sm">VERIFIED SPEC</Badge>;
      case 'VENDOR_QUOTED':
        return <Badge variant="safety" size="sm">VENDOR QUOTED</Badge>;
      case 'PRELIMINARY_ESTIMATE':
        return <Badge variant="warning" size="sm">BUDGET ESTIMATE</Badge>;
      case 'PENDING_REVIEW':
      default:
        return <Badge variant="slate" size="sm">PENDING REVIEW</Badge>;
    }
  };

  return (
    <div className="flex-1 p-3 sm:p-5 space-y-4 overflow-y-auto bg-graphite-950 select-none">
      {/* 1. Header Banner & Disclaimers */}
      <div className="bg-graphite-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-safety-500/10 border border-safety-500/30 text-safety-400">
              <Compass className="w-5 h-5 text-safety-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider font-mono">
                  Hardware Prototype Planning
                </h1>
                <Badge variant="warning" size="sm">
                  SIMULATION → HARDWARE TRANSITION
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Engineering bill of materials, preliminary dimensional sizing, candidate instrumentation, and physical acceptance test plans.
              </p>
            </div>
          </div>

          {/* Quick Actions & CSV Exports */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => downloadBomCsv(bomItems)}
              className="text-xs py-1 px-2.5 flex items-center gap-1.5 text-cyan-300 hover:text-cyan-200"
              title="Download Bill of Materials in CSV format"
            >
              <Download className="w-3.5 h-3.5" />
              BOM CSV
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => downloadSensorPlanCsv(sensorPlan)}
              className="text-xs py-1 px-2.5 flex items-center gap-1.5 text-emerald-300 hover:text-emerald-200"
              title="Download Candidate Sensor Instrumentation Plan in CSV format"
            >
              <Download className="w-3.5 h-3.5" />
              Sensor CSV
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => downloadTestPlanCsv(testPlan)}
              className="text-xs py-1 px-2.5 flex items-center gap-1.5 text-purple-300 hover:text-purple-200"
              title="Download Physical Test Procedures in CSV format"
            >
              <Download className="w-3.5 h-3.5" />
              Test Plan CSV
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => window.print()}
              className="text-xs py-1 px-3 flex items-center gap-1.5"
              title="Print consolidated engineering prototype readiness report"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Report
            </Button>
          </div>
        </div>

        {/* Truth-In-Engineering Alert Notice */}
        <div className="bg-amber-950/40 border border-amber-600/60 rounded-xl p-3 text-xs font-mono text-amber-200 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold uppercase tracking-wider text-[11px] text-amber-300">
              Prototype Engineering Notice & Governance:
            </span>
            <p className="text-[11px] leading-relaxed text-amber-200/90">
              {HARDWARE_PLANNING_DISCLAIMER} Pricing figures are indicative budgetary line-items for domestic Indian MSME sourcing, clearly distinguishing direct component procurement from fabrication labour, test rig rental, and contingency reserves.
            </p>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-800/80 pt-3 font-mono text-xs">
          {[
            { id: 'bom', label: '1. Bill of Materials (BOM)', icon: FileSpreadsheet },
            { id: 'config', label: '2. Machine Configuration & Sync', icon: Sliders },
            { id: 'sensors', label: '3. Candidate Sensor Plan', icon: Gauge },
            { id: 'tests', label: '4. Physical Test Procedures', icon: CheckCircle2 },
            { id: 'report', label: '5. Consolidated Report', icon: FileText }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all font-semibold text-xs border ${
                  isActive
                    ? 'bg-safety-500 text-white border-safety-400 shadow-md shadow-safety-500/20'
                    : 'bg-graphite-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: BILL OF MATERIALS (BOM) & BUDGET BREAKDOWN                     */}
      {/* ===================================================================== */}
      {activeTab === 'bom' && (
        <div className="space-y-4">
          {/* Financial Breakdown Cards Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 font-mono text-xs">
            <div className="bg-graphite-900 border border-slate-800 rounded-xl p-3 shadow-md space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Hardware Direct Cost</span>
              <div className="text-base sm:text-lg font-bold text-cyan-400">
                ₹{budget.hardwareDirectCostInr.toLocaleString('en-IN')}
              </div>
              <span className="text-[9px] text-slate-400">15 Components</span>
            </div>

            <div className="bg-graphite-900 border border-slate-800 rounded-xl p-3 shadow-md space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Fabrication Labour</span>
              <div className="text-base sm:text-lg font-bold text-slate-200">
                ₹{budget.fabricationLabourInr.toLocaleString('en-IN')}
              </div>
              <span className="text-[9px] text-slate-400">Machining & welding</span>
            </div>

            <div className="bg-graphite-900 border border-slate-800 rounded-xl p-3 shadow-md space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Sensor Calibration</span>
              <div className="text-base sm:text-lg font-bold text-emerald-400">
                ₹{budget.sensorInstrumentationInr.toLocaleString('en-IN')}
              </div>
              <span className="text-[9px] text-slate-400">Wiring & bench test</span>
            </div>

            <div className="bg-graphite-900 border border-slate-800 rounded-xl p-3 shadow-md space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Test Rig & Cell Hire</span>
              <div className="text-base sm:text-lg font-bold text-purple-400">
                ₹{budget.labBenchTestingInr.toLocaleString('en-IN')}
              </div>
              <span className="text-[9px] text-slate-400">Proof load & vacuum</span>
            </div>

            <div className="bg-graphite-900 border border-slate-800 rounded-xl p-3 shadow-md space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">15% Contingency</span>
              <div className="text-base sm:text-lg font-bold text-amber-400">
                ₹{budget.contingencyInr.toLocaleString('en-IN')}
              </div>
              <span className="text-[9px] text-slate-400">Unforeseen tooling</span>
            </div>

            <div className="bg-graphite-900 border border-safety-500/50 rounded-xl p-3 shadow-md space-y-1 bg-gradient-to-br from-graphite-900 to-safety-950/30">
              <span className="text-[10px] text-safety-400 uppercase font-bold block">Total Budget Estimate</span>
              <div className="text-base sm:text-lg font-bold text-white">
                ₹{(budget.totalPrototypeBudgetInr / 100000).toFixed(2)} Lakhs
              </div>
              <span className="text-[9px] text-safety-300 font-semibold">
                ₹{budget.totalPrototypeBudgetInr.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* BOM Interactive Filter & Action Controls */}
          <div className="bg-graphite-900 border border-slate-800 rounded-xl p-3 shadow-md flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter components..."
                  value={bomSearch}
                  onChange={(e) => setBomSearch(e.target.value)}
                  className="w-full bg-graphite-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-400 focus:outline-none focus:border-safety-500"
                />
              </div>

              {/* Category Selector Dropdown */}
              <div className="flex items-center gap-1 text-xs font-mono">
                <span className="text-slate-400 text-[11px] mr-1 hidden sm:inline">Category:</span>
                <select
                  value={bomCategoryFilter}
                  onChange={(e) => setBomCategoryFilter(e.target.value)}
                  className="bg-graphite-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-300 focus:outline-none focus:border-safety-500"
                >
                  <option value="ALL">All Categories ({bomItems.length})</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Item Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant={isAddingItem ? 'secondary' : 'primary'}
                size="sm"
                onClick={() => setIsAddingItem(!isAddingItem)}
                className="text-xs py-1 px-3 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                {isAddingItem ? 'Cancel' : 'Add Component'}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetBom}
                className="text-xs py-1 px-2.5 text-slate-400 hover:text-white"
                title="Reset BOM to default research-grounded line-items"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset Defaults
              </Button>
            </div>
          </div>

          {/* Add Component Form Modal/Inline Drawer */}
          {isAddingItem && (
            <div className="bg-graphite-900 border border-safety-500/40 rounded-xl p-4 shadow-xl font-mono text-xs space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white text-xs uppercase flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-safety-400" />
                  Add Hardware Prototype Component
                </span>
                <span className="text-[10px] text-slate-400">Budgetary Line-Item Entry</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Component Name *</label>
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="e.g. Telescopic Outrigger Ram"
                    className="w-full bg-graphite-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-safety-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Subsystem Category</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value as BomCategory)}
                    className="w-full bg-graphite-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-safety-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Verification Status</label>
                  <select
                    value={newItemStatus}
                    onChange={(e) => setNewItemStatus(e.target.value as VerificationStatus)}
                    className="w-full bg-graphite-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-safety-500"
                  >
                    <option value="PRELIMINARY_ESTIMATE">PRELIMINARY ESTIMATE</option>
                    <option value="VENDOR_QUOTED">VENDOR QUOTED</option>
                    <option value="VERIFIED_SPEC">VERIFIED SPEC</option>
                    <option value="PENDING_REVIEW">PENDING REVIEW</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] text-slate-400 block mb-1">Proposed Engineering Specification</label>
                  <input
                    type="text"
                    value={newItemSpec}
                    onChange={(e) => setNewItemSpec(e.target.value)}
                    placeholder="Material grade, displacement, dimensions, voltage rating..."
                    className="w-full bg-graphite-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-safety-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Primary Function</label>
                  <input
                    type="text"
                    value={newItemFunction}
                    onChange={(e) => setNewItemFunction(e.target.value)}
                    placeholder="e.g. Chassis leveling & tip-over prevention"
                    className="w-full bg-graphite-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-safety-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-graphite-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-safety-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Estimated Unit Price (₹ INR)</label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-graphite-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-safety-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Compatibility & Interface Notes</label>
                  <input
                    type="text"
                    value={newItemNotes}
                    onChange={(e) => setNewItemNotes(e.target.value)}
                    placeholder="Coupling type, pin diameter, voltage bus..."
                    className="w-full bg-graphite-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-safety-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button variant="secondary" size="sm" onClick={() => setIsAddingItem(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleAddNewItem}>
                  Add Item to BOM
                </Button>
              </div>
            </div>
          )}

          {/* Editable Bill of Materials Table */}
          <Card
            title={`Physical Prototype Bill of Materials (${filteredBom.length} Items Listed)`}
            subtitle="Click price, qty, or status dropdown to adjust budgetary prototype estimates"
            icon={<FileSpreadsheet className="w-4 h-4 text-safety-500" />}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase bg-graphite-950/60">
                    <th className="py-2.5 px-3">Item ID</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Component Name</th>
                    <th className="py-2.5 px-3">Proposed Specification</th>
                    <th className="py-2.5 px-3">Function & Notes</th>
                    <th className="py-2.5 px-2 text-center w-16">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price (₹)</th>
                    <th className="py-2.5 px-3 text-right">Subtotal (₹)</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-2 text-center w-10">Del</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredBom.map((item) => (
                    <tr key={item.id} className="hover:bg-graphite-850/40 transition">
                      <td className="py-2.5 px-3 text-slate-400 text-[11px]">{item.id}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-1.5 py-0.5 rounded bg-graphite-950 border border-slate-800 text-[10px] text-slate-300">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-white font-bold text-xs">{item.name}</td>
                      <td className="py-2.5 px-3 text-slate-300 text-[11px] max-w-xs">{item.proposedSpec}</td>
                      <td className="py-2.5 px-3 text-slate-400 text-[10px] max-w-xs">
                        <div>{item.function}</div>
                        <div className="text-slate-400 mt-0.5 italic">{item.compatibilityNotes}</div>
                      </td>

                      {/* Editable Qty */}
                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="number"
                          min={1}
                          value={item.qty}
                          onChange={(e) =>
                            handleUpdateBomItem(item.id, 'qty', Math.max(1, parseInt(e.target.value) || 1))
                          }
                          className="w-14 bg-graphite-950 border border-slate-800 rounded px-1 py-1 text-center text-xs text-white focus:outline-none focus:border-safety-500"
                        />
                      </td>

                      {/* Editable Unit Price */}
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          min={0}
                          step={500}
                          value={item.unitPriceInr}
                          onChange={(e) =>
                            handleUpdateBomItem(
                              item.id,
                              'unitPriceInr',
                              Math.max(0, parseInt(e.target.value) || 0)
                            )
                          }
                          className="w-24 bg-graphite-950 border border-slate-800 rounded px-1.5 py-1 text-right text-xs text-emerald-400 font-bold focus:outline-none focus:border-safety-500"
                        />
                      </td>

                      {/* Calculated Subtotal */}
                      <td className="py-2.5 px-3 text-right text-slate-200 font-bold text-xs">
                        ₹{item.subtotalInr.toLocaleString('en-IN')}
                      </td>

                      {/* Editable Status */}
                      <td className="py-2.5 px-3 text-center">
                        <select
                          value={item.verificationStatus}
                          onChange={(e) =>
                            handleUpdateBomItem(item.id, 'verificationStatus', e.target.value as VerificationStatus)
                          }
                          className="bg-graphite-950 border border-slate-800 rounded px-1.5 py-1 text-[10px] font-mono text-slate-300 focus:outline-none focus:border-safety-500"
                        >
                          <option value="PRELIMINARY_ESTIMATE">Budget Estimate</option>
                          <option value="VENDOR_QUOTED">Vendor Quoted</option>
                          <option value="VERIFIED_SPEC">Verified Spec</option>
                          <option value="PENDING_REVIEW">Pending Review</option>
                        </select>
                      </td>

                      {/* Delete action */}
                      <td className="py-2.5 px-2 text-center">
                        <button
                          onClick={() => handleDeleteBomItem(item.id)}
                          className="text-slate-400 hover:text-rose-400 p-1 transition"
                          title="Remove item from BOM"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: MACHINE CONFIGURATION & SIMULATION SYNCHRONIZATION            */}
      {/* ===================================================================== */}
      {activeTab === 'config' && (
        <div className="space-y-4">
          {/* Sync Header Callout */}
          <div className="bg-graphite-900 border border-slate-800 rounded-xl p-4 shadow-md flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-safety-500" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Machine Preliminary Physical Dimensions & Sizing
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Adjust preliminary physical design values. Click "Propagate Configuration" to immediately update the active 3D kinematics and deterministic simulation equations.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {syncStatus === 'synced' && (
                <span className="text-emerald-400 text-xs font-mono font-bold flex items-center gap-1 animate-in fade-in">
                  <Check className="w-4 h-4" />
                  Synchronized with Simulation Twin!
                </span>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={handlePropagateToSimulation}
                className="flex items-center gap-1.5 font-mono text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Propagate to Digital Twin Simulation
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* 1. Dimensions Card */}
            <Card
              title="Chassis Geometry & Clearance"
              subtitle="Envelope restrictions for narrow pedestrian alleyways"
              icon={<Truck className="w-4 h-4 text-cyan-400" />}
            >
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Overall Length (m)</span>
                    <span className="text-white font-bold">{machineConfig.overallLengthM} m</span>
                  </div>
                  <input
                    type="range"
                    min={2.5}
                    max={5.5}
                    step={0.05}
                    value={machineConfig.overallLengthM}
                    onChange={(e) =>
                      setMachineConfig({ ...machineConfig, overallLengthM: parseFloat(e.target.value) })
                    }
                    className="w-full accent-safety-500 bg-graphite-950 h-1.5 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Overall Width (m)</span>
                    <span className={`font-bold ${machineConfig.overallWidthM > 1.6 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {machineConfig.overallWidthM} m
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1.1}
                    max={2.4}
                    step={0.05}
                    value={machineConfig.overallWidthM}
                    onChange={(e) =>
                      setMachineConfig({ ...machineConfig, overallWidthM: parseFloat(e.target.value) })
                    }
                    className="w-full accent-safety-500 bg-graphite-950 h-1.5 rounded cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400">
                    Target ≤ 1.60 m to traverse pedestrian alleyway corridors.
                  </span>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Wheelbase (m)</span>
                    <span className="text-white font-bold">{machineConfig.wheelbaseM} m</span>
                  </div>
                  <input
                    type="range"
                    min={1.5}
                    max={3.5}
                    step={0.05}
                    value={machineConfig.wheelbaseM}
                    onChange={(e) =>
                      setMachineConfig({ ...machineConfig, wheelbaseM: parseFloat(e.target.value) })
                    }
                    className="w-full accent-safety-500 bg-graphite-950 h-1.5 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Ground Clearance (mm)</span>
                    <span className="text-white font-bold">{machineConfig.groundClearanceMm} mm</span>
                  </div>
                  <input
                    type="range"
                    min={150}
                    max={450}
                    step={10}
                    value={machineConfig.groundClearanceMm}
                    onChange={(e) =>
                      setMachineConfig({ ...machineConfig, groundClearanceMm: parseInt(e.target.value) })
                    }
                    className="w-full accent-safety-500 bg-graphite-950 h-1.5 rounded cursor-pointer"
                  />
                </div>
              </div>
            </Card>

            {/* 2. Weight Budget & Payload Analysis */}
            <Card
              title="Mass Budget & Payload Limits"
              subtitle="Weight allocation for mountain slope tractive limits"
              icon={<Scale className="w-4 h-4 text-emerald-400" />}
            >
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Chassis Tare Mass (kg)</span>
                    <span className="text-white font-bold">{machineConfig.chassisTareMassKg} kg</span>
                  </div>
                  <input
                    type="range"
                    min={500}
                    max={1500}
                    step={25}
                    value={machineConfig.chassisTareMassKg}
                    onChange={(e) =>
                      setMachineConfig({ ...machineConfig, chassisTareMassKg: parseInt(e.target.value) })
                    }
                    className="w-full accent-safety-500 bg-graphite-950 h-1.5 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Equipment Payload (kg)</span>
                    <span className="text-white font-bold">{machineConfig.equipmentPayloadMassKg} kg</span>
                  </div>
                  <input
                    type="range"
                    min={200}
                    max={900}
                    step={20}
                    value={machineConfig.equipmentPayloadMassKg}
                    onChange={(e) =>
                      setMachineConfig({ ...machineConfig, equipmentPayloadMassKg: parseInt(e.target.value) })
                    }
                    className="w-full accent-safety-500 bg-graphite-950 h-1.5 rounded cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400">Pump, motor, reel, outriggers & valves.</span>
                </div>

                <div className="p-2.5 rounded-lg bg-graphite-950 border border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Full Slurry Mass (2400L @ 1.18 kg/L):</span>
                    <span className="text-cyan-400 font-bold">{calculatedSludgeWeightKg} kg</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Gross Vehicle Weight (GVW):</span>
                    <span className="text-emerald-400 font-bold">{calculatedGvwKg} kg ({((calculatedGvwKg)/1000).toFixed(2)} t)</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Dry Transport Weight:</span>
                    <span className="text-white font-bold">
                      {machineConfig.chassisTareMassKg + machineConfig.equipmentPayloadMassKg} kg
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* 3. Pumping Parameters & Conduit Card */}
            <Card
              title="Pumping & Conduit Parameters"
              subtitle="Directly integrated with deterministic simulation store"
              icon={<Zap className="w-4 h-4 text-safety-400" />}
            >
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Collection Tank Capacity (L)</span>
                    <span className="text-cyan-400 font-bold">{machineConfig.collectionTankCapacityL} L</span>
                  </div>
                  <input
                    type="range"
                    min={1000}
                    max={6000}
                    step={100}
                    value={machineConfig.collectionTankCapacityL}
                    onChange={(e) =>
                      setMachineConfig({
                        ...machineConfig,
                        collectionTankCapacityL: parseInt(e.target.value)
                      })
                    }
                    className="w-full accent-safety-500 bg-graphite-950 h-1.5 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Configured Hose Length (m)</span>
                    <span className="text-white font-bold">{machineConfig.configuredHoseLengthM} m</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={1}
                    value={machineConfig.configuredHoseLengthM}
                    onChange={(e) =>
                      setMachineConfig({
                        ...machineConfig,
                        configuredHoseLengthM: parseInt(e.target.value)
                      })
                    }
                    className="w-full accent-safety-500 bg-graphite-950 h-1.5 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Hose Internal Diameter (mm)</span>
                    <span className="text-white font-bold">{machineConfig.hoseInnerDiameterMm} mm</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={150}
                    step={5}
                    value={machineConfig.hoseInnerDiameterMm}
                    onChange={(e) =>
                      setMachineConfig({
                        ...machineConfig,
                        hoseInnerDiameterMm: parseInt(e.target.value)
                      })
                    }
                    className="w-full accent-safety-500 bg-graphite-950 h-1.5 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Pump Rated Displacement (L/min)</span>
                    <span className="text-yellow-400 font-bold">{machineConfig.pumpRatedFlowLpm} L/min</span>
                  </div>
                  <input
                    type="range"
                    min={150}
                    max={1000}
                    step={25}
                    value={machineConfig.pumpRatedFlowLpm}
                    onChange={(e) =>
                      setMachineConfig({
                        ...machineConfig,
                        pumpRatedFlowLpm: parseInt(e.target.value)
                      })
                    }
                    className="w-full accent-safety-500 bg-graphite-950 h-1.5 rounded cursor-pointer"
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: CANDIDATE SENSOR INSTRUMENTATION PLAN                         */}
      {/* ===================================================================== */}
      {activeTab === 'sensors' && (
        <div className="space-y-4">
          <div className="bg-graphite-900 border border-slate-800 rounded-xl p-3 shadow-md flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-white uppercase text-xs">
                Proposed Instrumentation Architecture ({sensorPlan.length} Candidate Transducers)
              </span>
            </div>

            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search candidate sensors..."
                value={sensorSearch}
                onChange={(e) => setSensorSearch(e.target.value)}
                className="w-full bg-graphite-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-400 focus:outline-none focus:border-safety-500"
              />
            </div>
          </div>

          <Card
            title="Candidate Sensory Transducers (Digital Twin Telemetry Transition)"
            subtitle="Specifications proposed for prototype telemetry; physical sensors not yet installed or calibrated"
            icon={<Activity className="w-4 h-4 text-emerald-400" />}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase bg-graphite-950/60">
                    <th className="py-2.5 px-3">ID</th>
                    <th className="py-2.5 px-3">Measurement</th>
                    <th className="py-2.5 px-3">Candidate Sensor Type</th>
                    <th className="py-2.5 px-3">Measurement Range</th>
                    <th className="py-2.5 px-3">Interface Signal</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">Calibration / Validation Requirement</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredSensors.map((s) => (
                    <tr key={s.id} className="hover:bg-graphite-850/40 transition">
                      <td className="py-2.5 px-3 text-slate-400 text-[11px] font-semibold">{s.id}</td>
                      <td className="py-2.5 px-3 text-white font-bold text-xs">{s.measurement}</td>
                      <td className="py-2.5 px-3 text-cyan-300 text-[11px] font-medium">{s.candidateSensorType}</td>
                      <td className="py-2.5 px-3 text-amber-300 text-[11px]">{s.measurementRange}</td>
                      <td className="py-2.5 px-3 text-slate-300 text-[11px]">{s.interfaceSignal}</td>
                      <td className="py-2.5 px-3 text-slate-400 text-[10px] max-w-xs">{s.installationLocation}</td>
                      <td className="py-2.5 px-3 text-slate-400 text-[10px] max-w-xs">{s.calibrationRequirement}</td>
                      <td className="py-2.5 px-3 text-center">
                        <select
                          value={s.status}
                          onChange={(e) => handleUpdateSensorStatus(s.id, e.target.value)}
                          className="bg-graphite-950 border border-slate-800 rounded px-1.5 py-1 text-[10px] font-mono text-slate-300 focus:outline-none focus:border-safety-500"
                        >
                          <option value="PROPOSED_CANDIDATE">Proposed Candidate</option>
                          <option value="BENCH_EVALUATION">Bench Evaluation</option>
                          <option value="INTEGRATION_PENDING">Integration Pending</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: PHYSICAL TEST PROCEDURES & ACCEPTANCE CRITERIA                */}
      {/* ===================================================================== */}
      {activeTab === 'tests' && (
        <div className="space-y-4">
          <div className="bg-graphite-900 border border-slate-800 rounded-xl p-3 shadow-md flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white uppercase text-xs">
                Physical Acceptance Test Plan ({testPlan.length} Bench Verification Procedures)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">Category:</span>
              <select
                value={testCategoryFilter}
                onChange={(e) => setTestCategoryFilter(e.target.value)}
                className="bg-graphite-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-300 focus:outline-none focus:border-safety-500"
              >
                <option value="ALL">All Categories</option>
                {Array.from(new Set(testPlan.map((t) => t.category))).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {filteredTests.map((test) => (
              <div
                key={test.id}
                className="bg-graphite-900 border border-slate-800 rounded-xl p-4 shadow-md font-mono text-xs space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-graphite-950 border border-slate-800 text-[10px] font-bold text-safety-400">
                      {test.id}
                    </span>
                    <h3 className="text-xs font-bold text-white">{test.name}</h3>
                    <span className="text-[10px] text-slate-400">({test.category})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">Execution Status:</span>
                    <select
                      value={test.status}
                      onChange={(e) => handleUpdateTestItem(test.id, 'status', e.target.value)}
                      className="bg-graphite-950 border border-slate-800 rounded px-2 py-1 text-[10px] font-mono text-cyan-300 font-semibold focus:outline-none focus:border-safety-500"
                    >
                      <option value="PROCEDURE_READY">Procedure Ready</option>
                      <option value="BENCH_IN_PROGRESS">Bench In Progress</option>
                      <option value="AWAITING_PHYSICAL_CELL">Awaiting Test Cell</option>
                      <option value="NOT_STARTED">Not Started</option>
                    </select>
                  </div>
                </div>

                <div className="text-[11px] text-slate-300">
                  <strong className="text-slate-400">Objective:</strong> {test.purpose}
                </div>

                {/* Procedure Steps List */}
                <div className="bg-graphite-950 p-2.5 rounded-lg border border-slate-800/80 text-[11px] space-y-1">
                  <span className="font-semibold text-slate-400 uppercase text-[10px] block">
                    Step-by-Step Procedure:
                  </span>
                  <ol className="list-decimal list-inside space-y-0.5 text-slate-300 pl-1">
                    {test.procedureSteps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </div>

                {/* Acceptance Limits & Verification Method */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded bg-graphite-950 border border-slate-800 space-y-0.5">
                    <span className="text-[10px] text-amber-400 font-bold uppercase block">
                      Acceptance Criteria & Pass Limit:
                    </span>
                    <p className="text-slate-200">{test.acceptanceCriteria}</p>
                    <div className="text-[10px] text-emerald-400 font-bold mt-1">
                      Limit: {test.acceptanceLimit}
                    </div>
                  </div>

                  <div className="p-2 rounded bg-graphite-950 border border-slate-800 space-y-0.5">
                    <span className="text-[10px] text-cyan-400 font-bold uppercase block">
                      Instrumentation & Verification Method:
                    </span>
                    <p className="text-slate-200">{test.verificationMethod}</p>
                    <div className="text-[10px] text-slate-400 mt-1 italic">
                      Notes: {test.preliminaryNotes}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: CONSOLIDATED PRINTABLE REPORT                                  */}
      {/* ===================================================================== */}
      {activeTab === 'report' && (
        <div className="bg-graphite-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 font-mono text-xs max-w-5xl mx-auto">
          {/* Header */}
          <div className="border-b border-slate-800 pb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-white uppercase tracking-wider">
                Smart India Hackathon 2024 — Problem Statement SIH26258
              </div>
              <h1 className="text-lg font-bold text-safety-400 mt-0.5">
                Mechanized Desludging Prototype Planning & Engineering Readiness Dossier
              </h1>
              <div className="text-[11px] text-slate-400 mt-1">
                Target: Challenging Climatic Zones & Hilly Terrains | Status: Transition from Digital Twin to Physical Hardware
              </div>
            </div>

            <Button variant="primary" size="sm" onClick={() => window.print()} className="flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5" />
              Print / Save as PDF
            </Button>
          </div>

          {/* Section A: Executive Summary */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-wider border-b border-slate-800 pb-1">
              1. Executive Engineering Summary
            </h2>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              This document establishes the hardware transition baseline for the mechanized desludging digital twin. The proposed design features a narrow-gauge (1.35m track width) articulated chassis, 2,400L vacuum containment tank, 500 L/min positive displacement lobe pump, and 35m suction umbilical conduit. All financial allocations are preliminary budgetary estimates grounded in Indian MSME fabrication capabilities. No physical component has been certified as manufactured or field-tested.
            </p>
          </div>

          {/* Section B: Financial Summary Table */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-wider border-b border-slate-800 pb-1">
              2. Prototype Capital Expenditure (CAPEX) Summary
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-graphite-950 p-3 rounded-xl border border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 block">Direct Hardware BOM:</span>
                <span className="font-bold text-white text-sm">₹{budget.hardwareDirectCostInr.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Fabrication & Machining:</span>
                <span className="font-bold text-white text-sm">₹{budget.fabricationLabourInr.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Instrumentation & Test Rig:</span>
                <span className="font-bold text-white text-sm">
                  ₹{(budget.sensorInstrumentationInr + budget.labBenchTestingInr).toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-safety-400 font-bold block">Gross Prototype Budget:</span>
                <span className="font-bold text-safety-400 text-sm">₹{budget.totalPrototypeBudgetInr.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Section C: Target Machine Specifications */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-wider border-b border-slate-800 pb-1">
              3. Target Physical Machine Configuration
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-graphite-950 p-3 rounded-xl border border-slate-800 text-[11px]">
              <div><span className="text-slate-400">Dimensions (L×W×H):</span> <span className="text-white">{machineConfig.overallLengthM} × {machineConfig.overallWidthM} × {machineConfig.overallHeightM} m</span></div>
              <div><span className="text-slate-400">Track Width:</span> <span className="text-white">{machineConfig.trackWidthM} m (Alleyway compatible)</span></div>
              <div><span className="text-slate-400">Ground Clearance:</span> <span className="text-white">{machineConfig.groundClearanceMm} mm</span></div>
              <div><span className="text-slate-400">Tare Chassis Mass:</span> <span className="text-white">{machineConfig.chassisTareMassKg} kg</span></div>
              <div><span className="text-slate-400">Rated Tank Capacity:</span> <span className="text-cyan-400 font-bold">{machineConfig.collectionTankCapacityL} L</span></div>
              <div><span className="text-slate-400">Max Gross Vehicle Weight:</span> <span className="text-emerald-400 font-bold">{calculatedGvwKg} kg ({((calculatedGvwKg)/1000).toFixed(2)} t)</span></div>
              <div><span className="text-slate-400">Suction Conduit:</span> <span className="text-white">{machineConfig.configuredHoseLengthM} m (Ø{machineConfig.hoseInnerDiameterMm} mm)</span></div>
              <div><span className="text-slate-400">Vacuum Pump Displacement:</span> <span className="text-yellow-400 font-bold">{machineConfig.pumpRatedFlowLpm} L/min @ {machineConfig.pumpRatedRpm} RPM</span></div>
              <div><span className="text-slate-400">Max Static Suction Lift:</span> <span className="text-white">{machineConfig.maxStaticSuctionLiftM} m</span></div>
            </div>
          </div>

          {/* Section D: Physical Verification Sign-off Gate */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-wider border-b border-slate-800 pb-1">
              4. Physical Test Gate Checklist & Governance Sign-Off
            </h2>
            <p className="text-[11px] text-slate-400">
              The following 8 physical verification gates must be executed on the physical prototype rig prior to municipal field demonstration:
            </p>
            <div className="space-y-1.5">
              {testPlan.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-2 rounded bg-graphite-950 border border-slate-800 text-[11px]">
                  <span className="text-white font-semibold">{t.id}: {t.name}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                    Status: {t.status.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
