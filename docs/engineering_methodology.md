# Engineering Methodology, Mathematical Models & Governing Equations

## 1. Dimensional Units & Physical Constants
The software performs all internal calculations in standard **SI Metric Units**, with explicit conversion handles at API interfaces.

| Parameter | Symbol | SI Unit | Value / Engineering Baseline |
|---|---|---|---|
| Gravitational Acceleration | $g$ | $\text{m/s}^2$ | $9.80665$ |
| Water Base Density | $\rho_w$ | $\text{kg/m}^3$ | $1000.0 \text{ at } 20^\circ\text{C}$ |
| Atmospheric Pressure (Sea Level) | $P_0$ | $\text{kPa}$ | $101.325$ |
| Absolute Roughness (PVC/Rubber Hose) | $\epsilon$ | $\text{m}$ | $0.00005 \text{ (50 }\mu\text{m)}$ |
| Minor Loss Coefficient ($\sum K$) | $K_{\text{sum}}$ | dimensionless | $3.8 \text{ (strainer, quick-couplings, bends)}$ |

---

## 2. Sludge Rheology Formulation

Faecal sludge exhibits pronounced shear-thinning Bingham plastic behavior dependent on Total Solids concentration ($\text{TS}\%$) and ambient temperature ($T$ in $^\circ\text{C}$).

### 2.1 Sludge Density ($\rho$)
The bulk density increases linearly with solid fraction according to empirical settling chamber data:
$$\rho = 1000.0 + (6.5 \cdot \text{TS}\%) \quad [\text{kg/m}^3]$$
*Example: A 15% TS slurry yields $\rho = 1000 + (6.5 \times 15) = 1097.5 \text{ kg/m}^3$.*

### 2.2 Dynamic Viscosity ($\mu$)
Viscosity is modeled via exponential solids scaling combined with an Arrhenius-type temperature dependency:
$$\mu = \mu_0 \cdot \exp\left(0.12 \cdot \max(0, \text{TS}\% - 5)\right) \cdot \exp\left(0.035 \cdot (25 - \max(-10, T))\right) \quad [\text{cP}]$$
Where baseline viscosity $\mu_0$ is indexed by qualitative consistency:
- Liquid: $\mu_0 = 15.0 \text{ cP}$
- Slurry: $\mu_0 = 250.0 \text{ cP}$
- Viscous: $\mu_0 = 2200.0 \text{ cP}$
- Thick Crust: $\mu_0 = 7500.0 \text{ cP}$

---

## 3. Effective Pumping Flow Rate & Derating Dynamics

The effective volumetric pumping flow rate ($Q_{\text{eff}}$ in $\text{m}^3/\text{h}$) is computed by derating the baseline equipment performance ($Q_{\text{base}}$) across four simultaneous environmental stress factors:
$$Q_{\text{eff}} = Q_{\text{base}} \cdot f_{\mu} \cdot f_{\text{alt}} \cdot f_{L} \cdot f_{T}$$

### 3.1 Viscosity Derating ($f_{\mu}$)
High-viscosity fluids impede suction intake wands and induce internal shear throttling:
$$f_{\mu} = \begin{cases} 
1.0 & \text{if } \mu \le 1000 \text{ cP} \\ 
\max\left(0.35, 1.0 - 0.00008 \cdot (\mu - 1000)\right) & \text{if } \mu > 1000 \text{ cP} 
\end{cases}$$

### 3.2 Altitude Derating ($f_{\text{alt}}$)
Atmospheric barometric pressure drops with altitude ($z$ in metres ASL), reducing air density for internal combustion engine combustion and degrading vacuum pump differential pressure:
$$f_{\text{alt}} = \max\left(0.70, 1.0 - 0.04 \cdot \frac{z}{1000}\right)$$

### 3.3 Hose Length Resistance Derating ($f_L$)
Discharge line resistance beyond baseline 30-metre hose setups reduces net throughput:
$$f_L = \begin{cases} 
1.0 & \text{if } L_{\text{hose}} \le 30 \text{ m} \\ 
\max\left(0.40, 1.0 - 0.003 \cdot (L_{\text{hose}} - 30)\right) & \text{if } L_{\text{hose}} > 30 \text{ m} 
\end{cases}$$

### 3.4 Temperature Extremes Derating ($f_T$)
$$f_T = \begin{cases} 
\max(0.60, 1.0 - 0.025 \cdot |T|) & \text{if } T < 0^\circ\text{C (Freezing stiffening)} \\ 
1.0 & \text{if } 0^\circ\text{C} \le T \le 38^\circ\text{C} \\ 
\max(0.80, 1.0 - 0.015 \cdot (T - 38)) & \text{if } T > 38^\circ\text{C (Engine thermal throttling)} 
\end{cases}$$

---

## 4. Pipeline Hydraulics & Total Dynamic Head (TDH)

Total Dynamic Head ($H_{\text{TDH}}$ in metres of fluid column) represents the total mechanical work required per unit weight of fluid.

$$H_{\text{TDH}} = H_{\text{static}} + h_f + h_m$$

### 4.1 Static Elevation Head ($H_{\text{static}}$)
Computed as the sum of vertical suction lift from pit fluid level and the elevation climb along the slope gradient $\theta$:
$$H_{\text{static}} = h_{\text{suction\_lift}} + (L_{\text{hose}} \cdot \sin \theta) \quad [\text{m}]$$

### 4.2 Fluid Hose Velocity ($v$)
For a circular hose of internal diameter $d = D_{\text{mm}} / 1000$:
$$v = \frac{Q_{\text{eff}} / 3600}{\frac{\pi d^2}{4}} \quad [\text{m/s}]$$

### 4.3 Reynolds Number ($Re$) & Friction Factor ($f$)
$$\mu_{\text{Pa}\cdot\text{s}} = \frac{\mu_{\text{cP}}}{1000}, \quad Re = \frac{\rho \cdot v \cdot d}{\mu_{\text{Pa}\cdot\text{s}}}$$

- **Laminar Regime ($Re < 2100$)**:
  $$f = \frac{64}{Re} \quad (\text{clamped between } 0.02 \text{ and } 0.15)$$
- **Turbulent / Transition Regime ($Re \ge 2100$)**:
  Evaluated using the Swamee-Jain explicit solution to the Colebrook-White equation:
  $$f = \frac{0.25}{\left[\log_{10}\left(\frac{\epsilon}{3.7 d} + \frac{5.74}{Re^{0.9}}\right)\right]^2}$$

### 4.4 Darcy-Weisbach Friction Loss ($h_f$) & Minor Losses ($h_m$)
$$h_f = f \cdot \frac{L_{\text{hose}}}{d} \cdot \frac{v^2}{2g} \quad [\text{m}]$$
$$h_m = K_{\text{sum}} \cdot \frac{v^2}{2g} = 3.8 \cdot \frac{v^2}{2g} \quad [\text{m}]$$

---

## 5. Hydraulic & Engine Power Sizing

The mechanical hydraulic power delivered directly into the fluid stream is given by:
$$P_{\text{hyd}} = \frac{\rho \cdot g \cdot (Q_{\text{eff}} / 3600) \cdot H_{\text{TDH}}}{\eta_{\text{pump}}} \quad [\text{Watts}]$$
Where $\eta_{\text{pump}}$ is the pump mechanical/hydraulic efficiency (typically $0.60$ to $0.72$).

Converted to kilowatts:
$$P_{\text{hyd\_kW}} = \frac{P_{\text{hyd}}}{1000} \quad [\text{kW}]$$
The engine power reserve margin is verified by comparing $P_{\text{hyd\_kW}}$ against the unit's rated power ($P_{\text{rated}}$):
$$\text{Margin}\% = \frac{P_{\text{rated}} - P_{\text{hyd\_kW}}}{P_{\text{rated}}} \cdot 100\%$$

---

## 6. Operational Cycle Time & Daily Shift Productivity

### 6.1 Time Components
1. **Ideal Pumping Time**: $t_{\text{pump\_ideal}} = V_{\text{m3}} / Q_{\text{rated}}$ [hours]
2. **Actual Pumping Time**: $t_{\text{pump\_actual}} = V_{\text{m3}} / Q_{\text{eff}}$ [hours]
3. **On-Site Operational Time**:
   $$t_{\text{on\_site}} = t_{\text{setup}} + t_{\text{pump\_actual}} + t_{\text{fluidize}} + t_{\text{breakdown}} \quad [\text{hours}]$$
   *Where $t_{\text{fluidize}} = 0.35 \text{ h}$ if sludge is viscous or crusty, else $0.10 \text{ h}$.*
4. **Disposal Transit Round-Trip Time**:
   $$t_{\text{transit}} = \frac{2 \cdot L_{\text{route\_km}}}{v_{\text{transit}}} \quad [\text{hours}]$$
5. **Total Job Cycle Time**:
   $$t_{\text{cycle}} = t_{\text{on\_site}} + t_{\text{transit}} \quad [\text{hours}]$$

### 6.2 Daily Productivity ($N_{\text{shift}}$)
Based on an 8.0-hour standard operational shift:
$$N_{\text{shift}} = \frac{8.0}{\max(1.0, t_{\text{cycle}})} \quad [\text{jobs / 8h shift}]$$

---

## 7. Operating Cost Engineering Breakdown

Total operational expenditure per desludging service ($C_{\text{total}}$) is decomposed into five distinct cost centers:
$$C_{\text{total}} = C_{\text{fuel}} + C_{\text{labor}} + C_{\text{transit}} + C_{\text{maint}} + C_{\text{disposal}}$$

1. **Fuel / Energy Cost**:
   $$C_{\text{fuel}} = (t_{\text{pump\_actual}} + 0.3) \cdot \dot{V}_{\text{fuel}} \cdot c_{\text{fuel\_unit}}$$
2. **Crew Labor Cost**:
   $$C_{\text{labor}} = N_{\text{crew}} \cdot w_{\text{hourly}} \cdot t_{\text{cycle}}$$
3. **Vehicle Transit & Tire Wear**:
   $$C_{\text{transit}} = (2 \cdot L_{\text{route\_km}}) \cdot 0.35 \quad [\text{USD}]$$
4. **Maintenance Reserve & Gasket Allowance**: Fixed allowance per job ($C_{\text{maint}} = \$12.00 - \$28.00$).
5. **FSTP Authorized Disposal Tipping Fee**:
   $$C_{\text{disposal}} = V_{\text{m3}} \cdot c_{\text{tipping\_rate}} \quad (c_{\text{tipping}} = \$8.00/\text{m}^3)$$

**Unit Economic Metric**:
$$\text{Cost per m}^3 = \frac{C_{\text{total}}}{V_{\text{m3}}} \quad [\text{USD / m}^3]$$

---

## 8. Free-Surface Liquid Slosh Dynamics, Pitch-Back & Rollover Mechanics

In steep mountain settlements (e.g., Shimla, Aizawl, Mussoorie), paths and access ramps routinely reach $20^\circ$ to $30^\circ$ incline (40% to 55% gradient). Standard utility vehicles carrying 300–500 kg of liquid sludge experience dynamic free-surface sloshing that shifts the laden Center of Mass (CoM) rearward, causing catastrophic backwards pitch flipping.

### 8.1 Unbaffled Fluid Dynamic Surge
For an unbaffled tank of length $L$ and width $W$ holding volume $V$, the second moment of area of the liquid free surface is:
$$I_0 = \frac{W \cdot L^3}{12}$$
When climbing an incline $\theta$, the longitudinal fluid center of mass displacement ($\Delta x_{\text{fluid}}$) is:
$$\Delta x_{\text{fluid}} = \frac{I_0}{V} \cdot \sin(\theta)$$
For a 400L tank ($L = 1.2 \text{ m}, W = 0.7 \text{ m}$):
$$I_0 = \frac{0.7 \cdot (1.2)^3}{12} = 0.1008 \text{ m}^4$$
At a $28.0^\circ$ incline ($\sin 28^\circ \approx 0.4695$):
$$\Delta x_{\text{fluid}} = \frac{0.1008}{0.400} \cdot 0.4695 \approx 0.1183 \text{ m} \quad (11.8 \text{ cm rearward shift})$$
This rearward shift shifts the total vehicle CoM rearward:
$$\Delta x_{\text{CoM}} = \Delta x_{\text{fluid}} \cdot \frac{M_{\text{fluid}}}{M_{\text{total}}} = 0.1183 \cdot \frac{440}{660} \approx 0.079 \text{ m}$$
Without low-slung architecture ($h_{\text{cg}} \approx 0.62 \text{ m}$), the critical pitch-back angle collapses to:
$$\theta_{\text{pitch\_unbaffled}} = \arctan\left(\frac{L_{\text{front}} - \Delta x_{\text{CoM}}}{h_{\text{cg}}}\right) \approx 21.8^\circ$$
Hence, climbing a $25^\circ - 28^\circ$ ramp causes an unbaffled machine to flip backwards.

### 8.2 Dual Longitudinal & Transverse Anti-Slosh Baffles
Dividing the holding tank into $N = 3$ longitudinal/transverse baffled chambers reduces the effective free length to $L / 3$. The segmented second moment of area becomes:
$$I_{\text{baffled}} = 3 \cdot \left[\frac{W \cdot (L/3)^3}{12}\right] = \frac{I_0}{9} \quad (\mathbf{88.9\% \text{ reduction in slosh moment of inertia}})$$
Dynamic fluid displacement is constrained to:
$$\Delta x_{\text{fluid\_baffled}} = \frac{\Delta x_{\text{fluid}}}{9} \approx 0.0131 \text{ m} \quad (1.3 \text{ cm})$$

### 8.3 Low-Slung Chassis & Under-Chassis Battery Architecture
By mounting the heavy battery modules ($\approx 65 \text{ kg}$) beneath the axle line rather than above the frame, the combined laden Center of Mass height is lowered to:
$$h_{\text{cg\_laden}} = 0.42 \text{ m}$$
The resulting Critical Rollover / Pitch-Back Angle is:
$$\theta_{\text{crit}} = \mathbf{34.2^\circ}$$
- **Key Metric**: Critical Rollover Angle: $34.2^\circ$ (Operating threshold safely rated at $28.0^\circ$ with full 400L sludge payload).
- **Design Feature Highlight**: *"Low Center-of-Gravity achieved by under-chassis battery placement + dual longitudinal anti-slosh baffles inside the holding tank."*

---

## 9. Multi-Criteria Composite Utility Function

For all configurations that clear the hard physical feasibility gates, a normalized composite score ($S_{\text{composite}} \in [0, 100]$) is computed:
$$S_{\text{composite}} = \frac{\sum_{i} w_i \cdot S_i}{\sum_i w_i}$$

Where individual sub-scores ($S_i$) are defined on a $[0, 100]$ interval:
1. $S_{\text{cost}} = 100 \cdot \left(1.0 - \frac{C - C_{\min}}{C_{\max} - C_{\min}}\right)$ (lower cost = higher score)
2. $S_{\text{time}} = 100 \cdot \left(1.0 - \frac{t - t_{\min}}{t_{\max} - t_{\min}}\right)$ (faster cycle = higher score)
3. $S_{\text{access}} = \text{Accessibility Score}$ (slope margin, road width buffer, road traction)
4. $S_{\text{climate}} = \text{Climate Suitability Score}$ (freeze margin, rainfall proofing, heat soak)
5. $S_{\text{safety}} = \text{Zero-Entry Score}$ (remote suction geometry, non-entry design)
6. $S_{\text{portability}} = \max(10, 100 - (\text{weight}_{\text{kg}} / 40) - (\text{width}_{\text{m}} \cdot 15))$

