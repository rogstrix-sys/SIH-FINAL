import * as THREE from 'three';
import {
  createManholeCoverTexture,
  createAgedConcreteTexture,
  createSludgeCrustTexture,
  createCautionTapeTexture,
  createConfinedSpaceSignTexture,
  createSpiralHoseTexture,
  createSoilStrataTexture
} from './vaultTextures';

export interface VaultMeshes {
  rootGroup: THREE.Group;
  concreteVaultGroup: THREE.Group;
  soilPitMesh: THREE.Mesh;
  sludgeCrustMesh: THREE.Mesh;
  liquidSupernatantMesh: THREE.Mesh;
  consolidatedSludgeMesh: THREE.Mesh;
  robotGroup: THREE.Group;
  robotArmGroup: THREE.Group;
  maceratorDrumMesh: THREE.Mesh;
  leftNozzleWorldMesh: THREE.Mesh;
  rightNozzleWorldMesh: THREE.Mesh;
  suctionIntakeWorldMesh: THREE.Mesh;
  robotSpotlights: THREE.SpotLight[];
  winchCableMesh: THREE.Line;
  suctionHoseMesh: THREE.Mesh;
  ventDuctMesh: THREE.Mesh;
  ventDuctMouthMesh: THREE.Mesh;
  streetGroup: THREE.Group;
  gantryGroup: THREE.Group;
  inspectionCameraTurret: THREE.Group;
  materialsToDispose: THREE.Material[];
  geometriesToDispose: THREE.BufferGeometry[];
}

/**
 * Builds the complete high-fidelity 3D Subsurface Vault & Robotics Environment
 */
export function buildVaultEnvironment(): VaultMeshes {
  const rootGroup = new THREE.Group();
  const materialsToDispose: THREE.Material[] = [];
  const geometriesToDispose: THREE.BufferGeometry[] = [];

  // Reusable textures
  const concreteTex = createAgedConcreteTexture();
  const manholeTex = createManholeCoverTexture();
  const sludgeCrustTex = createSludgeCrustTexture();
  const cautionTapeTex = createCautionTapeTexture();
  const signTex = createConfinedSpaceSignTexture();
  const spiralHoseTex = createSpiralHoseTexture();
  const soilTex = createSoilStrataTexture();

  // Reusable PBR Materials
  const concreteMat = new THREE.MeshStandardMaterial({
    map: concreteTex,
    roughness: 0.88,
    metalness: 0.08
  });
  materialsToDispose.push(concreteMat);

  const cutawayConcreteMat = new THREE.MeshStandardMaterial({
    map: concreteTex,
    roughness: 0.85,
    metalness: 0.08,
    transparent: true,
    opacity: 0.28,
    side: THREE.DoubleSide
  });
  materialsToDispose.push(cutawayConcreteMat);

  const rebarMat = new THREE.MeshStandardMaterial({
    color: 0x92400e, // rusted rebar steel
    roughness: 0.75,
    metalness: 0.85
  });
  materialsToDispose.push(rebarMat);

  const asphaltMat = new THREE.MeshStandardMaterial({
    color: 0x22252a,
    roughness: 0.94,
    metalness: 0.05
  });
  materialsToDispose.push(asphaltMat);

  const soilMat = new THREE.MeshStandardMaterial({
    map: soilTex,
    roughness: 0.96,
    metalness: 0.02,
    side: THREE.BackSide
  });
  materialsToDispose.push(soilMat);

  // ==========================================
  // 1. SOIL EXCAVATION PIT & GROUND SURFACE
  // ==========================================
  // Ground plane with asphalt street and road lines
  const streetGroup = new THREE.Group();
  const groundGeo = new THREE.PlaneGeometry(16, 16);
  groundGeo.rotateX(-Math.PI / 2);
  const groundMesh = new THREE.Mesh(groundGeo, asphaltMat);
  groundMesh.receiveShadow = true;
  streetGroup.add(groundMesh);
  geometriesToDispose.push(groundGeo);

  // Yellow road safety curb line
  const curbGeo = new THREE.BoxGeometry(16, 0.15, 0.2);
  const curbMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.7 });
  const curbMesh = new THREE.Mesh(curbGeo, curbMat);
  curbMesh.position.set(0, 0.075, 2.2);
  curbMesh.receiveShadow = true;
  curbMesh.castShadow = true;
  streetGroup.add(curbMesh);
  materialsToDispose.push(curbMat);
  geometriesToDispose.push(curbGeo);

  // Excavation pit around the vault
  const pitGeo = new THREE.BoxGeometry(6.4, 3.8, 4.4);
  const soilPitMesh = new THREE.Mesh(pitGeo, soilMat);
  soilPitMesh.position.set(0, -1.9, 0);
  soilPitMesh.receiveShadow = true;
  rootGroup.add(soilPitMesh);
  geometriesToDispose.push(pitGeo);

  // ==========================================
  // 2. REINFORCED CONCRETE DUAL-CHAMBER VAULT
  // Vault dimensions: 4.4m length x 2.4m width x 2.6m depth
  // ==========================================
  const concreteVaultGroup = new THREE.Group();
  const vaultWallThick = 0.18;
  const vaultL = 4.4;
  const vaultW = 2.4;
  const vaultD = 2.5;

  // Base floor slab (y = -2.5)
  const floorGeo = new THREE.BoxGeometry(vaultL + vaultWallThick * 2, vaultWallThick, vaultW + vaultWallThick * 2);
  const floorMesh = new THREE.Mesh(floorGeo, concreteMat);
  floorMesh.position.set(0, -vaultD - vaultWallThick / 2, 0);
  floorMesh.receiveShadow = true;
  concreteVaultGroup.add(floorMesh);
  geometriesToDispose.push(floorGeo);

  // Back Wall (z = -vaultW / 2)
  const backWallGeo = new THREE.BoxGeometry(vaultL + vaultWallThick * 2, vaultD, vaultWallThick);
  const backWallMesh = new THREE.Mesh(backWallGeo, concreteMat);
  backWallMesh.position.set(0, -vaultD / 2, -vaultW / 2 - vaultWallThick / 2);
  backWallMesh.receiveShadow = true;
  concreteVaultGroup.add(backWallMesh);
  geometriesToDispose.push(backWallGeo);

  // Left End Wall (x = -vaultL / 2)
  const leftWallGeo = new THREE.BoxGeometry(vaultWallThick, vaultD, vaultW);
  const leftWallMesh = new THREE.Mesh(leftWallGeo, concreteMat);
  leftWallMesh.position.set(-vaultL / 2 - vaultWallThick / 2, -vaultD / 2, 0);
  leftWallMesh.receiveShadow = true;
  concreteVaultGroup.add(leftWallMesh);
  geometriesToDispose.push(leftWallGeo);

  // Right End Wall (x = vaultL / 2)
  const rightWallGeo = new THREE.BoxGeometry(vaultWallThick, vaultD, vaultW);
  const rightWallMesh = new THREE.Mesh(rightWallGeo, concreteMat);
  rightWallMesh.position.set(vaultL / 2 + vaultWallThick / 2, -vaultD / 2, 0);
  rightWallMesh.receiveShadow = true;
  concreteVaultGroup.add(rightWallMesh);
  geometriesToDispose.push(rightWallGeo);

  // Front Wall (Cutaway Transparent / X-Ray for Engineering Inspection)
  const frontWallGeo = new THREE.BoxGeometry(vaultL + vaultWallThick * 2, vaultD, vaultWallThick);
  const frontWallMesh = new THREE.Mesh(frontWallGeo, cutawayConcreteMat);
  frontWallMesh.position.set(0, -vaultD / 2, vaultW / 2 + vaultWallThick / 2);
  concreteVaultGroup.add(frontWallMesh);
  geometriesToDispose.push(frontWallGeo);

  // Center Baffle / Partition Wall dividing Chamber 1 and Chamber 2
  const centerBaffleGeo = new THREE.BoxGeometry(vaultWallThick, vaultD - 0.45, vaultW);
  const centerBaffleMesh = new THREE.Mesh(centerBaffleGeo, concreteMat);
  centerBaffleMesh.position.set(0.4, -vaultD / 2 - 0.22, 0); // Chamber 1 is larger (digestor)
  centerBaffleMesh.receiveShadow = true;
  centerBaffleMesh.castShadow = true;
  concreteVaultGroup.add(centerBaffleMesh);
  geometriesToDispose.push(centerBaffleGeo);

  // Overflow Transfer Notch in center baffle wall
  const notchFlangeGeo = new THREE.BoxGeometry(vaultWallThick + 0.05, 0.12, 0.5);
  const notchFlangeMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 });
  const notchFlangeMesh = new THREE.Mesh(notchFlangeGeo, notchFlangeMat);
  notchFlangeMesh.position.set(0.4, -0.7, 0);
  concreteVaultGroup.add(notchFlangeMesh);
  materialsToDispose.push(notchFlangeMat);
  geometriesToDispose.push(notchFlangeGeo);

  // PVC Inlet Baffle Tee (Chamber 1 intake pipe)
  const pvcMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.35 }); // orange sanitary PVC
  materialsToDispose.push(pvcMat);

  const inletPipeGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 16);
  const inletPipeMesh = new THREE.Mesh(inletPipeGeo, pvcMat);
  inletPipeMesh.position.set(-1.8, -0.65, -0.9);
  concreteVaultGroup.add(inletPipeMesh);
  geometriesToDispose.push(inletPipeGeo);

  // PVC Outlet Baffle Tee (Chamber 2 effluent outflow pipe)
  const outletPipeGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.9, 16);
  const outletPipeMesh = new THREE.Mesh(outletPipeGeo, pvcMat);
  outletPipeMesh.position.set(1.9, -0.85, -0.9);
  concreteVaultGroup.add(outletPipeMesh);
  geometriesToDispose.push(outletPipeGeo);

  // Rebar reinforcing steel grid embedded inside cutaway slab edges
  const rebarGroup = new THREE.Group();
  for (let rx = -vaultL / 2; rx <= vaultL / 2; rx += 0.4) {
    const rebarGeo = new THREE.CylinderGeometry(0.007, 0.007, vaultD - 0.2, 8);
    const rebarMesh = new THREE.Mesh(rebarGeo, rebarMat);
    rebarMesh.position.set(rx, -vaultD / 2, vaultW / 2 + 0.08);
    rebarGroup.add(rebarMesh);
    geometriesToDispose.push(rebarGeo);
  }
  concreteVaultGroup.add(rebarGroup);

  // Vault Roof Slab with Manhole Throat Collars
  const roofGeo = new THREE.BoxGeometry(vaultL + vaultWallThick * 2, vaultWallThick, vaultW + vaultWallThick * 2);
  const roofMesh = new THREE.Mesh(roofGeo, concreteMat);
  roofMesh.position.set(0, -vaultWallThick / 2, 0);
  roofMesh.receiveShadow = true;
  concreteVaultGroup.add(roofMesh);
  geometriesToDispose.push(roofGeo);

  // Cast Iron Manhole Ring Collar (Primary Chamber 1 Manhole, 550mm diameter)
  const collarGeo = new THREE.CylinderGeometry(0.36, 0.38, 0.22, 24, 1, true);
  const castIronMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.75,
    metalness: 0.85
  });
  materialsToDispose.push(castIronMat);

  const collarMesh = new THREE.Mesh(collarGeo, castIronMat);
  collarMesh.position.set(-0.8, 0.05, 0);
  concreteVaultGroup.add(collarMesh);
  geometriesToDispose.push(collarGeo);

  // Cast Iron Manhole Cover (Removed & resting tilted next to manhole)
  const coverGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.05, 32);
  const coverMat = new THREE.MeshStandardMaterial({
    map: manholeTex,
    roughness: 0.65,
    metalness: 0.75
  });
  materialsToDispose.push(coverMat);

  const coverMesh = new THREE.Mesh(coverGeo, coverMat);
  coverMesh.position.set(-0.8, 0.08, 0.85);
  coverMesh.rotation.x = 0.22;
  coverMesh.rotation.z = -0.15;
  coverMesh.castShadow = true;
  concreteVaultGroup.add(coverMesh);
  geometriesToDispose.push(coverGeo);

  // Chamber 2 Secondary Inspection Manhole Cover (Closed in place)
  const chamber2CoverMesh = new THREE.Mesh(coverGeo, coverMat);
  chamber2CoverMesh.position.set(1.5, 0.02, 0);
  chamber2CoverMesh.receiveShadow = true;
  concreteVaultGroup.add(chamber2CoverMesh);

  rootGroup.add(concreteVaultGroup);

  // ==========================================
  // 3. STRATIFIED SLUDGE & EFFLUENT LAYERS
  // Bottom: Consolidated sludge | Middle: Supernatant | Top: Solid crust
  // ==========================================
  // Bottom Consolidated Sludge & Grit Bed (Dense 30% TS)
  const gritGeo = new THREE.BoxGeometry(vaultL - 0.08, 0.55, vaultW - 0.08);
  const gritMat = new THREE.MeshStandardMaterial({
    color: 0x18100c,
    roughness: 0.98,
    metalness: 0.02
  });
  materialsToDispose.push(gritMat);
  const consolidatedSludgeMesh = new THREE.Mesh(gritGeo, gritMat);
  consolidatedSludgeMesh.position.set(0, -vaultD + 0.275, 0);
  consolidatedSludgeMesh.receiveShadow = true;
  rootGroup.add(consolidatedSludgeMesh);
  geometriesToDispose.push(gritGeo);

  // Middle Supernatant Liquid (Turbid effluent)
  const liquidGeo = new THREE.BoxGeometry(vaultL - 0.09, 1.25, vaultW - 0.09);
  const liquidMat = new THREE.MeshStandardMaterial({
    color: 0x2e382d,
    roughness: 0.35,
    metalness: 0.15,
    transparent: true,
    opacity: 0.78
  });
  materialsToDispose.push(liquidMat);
  const liquidSupernatantMesh = new THREE.Mesh(liquidGeo, liquidMat);
  liquidSupernatantMesh.position.set(0, -1.4, 0);
  liquidSupernatantMesh.receiveShadow = true;
  rootGroup.add(liquidSupernatantMesh);
  geometriesToDispose.push(liquidGeo);

  // Top Floating Scum Crust Layer (22% TS dried cake with fracture fissures)
  const crustGeo = new THREE.BoxGeometry(vaultL - 0.1, 0.22, vaultW - 0.1);
  const crustMat = new THREE.MeshStandardMaterial({
    map: sludgeCrustTex,
    roughness: 0.95,
    metalness: 0.05,
    transparent: true,
    opacity: 0.96
  });
  materialsToDispose.push(crustMat);
  const sludgeCrustMesh = new THREE.Mesh(crustGeo, crustMat);
  sludgeCrustMesh.position.set(0, -0.75, 0);
  sludgeCrustMesh.receiveShadow = true;
  sludgeCrustMesh.castShadow = true;
  rootGroup.add(sludgeCrustMesh);
  geometriesToDispose.push(crustGeo);

  // ==========================================
  // 4. BANDICOOT RO-VAC SUBMERSIBLE ROBOT
  // ==========================================
  const robotGroup = new THREE.Group();
  robotGroup.position.set(-0.8, -1.85, 0); // Suspended/positioned in Chamber 1

  // Robot Waterproof Monocoque Body Chassis (IP68 Anodized Aluminum alloy)
  const chassisGeo = new THREE.BoxGeometry(0.58, 0.24, 0.42);
  const chassisMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7, // high-visibility industrial cyan blue
    roughness: 0.42,
    metalness: 0.65
  });
  materialsToDispose.push(chassisMat);
  const robotChassis = new THREE.Mesh(chassisGeo, chassisMat);
  robotChassis.castShadow = true;
  robotGroup.add(robotChassis);
  geometriesToDispose.push(chassisGeo);

  // Protective Stainless Steel Exo-Cage / Roll bars
  const cageMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3, metalness: 0.9 });
  materialsToDispose.push(cageMat);
  const cageBar1Geo = new THREE.CylinderGeometry(0.012, 0.012, 0.62, 8);
  cageBar1Geo.rotateZ(Math.PI / 2);
  const cageBar1 = new THREE.Mesh(cageBar1Geo, cageMat);
  cageBar1.position.set(0, 0.16, 0.2);
  robotGroup.add(cageBar1);
  geometriesToDispose.push(cageBar1Geo);

  const cageBar2 = cageBar1.clone();
  cageBar2.position.set(0, 0.16, -0.2);
  robotGroup.add(cageBar2);

  // Dual Heavy-Duty Rubber Crawler Tracks
  const trackMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.95 });
  materialsToDispose.push(trackMat);

  const trackGeo = new THREE.BoxGeometry(0.66, 0.16, 0.12);
  const leftTrack = new THREE.Mesh(trackGeo, trackMat);
  leftTrack.position.set(0, -0.1, 0.26);
  leftTrack.castShadow = true;
  robotGroup.add(leftTrack);
  geometriesToDispose.push(trackGeo);

  const rightTrack = new THREE.Mesh(trackGeo, trackMat);
  rightTrack.position.set(0, -0.1, -0.26);
  rightTrack.castShadow = true;
  robotGroup.add(rightTrack);

  // 3-DOF Articulated Robotic Arm Boom
  const robotArmGroup = new THREE.Group();
  robotArmGroup.position.set(0.28, 0.02, 0);

  // Arm Segment 1 (Shoulder boom)
  const arm1Geo = new THREE.BoxGeometry(0.32, 0.09, 0.09);
  const armMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.7 });
  materialsToDispose.push(armMat);
  const arm1 = new THREE.Mesh(arm1Geo, armMat);
  arm1.position.set(0.16, 0, 0);
  arm1.castShadow = true;
  robotArmGroup.add(arm1);
  geometriesToDispose.push(arm1Geo);

  // Hydraulic Cylinder Piston on Arm
  const pistonGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.24, 12);
  pistonGeo.rotateZ(Math.PI / 2);
  const pistonMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, roughness: 0.2, metalness: 0.95 });
  materialsToDispose.push(pistonMat);
  const piston = new THREE.Mesh(pistonGeo, pistonMat);
  piston.position.set(0.14, 0.08, 0);
  robotArmGroup.add(piston);
  geometriesToDispose.push(pistonGeo);

  // Cutter / Macerator Drum Housing (Cylindrical with Tungsten-Carbide Teeth)
  const cutterDrumGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.34, 20);
  cutterDrumGeo.rotateX(Math.PI / 2);
  const cutterDrumMat = new THREE.MeshStandardMaterial({
    color: 0x71717a,
    roughness: 0.35,
    metalness: 0.85
  });
  materialsToDispose.push(cutterDrumMat);
  const maceratorDrumMesh = new THREE.Mesh(cutterDrumGeo, cutterDrumMat);
  maceratorDrumMesh.position.set(0.36, -0.06, 0);
  maceratorDrumMesh.castShadow = true;
  robotArmGroup.add(maceratorDrumMesh);
  geometriesToDispose.push(cutterDrumGeo);

  // Helical Cutter Teeth on Drum
  for (let t = 0; t < 12; t++) {
    const toothGeo = new THREE.ConeGeometry(0.022, 0.045, 6);
    const toothMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.9 });
    const tooth = new THREE.Mesh(toothGeo, toothMat);
    const angle = (t / 12) * Math.PI * 4;
    const zOffset = (t / 12 - 0.5) * 0.28;
    tooth.position.set(0.36 + Math.cos(angle) * 0.09, -0.06 + Math.sin(angle) * 0.09, zOffset);
    tooth.rotation.z = angle + Math.PI / 2;
    robotArmGroup.add(tooth);
    materialsToDispose.push(toothMat);
    geometriesToDispose.push(toothGeo);
  }

  // Dual High-Pressure Hydro-Jet Nozzles
  const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2, metalness: 0.9 });
  materialsToDispose.push(nozzleMat);

  const nozzleGeo = new THREE.CylinderGeometry(0.018, 0.025, 0.07, 12);
  nozzleGeo.rotateZ(Math.PI / 2);

  const leftNozzleWorldMesh = new THREE.Mesh(nozzleGeo, nozzleMat);
  leftNozzleWorldMesh.position.set(0.38, 0.05, 0.16);
  robotArmGroup.add(leftNozzleWorldMesh);
  geometriesToDispose.push(nozzleGeo);

  const rightNozzleWorldMesh = new THREE.Mesh(nozzleGeo, nozzleMat);
  rightNozzleWorldMesh.position.set(0.38, 0.05, -0.16);
  robotArmGroup.add(rightNozzleWorldMesh);

  // Suction Intake Hood with Camlock Coupler
  const intakeGeo = new THREE.CylinderGeometry(0.065, 0.09, 0.12, 16);
  intakeGeo.rotateZ(Math.PI / 2);
  const intakeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.8 });
  materialsToDispose.push(intakeMat);
  const suctionIntakeWorldMesh = new THREE.Mesh(intakeGeo, intakeMat);
  suctionIntakeWorldMesh.position.set(0.32, -0.06, 0);
  robotArmGroup.add(suctionIntakeWorldMesh);
  geometriesToDispose.push(intakeGeo);

  robotGroup.add(robotArmGroup);

  // Submersible Dual 5000K LED Floodlights
  const robotSpotlights: THREE.SpotLight[] = [];
  const spotLeft = new THREE.SpotLight(0xfffbeb, 4.5, 6, Math.PI / 5, 0.35, 1.2);
  spotLeft.position.set(0.24, 0.15, 0.14);
  spotLeft.target.position.set(1.5, -0.6, 0.14);
  spotLeft.castShadow = true;
  robotGroup.add(spotLeft);
  robotGroup.add(spotLeft.target);
  robotSpotlights.push(spotLeft);

  const spotRight = new THREE.SpotLight(0xfffbeb, 4.5, 6, Math.PI / 5, 0.35, 1.2);
  spotRight.position.set(0.24, 0.15, -0.14);
  spotRight.target.position.set(1.5, -0.6, -0.14);
  spotRight.castShadow = true;
  robotGroup.add(spotRight);
  robotGroup.add(spotRight.target);
  robotSpotlights.push(spotRight);

  // Optical Inspection PTZ Camera Turret on Top Mast
  const inspectionCameraTurret = new THREE.Group();
  inspectionCameraTurret.position.set(-0.1, 0.22, 0);

  const camHousingGeo = new THREE.SphereGeometry(0.065, 16, 16);
  const camHousingMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.9 });
  materialsToDispose.push(camHousingMat);
  const camHousing = new THREE.Mesh(camHousingGeo, camHousingMat);
  inspectionCameraTurret.add(camHousing);
  geometriesToDispose.push(camHousingGeo);

  const lensGeo = new THREE.CylinderGeometry(0.03, 0.035, 0.04, 16);
  lensGeo.rotateZ(Math.PI / 2);
  const lensMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.1, metalness: 0.95 });
  materialsToDispose.push(lensMat);
  const lens = new THREE.Mesh(lensGeo, lensMat);
  lens.position.set(0.05, 0, 0);
  inspectionCameraTurret.add(lens);
  geometriesToDispose.push(lensGeo);

  robotGroup.add(inspectionCameraTurret);
  rootGroup.add(robotGroup);

  // ==========================================
  // 5. TRIPOD GANTRY & MOTORIZED WINCH
  // Mounted directly over the open Chamber 1 manhole (-0.8, 0, 0)
  // ==========================================
  const gantryGroup = new THREE.Group();
  gantryGroup.position.set(-0.8, 0, 0);

  // Tripod Crown Head Casting
  const crownGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.08, 16);
  const crownMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4, metalness: 0.7 }); // safety amber
  materialsToDispose.push(crownMat);
  const crownMesh = new THREE.Mesh(crownGeo, crownMat);
  crownMesh.position.set(0, 2.4, 0);
  crownMesh.castShadow = true;
  gantryGroup.add(crownMesh);
  geometriesToDispose.push(crownGeo);

  // 3 Tubular Extruded Aluminum Telescoping Legs
  const legMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.35, metalness: 0.85 });
  materialsToDispose.push(legMat);
  const legRadius = 0.95;
  for (let l = 0; l < 3; l++) {
    const angle = (l / 3) * Math.PI * 2;
    const footX = Math.cos(angle) * legRadius;
    const footZ = Math.sin(angle) * legRadius;

    const legCurve = new THREE.LineCurve3(
      new THREE.Vector3(0, 2.4, 0),
      new THREE.Vector3(footX, 0, footZ)
    );
    const legGeo = new THREE.TubeGeometry(legCurve, 8, 0.032, 10, false);
    const legMesh = new THREE.Mesh(legGeo, legMat);
    legMesh.castShadow = true;
    gantryGroup.add(legMesh);
    geometriesToDispose.push(legGeo);

    // Rubber Foot Pad
    const padGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.03, 12);
    const padMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
    const padMesh = new THREE.Mesh(padGeo, padMat);
    padMesh.position.set(footX, 0.015, footZ);
    padMesh.receiveShadow = true;
    gantryGroup.add(padMesh);
    materialsToDispose.push(padMat);
    geometriesToDispose.push(padGeo);
  }

  // Motorized Winch Drum & Cable Sheave Pulley
  const pulleyGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.04, 16);
  pulleyGeo.rotateZ(Math.PI / 2);
  const pulleyMesh = new THREE.Mesh(pulleyGeo, crownMat);
  pulleyMesh.position.set(0, 2.32, 0);
  gantryGroup.add(pulleyMesh);
  geometriesToDispose.push(pulleyGeo);

  // High-Tensile Stainless Steel Winch Cable (Line between pulley and robot)
  const cableMat = new THREE.LineBasicMaterial({ color: 0xe2e8f0, linewidth: 2 });
  materialsToDispose.push(cableMat);
  const cableGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 2.32, 0),
    new THREE.Vector3(0, -1.85, 0)
  ]);
  const winchCableMesh = new THREE.Line(cableGeo, cableMat);
  gantryGroup.add(winchCableMesh);
  geometriesToDispose.push(cableGeo);

  rootGroup.add(gantryGroup);

  // ==========================================
  // 6. SUCTION HOSE & VENTILATION DUCTING
  // ==========================================
  // Flexible Spiral Suction Hose (from robot intake up to street surface)
  const hoseCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.5, -1.85, 0),
    new THREE.Vector3(-0.65, -1.2, 0.2),
    new THREE.Vector3(-0.8, -0.2, 0.15),
    new THREE.Vector3(-1.1, 0.15, 0.8),
    new THREE.Vector3(-2.2, 0.12, 1.8) // Leading toward vacuum tanker
  ]);
  const hoseGeo = new THREE.TubeGeometry(hoseCurve, 32, 0.058, 12, false);
  const hoseMat = new THREE.MeshStandardMaterial({
    map: spiralHoseTex,
    roughness: 0.45,
    metalness: 0.35,
    transparent: true,
    opacity: 0.92
  });
  materialsToDispose.push(hoseMat);
  const suctionHoseMesh = new THREE.Mesh(hoseGeo, hoseMat);
  suctionHoseMesh.castShadow = true;
  rootGroup.add(suctionHoseMesh);
  geometriesToDispose.push(hoseGeo);

  // Industrial Yellow Ventilation Blower & Collapsible Duct
  const blowerGroup = new THREE.Group();
  blowerGroup.position.set(-1.6, 0, -0.6);

  // Blower Fan Housing (Centrifugal scroll)
  const blowerHousingGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.22, 16);
  blowerHousingGeo.rotateZ(Math.PI / 2);
  const blowerMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 }); // high vis yellow
  materialsToDispose.push(blowerMat);
  const blowerMesh = new THREE.Mesh(blowerHousingGeo, blowerMat);
  blowerMesh.position.set(0, 0.25, 0);
  blowerMesh.castShadow = true;
  blowerGroup.add(blowerMesh);
  geometriesToDispose.push(blowerHousingGeo);

  // Blower Electric Motor
  const motorGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.28, 16);
  motorGeo.rotateZ(Math.PI / 2);
  const motorMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.8 });
  materialsToDispose.push(motorMat);
  const motorMesh = new THREE.Mesh(motorGeo, motorMat);
  motorMesh.position.set(-0.25, 0.25, 0);
  blowerGroup.add(motorMesh);
  geometriesToDispose.push(motorGeo);

  rootGroup.add(blowerGroup);

  // Yellow Flexible Ventilation Duct entering vault
  const ductCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.45, 0.25, -0.6),
    new THREE.Vector3(-1.0, 0.15, -0.4),
    new THREE.Vector3(-0.8, -0.15, -0.3),
    new THREE.Vector3(-0.75, -1.1, -0.35)
  ]);
  const ductGeo = new THREE.TubeGeometry(ductCurve, 24, 0.08, 12, false);
  const ductMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.7 });
  materialsToDispose.push(ductMat);
  const ventDuctMesh = new THREE.Mesh(ductGeo, ductMat);
  ventDuctMesh.castShadow = true;
  rootGroup.add(ventDuctMesh);
  geometriesToDispose.push(ductGeo);

  // Vent Duct Mouth (Where fresh air discharges inside vault)
  const ventMouthGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.06, 12);
  const ventDuctMouthMesh = new THREE.Mesh(ventMouthGeo, ductMat);
  ventDuctMouthMesh.position.set(-0.75, -1.1, -0.35);
  rootGroup.add(ventDuctMouthMesh);
  geometriesToDispose.push(ventMouthGeo);

  // ==========================================
  // 7. STREET SAFETY SITE EQUIPMENT
  // Traffic cones, OSHA warning sign, barricade tape
  // ==========================================
  // Traffic Cones
  const coneMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5 });
  materialsToDispose.push(coneMat);
  const conePositions = [
    [-1.9, 0, 0.9],
    [-1.9, 0, -0.9],
    [0.3, 0, 1.2],
    [0.3, 0, -1.2]
  ];
  conePositions.forEach(([cx, cy, cz]) => {
    const cGeo = new THREE.ConeGeometry(0.14, 0.55, 14);
    const cMesh = new THREE.Mesh(cGeo, coneMat);
    cMesh.position.set(cx, 0.275, cz);
    cMesh.castShadow = true;
    streetGroup.add(cMesh);
    geometriesToDispose.push(cGeo);

    // Reflective white collar
    const collarBandGeo = new THREE.CylinderGeometry(0.07, 0.09, 0.12, 14);
    const collarBandMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const collarBand = new THREE.Mesh(collarBandGeo, collarBandMat);
    collarBand.position.set(cx, 0.28, cz);
    streetGroup.add(collarBand);
    materialsToDispose.push(collarBandMat);
    geometriesToDispose.push(collarBandGeo);
  });

  // OSHA Confined Space Hazard Warning Signboard
  const signGeo = new THREE.PlaneGeometry(0.9, 0.56);
  const signBoardMat = new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.4 });
  materialsToDispose.push(signBoardMat);
  const signMesh = new THREE.Mesh(signGeo, signBoardMat);
  signMesh.position.set(-1.8, 0.95, -1.5);
  signMesh.rotation.y = 0.25;
  signMesh.castShadow = true;
  streetGroup.add(signMesh);
  geometriesToDispose.push(signGeo);

  // Sign Stand Legs
  const signStandGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.0, 8);
  const signStand = new THREE.Mesh(signStandGeo, legMat);
  signStand.position.set(-1.8, 0.5, -1.5);
  streetGroup.add(signStand);
  geometriesToDispose.push(signStandGeo);

  // Caution Barricade Tape Strung Around Perimeter
  const tapeMat = new THREE.MeshStandardMaterial({
    map: cautionTapeTex,
    roughness: 0.5,
    side: THREE.DoubleSide
  });
  materialsToDispose.push(tapeMat);

  const tapePositions = [
    [-1.9, 0.65, 0.9, 0.3, 0.65, 1.2],
    [0.3, 0.65, 1.2, 0.3, 0.65, -1.2],
    [0.3, 0.65, -1.2, -1.9, 0.65, -0.9],
    [-1.9, 0.65, -0.9, -1.9, 0.65, 0.9]
  ];
  tapePositions.forEach(([x1, y1, z1, x2, y2, z2]) => {
    const tapeCurve = new THREE.LineCurve3(new THREE.Vector3(x1, y1, z1), new THREE.Vector3(x2, y2, z2));
    const tapeGeo = new THREE.TubeGeometry(tapeCurve, 4, 0.035, 4, false);
    const tapeMesh = new THREE.Mesh(tapeGeo, tapeMat);
    streetGroup.add(tapeMesh);
    geometriesToDispose.push(tapeGeo);
  });

  rootGroup.add(streetGroup);

  return {
    rootGroup,
    concreteVaultGroup,
    soilPitMesh,
    sludgeCrustMesh,
    liquidSupernatantMesh,
    consolidatedSludgeMesh,
    robotGroup,
    robotArmGroup,
    maceratorDrumMesh,
    leftNozzleWorldMesh,
    rightNozzleWorldMesh,
    suctionIntakeWorldMesh,
    robotSpotlights,
    winchCableMesh,
    suctionHoseMesh,
    ventDuctMesh,
    ventDuctMouthMesh,
    streetGroup,
    gantryGroup,
    inspectionCameraTurret,
    materialsToDispose,
    geometriesToDispose
  };
}
