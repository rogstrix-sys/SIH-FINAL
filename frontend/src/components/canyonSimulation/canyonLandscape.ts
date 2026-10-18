import * as THREE from 'three';

export interface CanyonLandscapeMeshes {
  rootGroup: THREE.Group;
  terrainMesh: THREE.Mesh;
  riverMesh: THREE.Mesh;
  roadCurve: THREE.CatmullRomCurve3;
  roadMesh: THREE.Mesh;
  bridgeGroup: THREE.Group;
  waterfallCrestWorld: THREE.Vector3;
  materialsToDispose: THREE.Material[];
  geometriesToDispose: THREE.BufferGeometry[];
}

/**
 * Builds the dramatic Himalayan Canyon Gorge, River, Waterfall & Wooden Suspension Bridge
 */
export function buildCanyonLandscape(): CanyonLandscapeMeshes {
  const rootGroup = new THREE.Group();
  const materialsToDispose: THREE.Material[] = [];
  const geometriesToDispose: THREE.BufferGeometry[] = [];

  // 1. Procedural Canyon Terrain (High-resolution vertex elevation grid)
  const terrainSize = 160;
  const segments = 120;
  const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, segments, segments);
  terrainGeo.rotateX(-Math.PI / 2);

  const posAttr = terrainGeo.attributes.position as THREE.BufferAttribute;
  const posArr = posAttr.array as Float32Array;
  const colors = new Float32Array(posArr.length);

  // Shape the deep river gorge & mountain bluffs
  for (let i = 0; i < posArr.length / 3; i++) {
    const x = posArr[i * 3];
    const z = posArr[i * 3 + 2];

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

    // Rocky plateau features
    y += Math.sin(x * 0.2) * Math.cos(z * 0.2) * 1.2;
    posArr[i * 3 + 1] = y;

    // Elevation-based terrain vertex coloring (river gravel -> slate rock -> alpine pine meadow -> snow ridge)
    let r = 0.35, g = 0.38, b = 0.30;
    if (y < -1.0) {
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

  // 2. Glacial Mountain River Surface (Animated turquoise water)
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

  // 3. Complete Canyon Expedition Waypoint Road (Passes canyon floor, climbs cliff, crosses suspension bridge)
  const roadWaypoints = [
    new THREE.Vector3(-42, 2.8, -48),
    new THREE.Vector3(-36, 1.2, -32),
    new THREE.Vector3(-28, 0.4, -18),
    new THREE.Vector3(-20, 0.0, -4),  // River crossing approach
    new THREE.Vector3(-14, 0.2, 10),
    new THREE.Vector3(-18, 2.5, 26),  // Hairpin switchback 1
    new THREE.Vector3(-28, 5.8, 36),
    new THREE.Vector3(-34, 8.4, 22),  // Climbing cliff face
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
    new THREE.Vector3(28, 7.5, 28),   // East descending switchback
    new THREE.Vector3(18, 5.0, 42),
    new THREE.Vector3(4, 3.2, 48),
    new THREE.Vector3(-10, 1.5, 52),
    new THREE.Vector3(-25, 0.5, 46),
    new THREE.Vector3(-35, 1.2, 28),
    new THREE.Vector3(-44, 2.5, 6),
    new THREE.Vector3(-48, 3.0, -18)
  ];
  const roadCurve = new THREE.CatmullRomCurve3(roadWaypoints, true, 'catmullrom', 0.15);

  // Extrude Engineered Road Ribbon along curve
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

  // 4. Breathtaking Wooden Suspension Bridge across Canyon Gap (x = -15 to +15 at z = -18, y = 12.0)
  const bridgeGroup = new THREE.Group();

  // Two Massive Timber / Stone Suspension Pylon Towers (West at x = -15, East at x = 15)
  const towerMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.85 }); // weathered timber
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.92 }); // granite masonry
  const cableMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.35, metalness: 0.88 }); // steel cable
  const woodPlankMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.88 }); // dark hardwood planks

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

  // Dual Main Catenary Suspension Steel Cables spanning over towers
  [-1.8, 1.8].forEach((cableZ) => {
    const cableCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-22, 11.5, -18 + cableZ), // ground anchor west
      new THREE.Vector3(-15, 21.2, -18 + cableZ), // tower apex west
      new THREE.Vector3(0, 13.8, -18 + cableZ),   // sag mid-span
      new THREE.Vector3(15, 21.2, -18 + cableZ),  // tower apex east
      new THREE.Vector3(22, 11.5, -18 + cableZ)   // ground anchor east
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

  // Individual Wooden Bridge Planks across the 30m deck (x: -15 to +15)
  for (let px = -15; px <= 15; px += 0.42) {
    const plankGeo = new THREE.BoxGeometry(0.38, 0.08, 3.8);
    const plank = new THREE.Mesh(plankGeo, woodPlankMat);
    plank.position.set(px, 12.02, -18);
    plank.castShadow = true;
    plank.receiveShadow = true;
    bridgeGroup.add(plank);
    geometriesToDispose.push(plankGeo);
  }

  // Wooden Safety Railings along the bridge
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

  // Tibetan Buddhist Prayer Flags spanning between the bridge towers
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

  // 5. Pine Forest on Canyon Rim (40 Clustered Conifer Trees)
  const pineTrunkMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9 });
  const pineNeedleMat = new THREE.MeshStandardMaterial({ color: 0x1b4332, roughness: 0.85 });
  materialsToDispose.push(pineTrunkMat, pineNeedleMat);

  const treeLocations = [
    [-38, -42], [-44, -30], [-35, -20], [-42, 10], [-38, 24], [-24, 42],
    [22, -35], [32, -22], [42, -10], [38, 12], [28, 30], [36, 40],
    [-20, -45], [15, -46], [-10, 38], [12, 45], [-32, 38], [24, -42]
  ];

  treeLocations.forEach(([tx, tz]) => {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(tx, 9.5, tz);

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
    waterfallCrestWorld: new THREE.Vector3(-32, 18, -12),
    materialsToDispose,
    geometriesToDispose
  };
}
