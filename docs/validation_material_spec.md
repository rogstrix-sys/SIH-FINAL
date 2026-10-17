# Physical Validation Specification: Materials, Instrumentation & Protocols

## 1. Objective of Physical Validation
This specification defines the materials, mechanical components, fluid rheological surrogates, sensor instrumentation, and empirical procedures required to transition the software's simulated hydraulic and thermodynamic models into physical laboratory and field-tested reality.

---

## 2. Bill of Materials (BOM) for Experimental Test Rig

### 2.1 Pumping & Prime Mover Hardware
| Component ID | Description | Technical Specifications | Purpose |
|---|---|---|---|
| **PM-01** | Progressive Cavity Pump | Mono / Seepex type; Displacement: 0–8.0 m³/h; Rotor: Hard chrome plated tool steel; Stator: Nitrile elastomer; Max Pressure: 12 bar. | High-viscosity sludge pumping validation. |
| **PM-02** | Diaphragm Slurry Pump | Sandpiper / Wilden 2-inch mechanical positive displacement pump; Stroke: 45 mm; Max Solids: 35 mm ball passage. | Solids handling and self-priming lift test. |
| **ENG-01** | Variable Speed Petrol Engine | Honda GX200 OHV 4-stroke engine (4.3 kW @ 3,600 RPM); Integrated tachometer and fuel flow sensor. | Field prime mover power calibration. |
| **MOT-01** | 3-Phase Electric Motor & VFD | 5.5 kW IE3 premium efficiency electric motor coupled with ABB ACS380 Variable Frequency Drive (0–50 Hz). | Laboratory baseline torque & hydraulic efficiency curve testing. |

### 2.2 Conduit & Hose Assemblies
| Component ID | Description | Dimensions & Ratings | Testing Function |
|---|---|---|---|
| **HOSE-01** | Suction Flexible Hose | 75 mm (3 inch) internal diameter; Clear PVC with rigid white PVC spiral helix; Vacuum rating: -0.9 bar. | Flow visualization & cavitation bubble inception. |
| **HOSE-02** | Heavy-Duty Rubber Slurry Hose | 65 mm (2.5 inch) ID; Synthetic textile cord reinforcement with dual helix wire; Burst pressure: 30 bar. | Darcy-Weisbach friction head loss measurement. |
| **CPL-01** | Quick-Release Couplings | Type B/C 3-inch Aluminum Camlock couplings with locking R-clips and Buna-N food-grade seals. | Minor loss coefficient ($K_{\text{coupling}}$) measurement. |

---

## 3. High-Precision Instrumentation & Sensor Array

| Sensor System | Model & Make | Range & Accuracy | Measurement Parameter |
|---|---|---|---|
| **Differential Pressure Transmitter** | Rosemount 3051CD | 0 to 10 bar (±0.04% of span) | Direct hydraulic head loss ($\Delta P$) across 5-metre hose runs. |
| **In-Line Coriolis Mass Flow Meter** | Krohne OPTIMASS 7400 | 0 to 15,000 kg/h (±0.1% accuracy) | Continuous mass flow rate ($\dot{m}$) and slurry density ($\rho$). |
| **Digital Sludge Viscometer** | Brookfield DV2T Viscometer | 15 to 6,000,000 cP with T-bar helipath stand | Shear stress vs shear rate rheogram formulation. |
| **Multi-Gas Detector** | Industrial Scientific Ventis Pro5 | $H_2S$ (0–500 ppm), $CH_4$ (0–100% LEL), $CO$ (0–2000 ppm), $O_2$ (0–30%) | Headspace gas generation and dissipation tracking. |
| **Inclinometer / 6-Axis IMU** | Bosch BNO055 Intelligent 9-DOF Sensor | Pitch and roll: ±0.1° accuracy | Static tip-over angle and dynamic vibration testing on slopes. |

---

## 4. Surrogate Fluid Formulation (Synthetic Faecal Sludge)

To conduct standardized laboratory trials without biohazard contamination, a non-hazardous surrogate fluid replicating faecal sludge rheology is formulated according to Eawag / Sandec recipes:

| Component | Proportion (w/w) | Physical Function |
|---|---|---|
| **Municipal Tap Water** | $84.0\% - 92.0\%$ | Continuous aqueous base liquid phase. |
| **Sodium Bentonite Clay** | $5.0\% - 10.0\%$ | Imparts non-Newtonian yield stress ($\tau_y = 15 - 180 \text{ Pa}$). |
| **Microcrystalline Cellulose** | $2.0\% - 4.0\%$ | Replicates un-digested dietary fibers and toilet paper floc. |
| **Vegetable Oil / Glycerol** | $1.0\% - 2.0\%$ | Mimics lipid and surfactant surface tension properties. |

---

## 5. Empirical Validation Test Matrix

1. **Test Series A: Friction Loss vs Velocity**:
   - Pump synthetic slurry at velocities from $0.5 \text{ m/s}$ to $3.0 \text{ m/s}$ in $0.25 \text{ m/s}$ increments.
   - Record differential pressure $\Delta P$ across 10-metre hose test sections.
   - Validate whether experimental Darcy friction factors match Swamee-Jain predictions within $\pm 8\%$.
2. **Test Series B: Barometric Suction Lift Cutoff**:
   - Position pump at elevations $1.0 \text{ m}, 2.5 \text{ m}, 4.5 \text{ m}, 6.0 \text{ m}, 7.5 \text{ m}$ above fluid level.
   - Measure net positive suction head available ($\text{NPSH}_A$) and identify onset of acoustic cavitation.
3. **Test Series C: Sub-Zero Thermal Chamber Trials**:
   - Place slurry lines in an environmental cold chamber cooled from $+20^\circ\text{C}$ to $-10^\circ\text{C}$.
   - Measure power surge during startup and evaluate time required for thermal line-freeze.
