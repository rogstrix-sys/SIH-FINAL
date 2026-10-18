import * as THREE from 'three';

/**
 * Procedural PBR texture generators for Subsurface Vault & Robotics Simulation
 * Zero external image dependencies to ensure guaranteed 100% offline reliability.
 */

// 1. Cast Iron Manhole Cover Texture (Heavy duty ISO 1083 / EN 124 Class D400)
export function createManholeCoverTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1c1f24';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 30000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const gray = Math.floor(20 + Math.random() * 30);
    ctx.fillStyle = `rgb(${gray},${gray},${gray})`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }

  const cx = 256;
  const cy = 256;
  ctx.lineWidth = 4;
  for (let r = 50; r <= 240; r += 32) {
    ctx.strokeStyle = '#2d333b';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#101316';
    ctx.beginPath();
    ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Diamond knurled pattern
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
  ctx.fillStyle = '#14171a';
  ctx.beginPath();
  ctx.arc(cx, cy, 68, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#525c68';
  ctx.stroke();

  ctx.fillStyle = '#cbd5e1';
  ctx.font = 'bold 15px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SIH FSSM ROV', cx, cy - 20);
  ctx.font = 'bold 13px monospace';
  ctx.fillText('EN 124 D400', cx, cy);
  ctx.font = '10px monospace';
  ctx.fillStyle = '#eab308';
  ctx.fillText('HEAVY VAULT', cx, cy + 20);

  // Pick holes
  ctx.fillStyle = '#050708';
  ctx.beginPath();
  ctx.roundRect(cx - 52, cy - 6, 22, 12, 4);
  ctx.roundRect(cx + 30, cy - 6, 22, 12, 4);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

// 2. Aged Reinforced Concrete Texture with Formwork Seams & Water Stains
export function createAgedConcreteTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#525b68';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 45000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const shade = Math.floor(65 + Math.random() * 75);
    ctx.fillStyle = `rgb(${shade},${shade + 2},${shade + 4})`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Horizontal plywood formwork seams
  for (let y = 0; y < 512; y += 128) {
    ctx.strokeStyle = '#2b323c';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();

    // Tie-rod circular marks
    for (let x = 64; x < 512; x += 128) {
      ctx.fillStyle = '#1a1f26';
      ctx.beginPath();
      ctx.arc(x, y + 64, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#8b95a2';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }

  // Vertical efflorescence and dark water stains
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, 'rgba(15, 23, 42, 0.15)');
  grad.addColorStop(0.5, 'rgba(15, 23, 42, 0.4)');
  grad.addColorStop(1.0, 'rgba(8, 14, 26, 0.85)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Micro-fracture veins
  ctx.strokeStyle = 'rgba(10, 15, 25, 0.65)';
  ctx.lineWidth = 1.2;
  for (let j = 0; j < 8; j++) {
    let px = Math.random() * 512;
    let py = Math.random() * 512;
    ctx.beginPath();
    ctx.moveTo(px, py);
    for (let s = 0; s < 12; s++) {
      px += (Math.random() - 0.5) * 24;
      py += Math.random() * 22;
      ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// 3. Architectural Cutaway Section Hatch Texture (Exposed Concrete Core with Rebar Dots)
export function createSectionHatchTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Base core tone
  ctx.fillStyle = '#3a414d';
  ctx.fillRect(0, 0, 256, 256);

  // 45-degree diagonal CAD architectural hatching
  ctx.strokeStyle = '#5a6575';
  ctx.lineWidth = 2.0;
  for (let x = -256; x < 512; x += 16) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 256, 256);
    ctx.stroke();
  }

  // Concrete aggregate speckles
  for (let i = 0; i < 300; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const r = 2 + Math.random() * 4;
    ctx.fillStyle = Math.random() > 0.5 ? '#1f242d' : '#8894a4';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// 4. Sludge Crust Texture with Voronoi polygonal fracture fissures & saponified scum
export function createSludgeCrustTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#22140b';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 35000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = Math.floor(28 + Math.random() * 40);
    const g = Math.floor(18 + Math.random() * 28);
    const b = Math.floor(8 + Math.random() * 18);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(x, y, 2.5, 2.5);
  }

  // Fissure cracks
  ctx.strokeStyle = '#0a0502';
  ctx.lineWidth = 3.0;
  for (let k = 0; k < 35; k++) {
    let cx = Math.random() * 512;
    let cy = Math.random() * 512;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    const branches = 4 + Math.floor(Math.random() * 4);
    for (let b = 0; b < branches; b++) {
      let bx = cx;
      let by = cy;
      const angle = (b / branches) * Math.PI * 2 + (Math.random() - 0.5);
      const len = 35 + Math.random() * 65;
      bx += Math.cos(angle) * len;
      by += Math.sin(angle) * len;
      ctx.lineTo(bx, by);
      ctx.moveTo(cx, cy);
    }
    ctx.stroke();
  }

  // Grease / scum floating slicks
  for (let f = 0; f < 45; f++) {
    const fx = Math.random() * 512;
    const fy = Math.random() * 512;
    const fr = 10 + Math.random() * 22;
    const fgrad = ctx.createRadialGradient(fx, fy, 1, fx, fy, fr);
    fgrad.addColorStop(0, 'rgba(180, 145, 65, 0.75)');
    fgrad.addColorStop(0.7, 'rgba(120, 92, 38, 0.45)');
    fgrad.addColorStop(1, 'rgba(34, 20, 11, 0)');
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

// 5. Industrial Safety Hazard Chevrons (Yellow & Black 45° stripes for ROV body)
export function createHazardChevronTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#eab308'; // bright safety yellow
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = '#18181b'; // deep matte black
  const stripeWidth = 32;
  for (let x = -256; x < 512; x += stripeWidth * 2) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + stripeWidth, 0);
    ctx.lineTo(x + stripeWidth - 256, 256);
    ctx.lineTo(x - 256, 256);
    ctx.closePath();
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// 6. Caution Barricade Tape Texture
export function createCautionTapeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#facc15';
  ctx.fillRect(0, 0, 256, 64);

  ctx.fillStyle = '#09090b';
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

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// 7. OSHA Confined Space Hazard Warning Sign Texture
export function createConfinedSpaceSignTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 512, 320);
  ctx.lineWidth = 12;
  ctx.strokeStyle = '#dc2626';
  ctx.strokeRect(6, 6, 500, 308);

  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.roundRect(20, 20, 472, 80, 12);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('DANGER', 256, 60);

  ctx.fillStyle = '#111827';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('CONFINED SPACE ENTRY', 256, 135);
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('ZERO-ENTRY ROBOTIC REMOVAL', 256, 175);

  ctx.font = 'bold 16px monospace';
  ctx.fillStyle = '#b91c1c';
  ctx.fillText('TOXIC GAS: H2S · CH4 · CO · O2 DEFICIENT', 256, 220);
  ctx.fillStyle = '#15803d';
  ctx.fillText('OSHA 1910.146 · ISO 21876 SANITATION MANDATE', 256, 255);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

// 8. Spiral Wire-Reinforced Suction Hose
export function createSpiralHoseTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 128, 256);

  ctx.lineWidth = 14;
  for (let y = -32; y < 288; y += 48) {
    ctx.strokeStyle = '#f59e0b';
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

// 9. Stratified Soil Strata Excavation Cross-Section
export function createSoilStrataTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Stratum 1: Topsoil Organic Loam
  ctx.fillStyle = '#362217';
  ctx.fillRect(0, 0, 512, 130);

  // Stratum 2: Dense Clay / Silt Sediments
  ctx.fillStyle = '#543d2b';
  ctx.fillRect(0, 130, 512, 220);

  // Stratum 3: Compacted Gravel & Sandstone Bedrock
  ctx.fillStyle = '#423c34';
  ctx.fillRect(0, 350, 512, 162);

  // Stone and boulder inclusions
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 1.5 + Math.random() * 5;
    const shade = Math.floor(35 + Math.random() * 60);
    ctx.fillStyle = `rgb(${shade},${shade - 3},${shade - 6})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}
