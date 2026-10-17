# Climate & Terrain Simulation Benchmark Scenarios

## 1. Overview of Standard Engineering Scenarios
To ensure robust, reproducible testing and transparent decision-making, the system establishes five standardized reference scenarios spanning distinct microclimates, slopes, road widths, and sludge states.

---

## 2. Benchmark Scenario 1: Himalayan Hillside Settlement (Shimla / Leh)
- **Geographic Profile**: High-altitude alpine slope ($2,200 \text{ m}$ ASL), $24.0^\circ$ terrain gradient, $1.2 \text{ m}$ access road width with loose gravel and rock outcrops.
- **Climate Conditions**: Cold and freezing climate zone, $-3.0^\circ\text{C}$ ambient temperature, $0 \text{ mm/h}$ rainfall.
- **Sludge & Containment**: $3,500 \text{ L}$ containment vault, viscous digest consistency, $16.0\%$ Total Solids, $4.2 \text{ m}$ suction lift, $50.0 \text{ m}$ hose line.
- **Key Bottlenecks**:
  1. $24.0^\circ$ gradient strictly violates the $14^\circ$ and $15^\circ$ stability limits of wheeled tankers (EQ-01, EQ-04), risking severe rollover.
  2. Sub-zero temperatures risk freezing water inside pump impellers and hoses.
  3. Elevated altitude ($2,200 \text{ m}$) degrades naturally aspirated engine power by $\sim 8.8\%$.
- **Simulation Decision & Recommendation**:
  - **Selected Model**: **EQ-02 (Portable High-Lift Diaphragm & Trash Pump)** or **EQ-05 (Tracked Crawler)**.
  - **Feasibility Status**: Feasible (Composite Score: $84.2/100$).
  - **Calculated Results**: Effective Flow: $3.4 \text{ m}^3/\text{h}$; Total Dynamic Head: $25.8 \text{ m}$; Cycle Time: $3.8 \text{ hrs}$; Estimated Cost: $\$242.00$.
  - **Mitigation Requirement**: Winch-assisted tethering; mandatory thermal hose foam wraps and immediate air-purge post-pumping.

---

## 3. Benchmark Scenario 2: Narrow Mountain Village Lane (Uttarakhand / Gangtok)
- **Geographic Profile**: Mountainous village ($1,750 \text{ m}$ ASL), $28.0^\circ$ stepped slope, ultra-narrow $0.85 \text{ m}$ stone corridor.
- **Climate Conditions**: Temperate climate, $12.0^\circ\text{C}$ temperature.
- **Sludge & Containment**: $2,500 \text{ L}$ pit, thick crust scum ($20.0\%$ TS), $5.0 \text{ m}$ suction depth, $75 \text{ m}$ hose distance, $250 \text{ L}$ water available.
- **Key Bottlenecks**:
  1. $0.85 \text{ m}$ corridor width eliminates all units wider than $0.75 \text{ m}$ (EQ-01, EQ-03, EQ-04 rejected).
  2. $28.0^\circ$ stepped pedestrian pathway cannot be negotiated by wheeled machinery.
  3. Solidified thick crust requires mechanical mastication or water jet slurrying.
- **Simulation Decision & Recommendation**:
  - **Selected Model**: **EQ-05 (Remote Tracked Crawler)** or **EQ-02 (Portable High-Lift Diaphragm)**.
  - **Feasibility Status**: Feasible (Composite Score: $86.5/100$).
  - **Calculated Results**: Effective Flow: $5.2 \text{ m}^3/\text{h}$; Total Dynamic Head: $36.4 \text{ m}$; Cycle Time: $3.2 \text{ hrs}$; Estimated Cost: $\$286.00$.
  - **Mitigation Requirement**: On-site water injection to homogenize crust; robotic remote crawler operates without worker entry.

---

## 4. Benchmark Scenario 3: Monsoon-Affected Rural Settlement (Kerala / Assam)
- **Geographic Profile**: Lowland rolling plain ($80 \text{ m}$ ASL), $10.0^\circ$ slope, $1.6 \text{ m}$ waterlogged mud access track.
- **Climate Conditions**: Tropical monsoon zone, $27.0^\circ\text{C}$ temperature, torrential $42.0 \text{ mm/h}$ rainfall intensity.
- **Sludge & Containment**: $4,000 \text{ L}$ pit, slurry consistency ($10.0\%$ TS), $3.0 \text{ m}$ suction lift, $40 \text{ m}$ hose line.
- **Key Bottlenecks**:
  1. Saturated wet mud track causes severe wheel slip and axle sinking for standard commercial trucks.
  2. Heavy rainfall creates severe slip hazards around the pit mouth and electrical short hazards for non-IP54 equipment.
  3. Flooding risk: rain runoff ingress into the open pit during desludging.
- **Simulation Decision & Recommendation**:
  - **Selected Model**: **EQ-03 (Modular ATV Trailer with Flotation Tires)**.
  - **Feasibility Status**: Feasible (Composite Score: $89.0/100$).
  - **Calculated Results**: Effective Flow: $7.6 \text{ m}^3/\text{h}$; Total Dynamic Head: $11.2 \text{ m}$; Cycle Time: $2.6 \text{ hrs}$; Estimated Cost: $\$195.00$.
  - **Mitigation Requirement**: Wide flotation tires to prevent sinking; deploy water diversion barrier around pit; mandatory 30mA GFCI protection.

---

## 5. Benchmark Scenario 4: Hot & Dusty Arid Rural Region (Thar Desert / Kutch)
- **Geographic Profile**: Flat desert terrain ($220 \text{ m}$ ASL), $2.0^\circ$ slope, $2.4 \text{ m}$ gravel/sand access road.
- **Climate Conditions**: Hot arid desert, $44.0^\circ\text{C}$ ambient heat, heavy airborne dust, $0 \text{ mm/h}$ rain.
- **Sludge & Containment**: $5,000 \text{ L}$ dry containment vault, thick dehydrated crust ($26.0\%$ TS), $3.8 \text{ m}$ lift, acute water scarcity ($40 \text{ L}$ water on site).
- **Key Bottlenecks**:
  1. Dehydrated sludge crust with low moisture cannot be mobilized by standard suction alone.
  2. Extreme $44.0^\circ\text{C}$ ambient temperature causes engine heat-soak and biological odor volatilization.
  3. High dust concentration clogs engine air intakes.
- **Simulation Decision & Recommendation**:
  - **Selected Model**: **EQ-01 (Compact Motorized VacuTug)** or **EQ-04 (Narrow Tanker)**.
  - **Feasibility Status**: Feasible with warnings (Composite Score: $78.5/100$).
  - **Calculated Results**: Effective Flow: $4.2 \text{ m}^3/\text{h}$; Total Dynamic Head: $9.8 \text{ m}$; Cycle Time: $3.4 \text{ hrs}$; Estimated Cost: $\$218.00$.
  - **Mitigation Requirement**: Secondary cyclonic engine air pre-filter; external water bowser required for pre-dilution.

---

## 6. Benchmark Scenario 5: Flat Urban / Peri-Urban Settlement (Delhi / Pune Outskirts)
- **Geographic Profile**: Urban paved street ($350 \text{ m}$ ASL), $1.0^\circ$ flat terrain, $2.8 \text{ m}$ road width.
- **Climate Conditions**: Tropical humid, $31.0^\circ\text{C}$ ambient temperature.
- **Sludge & Containment**: $6,000 \text{ L}$ large institutional septic vault, slurry consistency ($12.0\%$ TS), $2.8 \text{ m}$ lift, $20 \text{ m}$ hose line.
- **Key Bottlenecks**:
  1. High sludge volume ($6.0 \text{ m}^3$) requires large volumetric throughput to avoid multi-trip delays.
  2. Urban traffic congestion and odor sensitivity require rapid cycle completion and sealed containment.
- **Simulation Decision & Recommendation**:
  - **Selected Model**: **EQ-04 (4x4 Narrow-Chassis Commercial Vacuum Tanker 2,000L)**.
  - **Feasibility Status**: Feasible (Composite Score: $92.4/100$).
  - **Calculated Results**: Effective Flow: $16.8 \text{ m}^3/\text{h}$; Total Dynamic Head: $7.4 \text{ m}$; Cycle Time: $1.9 \text{ hrs}$; Estimated Cost: $\$224.00$.
  - **Mitigation Requirement**: Deploy roadside high-visibility cones; carbon canister odor scrubber on vacuum pump exhaust.

---

## 7. Interactive 3D WebGL Multi-Physics Simulation
- **Engine**: Three.js WebGL GPU-accelerated renderer with dynamic OrbitControls, soft shadows, and procedural lighting.
- **Mountain Alley Geometry**:
  - Procedural $0^\circ$–$35^\circ$ slope ramp modeling narrow $1.4\text{ m}$ pedestrian alleyways (Shimla / Mussoorie / Aizawl).
  - Flanked by textured stone retaining walls, uphill cottage, and cutaway concrete septic containment vault.
- **Desludging Rig Mechanical Model**:
  - Tracked chassis frame with caterpillar treads and wheel rims.
  - Translucent 400L holding tank with adjustable cutaway opacity slider ($10\%$ to $90\%$).
  - Dual internal longitudinal and transverse anti-slosh baffles dividing the tank into 3 compartments.
  - Under-chassis low-CoM lithium battery enclosure ($h = 0.15\text{ m}$) with toggleable high-mounted comparison mode ($h = 0.82\text{ m}$).
- **Free-Surface Fluid Slosh Mechanics**:
  - Baffled mode: Suppresses liquid surge moment by $88.9\%$ ($I_0/9$), keeping fluid stabilized within sub-compartments ($\Delta x \le 0.9\text{ cm}$).
  - Unbaffled mode: Free-surface surge moves liquid toward the rear tank head, shifting Center-of-Mass rearward by up to $7.9\text{ cm}$.
  - Kinematic tip-over rollover disaster simulated in real time if slope angle exceeds critical rollover threshold ($34.2^\circ$ baffled vs $21.8^\circ$ unbaffled).
- **Environmental Particles**:
  - 3D falling snow particles with wind drift for sub-zero alpine conditions.
  - High-velocity vertical rain streaks for heavy monsoon downpours.
  - Live extraction flow pulses along the 3D Catmull-Rom spline suction hose.

