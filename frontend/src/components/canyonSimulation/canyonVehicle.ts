import * as THREE from 'three';

export interface CanyonVehicleMeshes {
  rootGroup: THREE.Group;
  chassisBody: THREE.Group;
  wheelGroups: THREE.Group[];
  frontSteerGroups: THREE.Group[];
  radarDishMesh: THREE.Mesh;
  craneBoomGroup: THREE.Group;
  headlights: THREE.SpotLight[];
  taillightsMat: THREE.MeshStandardMaterial;
  exhaustStackWorld: THREE.Vector3;
  materialsToDispose: THREE.Material[];
  geometriesToDispose: THREE.BufferGeometry[];
}

/**
 * Builds the High-Fidelity 6x6 Heavy All-Terrain Expedition Desludger Carrier
 */
export function buildCanyonVehicle(): CanyonVehicleMeshes {
  const rootGroup = new THREE.Group();
  const materialsToDispose: THREE.Material[] = [];
  const geometriesToDispose: THREE.BufferGeometry[] = [];

  // PBR Materials
  const cabPaintMat = new THREE.MeshStandardMaterial({
    color: 0xd97706, // High-visibility Himalayan expedition amber/orange
    roughness: 0.38,
    metalness: 0.65
  });
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    roughness: 0.6,
    metalness: 0.8
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.15,
    metalness: 0.95
  });
  const rubberMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.92
  });
  const tankMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7, // industrial cyan vacuum tank
    roughness: 0.45,
    metalness: 0.55
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.1,
    metalness: 0.9,
    transparent: true,
    opacity: 0.85
  });
  const taillightsMat = new THREE.MeshStandardMaterial({
    color: 0x7f1d1d, // dark red when idle, emissive red when braking
    roughness: 0.3,
    emissive: 0x000000
  });

  materialsToDispose.push(cabPaintMat, darkMetalMat, chromeMat, rubberMat, tankMat, glassMat, taillightsMat);

  // Chassis Body (can pitch and roll on suspension)
  const chassisBody = new THREE.Group();
  chassisBody.position.y = 0.65; // Ground clearance

  // Ladder Frame Steel Rails
  const frameGeo = new THREE.BoxGeometry(4.8, 0.22, 1.2);
  const frame = new THREE.Mesh(frameGeo, darkMetalMat);
  frame.castShadow = true;
  chassisBody.add(frame);
  geometriesToDispose.push(frameGeo);

  // Heavy 6x6 Forward-Control Cab (Front: x = 1.2 to 2.4)
  const cabGeo = new THREE.BoxGeometry(1.4, 1.45, 1.6);
  const cab = new THREE.Mesh(cabGeo, cabPaintMat);
  cab.position.set(1.5, 0.75, 0);
  cab.castShadow = true;
  chassisBody.add(cab);
  geometriesToDispose.push(cabGeo);

  // Tinted Windshield
  const windshieldGeo = new THREE.BoxGeometry(0.08, 0.65, 1.4);
  const windshield = new THREE.Mesh(windshieldGeo, glassMat);
  windshield.position.set(2.21, 0.95, 0);
  chassisBody.add(windshield);
  geometriesToDispose.push(windshieldGeo);

  // Rooftop LED Light Bar
  const lightBarGeo = new THREE.BoxGeometry(0.12, 0.12, 1.3);
  const lightBarMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2.0 });
  const lightBar = new THREE.Mesh(lightBarGeo, lightBarMat);
  lightBar.position.set(1.6, 1.55, 0);
  chassisBody.add(lightBar);
  materialsToDispose.push(lightBarMat);
  geometriesToDispose.push(lightBarGeo);

  // Rotating Rooftop Radar / LiDAR Turret
  const radarMastGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.35, 12);
  const radarMast = new THREE.Mesh(radarMastGeo, chromeMat);
  radarMast.position.set(1.1, 1.65, 0);
  chassisBody.add(radarMast);
  geometriesToDispose.push(radarMastGeo);

  const radarDishGeo = new THREE.CylinderGeometry(0.35, 0.18, 0.1, 16);
  radarDishGeo.rotateX(Math.PI / 2);
  const radarDishMesh = new THREE.Mesh(radarDishGeo, darkMetalMat);
  radarDishMesh.position.set(1.1, 1.85, 0);
  chassisBody.add(radarDishMesh);
  geometriesToDispose.push(radarDishGeo);

  // Rear Heavy Vacuum Septage Tank (Cylindrical with domed ends)
  const tankGeo = new THREE.CylinderGeometry(0.72, 0.72, 2.6, 24);
  tankGeo.rotateZ(Math.PI / 2);
  const tankMesh = new THREE.Mesh(tankGeo, tankMat);
  tankMesh.position.set(-0.85, 0.85, 0);
  tankMesh.castShadow = true;
  chassisBody.add(tankMesh);
  geometriesToDispose.push(tankGeo);

  // Tank Reinforcing Structural Bands
  [-1.6, -0.85, -0.1].forEach((bandX) => {
    const bandGeo = new THREE.CylinderGeometry(0.74, 0.74, 0.12, 24);
    bandGeo.rotateZ(Math.PI / 2);
    const band = new THREE.Mesh(bandGeo, darkMetalMat);
    band.position.set(bandX, 0.85, 0);
    chassisBody.add(band);
    geometriesToDispose.push(bandGeo);
  });

  // Articulated 3-Stage Hydraulic Suction Crane Boom Arm on Tank
  const craneBoomGroup = new THREE.Group();
  craneBoomGroup.position.set(-2.1, 1.25, 0);

  const boom1Geo = new THREE.BoxGeometry(0.16, 0.16, 0.9);
  boom1Geo.rotateX(Math.PI / 2);
  const boom1 = new THREE.Mesh(boom1Geo, darkMetalMat);
  boom1.position.set(0, 0.45, 0);
  craneBoomGroup.add(boom1);
  geometriesToDispose.push(boom1Geo);

  const boom2Geo = new THREE.BoxGeometry(1.2, 0.14, 0.14);
  const boom2 = new THREE.Mesh(boom2Geo, cabPaintMat);
  boom2.position.set(0.6, 0.9, 0);
  craneBoomGroup.add(boom2);
  geometriesToDispose.push(boom2Geo);

  chassisBody.add(craneBoomGroup);

  // Twin Vertical High-Mounted Exhaust Stacks
  [-0.68, 0.68].forEach((stackZ) => {
    const pipeGeo = new THREE.CylinderGeometry(0.065, 0.065, 1.8, 12);
    const pipe = new THREE.Mesh(pipeGeo, chromeMat);
    pipe.position.set(0.75, 1.25, stackZ);
    pipe.castShadow = true;
    chassisBody.add(pipe);
    geometriesToDispose.push(pipeGeo);
  });

  // Dual High-Beam LED Projector Headlights
  const headlights: THREE.SpotLight[] = [];
  [-0.55, 0.55].forEach((lightZ) => {
    const spot = new THREE.SpotLight(0xfffbeb, 5.0, 38, Math.PI / 5, 0.25, 1.2);
    spot.position.set(2.25, 0.55, lightZ);
    spot.target.position.set(14.0, -1.0, lightZ);
    spot.castShadow = true;
    spot.shadow.mapSize.width = 512;
    spot.shadow.mapSize.height = 512;
    chassisBody.add(spot);
    chassisBody.add(spot.target);
    headlights.push(spot);
  });

  // Rear LED Taillights / Brake Lights
  [-0.55, 0.55].forEach((tailZ) => {
    const tailGeo = new THREE.BoxGeometry(0.06, 0.14, 0.22);
    const tail = new THREE.Mesh(tailGeo, taillightsMat);
    tail.position.set(-2.41, 0.55, tailZ);
    chassisBody.add(tail);
    geometriesToDispose.push(tailGeo);
  });

  rootGroup.add(chassisBody);

  // 6 Independent Wheel Suspensions (Front Axle: x = 1.4, Middle: x = -0.4, Rear: x = -1.6)
  const wheelGroups: THREE.Group[] = [];
  const frontSteerGroups: THREE.Group[] = [];

  const axlePositions = [
    { x: 1.4, isSteer: true },   // Front steer axle
    { x: -0.4, isSteer: false }, // Middle drive axle
    { x: -1.6, isSteer: false }  // Rear tandem drive axle
  ];

  axlePositions.forEach((axle) => {
    [-0.92, 0.92].forEach((wheelZ) => {
      const wheelMountGroup = new THREE.Group();
      wheelMountGroup.position.set(axle.x, 0.45, wheelZ);

      // Steering pivot sub-group for front wheels
      const steerPivot = new THREE.Group();
      wheelMountGroup.add(steerPivot);

      if (axle.isSteer) {
        frontSteerGroups.push(steerPivot);
      }

      // Wheel Hub and Spinning Assembly
      const wheelSpinGroup = new THREE.Group();
      steerPivot.add(wheelSpinGroup);

      // Heavy Off-Road Tire
      const tireGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.38, 20);
      tireGeo.rotateX(Math.PI / 2);
      const tireMesh = new THREE.Mesh(tireGeo, rubberMat);
      tireMesh.castShadow = true;
      wheelSpinGroup.add(tireMesh);
      geometriesToDispose.push(tireGeo);

      // Beadlock Steel Rim Hub
      const rimGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.39, 16);
      rimGeo.rotateX(Math.PI / 2);
      const rimMesh = new THREE.Mesh(rimGeo, chromeMat);
      wheelSpinGroup.add(rimMesh);
      geometriesToDispose.push(rimGeo);

      // Suspension Coil Spring
      const springGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.35, 8);
      const spring = new THREE.Mesh(springGeo, cabPaintMat);
      spring.position.y = 0.25;
      wheelMountGroup.add(spring);
      geometriesToDispose.push(springGeo);

      rootGroup.add(wheelMountGroup);
      wheelGroups.push(wheelSpinGroup);
    });
  });

  return {
    rootGroup,
    chassisBody,
    wheelGroups,
    frontSteerGroups,
    radarDishMesh,
    craneBoomGroup,
    headlights,
    taillightsMat,
    exhaustStackWorld: new THREE.Vector3(0.75, 2.15, -0.68),
    materialsToDispose,
    geometriesToDispose
  };
}
