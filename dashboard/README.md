# TERRA-VAC 450: Mechanized Desludging Simulation Dashboard
**Smart India Hackathon 2026 | Problem Statement SIH26258**  
*Ministry of Jal Shakti / Swachh Bharat Mission (Grameen) 2.0 / NAMASTE Scheme Compliance*

---

## Overview
This interactive simulation dashboard models and validates the physics, kinematics, and operational telemetry of the **TERRA-VAC 450** mechanized desludging robot engineered for steep mountain topographies and extreme climatic zones.

### Core Multi-Physics Features
1. **Mountain Incline & Rollover Stability**:
   - Dynamic Center of Mass (CoM) trajectory on $0^\circ\text{–}35^\circ$ hill slopes.
   - Dual internal longitudinal anti-slosh baffles (suppressing liquid surge by $68\%$).
   - Static tipping safety margin ($h \cdot \tan\theta < b/2$).
2. **In-Situ Sludge Dewatering & Volume Compaction (Core Innovation)**:
   - High-thrust electric ballscrew ram ($12.8\text{ kN}$ / $3.5\text{ bar}$) compressing raw slurry against a $150\,\mu\text{m}$ wedge-wire screen.
   - Expels $68\%$ free water back to the household soakage pit, concentrating solids from $4.2\%$ to $22.8\%\text{ TS}$.
   - Multiplies effective mountain payload by $3.2\times$ households per trip.
3. **High-Altitude Suction & Cavitation Immunity**:
   - Progressive Cavity Pump (PCP) cutaway animation with counter-rotating tool-steel screw rotor.
   - Real-time side-by-side comparison proving $100\%$ suction head at $3,500\text{m}$ MSL (Leh) while conventional vacuum tankers suffer cavitation failure.
4. **Cold-Climate Rheology & Thermal Liquefaction**:
   - $1,450\text{ RPM}$ Tungsten-Carbide rotary macerator cutter (shredding trash to $<6\text{ mm}$).
   - Non-Newtonian Ostwald–de Waele shear-thinning model ($88\%$ viscosity drop).
   - Inline PTC ceramic thermal jacket maintaining $+18^\circ\text{C}$ boundary layer down to $-15^\circ\text{C}$ ambient.
5. **Zero-Manual Scavenging Safety Telemetry (NAMASTE Scheme)**:
   - Ex-d Zone 1 electrochemical sensor telemetry ($\text{H}_2\text{S} < 10\text{ ppm}$, $\text{CH}_4 < 10\%\text{ LEL}$).
6. **7 Geographic Administrative Zones**:
   - Shimla, Leh, Aizawl, Kedarnath, Tawang, Munnar, and Ooty with dynamic CPCB-compliant FSTP manifest generation.

---

## How to Run
This dashboard is completely self-contained with pure HTML5 Canvas and zero external runtime dependencies.

- **Option 1**: Open `dashboard/index.html` directly in any web browser.
- **Option 2 (Local Server)**:
  ```bash
  python -m http.server 8000 --directory dashboard
  ```
  Open `http://localhost:8000` in your browser.
- **Option 3 (Via Frontend Static Route)**:
  When running the Vite frontend (`npm run dev`), access `http://localhost:5173/dashboard.html`.
