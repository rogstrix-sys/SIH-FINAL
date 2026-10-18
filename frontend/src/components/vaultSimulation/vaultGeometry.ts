import * as THREE from 'three';
import {
  createManholeCoverTexture,
  createAgedConcreteTexture,
  createSectionHatchTexture,
  createSludgeCrustTexture,
  createHazardChevronTexture,
  createCautionTapeTexture,
  createConfinedSpaceSignTexture,
  createSpiralHoseTexture,
  createSoilStrataTexture
} from './vaultTextures';

export interface VaultMeshes {
  rootGroup: THREE.Group;
  concreteVaultGroup: THREE.Group;
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
  lidarTurretMesh: THREE.Mesh;
  laserBeamMesh: THREE.Mesh;
  materialsToDispose: THREE.Material[];
  geometriesToDispose: THREE.BufferGeometry[];
}

/**
 * Builds the Ultra-High-Fidelity Subsurface Vault & Robotics Digital Twin
 */
export function buildVaultEnvironment(): VaultMeshes {
  const rootGroup = new THREE.Group();
  const materialsToDispose: THREE.Material[] = [];
  const geometriesToDispose: THREE.BufferGeometry[] = [];

  // Procedural Textures
  const concreteTex = createAgedConcreteTexture();
  const sectionHatchTex = createSectionHatchTexture();
  const manholeTex = createManholeCoverTexture();
  const sludgeCrustTex = createSludgeCrustTexture();
  const hazardChevronTex = createHazardChevronTexture();
  const cautionTapeTex = createCautionTapeTexture();
  const signTex = createConfinedSpaceSignTexture();
  const spiralHoseTex = createSpiralHoseTexture();
  const soilTex = createSoilStrataTexture();

  // High-End PBR Materials
  const concreteMat = new THREE.MeshStandardMaterial({
    map: concreteTex,
    roughness: 0.82,
    metalness: 0.08
  });
  const sectionCutMat = new THREE.MeshStandardMaterial({
    map: sectionHatchTex,
    roughness: 0.65,
    metalness: 0.15
  });
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x1e242c,
    roughness: 0.55,
    metalness: 0.85
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.15,
    metalness: 0.95
  });
  const robotYellowMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b, // Rescue safety amber-yellow
    roughness: 0.35,
    metalness: 0.35
  });
  const hazardChevronMat = new THREE.MeshStandardMaterial({
    map: hazardChevronTex,
    roughness: 0.45,
    metalness: 0.25
  });
  const pvcMat = new THREE.MeshStandardMaterial({
    color: 0xe65100, // Sanitary orange PVC
    roughness: 0.38,
    metalness: 0.08
  });
  const rebarMat = new THREE.MeshStandardMaterial({
    color: 0xb45309,
    roughness: 0.75,
    metalness: 0.85
  });

  materialsToDispose.push(
    concreteMat,
    sectionCutMat,
    darkMetalMat,
    chromeMat,
    robotYellowMat,
    hazardChevronMat,
    pvcMat,
    rebarMat
  );

  // ==========================================
  // 1. ARCHITECTURAL SECTION-CUT CONCRETE VAULT
  // Clean cross-section (No murky foggy wall! Open engineering view!)
  // ==========================================
  const concreteVaultGroup = new THREE.Group();
  const vaultL = 4.6;
  const vaultW = 2.4;
  const vaultD = 2.6;
  const wallThick = 0.22;

  // Floor Base Slab (Solid cutaway edge in front)
  const floorGeo = new THREE.BoxGeometry(vaultL + wallThick * 2, wallThick, vaultW + wallThick);
  const floorMesh = new THREE.Mesh(floorGeo, concreteMat);
  floorMesh.position.set(0, -vaultD - wallThick / 2, -wallThick / 2);
  floorMesh.receiveShadow = true;
  concreteVaultGroup.add(floorMesh);
  geometriesToDispose.push(floorGeo);

  // Exposed Front Cut Edge of Floor Slab
  const floorCutGeo = new THREE.PlaneGeometry(vaultL + wallThick * 2, wallThick);
  const floorCutMesh = new THREE.Mesh(floorCutGeo, sectionCutMat);
  floorCutMesh.position.set(0, -vaultD - wallThick / 2, vaultW / 2);
  concreteVaultGroup.add(floorCutMesh);
  geometriesToDispose.push(floorCutGeo);

  // Back Concrete Wall (Full height)
  const backWallGeo = new THREE.BoxGeometry(vaultL + wallThick * 2, vaultD, wallThick);
  const backWallMesh = new THREE.Mesh(backWallGeo, concreteMat);
  backWallMesh.position.set(0, -vaultD / 2, -vaultW / 2 - wallThick / 2);
  backWallMesh.receiveShadow = true;
  concreteVaultGroup.add(backWallMesh);
  geometriesToDispose.push(backWallGeo);

  // Left End Wall
  const leftWallGeo = new THREE.BoxGeometry(wallThick, vaultD, vaultW + wallThick);
  const leftWallMesh = new THREE.Mesh(leftWallGeo, concreteMat);
  leftWallMesh.position.set(-vaultL / 2 - wallThick / 2, -vaultD / 2, -wallThick / 2);
  leftWallMesh.receiveShadow = true;
  concreteVaultGroup.add(leftWallMesh);
  geometriesToDispose.push(leftWallGeo);

  // Right End Wall
  const rightWallGeo = new THREE.BoxGeometry(wallThick, vaultD, vaultW + wallThick);
  const rightWallMesh = new THREE.Mesh(rightWallGeo, concreteMat);
  rightWallMesh.position.set(vaultL / 2 + wallThick / 2, -vaultD / 2, -wallThick / 2);
  rightWallMesh.receiveShadow = true;
  concreteVaultGroup.add(rightWallMesh);
  geometriesToDispose.push(rightWallGeo);

  // Exposed Front Section Cuts on Left and Right Walls
  [-vaultL / 2 - wallThick / 2, vaultL / 2 + wallThick / 2].forEach((cutX) => {
    const wallCutGeo = new THREE.PlaneGeometry(wallThick, vaultD);
    const wallCutMesh = new THREE.Mesh(wallCutGeo, sectionCutMat);
    wallCutMesh.position.set(cutX, -vaultD / 2, vaultW / 2);
    concreteVaultGroup.add(wallCutMesh);
    geometriesToDispose.push(wallCutGeo);
  });

  // Center Concrete Baffle Wall with Hydraulic Overflow Notch
  const centerBaffleGeo = new THREE.BoxGeometry(wallThick, vaultD - 0.45, vaultW);
  const centerBaffleMesh = new THREE.Mesh(centerBaffleGeo, concreteMat);
  centerBaffleMesh.position.set(0.5, -vaultD / 2 - 0.22, 0);
  centerBaffleMesh.receiveShadow = true;
  centerBaffleMesh.castShadow = true;
  concreteVaultGroup.add(centerBaffleMesh);
  geometriesToDispose.push(centerBaffleGeo);

  // Overflow Transfer Weir Notch Flange
  const notchGeo = new THREE.BoxGeometry(wallThick + 0.06, 0.15, 0.55);
  const notchMesh = new THREE.Mesh(notchGeo, darkMetalMat);
  notchMesh.position.set(0.5, -0.65, 0);
  concreteVaultGroup.add(notchMesh);
  geometriesToDispose.push(notchGeo);

  // Concrete Roof Slab with Circular Open Manhole Openings
  const roofGeo = new THREE.BoxGeometry(vaultL + wallThick * 2, wallThick, vaultW + wallThick);
  const roofMesh = new THREE.Mesh(roofGeo, concreteMat);
  roofMesh.position.set(0, -wallThick / 2, -wallThick / 2);
  roofMesh.receiveShadow = true;
  concreteVaultGroup.add(roofMesh);
  geometriesToDispose.push(roofGeo);

  // Exposed Front Cut of Roof Slab
  const roofCutGeo = new THREE.PlaneGeometry(vaultL + wallThick * 2, wallThick);
  const roofCutMesh = new THREE.Mesh(roofCutGeo, sectionCutMat);
  roofCutMesh.position.set(0, -wallThick / 2, vaultW / 2);
  concreteVaultGroup.add(roofCutMesh);
  geometriesToDispose.push(roofCutGeo);

  // Exposed Steel Rebar Grid Dots along Section Cut
  for (let rx = -vaultL / 2 + 0.1; rx <= vaultL / 2 - 0.1; rx += 0.35) {
    const rebarDotGeo = new THREE.CircleGeometry(0.016, 10);
    const rebarDot = new THREE.Mesh(rebarDotGeo, rebarMat);
    rebarDot.position.set(rx, -vaultD - wallThick / 2, vaultW / 2 + 0.005);
    concreteVaultGroup.add(rebarDot);
    geometriesToDispose.push(rebarDotGeo);

    const rebarTopDot = rebarDot.clone();
    rebarTopDot.position.set(rx, -wallThick / 2, vaultW / 2 + 0.005);
    concreteVaultGroup.add(rebarTopDot);
  }

  // Cast Iron Manhole Ring Collar over Chamber 1 (-0.8, 0, 0)
  const collarGeo = new THREE.CylinderGeometry(0.38, 0.42, 0.28, 28, 1, true);
  const collarMesh = new THREE.Mesh(collarGeo, darkMetalMat);
  collarMesh.position.set(-0.8, 0.08, 0);
  collarMesh.castShadow = true;
  concreteVaultGroup.add(collarMesh);
  geometriesToDispose.push(collarGeo);

  // Stainless Steel Safety Inspection Ladder Rungs inside manhole shaft
  for (let ld = 0; ld < 6; ld++) {
    const rungGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.38, 8);
    rungGeo.rotateZ(Math.PI / 2);
    const rung = new THREE.Mesh(rungGeo, chromeMat);
    rung.position.set(-0.8, -0.2 - ld * 0.35, -0.32);
    concreteVaultGroup.add(rung);
    geometriesToDispose.push(rungGeo);
  }

  // Cast Iron Manhole Cover (Tilted open on pavement next to hole)
  const coverGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.05, 32);
  const coverMat = new THREE.MeshStandardMaterial({
    map: manholeTex,
    roughness: 0.65,
    metalness: 0.85
  });
  materialsToDispose.push(coverMat);
  const coverMesh = new THREE.Mesh(coverGeo, coverMat);
  coverMesh.position.set(-0.8, 0.08, 0.95);
  coverMesh.rotation.x = 0.22;
  coverMesh.rotation.z = -0.15;
  coverMesh.castShadow = true;
  concreteVaultGroup.add(coverMesh);
  geometriesToDispose.push(coverGeo);

  // Chamber 2 Inspection Manhole Cover (Sealed in place at x = 1.6)
  const chamber2Cover = new THREE.Mesh(coverGeo, coverMat);
  chamber2Cover.position.set(1.6, 0.02, 0);
  chamber2Cover.receiveShadow = true;
  concreteVaultGroup.add(chamber2Cover);

  // PVC Sanitary Inflow & Outflow Drop Tees
  const inletTeeGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.9, 16);
  const inletTee = new THREE.Mesh(inletTeeGeo, pvcMat);
  inletTee.position.set(-1.9, -0.7, -0.8);
  inletTee.castShadow = true;
  concreteVaultGroup.add(inletTee);
  geometriesToDispose.push(inletTeeGeo);

  const outletTeeGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.1, 16);
  const outletTee = new THREE.Mesh(outletTeeGeo, pvcMat);
  outletTee.position.set(2.0, -0.9, -0.8);
  outletTee.castShadow = true;
  concreteVaultGroup.add(outletTee);
  geometriesToDispose.push(outletTeeGeo);

  rootGroup.add(concreteVaultGroup);

  // ==========================================
  // 2. STRATIFIED EXCAVATION SOIL & EARTH CUT
  // ==========================================
  const soilGroup = new THREE.Group();
  const soilMat = new THREE.MeshStandardMaterial({
    map: soilTex,
    roughness: 0.95,
    metalness: 0.05
  });
  materialsToDispose.push(soilMat);

  // Left & Right Exposed Soil Cliffs
  const leftSoilGeo = new THREE.BoxGeometry(2.4, 3.6, vaultW + 1.2);
  const leftSoil = new THREE.Mesh(leftSoilGeo, soilMat);
  leftSoil.position.set(-3.7, -1.8, -0.4);
  soilGroup.add(leftSoil);
  geometriesToDispose.push(leftSoilGeo);

  const rightSoilGeo = new THREE.BoxGeometry(2.4, 3.6, vaultW + 1.2);
  const rightSoil = new THREE.Mesh(rightSoilGeo, soilMat);
  rightSoil.position.set(3.7, -1.8, -0.4);
  soilGroup.add(rightSoil);
  geometriesToDispose.push(rightSoilGeo);

  // Back Soil Embankment
  const backSoilGeo = new THREE.BoxGeometry(9.8, 3.6, 2.8);
  const backSoil = new THREE.Mesh(backSoilGeo, soilMat);
  backSoil.position.set(0, -1.8, -2.8);
  soilGroup.add(backSoil);
  geometriesToDispose.push(backSoilGeo);

  // Retaining Shoring Timber Beams
  const timberMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.88 });
  materialsToDispose.push(timberMat);
  [-2.5, 2.5].forEach((sx) => {
    const beamGeo = new THREE.BoxGeometry(0.18, 3.4, 0.18);
    const beam = new THREE.Mesh(beamGeo, timberMat);
    beam.position.set(sx, -1.7, 1.2);
    soilGroup.add(beam);
    geometriesToDispose.push(beamGeo);
  });

  rootGroup.add(soilGroup);

  // ==========================================
  // 3. MULTI-PHASE DYNAMIC SLUDGE STRATIFICATION
  // ==========================================
  // Bottom Heavy Grit Bed (Consolidated 30% TS)
  const gritGeo = new THREE.BoxGeometry(vaultL - 0.05, 0.55, vaultW - 0.05);
  const gritMat = new THREE.MeshStandardMaterial({
    color: 0x140e0a,
    roughness: 0.98,
    metalness: 0.02
  });
  materialsToDispose.push(gritMat);
  const consolidatedSludgeMesh = new THREE.Mesh(gritGeo, gritMat);
  consolidatedSludgeMesh.position.set(0, -vaultD + 0.275, 0);
  consolidatedSludgeMesh.receiveShadow = true;
  rootGroup.add(consolidatedSludgeMesh);
  geometriesToDispose.push(gritGeo);

  // Middle Supernatant Aqueous Layer (Murky translucent wastewater)
  const liquidGeo = new THREE.BoxGeometry(vaultL - 0.06, 1.25, vaultW - 0.06);
  const liquidMat = new THREE.MeshStandardMaterial({
    color: 0x223326,
    roughness: 0.22,
    metalness: 0.25,
    transparent: true,
    opacity: 0.85
  });
  materialsToDispose.push(liquidMat);
  const liquidSupernatantMesh = new THREE.Mesh(liquidGeo, liquidMat);
  liquidSupernatantMesh.position.set(0, -1.4, 0);
  liquidSupernatantMesh.receiveShadow = true;
  rootGroup.add(liquidSupernatantMesh);
  geometriesToDispose.push(liquidGeo);

  // Top Floating Scum Crust Layer (22% TS dried fractured cake with Voronoi fissures)
  const crustGeo = new THREE.BoxGeometry(vaultL - 0.08, 0.22, vaultW - 0.08);
  const crustMat = new THREE.MeshStandardMaterial({
    map: sludgeCrustTex,
    roughness: 0.94,
    metalness: 0.06,
    transparent: true,
    opacity: 0.98
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
  // High-Tech Industrial Sanitation Submersible Crawler
  // ==========================================
  const robotGroup = new THREE.Group();
  robotGroup.position.set(-0.8, -1.85, 0);

  // Robot Main Submersible Monocoque Chassis (Safety yellow with black hazard chevrons)
  const chassisGeo = new THREE.BoxGeometry(0.68, 0.26, 0.46);
  const robotChassis = new THREE.Mesh(chassisGeo, robotYellowMat);
  robotChassis.castShadow = true;
  robotGroup.add(robotChassis);
  geometriesToDispose.push(chassisGeo);

  // Side Hazard Chevron Decal Panels
  [-0.235, 0.235].forEach((sideZ) => {
    const decalGeo = new THREE.PlaneGeometry(0.55, 0.16);
    if (sideZ < 0) decalGeo.rotateY(Math.PI);
    const decal = new THREE.Mesh(decalGeo, hazardChevronMat);
    decal.position.set(0, 0, sideZ);
    robotGroup.add(decal);
    geometriesToDispose.push(decalGeo);
  });

  // Dual Heavy Continuous Crawler Track Bogies
  const trackRubberMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.92 });
  materialsToDispose.push(trackRubberMat);

  [-0.28, 0.28].forEach((trackZ) => {
    const trackBogey = new THREE.Group();
    trackBogey.position.set(0, -0.1, trackZ);

    // Track Main Frame
    const beltGeo = new THREE.BoxGeometry(0.76, 0.17, 0.10);
    const belt = new THREE.Mesh(beltGeo, trackRubberMat);
    belt.castShadow = true;
    trackBogey.add(belt);
    geometriesToDispose.push(beltGeo);

    // Drive Sprocket (Front) & Idler (Rear)
    [-0.32, 0.32].forEach((wheelX) => {
      const sprocketGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.11, 16);
      sprocketGeo.rotateX(Math.PI / 2);
      const sprocket = new THREE.Mesh(sprocketGeo, darkMetalMat);
      sprocket.position.x = wheelX;
      trackBogey.add(sprocket);
      geometriesToDispose.push(sprocketGeo);
    });

    // 4 Mid-Road Wheels
    for (let rw = -0.18; rw <= 0.18; rw += 0.12) {
      const rwGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.11, 12);
      rwGeo.rotateX(Math.PI / 2);
      const roadWheel = new THREE.Mesh(rwGeo, chromeMat);
      roadWheel.position.set(rw, -0.03, 0);
      trackBogey.add(roadWheel);
      geometriesToDispose.push(rwGeo);
    }

    robotGroup.add(trackBogey);
  });

  // Articulated 4-Axis Hydraulic Robotic Boom Arm
  const robotArmGroup = new THREE.Group();
  robotArmGroup.position.set(0.32, 0.04, 0);

  // Arm Segment 1: Shoulder Turret
  const shoulderGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.12, 16);
  const shoulder = new THREE.Mesh(shoulderGeo, darkMetalMat);
  robotArmGroup.add(shoulder);
  geometriesToDispose.push(shoulderGeo);

  // Arm Segment 2: Boom
  const boomGeo = new THREE.BoxGeometry(0.36, 0.09, 0.09);
  const boom = new THREE.Mesh(boomGeo, robotYellowMat);
  boom.position.set(0.18, 0.08, 0);
  boom.castShadow = true;
  robotArmGroup.add(boom);
  geometriesToDispose.push(boomGeo);

  // Chrome Hydraulic Piston Actuator
  const pistonGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.26, 12);
  pistonGeo.rotateZ(Math.PI / 2);
  const piston = new THREE.Mesh(pistonGeo, chromeMat);
  piston.position.set(0.16, 0.16, 0);
  robotArmGroup.add(piston);
  geometriesToDispose.push(pistonGeo);

  // High-Torque Cylindrical Macerator Cutter Drum with Helical Carbide Teeth
  const cutterDrumGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.36, 20);
  cutterDrumGeo.rotateX(Math.PI / 2);
  const maceratorDrumMesh = new THREE.Mesh(cutterDrumGeo, darkMetalMat);
  maceratorDrumMesh.position.set(0.42, -0.06, 0);
  maceratorDrumMesh.castShadow = true;
  robotArmGroup.add(maceratorDrumMesh);
  geometriesToDispose.push(cutterDrumGeo);

  // Tungsten-Carbide Helical Teeth
  for (let t = 0; t < 16; t++) {
    const toothGeo = new THREE.ConeGeometry(0.024, 0.05, 6);
    const tooth = new THREE.Mesh(toothGeo, chromeMat);
    const angle = (t / 16) * Math.PI * 4;
    const zOffset = (t / 16 - 0.5) * 0.3;
    tooth.position.set(0.42 + Math.cos(angle) * 0.095, -0.06 + Math.sin(angle) * 0.095, zOffset);
    tooth.rotation.z = angle + Math.PI / 2;
    robotArmGroup.add(tooth);
    geometriesToDispose.push(toothGeo);
  }

  // Dual High-Pressure Hydro-Jet Nozzles
  const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.2, metalness: 0.95 });
  materialsToDispose.push(nozzleMat);

  const nozzleGeo = new THREE.CylinderGeometry(0.018, 0.025, 0.08, 12);
  nozzleGeo.rotateZ(Math.PI / 2);

  const leftNozzleWorldMesh = new THREE.Mesh(nozzleGeo, nozzleMat);
  leftNozzleWorldMesh.position.set(0.44, 0.05, 0.18);
  robotArmGroup.add(leftNozzleWorldMesh);
  geometriesToDispose.push(nozzleGeo);

  const rightNozzleWorldMesh = new THREE.Mesh(nozzleGeo, nozzleMat);
  rightNozzleWorldMesh.position.set(0.44, 0.05, -0.18);
  robotArmGroup.add(rightNozzleWorldMesh);

  // Glowing Cyan Laser Guide Beams projecting from nozzles onto sludge surface
  const laserBeamGeo = new THREE.CylinderGeometry(0.004, 0.008, 1.2, 8);
  laserBeamGeo.rotateX(Math.PI / 2);
  const laserBeamMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.65
  });
  materialsToDispose.push(laserBeamMat);
  const laserBeamMesh = new THREE.Mesh(laserBeamGeo, laserBeamMat);
  laserBeamMesh.position.set(0.9, -0.2, 0);
  laserBeamMesh.rotation.y = 0.15;
  robotArmGroup.add(laserBeamMesh);
  geometriesToDispose.push(laserBeamGeo);

  // Suction Intake Hood with Camlock Coupling
  const intakeGeo = new THREE.CylinderGeometry(0.07, 0.095, 0.14, 16);
  intakeGeo.rotateZ(Math.PI / 2);
  const suctionIntakeWorldMesh = new THREE.Mesh(intakeGeo, darkMetalMat);
  suctionIntakeWorldMesh.position.set(0.36, -0.06, 0);
  robotArmGroup.add(suctionIntakeWorldMesh);
  geometriesToDispose.push(intakeGeo);

  robotGroup.add(robotArmGroup);

  // Dual Underwater LED Floodlights with real-time shadow casting
  const robotSpotlights: THREE.SpotLight[] = [];
  [-0.15, 0.15].forEach((lightZ) => {
    const spot = new THREE.SpotLight(0xfef08a, 4.5, 8.0, Math.PI / 4, 0.35, 1.2);
    spot.position.set(0.28, 0.16, lightZ);
    spot.target.position.set(2.2, -0.8, lightZ);
    spot.castShadow = true;
    robotGroup.add(spot);
    robotGroup.add(spot.target);
    robotSpotlights.push(spot);
  });

  // PTZ Inspection Camera Turret with glowing cyan lens
  const inspectionCameraTurret = new THREE.Group();
  inspectionCameraTurret.position.set(-0.12, 0.24, 0);

  const camHousingGeo = new THREE.SphereGeometry(0.07, 16, 16);
  const camHousing = new THREE.Mesh(camHousingGeo, darkMetalMat);
  inspectionCameraTurret.add(camHousing);
  geometriesToDispose.push(camHousingGeo);

  const lensGeo = new THREE.CylinderGeometry(0.035, 0.038, 0.04, 16);
  lensGeo.rotateZ(Math.PI / 2);
  const lensMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.1,
    metalness: 0.95,
    emissive: 0x0284c7,
    emissiveIntensity: 0.4
  });
  materialsToDispose.push(lensMat);
  const lens = new THREE.Mesh(lensGeo, lensMat);
  lens.position.set(0.06, 0, 0);
  inspectionCameraTurret.add(lens);
  geometriesToDispose.push(lensGeo);

  robotGroup.add(inspectionCameraTurret);

  // Rotating LiDAR Scanner Turret
  const lidarTurretGeo = new THREE.CylinderGeometry(0.06, 0.07, 0.08, 16);
  const lidarTurretMesh = new THREE.Mesh(lidarTurretGeo, darkMetalMat);
  lidarTurretMesh.position.set(-0.25, 0.22, 0);
  robotGroup.add(lidarTurretMesh);
  geometriesToDispose.push(lidarTurretGeo);

  rootGroup.add(robotGroup);

  // ==========================================
  // 5. SURFACE STREET & GANTRY TRIPOD
  // ==========================================
  const streetGroup = new THREE.Group();

  // Asphalt Ground Surface with Road Paint
  const groundGeo = new THREE.PlaneGeometry(16, 16);
  groundGeo.rotateX(-Math.PI / 2);
  const asphaltMat = new THREE.MeshStandardMaterial({
    color: 0x1f2328,
    roughness: 0.94,
    metalness: 0.06
  });
  materialsToDispose.push(asphaltMat);
  const groundMesh = new THREE.Mesh(groundGeo, asphaltMat);
  groundMesh.receiveShadow = true;
  streetGroup.add(groundMesh);
  geometriesToDispose.push(groundGeo);

  // Yellow Road Safety Curb Line
  const curbGeo = new THREE.BoxGeometry(16, 0.15, 0.2);
  const curbMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.7 });
  materialsToDispose.push(curbMat);
  const curbMesh = new THREE.Mesh(curbGeo, curbMat);
  curbMesh.position.set(0, 0.075, 2.2);
  curbMesh.castShadow = true;
  streetGroup.add(curbMesh);
  geometriesToDispose.push(curbGeo);

  // Heavy Aluminum Rescue Gantry Tripod (-0.8, 0, 0)
  const gantryGroup = new THREE.Group();
  gantryGroup.position.set(-0.8, 0, 0);

  const crownGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.1, 16);
  const crownMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4, metalness: 0.7 });
  materialsToDispose.push(crownMat);
  const crown = new THREE.Mesh(crownGeo, crownMat);
  crown.position.set(0, 2.5, 0);
  crown.castShadow = true;
  gantryGroup.add(crown);
  geometriesToDispose.push(crownGeo);

  // 3 Extruded Aluminum Telescoping Legs with Hazard Stripes
  for (let l = 0; l < 3; l++) {
    const angle = (l / 3) * Math.PI * 2;
    const footX = Math.cos(angle) * 1.05;
    const footZ = Math.sin(angle) * 1.05;

    const legCurve = new THREE.LineCurve3(new THREE.Vector3(0, 2.5, 0), new THREE.Vector3(footX, 0, footZ));
    const legGeo = new THREE.TubeGeometry(legCurve, 8, 0.035, 10, false);
    const leg = new THREE.Mesh(legGeo, chromeMat);
    leg.castShadow = true;
    gantryGroup.add(leg);
    geometriesToDispose.push(legGeo);

    // Rubber Foot Swivel Pad
    const padGeo = new THREE.CylinderGeometry(0.09, 0.1, 0.035, 12);
    const pad = new THREE.Mesh(padGeo, darkMetalMat);
    pad.position.set(footX, 0.018, footZ);
    gantryGroup.add(pad);
    geometriesToDispose.push(padGeo);
  }

  // Motorized Winch Drum & Cable Sheave
  const winchDrumGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.22, 16);
  winchDrumGeo.rotateZ(Math.PI / 2);
  const winchDrum = new THREE.Mesh(winchDrumGeo, darkMetalMat);
  winchDrum.position.set(0, 2.38, 0);
  gantryGroup.add(winchDrum);
  geometriesToDispose.push(winchDrumGeo);

  // Active Stainless Steel Winch Cable Line
  const cableMat = new THREE.LineBasicMaterial({ color: 0xf1f5f9, linewidth: 2 });
  materialsToDispose.push(cableMat);
  const cableGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 2.38, 0),
    new THREE.Vector3(0, -1.85, 0)
  ]);
  const winchCableMesh = new THREE.Line(cableGeo, cableMat);
  gantryGroup.add(winchCableMesh);
  geometriesToDispose.push(cableGeo);

  rootGroup.add(gantryGroup);

  // Surface Suction Hose Line (connecting robot to tanker intake)
  const hoseCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.5, -1.85, 0),
    new THREE.Vector3(-0.65, -1.2, 0.2),
    new THREE.Vector3(-0.8, -0.2, 0.15),
    new THREE.Vector3(-1.1, 0.15, 0.8),
    new THREE.Vector3(-2.4, 0.12, 1.8)
  ]);
  const hoseGeo = new THREE.TubeGeometry(hoseCurve, 32, 0.065, 12, false);
  const hoseMat = new THREE.MeshStandardMaterial({
    map: spiralHoseTex,
    roughness: 0.45,
    metalness: 0.35,
    transparent: true,
    opacity: 0.94
  });
  materialsToDispose.push(hoseMat);
  const suctionHoseMesh = new THREE.Mesh(hoseGeo, hoseMat);
  suctionHoseMesh.castShadow = true;
  rootGroup.add(suctionHoseMesh);
  geometriesToDispose.push(hoseGeo);

  // Surface Vacuum Tanker Rear End / Manifold Station (-2.4, 0, 1.8)
  const tankerStation = new THREE.Group();
  tankerStation.position.set(-2.4, 0, 1.8);

  const pumpBoxGeo = new THREE.BoxGeometry(0.8, 0.75, 0.9);
  const pumpBox = new THREE.Mesh(pumpBoxGeo, darkMetalMat);
  pumpBox.position.y = 0.38;
  pumpBox.castShadow = true;
  tankerStation.add(pumpBox);
  geometriesToDispose.push(pumpBoxGeo);

  // Chrome Suction Manifold Valve
  const valveGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.22, 16);
  valveGeo.rotateZ(Math.PI / 2);
  const valve = new THREE.Mesh(valveGeo, chromeMat);
  valve.position.set(0.42, 0.4, 0);
  tankerStation.add(valve);
  geometriesToDispose.push(valveGeo);

  rootGroup.add(tankerStation);

  // Ventilation Blower & Collapsible Yellow Duct
  const blowerGroup = new THREE.Group();
  blowerGroup.position.set(-1.6, 0, -0.6);

  const blowerGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.24, 16);
  blowerGeo.rotateZ(Math.PI / 2);
  const blowerMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
  materialsToDispose.push(blowerMat);
  const blower = new THREE.Mesh(blowerGeo, blowerMat);
  blower.position.set(0, 0.25, 0);
  blower.castShadow = true;
  blowerGroup.add(blower);
  geometriesToDispose.push(blowerGeo);

  rootGroup.add(blowerGroup);

  // Yellow Flexible Ventilation Duct entering vault
  const ductCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.45, 0.25, -0.6),
    new THREE.Vector3(-1.0, 0.15, -0.4),
    new THREE.Vector3(-0.8, -0.15, -0.3),
    new THREE.Vector3(-0.75, -1.1, -0.35)
  ]);
  const ductGeo = new THREE.TubeGeometry(ductCurve, 24, 0.085, 12, false);
  const ventDuctMesh = new THREE.Mesh(ductGeo, blowerMat);
  ventDuctMesh.castShadow = true;
  rootGroup.add(ventDuctMesh);
  geometriesToDispose.push(ductGeo);

  const ventMouthGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.06, 12);
  const ventDuctMouthMesh = new THREE.Mesh(ventMouthGeo, blowerMat);
  ventDuctMouthMesh.position.set(-0.75, -1.1, -0.35);
  rootGroup.add(ventDuctMouthMesh);
  geometriesToDispose.push(ventMouthGeo);

  // Street Safety Cones with Reflective Collars
  const coneMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5 });
  materialsToDispose.push(coneMat);
  [
    [-1.9, 0.9],
    [-1.9, -0.9],
    [0.3, 1.2],
    [0.3, -1.2]
  ].forEach(([cx, cz]) => {
    const cGeo = new THREE.ConeGeometry(0.15, 0.55, 14);
    const cMesh = new THREE.Mesh(cGeo, coneMat);
    cMesh.position.set(cx, 0.275, cz);
    cMesh.castShadow = true;
    streetGroup.add(cMesh);
    geometriesToDispose.push(cGeo);
  });

  // OSHA Confined Space Warning Placard
  const signGeo = new THREE.PlaneGeometry(0.95, 0.6);
  const signMat = new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.4 });
  materialsToDispose.push(signMat);
  const sign = new THREE.Mesh(signGeo, signMat);
  sign.position.set(-1.8, 0.95, -1.5);
  sign.rotation.y = 0.25;
  sign.castShadow = true;
  streetGroup.add(sign);
  geometriesToDispose.push(signGeo);

  // Caution Hazard Perimeter Tape
  const tapeMat = new THREE.MeshStandardMaterial({ map: cautionTapeTex, side: THREE.DoubleSide });
  materialsToDispose.push(tapeMat);
  [
    [-1.9, 0.65, 0.9, 0.3, 0.65, 1.2],
    [0.3, 0.65, 1.2, 0.3, 0.65, -1.2],
    [0.3, 0.65, -1.2, -1.9, 0.65, -0.9],
    [-1.9, 0.65, -0.9, -1.9, 0.65, 0.9]
  ].forEach(([x1, y1, z1, x2, y2, z2]) => {
    const tapeCurve = new THREE.LineCurve3(new THREE.Vector3(x1, y1, z1), new THREE.Vector3(x2, y2, z2));
    const tapeGeo = new THREE.TubeGeometry(tapeCurve, 4, 0.038, 4, false);
    const tape = new THREE.Mesh(tapeGeo, tapeMat);
    streetGroup.add(tape);
    geometriesToDispose.push(tapeGeo);
  });

  rootGroup.add(streetGroup);

  return {
    rootGroup,
    concreteVaultGroup,
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
    lidarTurretMesh,
    laserBeamMesh,
    materialsToDispose,
    geometriesToDispose
  };
}
