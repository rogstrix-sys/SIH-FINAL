# Live Demonstration Script: Mechanized Desludging Decision Support System

## 1. Demonstration Setup & Pre-Flight Checks
- **Environment**: Local Windows Laptop / Terminal.
- **Backend**: FastAPI running at `http://127.0.0.1:8000` (auto-started via Python venv).
- **Frontend**: Vite development or preview server running at `http://localhost:3000`.
- **Target Audience**: Evaluation Committee, Sanitation Engineers, Academic Evaluators, Municipal Stakeholders.

---

## 2. Step-by-Step Live Walkthrough (Approx. 7–10 Minutes)

### Step 1: System Overview & Baseline Dashboard (Time: 0:00 - 1:30)
1. **Action**: Open browser at `http://localhost:3000`. Show the header bar with the green pulsing `ENGINE ONLINE` badge.
2. **Talking Points**:
   - *"Welcome. Today we demonstrate an innovative decision-support engineering system designed for non-sewered sanitation in challenging terrains and extreme climates."*
   - *"Notice the top KPI summary: Total Dynamic Head, hydraulic power required, operational cost, and daily shift productivity are all computed dynamically in real time from exact SI physical equations."*
   - *"Notice the AI Advisor Card: This is not an external API call; it is a deterministic, rule-based reasoning engine that extracts governing bottlenecks and justifies the top equipment selection."*

---

### Step 2: The Core Challenge — Mountain Slope & Road Width (Time: 1:30 - 3:30)
1. **Action**: In the top navigation bar, select the preset dropdown and choose:
   **`Himalayan Hillside Settlement (Shimla / Leh)`**.
2. **Observation**:
   - The dashboard instantly updates.
   - The selected model shifts to **`EQ-02: Portable High-Lift Diaphragm & Trash Pump System`**.
3. **Action**: Click on the **`Equipment Matrix`** tab.
4. **Talking Points**:
   - *"Look at the feasibility status in this comparison matrix. Notice that Model EQ-04 (the 4x4 Commercial Tanker) is flagged in red as REJECTED."*
   - *"Why is it rejected? Because our system enforces hard engineering feasibility gates: the Himalayan slope is 24°, exceeding the truck's 14° safe tipping limit, and the road width is 1.2m, narrower than the truck's 1.92m chassis."*
   - *"Our system never hides a dangerous physical failure inside a weighted average. The operator is protected from deploying an impossible machine."*

---

### Step 3: Interactive Terrain & Climate Simulation (Time: 3:30 - 4:30)
1. **Action**: Click on the **`Terrain Simulation`** tab.
2. **Observation**:
   - Show the dynamic SVG cross-section.
   - Point out the slope gradient, the equipment station anchored on the slope with winch lines, the flexible hose line, the pit cutaway with toxic gas headspace, scum crust, and bottom sludge body.
   - Click the operational stage buttons: **Stage 1 (Anchor)** $\rightarrow$ **Stage 2 (Gas Check)** $\rightarrow$ **Stage 3 (Pumping)** $\rightarrow$ **Stage 4 (Purge)**.
   - In Stage 3, observe the animated fluid particles flowing through the hose line.
3. **Action**: Drag the **Slope Slider** down to 0° and watch the SVG flatten into a plain; then drag it up to 30° and observe the steep climb and elevation head ($\Delta z$) callout update live.
4. **Talking Points**:
   - *"This visual simulation provides intuitive operational awareness for field crews. Notice the elevation head callout and dynamic weather particles matching our site's climate zone."*

---

### Step 3.5: Interactive 3D WebGL Multi-Physics Simulation (Time: 4:30 - 6:00)
1. **Action**: Click on the **`3D Simulation`** tab (or click "Launch Interactive 3D Simulation" on Dashboard).
2. **Observation & Interaction**:
   - Show the GPU-rendered 3D mountain alley ($1.4\text{ m}$ corridor, stone walls, hillside cottage, and pit).
   - Click **`Crawl Incline`**: Watch the vehicle dynamically drive up the 28° slope with rotating tracks and wheels.
   - Toggle **`Bedrock Winch Anchor`**: Observe the tensioned steel anchor cable connecting to the mountain wall ($F_{\text{winch}} = 3.6\text{ kN}$).
   - Click **`Braking Surge Test`**: Observe the dynamic slosh impulse. Point out how the dual anti-slosh baffles damp the wave within 1.2 seconds, preventing rearward rollover.
   - Toggle **`Dual Baffles OFF`**: Notice the sludge surge backward ($\Delta x = 7.9\text{ cm}$) and the vehicle pitching back in a simulated rollover disaster when slope exceeds 21.8°!
   - Toggle **`Fullscreen`** (`Maximize2`) for an immersive demonstration to SIH evaluators.
3. **Talking Points for SIH Judges**:
   - *"This is our primary hardware-software innovation for SIH-26258: proving how mechanical anti-slosh baffles and under-chassis battery placement suppress the free-surface surge of 400L liquid sludge by 88.9%, converting a fatal rollover into a fully rated 28.0° operating threshold."*

---

### Step 4: Route Access Corridor & GIS Mapping (Time: 5:00 - 6:30)
1. **Action**: Click on the **`Route & Access`** tab.
2. **Observation**:
   - Show the interactive OpenStreetMap Leaflet map centered on mountain coordinates.
   - Point out Marker A (Vehicle Staging Stop) and Marker B (Containment Pit).
   - Toggle the **Narrow Alleyway (< 1.3m)** checkbox and show the deployment mode comparison below: Approach A (Tanker) is marked infeasible, while Approach B (Portable Carry-in) remains traversable.
3. **Talking Points**:
   - *"In mountain villages, roads frequently terminate 50 to 100 metres from the homes. Our access planner compares bringing a vehicle directly to the pit versus staging on the road and carrying lightweight modular equipment the remaining distance."*

---

### Step 5: Worker Safety & Confined Space Zero-Entry Mandate (Time: 6:30 - 8:00)
1. **Action**: Click on the **`Safety & Hazard Control`** tab.
2. **Talking Points**:
   - *"Here is the most critical pillar of our project: the Zero-Entry Confined Space Mandate. In accordance with ISO 21876 and OSHA standards, human physical entry into pits is strictly forbidden."*
   - *"Look at the quantitative hazard cards: we calculate the static tip-over angle of the equipment to prevent rollovers, quantify $H_2S$ and $CH_4$ toxicity, mandate 30mA GFCI protection for wet environments, and provide an enforceable PPE standards matrix."*

---

### Step 6: Printable Engineering Assessment Report (Time: 8:00 - 9:30)
1. **Action**: Click on the **`Engineering Report`** tab (or the top **`Print Report`** button).
2. **Observation**:
   - The view switches into a clean, formal engineering document formatted with white background, formal technical borders, equation summaries, cost tables, safety protocols, and dual engineering signature blocks.
3. **Action**: Click **`Print / Save as PDF`** to trigger the browser print dialogue, demonstrating that the stylesheet cleanly hides all UI buttons and produces a multi-page client-ready PDF.
4. **Closing Statement**:
   - *"In conclusion, this project delivers a complete, verified, and innovative engineering tool that transforms how sanitation authorities plan and execute mechanized desludging in the world's most difficult geographies."*
