import * as THREE from 'three';

/**
 * Procedural PBR Texture Generation Suite for SIH-26258 3D Mechanized Desludging Simulator
 * Generates photorealistic canvas textures with zero external asset or network dependencies.
 */

// 1. Photorealistic Asphalt Road Textures for Indian Himalayan Regions (Uttarakhand, Himachal, Ladakh)
export function createAsphaltTextures(
  region: 'uttarakhand' | 'himachal' | 'ladakh' | 'shimla' | 'aizawl' = 'uttarakhand'
): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const size = 1024;
  const isLadakh = region === 'ladakh';
  const isHimachal = region === 'himachal' || region === 'shimla';
  // Default is Uttarakhand (Garhwal & Kumaon Ghats)

  // --- Diffuse / Albedo Map ---
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const ctx = colorCanvas.getContext('2d')!;

  // 1. Base bitumen tarmac color tailored to Indian Himalayan geology
  let baseBitumen = '#14171c'; // Uttarakhand wet deep charcoal bitumen
  if (isLadakh) {
    baseBitumen = '#2b2d32'; // Sun-bleached high-altitude dusty cold desert bitumen
  } else if (isHimachal) {
    baseBitumen = '#1f2329'; // Weathered aggregate asphalt
  }
  ctx.fillStyle = baseBitumen;
  ctx.fillRect(0, 0, size, size);

  // Micro-bitumen noise variation
  for (let y = 0; y < size; y += 4) {
    for (let x = 0; x < size; x += 4) {
      if (Math.random() > 0.45) {
        const val = Math.floor(Math.random() * 16 - 8);
        const rVal = isLadakh ? 43 + val : isHimachal ? 31 + val : 20 + val;
        const gVal = isLadakh ? 45 + val : isHimachal ? 35 + val : 23 + val;
        const bVal = isLadakh ? 50 + val : isHimachal ? 41 + val : 28 + val;
        ctx.fillStyle = `rgba(${rVal}, ${gVal}, ${bVal}, 0.70)`;
        ctx.fillRect(x, y, 4, 4);
      }
    }
  }

  // 2. Tire wear tracks (two darker, smoothed compacted bitumen lanes)
  const leftTrack = ctx.createLinearGradient(size * 0.18, 0, size * 0.40, 0);
  leftTrack.addColorStop(0, 'rgba(14, 16, 20, 0)');
  leftTrack.addColorStop(0.2, 'rgba(10, 12, 16, 0.75)');
  leftTrack.addColorStop(0.8, 'rgba(10, 12, 16, 0.75)');
  leftTrack.addColorStop(1, 'rgba(14, 16, 20, 0)');
  ctx.fillStyle = leftTrack;
  ctx.fillRect(size * 0.16, 0, size * 0.26, size);

  const rightTrack = ctx.createLinearGradient(size * 0.60, 0, size * 0.82, 0);
  rightTrack.addColorStop(0, 'rgba(14, 16, 20, 0)');
  rightTrack.addColorStop(0.2, 'rgba(10, 12, 16, 0.75)');
  rightTrack.addColorStop(0.8, 'rgba(10, 12, 16, 0.75)');
  rightTrack.addColorStop(1, 'rgba(14, 16, 20, 0)');
  ctx.fillStyle = rightTrack;
  ctx.fillRect(size * 0.58, 0, size * 0.26, size);

  // 3. Dense micro-aggregate gravel flecks (granite, basalt, quartzite, tar voids)
  for (let i = 0; i < 18000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 1.8 + 0.3;
    const tone = Math.random();
    if (tone < 0.35) {
      ctx.fillStyle = 'rgba(75, 82, 92, 0.55)'; // grey basalt
    } else if (tone < 0.65) {
      ctx.fillStyle = 'rgba(125, 135, 148, 0.45)'; // light granite
    } else if (tone < 0.85) {
      ctx.fillStyle = isLadakh ? 'rgba(190, 180, 165, 0.40)' : 'rgba(175, 185, 195, 0.35)'; // quartz / sand fleck
    } else {
      ctx.fillStyle = 'rgba(8, 10, 12, 0.65)'; // dark tar void
    }
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Bitumen Tar Patch Repairs (Characteristic of Indian mountain ghat highways)
  if (!isLadakh) {
    ctx.fillStyle = 'rgba(10, 12, 15, 0.85)';
    // Patch 1
    ctx.fillRect(size * 0.22, size * 0.12, size * 0.20, size * 0.16);
    // Patch 2
    ctx.fillRect(size * 0.52, size * 0.60, size * 0.24, size * 0.20);
    // Sealant tar seam lines around patches
    ctx.strokeStyle = 'rgba(6, 7, 9, 0.95)';
    ctx.lineWidth = 3;
    ctx.strokeRect(size * 0.22, size * 0.12, size * 0.20, size * 0.16);
    ctx.strokeRect(size * 0.52, size * 0.60, size * 0.24, size * 0.20);
  }

  // 5. High-Pass Sand & Silt Drift along Shoulders (Signature Ladakh cold desert pass effect)
  if (isLadakh) {
    const siltL = ctx.createLinearGradient(0, 0, size * 0.16, 0);
    siltL.addColorStop(0, 'rgba(180, 165, 140, 0.55)');
    siltL.addColorStop(0.7, 'rgba(180, 165, 140, 0.25)');
    siltL.addColorStop(1, 'rgba(180, 165, 140, 0)');
    ctx.fillStyle = siltL;
    ctx.fillRect(0, 0, size * 0.16, size);

    const siltR = ctx.createLinearGradient(size, 0, size * 0.84, 0);
    siltR.addColorStop(0, 'rgba(180, 165, 140, 0.55)');
    siltR.addColorStop(0.7, 'rgba(180, 165, 140, 0.25)');
    siltR.addColorStop(1, 'rgba(180, 165, 140, 0)');
    ctx.fillStyle = siltR;
    ctx.fillRect(size * 0.84, 0, size * 0.16, size);
  }

  // 6. Continuous Weathered Shoulder Edge Lines
  const leftEdgeX = size * 0.085;
  const edgeW = size * 0.024;
  ctx.fillStyle = isLadakh ? 'rgba(220, 225, 230, 0.75)' : 'rgba(240, 245, 252, 0.88)';
  ctx.fillRect(leftEdgeX, 0, edgeW, size);

  const rightEdgeX = size * 0.89;
  ctx.fillRect(rightEdgeX, 0, edgeW, size);

  // 7. Authentic Indian Centerline Markings
  // Uttarakhand: Crisp white dashed centerline (standard NH-58/NH-7 hill ghat marking)
  // Himachal: Weathered yellow dashed centerline
  // Ladakh: Pale yellow / white weathered dashed line
  const lineX = size * 0.488;
  const lineW = size * 0.024;
  const dashStartY = size * 0.12;
  const dashHeight = size * 0.76;

  ctx.fillStyle = isHimachal ? '#f59e0b' : isLadakh ? '#e2e8f0' : '#ffffff';
  ctx.fillRect(lineX, dashStartY, lineW, dashHeight);

  // Weathering, paint wear & chipped edge effects on centerline
  for (let y = dashStartY; y <= dashStartY + dashHeight; y += 3) {
    const chipL = (Math.random() - 0.4) * 4;
    const chipR = (Math.random() - 0.4) * 4;
    ctx.fillStyle = baseBitumen;
    ctx.fillRect(lineX + chipL - 2, y, 3, 3);
    ctx.fillRect(lineX + lineW - chipR, y, 3, 3);

    if (Math.random() > 0.65) {
      ctx.fillStyle = `rgba(20, 24, 30, ${Math.random() * 0.55 + 0.2})`;
      ctx.fillRect(lineX + Math.random() * (lineW - 6), y, Math.random() * 6 + 2, Math.random() * 4 + 2);
    }
  }

  // Edge line weathering
  for (let y = 0; y < size; y += 4) {
    if (Math.random() > 0.7) {
      ctx.fillStyle = baseBitumen;
      ctx.fillRect(leftEdgeX + Math.random() * edgeW, y, 3, 3);
      ctx.fillRect(rightEdgeX + Math.random() * edgeW, y, 3, 3);
    }
  }

  // --- Bump Map (Gravel Relief, Painted Line Steps & Surface Noise) ---
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bumpCtx = bumpCanvas.getContext('2d')!;
  bumpCtx.fillStyle = '#808080';
  bumpCtx.fillRect(0, 0, size, size);

  // Aggregate stone relief
  for (let i = 0; i < 14000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 1.8 + 0.3;
    const val = Math.random() > 0.5 ? 255 : 0;
    bumpCtx.fillStyle = `rgba(${val}, ${val}, ${val}, ${Math.random() * 0.45 + 0.1})`;
    bumpCtx.beginPath();
    bumpCtx.arc(x, y, r, 0, Math.PI * 2);
    bumpCtx.fill();
  }

  // Raised paint thickness relief for centerline and edge lines
  bumpCtx.fillStyle = 'rgba(255, 255, 255, 0.24)';
  bumpCtx.fillRect(lineX, dashStartY, lineW, dashHeight);
  bumpCtx.fillRect(leftEdgeX, 0, edgeW, size);
  bumpCtx.fillRect(rightEdgeX, 0, edgeW, size);

  // Tar patch seams in bump map
  if (!isLadakh) {
    bumpCtx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    bumpCtx.lineWidth = 4;
    bumpCtx.strokeRect(size * 0.22, size * 0.12, size * 0.20, size * 0.16);
    bumpCtx.strokeRect(size * 0.52, size * 0.60, size * 0.24, size * 0.20);
  }

  // Frost heave cracks for Ladakh
  if (isLadakh) {
    bumpCtx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    bumpCtx.lineWidth = 2.5;
    bumpCtx.beginPath();
    bumpCtx.moveTo(size * 0.15, size * 0.3);
    bumpCtx.lineTo(size * 0.35, size * 0.38);
    bumpCtx.lineTo(size * 0.55, size * 0.35);
    bumpCtx.stroke();
  }

  // --- Roughness Map (Matte Stone vs Sleeker Bitumen vs Paint) ---
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const roughCtx = roughCanvas.getContext('2d')!;
  roughCtx.fillStyle = 'rgb(220, 220, 220)'; // base rough 0.86
  roughCtx.fillRect(0, 0, size, size);

  // Smoother tire lanes (darker = glossier ~0.50)
  roughCtx.fillStyle = 'rgba(140, 140, 140, 0.55)';
  roughCtx.fillRect(size * 0.18, 0, size * 0.24, size);
  roughCtx.fillRect(size * 0.60, 0, size * 0.24, size);

  // Road lines have distinct matte painted roughness
  roughCtx.fillStyle = 'rgba(180, 180, 180, 0.4)';
  roughCtx.fillRect(lineX, dashStartY, lineW, dashHeight);

  const map = new THREE.CanvasTexture(colorCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;

  return { map, bumpMap, roughnessMap };
}

// 2. Cliff Face & Strata Rock Textures for Indian Himalayan Regions
export function createRockTextures(
  preset: 'uttarakhand' | 'himachal' | 'ladakh' | 'shimla' | 'aizawl' = 'uttarakhand'
): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const size = 1024;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const ctx = colorCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bumpCtx = bumpCanvas.getContext('2d')!;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const roughCtx = roughCanvas.getContext('2d')!;

  // Base geological palette per Indian Himalayan region
  let baseColor = '#343a40'; // Uttarakhand Garhwal slate/quartzite
  let bandColors = ['#282e34', '#424a52', '#505862', '#30373d', '#20252a'];
  let veinColor = 'rgba(235, 240, 248, 0.5)'; // White quartz seam
  let lichenColor = 'rgba(54, 88, 52, 0.45)'; // Himalayan river valley moss

  if (preset === 'himachal' || preset === 'shimla') {
    baseColor = '#3c4349'; // Pir Panjal grey granite & slate
    bandColors = ['#2d3339', '#4a535b', '#566069', '#373e44', '#242a30'];
    veinColor = 'rgba(226, 232, 240, 0.45)'; // Calcite vein
    lichenColor = 'rgba(64, 86, 60, 0.35)'; // Alpine pine undergrowth
  } else if (preset === 'ladakh') {
    baseColor = '#544e47'; // Ladakh batholith granodiorite & barren scree
    bandColors = ['#443f39', '#665f57', '#766e64', '#3c3833', '#504a43'];
    veinColor = 'rgba(245, 248, 252, 0.6)'; // Cold quartz/frost vein
    lichenColor = 'rgba(175, 168, 160, 0.2)'; // Bare high-altitude mineral crust
  } else if (preset === 'aizawl') {
    baseColor = '#30261f';
    bandColors = ['#241d18', '#42352a', '#4c3e32', '#2a221b', '#362b22'];
    veinColor = 'rgba(217, 119, 6, 0.35)';
    lichenColor = 'rgba(46, 92, 48, 0.65)';
  }

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  bumpCtx.fillStyle = '#808080';
  bumpCtx.fillRect(0, 0, size, size);

  roughCtx.fillStyle = '#dcdcdc';
  roughCtx.fillRect(0, 0, size, size);

  // 1. Wavy Sedimentary Geological Strata Bands
  for (let y = 0; y < size; y += 18) {
    const bandCol = bandColors[Math.floor(Math.random() * bandColors.length)];
    ctx.fillStyle = bandCol;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= size; x += 32) {
      const wave = Math.sin((x / size) * Math.PI * 6 + y * 0.04) * 10;
      ctx.lineTo(x, y + wave + (Math.random() - 0.5) * 6);
    }
    ctx.lineTo(size, y + 24);
    ctx.lineTo(0, y + 24);
    ctx.closePath();
    ctx.fill();

    // Strata step relief in bump map
    bumpCtx.strokeStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
    bumpCtx.lineWidth = 3;
    bumpCtx.beginPath();
    bumpCtx.moveTo(0, y);
    for (let x = 0; x <= size; x += 32) {
      const wave = Math.sin((x / size) * Math.PI * 6 + y * 0.04) * 10;
      bumpCtx.lineTo(x, y + wave);
    }
    bumpCtx.stroke();
  }

  // 2. Vertical & Diagonal Tectonic Joint Cracks / Craggy Fissures
  ctx.lineWidth = 2;
  bumpCtx.lineWidth = 3.5;
  for (let i = 0; i < 28; i++) {
    const startX = Math.random() * size;
    let currX = startX;
    let currY = Math.random() * size * 0.4;
    const length = Math.random() * 300 + 120;

    ctx.strokeStyle = 'rgba(12, 14, 16, 0.75)';
    bumpCtx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    roughCtx.strokeStyle = 'rgba(90, 90, 90, 0.7)';

    ctx.beginPath();
    bumpCtx.beginPath();
    roughCtx.beginPath();

    ctx.moveTo(currX, currY);
    bumpCtx.moveTo(currX, currY);
    roughCtx.moveTo(currX, currY);

    while (currY < startX + length && currY < size) {
      currX += (Math.random() - 0.5) * 14;
      currY += Math.random() * 16 + 8;
      ctx.lineTo(currX, currY);
      bumpCtx.lineTo(currX, currY);
      roughCtx.lineTo(currX, currY);
    }

    ctx.stroke();
    bumpCtx.stroke();
    roughCtx.stroke();
  }

  // 3. Quartz / Calcite Mineral Veins
  ctx.strokeStyle = veinColor;
  ctx.lineWidth = 1.8;
  for (let v = 0; v < 12; v++) {
    ctx.beginPath();
    let vx = Math.random() * size;
    let vy = Math.random() * size;
    ctx.moveTo(vx, vy);
    for (let s = 0; s < 12; s++) {
      vx += (Math.random() - 0.48) * 35;
      vy += Math.random() * 25 + 5;
      ctx.lineTo(vx, vy);
    }
    ctx.stroke();
  }

  // 4. Scattered Lichen & Weathered Rock Scree Patches
  for (let i = 0; i < 600; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 8 + 2;
    ctx.fillStyle = lichenColor;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;

  return { map, bumpMap, roughnessMap };
}

// 3. Indian Himalayan Kath-Kuni Dressed Stonework Texture
export function createKathKuniStoneTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Dark mortar background
  ctx.fillStyle = '#1c1f24';
  ctx.fillRect(0, 0, size, size);

  const rows = 12;
  const rowHeight = size / rows;

  for (let r = 0; r < rows; r++) {
    const y = r * rowHeight;
    const cols = 6;
    const colWidth = size / cols;
    const offset = (r % 2) * (colWidth / 2);

    for (let c = -1; c <= cols; c++) {
      const x = c * colWidth + offset + 2;
      const w = colWidth - 4;
      const h = rowHeight - 4;

      // Stone block shade variation
      const brightness = Math.floor(60 + Math.random() * 45);
      ctx.fillStyle = `rgb(${brightness}, ${brightness + 4}, ${brightness + 8})`;
      ctx.fillRect(x, y + 2, w, h);

      // Chiseled edge highlight & shadow
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y + 2, w, h);

      // Kath-Kuni horizontal timber layer every 4 rows
      if (r % 4 === 3) {
        ctx.fillStyle = '#5c3a21'; // Himalayan cedar wood beam
        ctx.fillRect(0, y + 2, size, h);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

// 4. Corrugated Galvanized Iron (CGI) Tin Roof Texture with Rivets & Weathering
export function createCorrugatedTinTexture(baseHex: string): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);

  // Alternating sinusoidal shadow and highlight ribs
  const ribWidth = 8;
  for (let x = 0; x < size; x += ribWidth) {
    const grad = ctx.createLinearGradient(x, 0, x + ribWidth, 0);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.38)');
    grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.32)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.38)');
    ctx.fillStyle = grad;
    ctx.fillRect(x, 0, ribWidth, size);

    // Galvanized rivet fixings along purlins
    for (let y = 32; y < size; y += 64) {
      ctx.fillStyle = 'rgba(240, 244, 248, 0.75)';
      ctx.beginPath();
      ctx.arc(x + ribWidth / 2, y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  return texture;
}

// 5. Decal Generator: Swachh Bharat / SIH Livery & Engineering Markings
export function createDecalTexture(
  type: 'swachh_bharat' | 'battery_warning' | 'chevrons' | 'vacuum_gauge' | 'hazard_stripe' | 'compaction_warning'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');

  if (type === 'swachh_bharat') {
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 512, 256);

    // Outer emblem badge
    ctx.fillStyle = 'rgba(5, 78, 56, 0.92)'; // Emerald green
    ctx.roundRect(16, 16, 480, 224, 20);
    ctx.fill();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Gandhi round spectacles logo
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(180, 95, 36, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(332, 95, 36, 0, Math.PI * 2);
    ctx.stroke();
    // Spectacle bridge
    ctx.beginPath();
    ctx.moveTo(216, 95);
    ctx.lineTo(296, 95);
    ctx.stroke();

    // Text: Swachh Bharat Mission & SIH
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SWACHH BHARAT MISSION', 256, 170);

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('SIH-26258 MECH-DESLUDGER · 400L ZERO-ENTRY', 256, 205);
  } else if (type === 'battery_warning') {
    canvas.width = 384;
    canvas.height = 160;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 384, 160);

    // Hazard yellow/black border
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, 376, 152);

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ HIGH VOLTAGE · 48V LiFePO4', 192, 42);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('SUB-CHASSIS LOW-CoM BATTERY PACK', 192, 75);
    ctx.fillText('IP68 WATERPROOF · 12.8 kWh · 200Ah', 192, 102);

    ctx.fillStyle = '#10b981';
    ctx.font = '12px monospace';
    ctx.fillText('CALCULATED TIP ANGLE: 34.2° SAFE', 192, 130);
  } else if (type === 'chevrons') {
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ef4444'; // Red
    ctx.fillRect(0, 0, 256, 64);

    // White diagonal stripes
    ctx.fillStyle = '#ffffff';
    const stripeW = 32;
    for (let x = -64; x < 256 + 64; x += stripeW * 2) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + stripeW, 0);
      ctx.lineTo(x + stripeW - 32, 64);
      ctx.lineTo(x - 32, 64);
      ctx.closePath();
      ctx.fill();
    }
  } else if (type === 'vacuum_gauge') {
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(128, 128, 120, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 8;
    ctx.stroke();

    // Dial background
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(128, 128, 110, 0, Math.PI * 2);
    ctx.fill();

    // Green operating suction sector
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(128, 128, 95, Math.PI * 0.7, Math.PI * 1.3);
    ctx.stroke();

    // Red caution sector
    ctx.strokeStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(128, 128, 95, Math.PI * 1.5, Math.PI * 1.9);
    ctx.stroke();

    // Center needle
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(128, 128);
    ctx.lineTo(95, 80);
    ctx.stroke();

    // Center pin
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(128, 128, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('VACUUM (BAR)', 128, 175);
    ctx.font = 'bold 18px monospace';
    ctx.fillText('-0.82', 128, 198);
  } else if (type === 'hazard_stripe') {
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#facc15'; // High-visibility safety yellow
    ctx.fillRect(0, 0, 256, 64);

    // Diagonal pitch black hazard stripes (45 degrees)
    ctx.fillStyle = '#0f172a';
    const stripeW = 24;
    for (let x = -64; x < 256 + 64; x += stripeW * 2) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + stripeW, 0);
      ctx.lineTo(x + stripeW - 32, 64);
      ctx.lineTo(x - 32, 64);
      ctx.closePath();
      ctx.fill();
    }
  } else if (type === 'compaction_warning') {
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 512, 128);

    // Amber border
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 504, 120);

    // Caution header
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚠ HIGH-PRESSURE SLUDGE COMPACTOR', 256, 42);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('CYLINDER RATING: 210 BAR · 120MM BORE', 256, 75);

    ctx.fillStyle = '#10b981';
    ctx.font = '13px monospace';
    ctx.fillText('TRANSPORT LOCK INTERLOCK ACTIVE · ZERO-ENTRY', 256, 105);
  }

  return new THREE.CanvasTexture(canvas);
}

// 6. Mountain Highway Warning Signboard Texture
export function createMountainSignTexture(
  title: string,
  sub: string,
  icon: 'curve' | 'slope' | 'hazard'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Yellow diamond warning sign background
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, 0, 384, 256);

  // Black border
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, 364, 236);

  // Icon illustration
  ctx.strokeStyle = '#0f172a';
  ctx.fillStyle = '#0f172a';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (icon === 'curve') {
    // Hairpin bend symbol
    ctx.beginPath();
    ctx.moveTo(150, 130);
    ctx.lineTo(150, 70);
    ctx.arc(192, 70, 42, Math.PI, 0, false);
    ctx.lineTo(234, 110);
    ctx.stroke();
    // Arrow head
    ctx.beginPath();
    ctx.moveTo(215, 100);
    ctx.lineTo(234, 120);
    ctx.lineTo(253, 100);
    ctx.stroke();
  } else if (icon === 'slope') {
    // 28° Steep slope symbol
    ctx.beginPath();
    ctx.moveTo(90, 120);
    ctx.lineTo(294, 50);
    ctx.stroke();
    // Truck box on ramp
    ctx.fillRect(160, 45, 60, 35);
  } else {
    // Caution exclamation
    ctx.font = 'bold 72px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('!', 192, 105);
  }

  // Text captions
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 192, 185);

  ctx.font = 'bold 16px monospace';
  ctx.fillText(sub, 192, 218);

  return new THREE.CanvasTexture(canvas);
}

// 7. All-Terrain Tire Sidewall & Knobby Chevron Tread Texture
export function createTireTextures(): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bumpCtx = bumpCanvas.getContext('2d')!;

  ctx.fillStyle = '#111418';
  ctx.fillRect(0, 0, size, size);

  bumpCtx.fillStyle = '#808080';
  bumpCtx.fillRect(0, 0, size, size);

  // Knobby Chevron Tread Blocks
  const blocks = 10;
  const blockH = size / blocks;
  for (let b = 0; b < blocks; b++) {
    const y = b * blockH;
    // Left lug
    bumpCtx.fillStyle = '#ffffff';
    bumpCtx.beginPath();
    bumpCtx.moveTo(24, y + 6);
    bumpCtx.lineTo(size * 0.46, y + blockH * 0.42);
    bumpCtx.lineTo(size * 0.46, y + blockH * 0.85);
    bumpCtx.lineTo(24, y + blockH * 0.52);
    bumpCtx.closePath();
    bumpCtx.fill();

    // Right staggered lug
    bumpCtx.beginPath();
    bumpCtx.moveTo(size * 0.54, y + blockH * 0.18);
    bumpCtx.lineTo(size - 24, y + blockH * 0.58);
    bumpCtx.lineTo(size - 24, y + blockH * 0.95);
    bumpCtx.lineTo(size * 0.54, y + blockH * 0.55);
    bumpCtx.closePath();
    bumpCtx.fill();
  }

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(1, 4);

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(1, 4);

  return { map, bumpMap };
}

// 8. 3D Floating CAD Dimension Callout HUD Badge
export function createCadDimensionBadge(
  title: string,
  value: string,
  sub?: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 512, 160);

  // High-tech sci-fi CAD border & dark translucent background
  ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
  ctx.beginPath();
  ctx.roundRect(8, 8, 496, 144, 14);
  ctx.fill();

  ctx.strokeStyle = '#06b6d4'; // Cyan technical stroke
  ctx.lineWidth = 3;
  ctx.stroke();

  // Corner tech bracket accents
  ctx.strokeStyle = '#10b981'; // Emerald corner ticks
  ctx.lineWidth = 5;
  // Top-left
  ctx.beginPath();
  ctx.moveTo(8, 32);
  ctx.lineTo(8, 8);
  ctx.lineTo(32, 8);
  ctx.stroke();
  // Top-right
  ctx.beginPath();
  ctx.moveTo(480, 8);
  ctx.lineTo(504, 8);
  ctx.lineTo(504, 32);
  ctx.stroke();
  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(8, 128);
  ctx.lineTo(8, 152);
  ctx.lineTo(32, 152);
  ctx.stroke();
  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(480, 152);
  ctx.lineTo(504, 152);
  ctx.lineTo(504, 128);
  ctx.stroke();

  // Header Title
  ctx.font = 'bold 22px "SF Mono", "Fira Code", monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(title.toUpperCase(), 26, 44);

  // Main Measurement Value
  ctx.font = '900 44px "SF Pro Display", sans-serif';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText(value, 26, 96);

  // Subtitle / Standard annotation
  if (sub) {
    ctx.font = '600 20px "SF Pro Text", sans-serif';
    ctx.fillStyle = '#10b981';
    ctx.fillText(sub, 26, 134);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

// 9. Aerated Sludge Froth & Foam Texture for Active Extraction
export function createSludgeFoamTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 512, 512);

  // Dark brown bubbly froth base
  ctx.fillStyle = 'rgba(74, 52, 36, 0.92)';
  ctx.fillRect(0, 0, 512, 512);

  // Dense aeration bubbles and froth clusters
  for (let i = 0; i < 500; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = Math.random() * 12 + 2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(120, 88, 58, 0.75)';
    ctx.fill();

    // Bubble rim highlight
    ctx.strokeStyle = 'rgba(215, 185, 145, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// 10. Mountain Mist / Cloud Billboard Texture
export function createCloudTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 512, 256);

  // Multi-lobe radial gradient soft cloud puff
  const puffs = [
    { x: 256, y: 130, r: 110, a: 0.35 },
    { x: 180, y: 140, r: 90, a: 0.28 },
    { x: 330, y: 140, r: 95, a: 0.28 },
    { x: 120, y: 160, r: 75, a: 0.2 },
    { x: 390, y: 160, r: 80, a: 0.2 }
  ];

  puffs.forEach((p) => {
    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
    grad.addColorStop(0, `rgba(240, 248, 255, ${p.a})`);
    grad.addColorStop(0.6, `rgba(220, 235, 250, ${p.a * 0.5})`);
    grad.addColorStop(1, 'rgba(220, 235, 250, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

// 11. Heavy-Duty Crawler Tank Track Belt Texture (Continuous Chevron Grousers, Pins & Drive Lugs)
export function createCrawlerTrackTexture(): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const w = 512;
  const h = 512;

  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = w;
  colorCanvas.height = h;
  const ctx = colorCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = w;
  bumpCanvas.height = h;
  const bCtx = bumpCanvas.getContext('2d')!;

  // Base vulcanized synthetic rubber compound
  ctx.fillStyle = '#111418';
  ctx.fillRect(0, 0, w, h);

  bCtx.fillStyle = '#404040';
  bCtx.fillRect(0, 0, w, h);

  const numPads = 16;
  const padH = h / numPads;

  for (let i = 0; i < numPads; i++) {
    const y = i * padH;

    // Metallic link hinge pin seam (groove)
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(0, y, w, 3);
    bCtx.fillStyle = '#101010';
    bCtx.fillRect(0, y, w, 4);

    // Chevron Grouser (cleat) pad
    const padMarginY = 4;
    const padHeight = padH - 8;

    // Outer rubber tread blocks with steel chevron
    ctx.fillStyle = '#1e242c';
    ctx.fillRect(16, y + padMarginY, w - 32, padHeight);

    bCtx.fillStyle = '#d0d0d0'; // raised pad
    bCtx.fillRect(16, y + padMarginY, w - 32, padHeight);

    // Center sprocket drive guide horn / drive tooth slot
    const midX = w / 2;
    ctx.fillStyle = '#0a0d12';
    ctx.fillRect(midX - 22, y + 2, 44, padH - 4);
    bCtx.fillStyle = '#000000'; // deep slot
    bCtx.fillRect(midX - 22, y + 2, 44, padH - 4);

    // Dual steel guide horns (sprocket drive teeth pins)
    ctx.fillStyle = '#64748b';
    ctx.fillRect(midX - 28, y + 6, 8, padH - 12);
    ctx.fillRect(midX + 20, y + 6, 8, padH - 12);
    bCtx.fillStyle = '#ffffff';
    bCtx.fillRect(midX - 28, y + 6, 8, padH - 12);
    bCtx.fillRect(midX + 20, y + 6, 8, padH - 12);

    // High-tensile steel grip cleats on chevron wings
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(36, y + padMarginY + 2, 70, 5);
    ctx.fillRect(w - 106, y + padMarginY + 2, 70, 5);
    bCtx.fillStyle = '#ffffff';
    bCtx.fillRect(36, y + padMarginY + 2, 70, 5);
    bCtx.fillRect(w - 106, y + padMarginY + 2, 70, 5);
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;

  return { map, bumpMap };
}

// 12. Iconic Indian Hill Road Black & White Concrete Safety Parapet Texture (Universal in Uttarakhand & Himachal Ghats)
export function createIndianParapetTexture(): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const w = 512;
  const h = 256;

  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = w;
  colorCanvas.height = h;
  const ctx = colorCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = w;
  bumpCanvas.height = h;
  const bCtx = bumpCanvas.getContext('2d')!;

  // Alternating vertical stripes: 50% Stark White (#f8fafc) and 50% Coal Black (#0f172a)
  const stripeW = w / 2;

  // Left stripe: Stark White concrete
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, stripeW, h);
  bCtx.fillStyle = '#b0b0b0';
  bCtx.fillRect(0, 0, stripeW, h);

  // Right stripe: Coal Black concrete
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(stripeW, 0, stripeW, h);
  bCtx.fillStyle = '#a0a0a0';
  bCtx.fillRect(stripeW, 0, stripeW, h);

  // Concrete micro-porosity and aggregate noise
  for (let i = 0; i < 6000; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = Math.random() * 1.5 + 0.4;
    const isDark = Math.random() > 0.5;
    ctx.fillStyle = isDark ? 'rgba(30, 41, 59, 0.25)' : 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    bCtx.fillStyle = isDark ? '#404040' : '#ffffff';
    bCtx.beginPath();
    bCtx.arc(x, y, r, 0, Math.PI * 2);
    bCtx.fill();
  }

  // Vertical chamfer groove at stripe boundary
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(stripeW - 3, 0, 6, h);
  bCtx.fillStyle = '#202020';
  bCtx.fillRect(stripeW - 3, 0, 6, h);

  // Weathering, road dust and monsoon rain grime near bottom edge
  const grimeGrad = ctx.createLinearGradient(0, h * 0.70, 0, h);
  grimeGrad.addColorStop(0, 'rgba(51, 65, 85, 0)');
  grimeGrad.addColorStop(1, 'rgba(41, 37, 36, 0.65)');
  ctx.fillStyle = grimeGrad;
  ctx.fillRect(0, h * 0.70, w, h * 0.30);

  const map = new THREE.CanvasTexture(colorCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;

  return { map, bumpMap };
}

// 13. Authentic Border Roads Organisation (BRO) Mountain Highway Signboard Texture
export function createBROSignTexture(
  region: 'uttarakhand' | 'himachal' | 'ladakh' | string,
  slogan: string,
  subtitle?: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext('2d')!;

  // Iconic BRO Indian Highway Yellow background (#facc15)
  ctx.fillStyle = '#facc15';
  ctx.fillRect(0, 0, 640, 360);

  // Distinctive double black border
  ctx.strokeStyle = '#0a0a0a';
  ctx.lineWidth = 14;
  ctx.strokeRect(10, 10, 620, 340);

  ctx.lineWidth = 4;
  ctx.strokeRect(26, 26, 588, 308);

  // Top header: BORDER ROADS ORGANISATION
  ctx.fillStyle = '#0a0a0a';
  ctx.font = 'bold 22px "Arial Black", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('BORDER ROADS ORGANISATION', 320, 62);

  // Project badge
  let projectTag = 'PROJECT SHIVALIK';
  if (region === 'himachal' || region === 'shimla') projectTag = 'PROJECT DEEPAK';
  if (region === 'ladakh') projectTag = 'PROJECT HIMANK';

  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(160, 78, 320, 30);
  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 16px monospace';
  ctx.fillText(projectTag, 320, 99);

  // Divider line
  ctx.strokeStyle = '#0a0a0a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(40, 122);
  ctx.lineTo(600, 122);
  ctx.stroke();

  // Main high-impact BRO slogan
  ctx.fillStyle = '#0a0a0a';
  ctx.font = 'bold 28px "Arial Black", Impact, sans-serif';
  ctx.fillText(slogan, 320, 185);

  // Subtitle / cautionary advisory
  if (subtitle) {
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillText(subtitle, 320, 230);
  }

  // Footer: Road courtesy / Emergency reminder
  ctx.font = 'bold 14px monospace';
  ctx.fillText('GIVE WAY TO UPHILL VEHICLES · DRIVE WITH CARE', 320, 290);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

// 14. Indian Highway & BRO Curved Dome Milestone Pillar Texture
export function createBROMilestoneTexture(
  region: 'uttarakhand' | 'himachal' | 'ladakh' | string,
  route: string,
  km: number,
  elevText: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;

  // 1. Lower pillar body: Crisp white concrete
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 256, 384);

  // 2. Upper arched dome: Indian National Highway Yellow (#facc15)
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(128, 96, 96, Math.PI, 0, false);
  ctx.lineTo(224, 120);
  ctx.lineTo(32, 120);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#0a0a0a';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Highway code on dome (e.g. NH 58, NH 5, NH 1D)
  ctx.fillStyle = '#0a0a0a';
  ctx.font = 'bold 28px "Arial Black", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(route, 128, 86);

  // Destination & Distance in black bold lettering
  let destination = 'BADRINATH';
  if (region === 'himachal' || region === 'shimla') destination = 'KINNAUR';
  if (region === 'ladakh') destination = 'KHARDUNG LA';

  ctx.font = 'bold 22px Arial, sans-serif';
  ctx.fillText(destination, 128, 175);

  ctx.font = 'bold 44px "Arial Black", Impact, sans-serif';
  ctx.fillText(`${km}`, 128, 235);

  ctx.font = 'bold 18px Arial, sans-serif';
  ctx.fillText('KM', 128, 265);

  // BRO mark and Elevation
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(32, 285);
  ctx.lineTo(224, 285);
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 15px monospace';
  ctx.fillText(elevText, 128, 315);

  ctx.font = 'bold 16px "Arial Black", monospace';
  ctx.fillText('B. R. O.', 128, 345);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

// 15. Tibetan 5-Color Buddhist Prayer Flags Texture (Lungta: Blue, White, Red, Green, Yellow) for Ladakh Passes
export function createTibetanPrayerFlagsTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const colors = [
    '#1e40af', // Blue: Sky / Space
    '#f8fafc', // White: Air / Wind
    '#dc2626', // Red: Fire
    '#15803d', // Green: Water
    '#eab308'  // Yellow: Earth
  ];

  const flagW = 512 / 5;

  // Background top string
  ctx.strokeStyle = '#78716c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 10);
  ctx.lineTo(512, 10);
  ctx.stroke();

  colors.forEach((col, idx) => {
    const x = idx * flagW;
    ctx.fillStyle = col;
    // Flag cloth rectangle with ragged bottom edges
    ctx.fillRect(x + 2, 10, flagW - 4, 108);

    // Sacred Lungta Wind Horse woodcut emblem in center
    ctx.strokeStyle = col === '#f8fafc' || col === '#eab308' ? '#0f172a' : '#ffffff';
    ctx.fillStyle = col === '#f8fafc' || col === '#eab308' ? '#0f172a' : '#ffffff';
    ctx.lineWidth = 2;

    const cx = x + flagW / 2;
    const cy = 60;

    // Stylized Wind Horse glyph
    ctx.beginPath();
    ctx.arc(cx, cy - 8, 10, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - 14, cy + 12);
    ctx.lineTo(cx + 14, cy + 12);
    ctx.lineTo(cx, cy - 4);
    ctx.closePath();
    ctx.stroke();

    // Sacred Sanskrit/Tibetan mantra text lines
    for (let l = 28; l < 110; l += 14) {
      if (Math.abs(l - cy) > 16) {
        ctx.fillRect(x + 10, l, flagW - 20, 2);
      }
    }
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.repeat.set(2, 1);
  return texture;
}


