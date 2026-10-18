# Innovative Mechanized Desludging Models for Varied Climatic Zones and Hilly Terrains

An intelligent decision-support system and multi-physics simulation platform engineered to select, evaluate, and optimize mechanized desludging equipment for non-sewered sanitation facilities across challenging mountain topographies and extreme climatic zones.

---

## 1. Project Overview & Central Innovation

Over 3.5 billion people worldwide rely on on-site sanitation (septic tanks, soak pits, and leach vaults). In steep mountain settlements (e.g. Himalayas, Andes, Western Ghats) and rural environments, conventional municipal vacuum trucks fail completely due to narrow pathways (< 1.5 m), steep slopes (> 15°), and freezing or monsoon extremes. When mechanization fails, workers are subjected to hazardous, illegal **manual scavenging and confined-space pit entry**.

### Key Innovations of this Decision Support System:
1. **Adaptive Rule-Based Recommendation Engine**: Evaluates six specialized equipment configurations (compact motorized units, portable skids, modular trailers, 4x4 mini-tankers, robotic crawlers, and packable systems) and enforces **hard physical feasibility gatekeepers** before ranking alternatives.
2. **Multi-Physics Hydraulic Calculations**: Implements exact, traceable SI equations for non-Newtonian Bingham-plastic sludge rheology, Darcy-Weisbach / Swamee-Jain pipeline friction head loss, Total Dynamic Head (TDH), brake and hydraulic power, cycle times, and operational costs.
3. **Dual Interactive 3D Multi-Physics Simulation Environments**:
   - **Environment 1: Mountain Slope & Vehicle Stability Simulator** (`Simulation3D.tsx`): Real-time WebGL simulation of the narrow all-terrain crawler ascending 20°–30° Himalayan switchback slopes (Uttarakhand, Himachal, Ladakh presets), featuring dynamic anti-slosh longitudinal baffles (-88.9% surge suppression), low-CoM battery pack, 3D static rollover safety pyramid, and emergency brake tests.
   - **Environment 2: Subsurface Vault & Robotic Fluidization Digital Twin** (`SubsurfaceVaultSim3D.tsx`): Complete underground confined-space concrete septic vault (ISO 21876 / OSHA 1910.146 compliant). Simulates submersible Bandicoot-class 6-DOF robotic crawler with tungsten-carbide macerator teeth, dual 70-bar hydro-jet crust liquefaction spray particles, suction vortex slurry currents, real-time Net Positive Suction Head ($NPSHa$ vs $NPSHr$) cavitation diagnostics, differential 4-gas atmospheric dispersion ($H_2S, CH_4, CO, O_2$), and forced-air mechanical ventilation dilution.
4. **Interactive 2D Terrain SVG Simulation**: Dynamic cross-section profile illustrating slope angle, pit geometry, fluid layers, hose routing, animated fluid flow, operational stages, and dynamic weather particle overlays (rain downpours, sub-zero snow, arid dust).
5. **GIS Route & Access Corridor Planner**: Interactive Leaflet OpenStreetMap integration comparing vehicular approach versus portable carry-in deployment.
6. **Worker Safety & Enforced Zero-Entry Mandate**: Calculates critical static rollover tip angles ($\theta_{\text{tip}}$), quantifies toxic biogas risks ($H_2S, CH_4$), mandates 30mA GFCI electrical protection, specifies standard-certified PPE, and strictly enforces zero human pit entry.
7. **Persistence & Printable Engineering Reports**: SQLite database storage for simulation scenarios, CSV export streaming, and print-to-PDF engineering report generation.
8. **100% Local & Offline**: Requires zero paid APIs, zero proprietary cloud services, and zero dedicated AI hardware. Runs entirely on a standard Windows laptop.

---

## 2. Technology Stack

- **Frontend**: React 18, TypeScript 5.4, Vite 5.2, Tailwind CSS 3.4.
- **3D & 2D Visualization**: Three.js (WebGL GPU 3D simulation with OrbitControls), Recharts 2.12, Custom Dynamic SVG Engine.
- **Geographic Mapping**: Leaflet 1.9 with OpenStreetMap tile streaming.
- **Backend API**: Python 3.14, FastAPI 0.110, Uvicorn 0.28.
- **Scientific Computations**: NumPy 2.5 (vectorized hydraulics and rheology).
- **Database**: SQLite 3 (embedded ACID relational persistence).
- **Test Automation**: Pytest 9.1 (22/22 tests passing).

---

## 3. System Architecture

```
sih 26258/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application entrypoint & lifespan
│   │   ├── database.py          # SQLite persistence & scenario storage
│   │   ├── models/
│   │   │   ├── site.py          # SiteConditions Pydantic schema & validations
│   │   │   ├── equipment.py     # 6 EquipmentProfiles & baseline catalog
│   │   │   └── scenario.py      # Scenario CRUD request/response models
│   │   ├── services/
│   │   │   ├── calculations.py  # Sludge rheology, TDH, power, cost & time
│   │   │   ├── recommendation.py# Hard gatekeeper & multi-criteria utility
│   │   │   ├── safety.py        # Gas hazards, rollover tip angle & PPE
│   │   │   └── ai_advisor.py    # Deterministic engineering diagnosis
│   │   └── routers/
│   │       ├── equipment.py     # GET/PUT equipment specs & assumptions
│   │       ├── calculate.py     # Single & batch calculation endpoints
│   │       ├── recommend.py     # Multi-objective ranking endpoint
│   │       └── scenarios.py     # Presets, database CRUD & CSV export
│   ├── tests/
│   │   ├── test_calculations.py # Volume, flow, head, power, cost unit tests
│   │   ├── test_recommendations.py # Gate constraints & ranking order tests
│   │   ├── test_scenarios.py    # 5 benchmark climate/terrain scenario tests
│   │   └── test_api.py          # FastAPI endpoints, health & CSV tests
│   ├── pytest.ini               # Pytest configuration
│   └── requirements.txt         # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx             # Header, preset selector & navigation
│   │   │   ├── Dashboard.tsx          # Key metrics, KPIs, flow chart
│   │   │   ├── SiteAssessmentForm.tsx # Input form with physical bounds checks
│   │   │   ├── TerrainSimulationSVG.tsx# 2D cross-section SVG simulation
│   │   │   ├── Simulation3D.tsx       # 3D Mountain Road & Vehicle Stability Simulator
│   │   │   ├── vaultSimulation/       # Complete 3D Subsurface Vault & Robotics Simulator
│   │   │   │   ├── SubsurfaceVaultSim3D.tsx # Primary vault simulation & HUD component
│   │   │   │   ├── vaultGeometry.ts   # Dual-chamber vault, Bandicoot ROV & gantry meshes
│   │   │   │   ├── vaultPhysics.ts    # Bingham rheology, cavitation NPSH & OSHA 4-gas
│   │   │   │   ├── vaultParticles.ts  # GPU hydro-jet, slurry vortex & gas cloud particles
│   │   │   │   ├── vaultAudio.ts      # Web Audio procedural sound synthesizer
│   │   │   │   └── vaultTextures.ts   # Procedural PBR cast-iron, rebar & concrete textures
│   │   │   ├── RouteAccessPlanner.tsx # Leaflet GIS map & access corridor
│   │   │   ├── EquipmentComparison.tsx# Side-by-side matrix & weight sliders
│   │   │   ├── SafetyPanel.tsx        # Confined space, gas & tip angle panel
│   │   │   ├── AiAdvisorCard.tsx      # Deterministic AI recommendation card
│   │   │   ├── ScenarioManager.tsx    # Save/load/duplicate modal
│   │   │   └── EngineeringReport.tsx  # Printable formal engineering report
│   │   ├── services/api.ts            # Typed REST API client
│   │   ├── types/index.ts             # TypeScript interface definitions
│   │   ├── App.tsx                    # Main state orchestrator
│   │   └── main.tsx                   # React root entry
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── docs/                              # Complete Academic & Engineering Documentation
│   ├── problem_statement.md           # Problem definition & global sanitation
│   ├── literature_review.md           # Research themes & identified gaps
│   ├── system_architecture.md         # Architecture diagrams & component mapping
│   ├── engineering_methodology.md     # Equations, units, and assumptions
│   ├── equipment_selection.md         # 6 equipment profiles & specs
│   ├── simulation_scenarios.md        # 5 benchmark scenarios
│   ├── safety_and_environment.md      # Gas hazards, rollover & PPE matrix
│   ├── testing_and_validation.md      # Test matrix & command execution logs
│   ├── results_and_discussion.md      # Results analysis & model limitations
│   ├── future_scope.md                # IoT sensors & physical testing roadmap
│   ├── references.md                  # Genuine academic & standards citations
│   ├── presentation_deck.md           # 12-slide presentation outline
│   ├── demonstration_script.md        # Step-by-step evaluator demo guide
├── dashboard/                         # TERRA-VAC 450 Multi-Physics Desludging Simulation Dashboard
│   ├── index.html                     # Interactive HTML5 Canvas physics engine & SCADA telemetry
│   └── README.md                      # Detailed technical documentation & operating guide
└── README.md
```

---

## 4. TERRA-VAC 450 Simulation Dashboard

The repository includes a dedicated standalone simulation dashboard (`dashboard/index.html`) engineered for Problem Statement **SIH26258** (Ministry of Jal Shakti / SBM 2.0 / NAMASTE compliance).

### Core Simulation Capabilities:
- **Hillside Rollover & Slope Incline**: Live Center of Mass (CoM) trajectory, dynamic anti-slosh baffle damping, and static tipping margin ($h\tan\theta < b/2$) up to $35^\circ$.
- **Automated Piston Dewatering Ram (12.8 kN / 3.5 bar)**: Real-time ballscrew displacement squeezing raw slurry against a $150\,\mu\text{m}$ wedge-wire screen, expelling $68\%$ free water to soakage and concentrating cake from $4.2\%$ to $22.8\%\text{ TS}$ ($3.2\times$ payload capacity).
- **Progressive Cavity Screw Pump (PCP) vs. Vacuum Cavitation**: Animated cutaway demonstrating mechanical displacement at $3,500\text{m}$ altitude (Leh) with zero cavitation loss.
- **Cold-Climate Rheology & PTC Heating**: $1,450\text{ RPM}$ Tungsten-Carbide cutter and $+18^\circ\text{C}$ thermal boundary layer liquefaction down to $-15^\circ\text{C}$.
- **Ex-d Zone 1 Gas Telemetry**: OSHA-compliant $\text{H}_2\text{S}$ ($<10\text{ ppm}$) and $\text{CH}_4$ ($<10\%\text{ LEL}$) sniffer telemetry for zero-manual scavenging.

To run the simulation dashboard:
```bash
python -m http.server 8000 --directory dashboard
# Open http://localhost:8000
```
*(Also accessible directly via Vite frontend static route at `http://localhost:5173/dashboard.html`)*

---

## 5. Quick Start & Installation Guide

### Prerequisites
- Python 3.10+ (Tested under Python 3.14.6)
- Node.js 18+ (Tested under Node.js v24.21.0)
- Windows PowerShell / Command Prompt

### Step 1: Clone or Navigate to the Workspace
```powershell
cd "c:\Users\kedia\Downloads\sih 26258"
```

### Step 2: Setup & Run Backend
```powershell
cd backend
# Create virtual environment if not already present
python -m venv venv
.\venv\Scripts\pip install -r requirements.txt

# Start the FastAPI server (Port 8000)
.\venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend API interactive documentation is available at `http://127.0.0.1:8000/docs`.*

### Step 3: Setup & Run Frontend
In a separate terminal window:
```powershell
cd "c:\Users\kedia\Downloads\sih 26258\frontend"
npm install
npm run dev
```
*Open your browser at `http://localhost:3000` to interact with the system.*

---

## 5. Running Automated Verification Tests

### Execute Backend Pytest Suite
```powershell
cd "c:\Users\kedia\Downloads\sih 26258\backend"
.\venv\Scripts\python -m pytest -v
```
**Result**: 21 passed in ~0.50s.

### Execute Frontend TypeScript & Production Build
```powershell
cd "c:\Users\kedia\Downloads\sih 26258\frontend"
npm run build
```
**Result**: Built cleanly in 4.8s with 0 errors.

---

## 6. The Five Reference Benchmark Scenarios

The system includes pre-configured, peer-reviewed engineering benchmarks accessible via the top dropdown:
1. **Himalayan Hillside Settlement (Shimla / Leh)**: 24° slope, -3°C sub-zero cold, 1.2m gravel corridor. Selects portable diaphragm pump or tracked crawler; rejects heavy tankers due to rollover limits.
2. **Narrow Mountain Village Alley (Uttarakhand / Gangtok)**: 28° stepped incline, 0.85m corridor, 20% TS thick crust. Selects narrow robotic crawler or portable unit; mandates water jet fluidization.
3. **Monsoon-Affected Rural Settlement (Kerala / Assam)**: 42 mm/h torrential rain, saturated mud tracks, high groundwater table. Selects flotation-tire trailer with water-diversion barrier and GFCI breakers.
4. **Hot and Dusty Arid Region (Thar Desert / Kutch)**: 44°C ambient heat, dehydrated 26% TS crust, acute water scarcity. Evaluates pre-dilution requirements and secondary air filtration.
5. **Flat Peri-Urban Settlement (Delhi / Pune Outskirts)**: Paved 2.8m roadway, large 6000L institutional vault. Selects high-capacity 4x4 vacuum tanker for rapid turnaround.

---

## 7. Troubleshooting

| Issue | Likely Cause | Solution |
|---|---|---|
| Frontend shows `DISCONNECTED` badge | Backend server is not running on port 8000 | Ensure Uvicorn is active on `http://127.0.0.1:8000` |
| Pytest `ModuleNotFoundError: No module named 'app'` | `PYTHONPATH` not registered | Run via `python -m pytest -v` inside the `backend` folder where `pytest.ini` exists |
| Leaflet map tiles blank | Offline / restricted internet firewall | The application remains fully functional with manual route distance fallback entry |
| Port 8000 or 3000 in use | Another service is using the port | Run Uvicorn with `--port 8001` and update `vite.config.ts` proxy target |

---

## 8. License & Academic Integrity
Developed as a scientific demonstration and academic submission for the Smart India Hackathon / Sanitation Systems Engineering evaluation. Built in compliance with ISO 21876, ISO 24521, and OSHA 1910.146.
