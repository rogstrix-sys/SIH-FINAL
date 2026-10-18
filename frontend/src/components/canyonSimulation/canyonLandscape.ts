import * as THREE from 'three';

export interface CanyonLandscapeMeshes {
  rootGroup: THREE.Group;
  terrainMesh: THREE.Mesh;
  riverMesh: THREE.Mesh;
  roadCurve: THREE.CatmullRomCurve3;
  roadMesh: THREE.Mesh;
  bridgeGroup: THREE.Group;
  tunnelGroup: THREE.Group;
  waterfallCrestWorld: THREE.Vector3;
  materialsToDispose: THREE.Material[];
  geometriesToDispose: THREE.BufferGeometry[];
}

/**
 * Creates high-resolution canvas texture for Border Roads Organisation (BRO) portal signboards
 */
function createTunnelSignboardTexture(title: string, subText: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Deep BRO Navy Blue
    ctx.fillStyle = '#0a233b';
    ctx.fillRect(0, 0, 512, 128);

    // Double Golden-Yellow Border
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 5;
    ctx.strokeRect(6, 6, 500, 116);
    ctx.lineWidth = 2;
    ctx.strokeRect(12, 12, 488, 104);

    // Top Header
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BORDER ROADS ORGANISATION · PROJECT DEEPAK', 256, 38);

    // Main Tunnel Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px "Segoe UI", Arial, sans-serif';
    ctx.fillText(title, 256, 74);

    // Technical Subtitle / Clearance
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
    ctx.fillText(subText, 256, 104);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

/**
 * Creates high-visibility yellow and charcoal hazard chevron stripes for portal pilasters
 */
function createHazardStripeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, 128, 256);

    ctx.fillStyle = '#facc15';
    for (let y = -128; y < 384; y += 48) {
      ctx.beginPath();
      ctx.moveTo(-10, y);
      ctx.lineTo(138, y + 74);
      ctx.lineTo(138, y + 104);
      ctx.lineTo(-10, y + 30);
      ctx.closePath();
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 1);
  return tex;
}

/**
 * Builds an authentic dressed-granite stone arch portal structure with BRO signboards and wingwalls
 */
function createPortalStructure(
  title: string,
  subText: string,
  stoneMat: THREE.Material,
  keystoneMat: THREE.Material,
  hazardMat: THREE.Material,
  materialsToDispose: THREE.Material[],
  geometriesToDispose: THREE.BufferGeometry[]
): THREE.Group {
  const group = new THREE.Group();

  // 1. Left and Right Massive Stone Pilasters (width: 1.6, height: 5.6, depth: 3.2)
  const pillarGeo = new THREE.BoxGeometry(1.6, 5.6, 3.2);
  const leftPillar = new THREE.Mesh(pillarGeo, stoneMat);
  leftPillar.position.set(-3.1, 2.8, 0);
  leftPillar.castShadow = true;
  leftPillar.receiveShadow = true;
  group.add(leftPillar);

  const rightPillar = new THREE.Mesh(pillarGeo, stoneMat);
  rightPillar.position.set(3.1, 2.8, 0);
  rightPillar.castShadow = true;
  rightPillar.receiveShadow = true;
  group.add(rightPillar);
  geometriesToDispose.push(pillarGeo);

  // 2. Heavy Arch Lintel Beam
  const lintelGeo = new THREE.BoxGeometry(7.8, 1.4, 3.2);
  const lintel = new THREE.Mesh(lintelGeo, stoneMat);
  lintel.position.set(0, 5.5, 0);
  lintel.castShadow = true;
  lintel.receiveShadow = true;
  group.add(lintel);
  geometriesToDispose.push(lintelGeo);

  // 3. Central Protruding Keystone
  const keystoneGeo = new THREE.BoxGeometry(0.85, 1.6, 3.5);
  const keystone = new THREE.Mesh(keystoneGeo, keystoneMat);
  keystone.position.set(0, 5.5, 0);
  group.add(keystone);
  geometriesToDispose.push(keystoneGeo);

  // 4. Angled Rock Retaining Wingwalls
  const wingwallGeo = new THREE.BoxGeometry(2.4, 5.0, 1.2);
  const leftWing = new THREE.Mesh(wingwallGeo, stoneMat);
  leftWing.position.set(-4.8, 2.5, 0.6);
  leftWing.rotation.y = Math.PI / 6;
  group.add(leftWing);

  const rightWing = new THREE.Mesh(wingwallGeo, stoneMat);
  rightWing.position.set(4.8, 2.5, 0.6);
  rightWing.rotation.y = -Math.PI / 6;
  group.add(rightWing);
  geometriesToDispose.push(wingwallGeo);

  // 5. Official BRO Signboard mounted on front lintel face (local z = -1.62)
  const signTex = createTunnelSignboardTexture(title, subText);
  const signMat = new THREE.MeshStandardMaterial({
    map: signTex,
    roughness: 0.4,
    metalness: 0.1
  });
  materialsToDispose.push(signMat);

  const signGeo = new THREE.PlaneGeometry(4.4, 1.1);
  const signMesh = new THREE.Mesh(signGeo, signMat);
  signMesh.position.set(0, 5.45, -1.62);
  signMesh.rotation.y = Math.PI; // Face oncoming traffic (-Z)
  group.add(signMesh);
  geometriesToDispose.push(signGeo);

  // 6. Black & Yellow Hazard Chevron Plates on Pilaster Faces
  const hazardGeo = new THREE.PlaneGeometry(0.85, 2.8);
  const leftHazard = new THREE.Mesh(hazardGeo, hazardMat);
  leftHazard.position.set(-2.8, 2.2, -1.62);
  leftHazard.rotation.y = Math.PI;
  group.add(leftHazard);

  const rightHazard = new THREE.Mesh(hazardGeo, hazardMat);
  rightHazard.position.set(2.8, 2.2, -1.62);
  rightHazard.rotation.y = Math.PI;
  group.add(rightHazard);
  geometriesToDispose.push(hazardGeo);

  // 7. Green LED Traffic Clearance Signal Lantern
  const signalGeo = new THREE.SphereGeometry(0.16, 12, 12);
  const signalMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
  const signalMesh = new THREE.Mesh(signalGeo, signalMat);
  signalMesh.position.set(0, 4.65, -1.65);
  group.add(signalMesh);
  materialsToDispose.push(signalMat);
  geometriesToDispose.push(signalGeo);

  // 8. Portal Entrance Overhead Sodium Light
  const portalLamp = new THREE.PointLight(0xf59e0b, 2.4, 14, 1.4);
  portalLamp.position.set(0, 4.2, 0);
  group.add(portalLamp);

  return group;
}

/**
 * Builds the dramatic Himalayan Canyon Gorge, River, Engineered Road Cut,
 * Wooden Suspension Bridge & Blasted Mountain Tunnel
 */
export function buildCanyonLandscape(): CanyonLandscapeMeshes {
  const rootGroup = new THREE.Group();
  const materialsToDispose: THREE.Material[] = [];
  const geometriesToDispose: THREE.BufferGeometry[] = [];

  // =========================================================================
  // 1. ROAD WAYPOINTS & CURVE DEFINITION (Calculated First to Carve Terrain)
  // =========================================================================
  const roadWaypoints = [
    new THREE.Vector3(-42, 2.8, -48),  // Waypoint 0: Exit from North Tunnel Portal into Open Gorge
    new THREE.Vector3(-36, 1.2, -32),
    new THREE.Vector3(-28, 0.4, -18),
    new THREE.Vector3(-20, 0.0, -4),   // River crossing approach
    new THREE.Vector3(-14, 0.2, 10),
    new THREE.Vector3(-18, 2.5, 26),   // Hairpin switchback 1
    new THREE.Vector3(-28, 5.8, 36),
    new THREE.Vector3(-34, 8.4, 22),   // Climbing cliff face
    new THREE.Vector3(-30, 10.2, 6),
    new THREE.Vector3(-22, 11.8, -8),
    new THREE.Vector3(-15, 12.0, -18), // West Bridge Abutment
    // Suspension Bridge Span (x = -14 to +14, y = 12.0)
    new THREE.Vector3(-10, 12.0, -18),
    new THREE.Vector3(0, 11.7, -18),   // Mid-span slight sag
    new THREE.Vector3(10, 12.0, -18),
    new THREE.Vector3(15, 12.0, -18),  // East Bridge Abutment
    new THREE.Vector3(26, 11.2, -6),
    new THREE.Vector3(34, 9.8, 12),
    new THREE.Vector3(28, 7.5, 28),    // East descending switchback
    new THREE.Vector3(18, 5.0, 42),
    new THREE.Vector3(4, 3.2, 48),
    new THREE.Vector3(-10, 1.5, 52),
    new THREE.Vector3(-25, 0.5, 46),
    new THREE.Vector3(-35, 1.2, 28),
    new THREE.Vector3(-44, 2.5, 6),    // Approach to South Tunnel Portal
    new THREE.Vector3(-48, 3.0, -18)   // Deep Inside Mountain Tunnel
  ];
  const roadCurve = new THREE.CatmullRomCurve3(roadWaypoints, true, 'catmullrom', 0.15);

  // Pre-sample road curve for terrain benching
  const roadSampleCount = 240;
  const roadSamples: { pt: THREE.Vector3; u: number }[] = [];
  for (let s = 0; s < roadSampleCount; s++) {
    const u = s / roadSampleCount;
    roadSamples.push({ pt: roadCurve.getPointAt(u), u });
  }

  // =========================================================================
  // 2. PROCEDURAL CANYON TERRAIN WITH ENGINEERED ROAD BENCHING
  // =========================================================================
  const terrainSize = 160;
  const segments = 120;
  const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, segments, segments);
  terrainGeo.rotateX(-Math.PI / 2);

  const posAttr = terrainGeo.attributes.position as THREE.BufferAttribute;
  const posArr = posAttr.array as Float32Array;
  const colors = new Float32Array(posArr.length);

  /**
   * Evaluates terrain elevation at (x, z) taking road excavation into account
   */
  const computeTerrainPoint = (x: number, z: number): { y: number; isRoadCut: boolean } => {
    // Gorge centerline is curved river valley around x = 0 to 12
    const gorgeDistance = Math.abs(x - Math.sin(z * 0.05) * 8.0);
    let y = 0;
    if (gorgeDistance < 14) {
      // Deep canyon riverbed
      const t = gorgeDistance / 14;
      y = -2.5 + Math.pow(t, 2.5) * 12.0;
    } else {
      // Mountain bluffs and ridges
      const distFromGorge = gorgeDistance - 14;
      y = 9.5 + Math.sin(x * 0.08) * 4.5 + Math.cos(z * 0.06) * 5.0 + (distFromGorge * 0.18);
    }
    y += Math.sin(x * 0.2) * Math.cos(z * 0.2) * 1.2;

    // Find nearest road waypoint sample
    let minDist = Infinity;
    let nearestRoadY = 0;
    let nearestU = 0;
    for (let s = 0; s < roadSampleCount; s++) {
      const r = roadSamples[s];
      const dist = Math.hypot(x - r.pt.x, z - r.pt.z);
      if (dist < minDist) {
        minDist = dist;
        nearestRoadY = r.pt.y;
        nearestU = r.u;
      }
    }

    // Exclusion 1: Wooden Suspension Bridge Gorge Span (|x| < 14.5, z ≈ -18)
    const isBridgeSpan = Math.abs(x) < 14.5 && Math.abs(z - (-18)) < 6.0;

    // Exclusion 2: Mountain Tunnel Zone (x < -36, u between 0.872 and 0.988)
    // Mountain ridge must remain high to form the mountain roof above the tunnel!
    const isTunnelMassif = x < -36 && nearestU >= 0.872 && nearestU <= 0.988;

    let isRoadCut = false;
    if (!isBridgeSpan && !isTunnelMassif) {
      // Open-air road section: Bench cut the terrain to prevent dirt clipping!
      const roadBenchRadius = 2.0; // Flat roadbed + drainage shoulder
      const roadBlendRadius = 4.8; // Mountain cut slope blend
      if (minDist < roadBlendRadius) {
        isRoadCut = true;
        const benchY = nearestRoadY - 0.22;
        if (minDist <= roadBenchRadius) {
          y = benchY;
        } else {
          const blend = (minDist - roadBenchRadius) / (roadBlendRadius - roadBenchRadius);
          const targetY = benchY * (1 - blend) + y * blend;
          if (y > targetY) {
            y = targetY;
          }
        }
      }
    }

    return { y, isRoadCut };
  };

  // Shape elevation and vertex colors for all terrain vertices
  for (let i = 0; i < posArr.length / 3; i++) {
    const x = posArr[i * 3];
    const z = posArr[i * 3 + 2];
    const { y, isRoadCut } = computeTerrainPoint(x, z);
    posArr[i * 3 + 1] = y;

    // Elevation & roadcut-based terrain vertex coloring
    let r = 0.35, g = 0.38, b = 0.30;
    if (isRoadCut) {
      // Blasted mountain slate / crushed gravel road shoulder
      r = 0.32; g = 0.30; b = 0.28;
    } else if (y < -1.0) {
      // River gravel / silt bed
      r = 0.28; g = 0.26; b = 0.22;
    } else if (y < 8.0) {
      // Steep slate & sandstone cliff faces
      r = 0.42; g = 0.38; b = 0.35;
    } else if (y < 16.0) {
      // Lush mountain pine moss & grass
      r = 0.22; g = 0.38; b = 0.20;
    } else {
      // Alpine scree / ridge snow
      r = 0.85; g = 0.90; b = 0.95;
    }

    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
  }

  terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  terrainGeo.computeVertexNormals();

  const terrainMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.92,
    metalness: 0.08,
    flatShading: true
  });
  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.receiveShadow = true;
  rootGroup.add(terrainMesh);
  materialsToDispose.push(terrainMat);
  geometriesToDispose.push(terrainGeo);

  // =========================================================================
  // 3. GLACIAL MOUNTAIN RIVER SURFACE
  // =========================================================================
  const riverGeo = new THREE.PlaneGeometry(16, 150, 24, 60);
  riverGeo.rotateX(-Math.PI / 2);
  const riverMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4, // turquoise glacial meltwater
    roughness: 0.18,
    metalness: 0.35,
    transparent: true,
    opacity: 0.82
  });
  const riverMesh = new THREE.Mesh(riverGeo, riverMat);
  riverMesh.position.set(0, -2.2, 0);
  rootGroup.add(riverMesh);
  materialsToDispose.push(riverMat);
  geometriesToDispose.push(riverGeo);

  // =========================================================================
  // 4. ENGINEERED ROAD RIBBON MESH
  // =========================================================================
  const roadSegments = 320;
  const roadWidth = 3.2;
  const curvePts = roadCurve.getPoints(roadSegments);
  const roadRibbonGeo = new THREE.BufferGeometry();
  const roadVerts = new Float32Array((roadSegments + 1) * 2 * 3);
  const roadUvs = new Float32Array((roadSegments + 1) * 2 * 2);
  const roadIndices: number[] = [];

  for (let s = 0; s <= roadSegments; s++) {
    const pt = curvePts[s % curvePts.length];
    const tangent = roadCurve.getTangent(s / roadSegments);
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    const left = pt.clone().add(normal.clone().multiplyScalar(-roadWidth / 2));
    const right = pt.clone().add(normal.clone().multiplyScalar(roadWidth / 2));
    left.y += 0.08;
    right.y += 0.08;

    const vIdx = s * 2;
    roadVerts[vIdx * 3] = left.x;
    roadVerts[vIdx * 3 + 1] = left.y;
    roadVerts[vIdx * 3 + 2] = left.z;

    roadVerts[(vIdx + 1) * 3] = right.x;
    roadVerts[(vIdx + 1) * 3 + 1] = right.y;
    roadVerts[(vIdx + 1) * 3 + 2] = right.z;

    roadUvs[vIdx * 2] = 0;
    roadUvs[vIdx * 2 + 1] = s * 0.2;
    roadUvs[(vIdx + 1) * 2] = 1;
    roadUvs[(vIdx + 1) * 2 + 1] = s * 0.2;

    if (s < roadSegments) {
      roadIndices.push(vIdx, vIdx + 1, vIdx + 2);
      roadIndices.push(vIdx + 1, vIdx + 3, vIdx + 2);
    }
  }

  roadRibbonGeo.setAttribute('position', new THREE.BufferAttribute(roadVerts, 3));
  roadRibbonGeo.setAttribute('uv', new THREE.BufferAttribute(roadUvs, 2));
  roadRibbonGeo.setIndex(roadIndices);
  roadRibbonGeo.computeVertexNormals();

  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x27272a, // dark mountain gravel & asphalt blend
    roughness: 0.94,
    metalness: 0.06
  });
  const roadMesh = new THREE.Mesh(roadRibbonGeo, roadMat);
  roadMesh.receiveShadow = true;
  rootGroup.add(roadMesh);
  materialsToDispose.push(roadMat);
  geometriesToDispose.push(roadRibbonGeo);

  // =========================================================================
  // 5. WOODEN SUSPENSION BRIDGE ACROSS GORGE (x = -15 to +15 at z = -18)
  // =========================================================================
  const bridgeGroup = new THREE.Group();

  const towerMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.85 });
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.92 });
  const cableMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.35, metalness: 0.88 });
  const woodPlankMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.88 });
  materialsToDispose.push(towerMat, stoneMat, cableMat, woodPlankMat);

  [-15, 15].forEach((towerX) => {
    // Stone masonry base
    const baseGeo = new THREE.BoxGeometry(2.4, 6.0, 4.6);
    const base = new THREE.Mesh(baseGeo, stoneMat);
    base.position.set(towerX, 9.0, -18);
    base.castShadow = true;
    base.receiveShadow = true;
    bridgeGroup.add(base);
    geometriesToDispose.push(baseGeo);

    // Twin timber tower vertical posts
    [-1.8, 1.8].forEach((postZ) => {
      const postGeo = new THREE.BoxGeometry(0.5, 9.5, 0.5);
      const post = new THREE.Mesh(postGeo, towerMat);
      post.position.set(towerX, 16.5, -18 + postZ);
      post.castShadow = true;
      bridgeGroup.add(post);
      geometriesToDispose.push(postGeo);
    });

    // Cross beam top cap
    const capGeo = new THREE.BoxGeometry(0.6, 0.6, 4.4);
    const cap = new THREE.Mesh(capGeo, towerMat);
    cap.position.set(towerX, 21.0, -18);
    bridgeGroup.add(cap);
    geometriesToDispose.push(capGeo);
  });

  // Dual Main Catenary Suspension Steel Cables
  [-1.8, 1.8].forEach((cableZ) => {
    const cableCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-22, 11.5, -18 + cableZ),
      new THREE.Vector3(-15, 21.2, -18 + cableZ),
      new THREE.Vector3(0, 13.8, -18 + cableZ),
      new THREE.Vector3(15, 21.2, -18 + cableZ),
      new THREE.Vector3(22, 11.5, -18 + cableZ)
    ]);
    const mainCableGeo = new THREE.TubeGeometry(cableCurve, 40, 0.045, 8, false);
    const mainCable = new THREE.Mesh(mainCableGeo, cableMat);
    mainCable.castShadow = true;
    bridgeGroup.add(mainCable);
    geometriesToDispose.push(mainCableGeo);

    // Vertical suspender ropes hanging every 1.2m
    for (let sx = -14; sx <= 14; sx += 1.2) {
      const cableY = cableCurve.getPoint((sx + 15) / 30).y;
      const deckY = 12.0;
      if (cableY > deckY) {
        const suspenderCurve = new THREE.LineCurve3(
          new THREE.Vector3(sx, cableY, -18 + cableZ),
          new THREE.Vector3(sx, deckY, -18 + cableZ)
        );
        const suspenderGeo = new THREE.TubeGeometry(suspenderCurve, 2, 0.012, 6, false);
        const suspender = new THREE.Mesh(suspenderGeo, cableMat);
        bridgeGroup.add(suspender);
        geometriesToDispose.push(suspenderGeo);
      }
    }
  });

  // Individual Wooden Bridge Planks across deck
  for (let px = -15; px <= 15; px += 0.42) {
    const plankGeo = new THREE.BoxGeometry(0.38, 0.08, 3.8);
    const plank = new THREE.Mesh(plankGeo, woodPlankMat);
    plank.position.set(px, 12.02, -18);
    plank.castShadow = true;
    plank.receiveShadow = true;
    bridgeGroup.add(plank);
    geometriesToDispose.push(plankGeo);
  }

  // Wooden Safety Railings
  [-1.9, 1.9].forEach((railZ) => {
    const railCurve = new THREE.LineCurve3(
      new THREE.Vector3(-15, 12.9, -18 + railZ),
      new THREE.Vector3(15, 12.9, -18 + railZ)
    );
    const railGeo = new THREE.TubeGeometry(railCurve, 10, 0.04, 6, false);
    const rail = new THREE.Mesh(railGeo, towerMat);
    bridgeGroup.add(rail);
    geometriesToDispose.push(railGeo);
  });

  // Tibetan Buddhist Prayer Flags
  const flagColors = [0xef4444, 0xffffff, 0x3b82f6, 0x22c55e, 0xfacc15];
  for (let f = -12; f <= 12; f += 1.2) {
    const flagGeo = new THREE.PlaneGeometry(0.65, 0.45);
    flagGeo.rotateX(0.15);
    const flagMat = new THREE.MeshBasicMaterial({
      color: flagColors[Math.abs(Math.floor(f)) % flagColors.length],
      side: THREE.DoubleSide
    });
    const flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(f, 17.5 - Math.abs(f) * 0.12, -18);
    bridgeGroup.add(flag);
    materialsToDispose.push(flagMat);
    geometriesToDispose.push(flagGeo);
  }
  rootGroup.add(bridgeGroup);

  // =========================================================================
  // 6. HIMALAYAN MOUNTAIN TUNNEL (BORDER ROADS ORGANISATION - 52 METERS)
  // =========================================================================
  const tunnelGroup = new THREE.Group();

  const uTunnelStart = 0.870; // South Portal (near x = -44.5, z = 3.6, y = 2.57)
  const uTunnelEnd = 0.990;   // North Portal (near x = -43.0, z = -44.2, y = 2.86)

  // 6A. Horseshoe Arch Tunnel Tube Lining (Dark shotcrete & blasted Himalayan granite)
  const tunnelSteps = 44;
  const horseshoeProfile = [
    [-2.5, 0.0],
    [-2.5, 2.2],
    [-2.3, 3.2],
    [-1.8, 4.0],
    [-1.0, 4.5],
    [0.0, 4.75],
    [1.0, 4.5],
    [1.8, 4.0],
    [2.3, 3.2],
    [2.5, 2.2],
    [2.5, 0.0]
  ];
  const numTubeVerts = (tunnelSteps + 1) * horseshoeProfile.length;
  const tubePositions = new Float32Array(numTubeVerts * 3);
  const tubeUvs = new Float32Array(numTubeVerts * 2);
  const tubeIndices: number[] = [];

  for (let s = 0; s <= tunnelSteps; s++) {
    const u = uTunnelStart + (uTunnelEnd - uTunnelStart) * (s / tunnelSteps);
    const center = roadCurve.getPointAt(u);
    const tangent = roadCurve.getTangentAt(u).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const up = new THREE.Vector3(0, 1, 0);

    for (let p = 0; p < horseshoeProfile.length; p++) {
      const [px, py] = horseshoeProfile[p];
      const pt = center.clone().add(normal.clone().multiplyScalar(px)).add(up.clone().multiplyScalar(py));
      const vIdx = s * horseshoeProfile.length + p;
      tubePositions[vIdx * 3] = pt.x;
      tubePositions[vIdx * 3 + 1] = pt.y;
      tubePositions[vIdx * 3 + 2] = pt.z;

      tubeUvs[vIdx * 2] = p / (horseshoeProfile.length - 1);
      tubeUvs[vIdx * 2 + 1] = s * 0.4;

      if (s < tunnelSteps && p < horseshoeProfile.length - 1) {
        const v0 = s * horseshoeProfile.length + p;
        const v1 = s * horseshoeProfile.length + p + 1;
        const v2 = (s + 1) * horseshoeProfile.length + p;
        const v3 = (s + 1) * horseshoeProfile.length + p + 1;
        tubeIndices.push(v0, v1, v2);
        tubeIndices.push(v1, v3, v2);
      }
    }
  }

  const tunnelTubeGeo = new THREE.BufferGeometry();
  tunnelTubeGeo.setAttribute('position', new THREE.BufferAttribute(tubePositions, 3));
  tunnelTubeGeo.setAttribute('uv', new THREE.BufferAttribute(tubeUvs, 2));
  tunnelTubeGeo.setIndex(tubeIndices);
  tunnelTubeGeo.computeVertexNormals();

  const tunnelMat = new THREE.MeshStandardMaterial({
    color: 0x334155, // shotcrete blasted rock vault
    roughness: 0.95,
    metalness: 0.05,
    side: THREE.DoubleSide
  });
  const tunnelTubeMesh = new THREE.Mesh(tunnelTubeGeo, tunnelMat);
  tunnelTubeMesh.receiveShadow = true;
  tunnelGroup.add(tunnelTubeMesh);
  materialsToDispose.push(tunnelMat);
  geometriesToDispose.push(tunnelTubeGeo);

  // 6B. Solid Concrete Roadbed Foundation inside tunnel
  const floorSteps = 44;
  const floorGeo = new THREE.BufferGeometry();
  const floorPositions = new Float32Array((floorSteps + 1) * 2 * 3);
  const floorIndices: number[] = [];

  for (let s = 0; s <= floorSteps; s++) {
    const u = uTunnelStart + (uTunnelEnd - uTunnelStart) * (s / floorSteps);
    const center = roadCurve.getPointAt(u);
    const tangent = roadCurve.getTangentAt(u).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    const left = center.clone().add(normal.clone().multiplyScalar(-2.5));
    const right = center.clone().add(normal.clone().multiplyScalar(2.5));
    left.y += 0.02;
    right.y += 0.02;

    const vIdx = s * 2;
    floorPositions[vIdx * 3] = left.x;
    floorPositions[vIdx * 3 + 1] = left.y;
    floorPositions[vIdx * 3 + 2] = left.z;

    floorPositions[(vIdx + 1) * 3] = right.x;
    floorPositions[(vIdx + 1) * 3 + 1] = right.y;
    floorPositions[(vIdx + 1) * 3 + 2] = right.z;

    if (s < floorSteps) {
      floorIndices.push(vIdx, vIdx + 1, vIdx + 2);
      floorIndices.push(vIdx + 1, vIdx + 3, vIdx + 2);
    }
  }
  floorGeo.setAttribute('position', new THREE.BufferAttribute(floorPositions, 3));
  floorGeo.setIndex(floorIndices);
  floorGeo.computeVertexNormals();

  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.96
  });
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.receiveShadow = true;
  tunnelGroup.add(floorMesh);
  materialsToDispose.push(floorMat);
  geometriesToDispose.push(floorGeo);

  // 6C. Overhead Industrial Sodium Vapor Lamps & Tunnel Lighting (6 Fixtures spaced every 9m)
  const lampFixtureMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8, roughness: 0.4 });
  const lampLensMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 }); // Glowing amber yellow
  materialsToDispose.push(lampFixtureMat, lampLensMat);

  const numLamps = 6;
  for (let i = 0; i < numLamps; i++) {
    const u = uTunnelStart + (uTunnelEnd - uTunnelStart) * ((i + 0.5) / numLamps);
    const lampPos = roadCurve.getPointAt(u);
    lampPos.y += 4.5; // Tunnel crown

    // Conduit Box & Reflector Housing
    const housingGeo = new THREE.BoxGeometry(0.35, 0.16, 0.8);
    const housing = new THREE.Mesh(housingGeo, lampFixtureMat);
    housing.position.copy(lampPos);
    tunnelGroup.add(housing);
    geometriesToDispose.push(housingGeo);

    // Glowing Emissive Lens Face
    const lensGeo = new THREE.BoxGeometry(0.28, 0.05, 0.7);
    const lens = new THREE.Mesh(lensGeo, lampLensMat);
    lens.position.set(lampPos.x, lampPos.y - 0.08, lampPos.z);
    tunnelGroup.add(lens);
    geometriesToDispose.push(lensGeo);

    // Warm Golden Sodium PointLight illuminating asphalt and rock walls
    const light = new THREE.PointLight(0xf59e0b, 2.8, 16, 1.25);
    light.position.set(lampPos.x, lampPos.y - 0.35, lampPos.z);
    tunnelGroup.add(light);
  }

  // 6D. Emergency SOS Call Boxes with glowing red indicators inside tunnel
  [0.35, 0.70].forEach((relU) => {
    const u = uTunnelStart + (uTunnelEnd - uTunnelStart) * relU;
    const pt = roadCurve.getPointAt(u);
    const tangent = roadCurve.getTangentAt(u).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    // Box on right rock wall
    const boxPos = pt.clone().add(normal.clone().multiplyScalar(2.35));
    boxPos.y += 1.4;

    const sosBoxGeo = new THREE.BoxGeometry(0.2, 0.45, 0.35);
    const sosBoxMat = new THREE.MeshStandardMaterial({ color: 0xdc2626 });
    const sosBox = new THREE.Mesh(sosBoxGeo, sosBoxMat);
    sosBox.position.copy(boxPos);
    tunnelGroup.add(sosBox);
    materialsToDispose.push(sosBoxMat);
    geometriesToDispose.push(sosBoxGeo);

    // Glowing Red Beacon
    const beaconLight = new THREE.PointLight(0xef4444, 1.2, 4.0);
    beaconLight.position.set(boxPos.x, boxPos.y + 0.3, boxPos.z);
    tunnelGroup.add(beaconLight);
  });

  // 6E. South Portal & North Portal Stone Arch Facades
  const portalStoneMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.90 });
  const portalKeystoneMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.60, metalness: 0.4 });
  const hazardTex = createHazardStripeTexture();
  const hazardMat = new THREE.MeshStandardMaterial({ map: hazardTex, roughness: 0.5 });
  materialsToDispose.push(portalStoneMat, portalKeystoneMat, hazardMat);

  // South Portal (Entrance into mountain heading north)
  const pSouth = roadCurve.getPointAt(uTunnelStart);
  const tSouth = roadCurve.getTangentAt(uTunnelStart).normalize();
  const rotYSouth = Math.atan2(tSouth.x, tSouth.z);

  const southPortal = createPortalStructure(
    'KINNAUR GORGE TUNNEL · SOUTH PORTAL',
    'CLEARANCE 4.2 M · SPEED LIMIT 30 KM/H',
    portalStoneMat,
    portalKeystoneMat,
    hazardMat,
    materialsToDispose,
    geometriesToDispose
  );
  southPortal.position.copy(pSouth);
  southPortal.rotation.y = rotYSouth;
  tunnelGroup.add(southPortal);

  // North Portal (Exit from mountain heading into canyon floor)
  const pNorth = roadCurve.getPointAt(uTunnelEnd);
  const tNorth = roadCurve.getTangentAt(uTunnelEnd).normalize();
  const rotYNorth = Math.atan2(tNorth.x, tNorth.z) + Math.PI;

  const northPortal = createPortalStructure(
    'KINNAUR GORGE TUNNEL · NORTH PORTAL',
    'LENGTH 52 METERS · PROJECT DEEPAK',
    portalStoneMat,
    portalKeystoneMat,
    hazardMat,
    materialsToDispose,
    geometriesToDispose
  );
  northPortal.position.copy(pNorth);
  northPortal.rotation.y = rotYNorth;
  tunnelGroup.add(northPortal);

  rootGroup.add(tunnelGroup);

  // =========================================================================
  // 7. PINE FOREST ON CANYON RIM (Flush on Real Mountain Elevation)
  // =========================================================================
  const pineTrunkMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9 });
  const pineNeedleMat = new THREE.MeshStandardMaterial({ color: 0x1b4332, roughness: 0.85 });
  materialsToDispose.push(pineTrunkMat, pineNeedleMat);

  const treeLocations = [
    [-38, -42], [-44, -30], [-35, -20], [-42, 10], [-38, 24], [-24, 42],
    [22, -35], [32, -22], [42, -10], [38, 12], [28, 30], [36, 40],
    [-20, -45], [15, -46], [-10, 38], [12, 45], [-32, 38], [24, -42]
  ];

  treeLocations.forEach(([tx, tz]) => {
    const { y: groundY } = computeTerrainPoint(tx, tz);
    const treeGroup = new THREE.Group();
    treeGroup.position.set(tx, groundY, tz);

    const trunkGeo = new THREE.CylinderGeometry(0.18, 0.28, 2.5, 8);
    const trunk = new THREE.Mesh(trunkGeo, pineTrunkMat);
    trunk.position.y = 1.25;
    trunk.castShadow = true;
    treeGroup.add(trunk);
    geometriesToDispose.push(trunkGeo);

    // 3 Foliage Tiers
    [2.8, 4.4, 5.8].forEach((coneY, idx) => {
      const radius = 1.8 - idx * 0.45;
      const height = 2.4 - idx * 0.35;
      const coneGeo = new THREE.ConeGeometry(radius, height, 8);
      const cone = new THREE.Mesh(coneGeo, pineNeedleMat);
      cone.position.y = coneY;
      cone.castShadow = true;
      treeGroup.add(cone);
      geometriesToDispose.push(coneGeo);
    });

    rootGroup.add(treeGroup);
  });

  return {
    rootGroup,
    terrainMesh,
    riverMesh,
    roadCurve,
    roadMesh,
    bridgeGroup,
    tunnelGroup,
    waterfallCrestWorld: new THREE.Vector3(-32, 18, -12),
    materialsToDispose,
    geometriesToDispose
  };
}
