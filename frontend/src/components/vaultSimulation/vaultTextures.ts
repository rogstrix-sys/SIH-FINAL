import * as THREE from 'three';

/**
 * Procedural texture generators for Subsurface Vault & Robotics Simulation
 * Zero external image dependencies to ensure guaranteed 100% offline reliability.
 */

// 1. Cast Iron Manhole Cover Texture (Heavy duty ISO 1083 / EN 124 Class D400)
export function createManholeCoverTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base cast iron dark metallic texture
  ctx.fillStyle = '#1e2124';
  ctx.fillRect(0, 0, 512, 512);

  // Surface grit & casting porosity
  for (let i = 0; i < 25000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const gray = Math.floor(25 + Math.random() * 25);
    ctx.fillStyle = `rgb(${gray},${gray},${gray})`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }

  // Concentric structural rings
  const cx = 256;
  const cy = 256;
  ctx.lineWidth = 4;
  for (let r = 50; r <= 240; r += 32) {
    ctx.strokeStyle = '#2d333b';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#121517';
    ctx.beginPath();
    ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Diamond knurled anti-skid checker plate pattern
  ctx.strokeStyle = '#383e47';
  ctx.lineWidth = 2.5;
  const step = 20;
  for (let x = -512; x < 1024; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 512, 512);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x, 512);
    ctx.lineTo(x + 512, 0);
    ctx.stroke();
  }

  // Center medallion badge
  ctx.fillStyle = '#16191c';
  ctx.beginPath();
  ctx.arc(cx, cy, 64, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#485058';
  ctx.stroke();

  // Embossed Text
  ctx.fillStyle = '#9ca3af';
  ctx.font = 'bold 15px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SIH FSSM', cx, cy - 20);
  ctx.font = 'bold 12px monospace';
  ctx.fillText('EN 124 D400', cx, cy);
  ctx.font = '10px monospace';
  ctx.fillStyle = '#eab308';
  ctx.fillText('SEWER VAULT', cx, cy + 20);

  // Pick holes for lifting hook
  ctx.fillStyle = '#050708';
  ctx.beginPath();
  ctx.roundRect(cx - 50, cy - 6, 20, 12, 4);
  ctx.roundRect(cx + 30, cy - 6, 20, 12, 4);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

// 2. Aged Reinforced Concrete Texture (Vault walls & partition with formwork lines)
export function createAgedConcreteTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base cement tone
  ctx.fillStyle = '#6b7280';
  ctx.fillRect(0, 0, 512, 512);

  // Grainy sand & aggregate particles
  for (let i = 0; i < 40000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const shade = Math.floor(80 + Math.random() * 70);
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Horizontal plywood formwork casting seams
  for (let y = 0; y < 512; y += 128) {
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();

    // Tie-rod circular indentations
    for (let x = 64; x < 512; x += 128) {
      ctx.fillStyle = '#1f2937';
      ctx.beginPath();
      ctx.arc(x, y + 64, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // Dark moisture & effluent efflorescence streaks (lower wet zone)
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, 'rgba(30, 41, 59, 0.1)');
  grad.addColorStop(0.6, 'rgba(20, 30, 40, 0.35)');
  grad.addColorStop(1.0, 'rgba(10, 18, 25, 0.7)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Micro-cracks
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.6)';
  ctx.lineWidth = 1.2;
  for (let j = 0; j < 6; j++) {
    let px = Math.random() * 512;
    let py = Math.random() * 512;
    ctx.beginPath();
    ctx.moveTo(px, py);
    for (let s = 0; s < 12; s++) {
      px += (Math.random() - 0.5) * 24;
      py += Math.random() * 20;
      ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// 3. Sludge Crust Texture (Dried, thick scum cake with polygonal fracture fissures)
export function createSludgeCrustTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Dark organic brown/black sludge base
  ctx.fillStyle = '#2b1b11';
  ctx.fillRect(0, 0, 512, 512);

  // Mottled organic matter patches
  for (let i = 0; i < 30000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = Math.floor(35 + Math.random() * 40);
    const g = Math.floor(22 + Math.random() * 30);
    const b = Math.floor(10 + Math.random() * 20);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(x, y, 2.5, 2.5);
  }

  // Voronoi-like polygonal drying crust fissures
  ctx.strokeStyle = '#0f0804';
  ctx.lineWidth = 2.5;
  for (let k = 0; k < 25; k++) {
    let cx = Math.random() * 512;
    let cy = Math.random() * 512;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    const branches = 3 + Math.floor(Math.random() * 4);
    for (let b = 0; b < branches; b++) {
      let bx = cx;
      let by = cy;
      const angle = (b / branches) * Math.PI * 2 + (Math.random() - 0.5);
      const len = 35 + Math.random() * 55;
      bx += Math.cos(angle) * len;
      by += Math.sin(angle) * len;
      ctx.lineTo(bx, by);
      ctx.moveTo(cx, cy);
    }
    ctx.stroke();
  }

  // Floating foam & grease patches (yellowish saponified lipids)
  for (let f = 0; f < 35; f++) {
    const fx = Math.random() * 512;
    const fy = Math.random() * 512;
    const fr = 8 + Math.random() * 18;
    const fgrad = ctx.createRadialGradient(fx, fy, 1, fx, fy, fr);
    fgrad.addColorStop(0, 'rgba(161, 130, 60, 0.7)');
    fgrad.addColorStop(0.7, 'rgba(110, 85, 35, 0.4)');
    fgrad.addColorStop(1, 'rgba(43, 27, 17, 0)');
    ctx.fillStyle = fgrad;
    ctx.beginPath();
    ctx.arc(fx, fy, fr, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// 4. Caution Barricade Tape Texture (Yellow / Black diagonal hazard stripes)
export function createCautionTapeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#facc15'; // bright hazard yellow
  ctx.fillRect(0, 0, 256, 64);

  // Black diagonal stripes
  ctx.fillStyle = '#111827';
  const stripeW = 32;
  for (let x = -64; x < 320; x += stripeW * 2) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + stripeW, 0);
    ctx.lineTo(x + stripeW - 32, 64);
    ctx.lineTo(x - 32, 64);
    ctx.closePath();
    ctx.fill();
  }

  // Border lines
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, 256, 64);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// 5. OSHA Confined Space Hazard Warning Sign Texture
export function createConfinedSpaceSignTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d')!;

  // Sign border & white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 512, 320);
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#dc2626';
  ctx.strokeRect(5, 5, 502, 310);

  // Top DANGER header box
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.roundRect(20, 20, 472, 80, 12);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('DANGER', 256, 60);

  // Body text
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('CONFINED SPACE', 256, 135);
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('ENTER BY PERMIT ONLY', 256, 175);

  // Gas indicators
  ctx.font = 'bold 16px monospace';
  ctx.fillStyle = '#b91c1c';
  ctx.fillText('TOXIC GASES: H2S · CH4 · CO', 256, 220);
  ctx.fillStyle = '#15803d';
  ctx.fillText('MANDATORY CONTINUOUS VENTILATION', 256, 255);

  // Footer ISO icons
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#6b7280';
  ctx.fillText('OSHA 1910.146 · ISO 24521 SANITATION STANDARD', 256, 292);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

// 6. Transparent Spiral Suction Hose Wire-Helix Normal & Texture
export function createSpiralHoseTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Semi-transparent PVC base
  ctx.fillStyle = '#334155';
  ctx.fillRect(0, 0, 128, 256);

  // Spiral reinforcing spring wire helix
  ctx.lineWidth = 14;
  for (let y = -32; y < 288; y += 48) {
    ctx.strokeStyle = '#f59e0b'; // Amber high-tensile spring wire
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(128, y + 24);
    ctx.stroke();

    ctx.strokeStyle = '#d97706';
    ctx.beginPath();
    ctx.moveTo(0, y + 4);
    ctx.lineTo(128, y + 28);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 8);
  return tex;
}

// 7. Earth / Soil Strata Excavation Texture (Geological layers around vault)
export function createSoilStrataTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // 3 Geological strata bands: Topsoil, Dense Clay, Gravel Bed
  // Band 1: Topsoil (0 - 150)
  ctx.fillStyle = '#3a271d';
  ctx.fillRect(0, 0, 512, 150);

  // Band 2: Clay / Silt (150 - 360)
  ctx.fillStyle = '#5c4033';
  ctx.fillRect(0, 150, 512, 210);

  // Band 3: Compacted Gravel / Sandstone (360 - 512)
  ctx.fillStyle = '#4a4238';
  ctx.fillRect(0, 360, 512, 152);

  // Stones and rock inclusions
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 1 + Math.random() * 4;
    const shade = Math.floor(40 + Math.random() * 60);
    ctx.fillStyle = `rgb(${shade},${shade - 5},${shade - 10})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}
