import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Camera, RotateCcw, Maximize2, ShieldAlert, Sparkles, Eye, Zap } from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';

interface Cutter3DMechanicalViewerProps {
  className?: string;
}

export const Cutter3DMechanicalViewer: React.FC<Cutter3DMechanicalViewerProps> = ({
  className = 'h-[360px] sm:h-[400px]'
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const cutterTelemetry = useSimulationStore((s) => s.cutterTelemetry);
  const cutterParams = useSimulationStore((s) => s.cutterParams);
  const thermalTelemetry = useSimulationStore((s) => s.thermalTelemetry);

  const [activeCamPreset, setActiveCamPreset] = useState<'iso' | 'front' | 'top' | 'motor'>('iso');

  // Animated refs so loop runs without rebuilding Three scene
  const enabledRef = useRef(cutterTelemetry.enabled);
  const rpmRef = useRef(cutterTelemetry.rpm);
  const reversedRef = useRef(cutterTelemetry.isReversed);
  const heaterActiveRef = useRef(thermalTelemetry.heaterEnabled);

  useEffect(() => {
    enabledRef.current = cutterTelemetry.enabled;
    rpmRef.current = cutterTelemetry.rpm;
    reversedRef.current = cutterTelemetry.isReversed;
  }, [cutterTelemetry.enabled, cutterTelemetry.rpm, cutterTelemetry.isReversed]);

  useEffect(() => {
    heaterActiveRef.current = thermalTelemetry.heaterEnabled;
  }, [thermalTelemetry.heaterEnabled]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 640;
    const height = container.clientHeight || 400;

    // 1. Scene & Background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16); // dark slate backdrop

    // Subtle radial grid / ground marker
    const gridHelper = new THREE.GridHelper(2.4, 24, 0x0284c7, 0x1e293b);
    gridHelper.position.y = -0.32;
    scene.add(gridHelper);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.05, 50);
    camera.position.set(0.65, 0.38, 0.65);
    cameraRef.current = camera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 0.3;
    controls.maxDistance = 2.2;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // 5. Lighting Setup (Matching authentic industrial submersible spec)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xe0f2fe, 1.8);
    dirLight.position.set(1.5, 2.0, 1.2);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // Submersible 5000K LED Spotlights focused on cutting teeth
    const spotLeft = new THREE.SpotLight(0xfffbeb, 4.5, 3.5, Math.PI / 4, 0.4, 1.2);
    spotLeft.position.set(0.35, 0.3, 0.35);
    spotLeft.target.position.set(0, 0, 0);
    spotLeft.castShadow = true;
    scene.add(spotLeft);
    scene.add(spotLeft.target);

    const spotRight = new THREE.SpotLight(0x38bdf8, 2.5, 3.0, Math.PI / 4, 0.5, 1.2);
    spotRight.position.set(-0.35, 0.3, -0.35);
    spotRight.target.position.set(0, 0, 0);
    scene.add(spotRight);
    scene.add(spotRight.target);

    // Arrays to track resources for clean disposal
    const geometriesToDispose: THREE.BufferGeometry[] = [];
    const materialsToDispose: THREE.Material[] = [];

    // ==========================================
    // 6. MECHANICAL CUTTER ASSEMBLY HIERARCHY
    // ==========================================
    const cutterRootGroup = new THREE.Group();
    scene.add(cutterRootGroup);

    // Reusable Materials
    const toolSteelMat = new THREE.MeshStandardMaterial({
      color: 0x71717a,
      roughness: 0.32,
      metalness: 0.88
    });
    materialsToDispose.push(toolSteelMat);

    const tungstenCarbideMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Amber gold tungsten carbide
      roughness: 0.22,
      metalness: 0.95
    });
    materialsToDispose.push(tungstenCarbideMat);

    const hardenedAnvilMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Hardened counter-shear steel
      roughness: 0.45,
      metalness: 0.82
    });
    materialsToDispose.push(hardenedAnvilMat);

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.15,
      metalness: 0.98
    });
    materialsToDispose.push(chromeMat);

    const jetNozzleMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.25,
      metalness: 0.9
    });
    materialsToDispose.push(jetNozzleMat);

    const motorHousingMat = new THREE.MeshStandardMaterial({
      color: 0x0f766e, // Industrial deep teal PMAC motor casing
      roughness: 0.4,
      metalness: 0.65
    });
    materialsToDispose.push(motorHousingMat);

    const suctionHoodMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Heavy dark cast steel intake throat
      roughness: 0.55,
      metalness: 0.78
    });
    materialsToDispose.push(suctionHoodMat);

    // --- A. ROTARY CUTTER DRUM SPINDLE (ROTATING GROUP) ---
    const drumSpindleGroup = new THREE.Group();
    cutterRootGroup.add(drumSpindleGroup);

    // Main Drum Cylinder (length: 0.34m, radius: 0.085m - matching bhavyam spec)
    const drumGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.34, 32);
    // Align drum along Z axis
    drumGeo.rotateX(Math.PI / 2);
    geometriesToDispose.push(drumGeo);

    const drumMesh = new THREE.Mesh(drumGeo, toolSteelMat);
    drumMesh.castShadow = true;
    drumMesh.receiveShadow = true;
    drumSpindleGroup.add(drumMesh);

    // Central Drive Shaft Core
    const shaftGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.46, 20);
    shaftGeo.rotateX(Math.PI / 2);
    geometriesToDispose.push(shaftGeo);
    const shaftMesh = new THREE.Mesh(shaftGeo, chromeMat);
    drumSpindleGroup.add(shaftMesh);

    // End Flange Retaining Collars
    [-0.17, 0.17].forEach((zPos) => {
      const collarGeo = new THREE.CylinderGeometry(0.096, 0.096, 0.016, 24);
      collarGeo.rotateX(Math.PI / 2);
      geometriesToDispose.push(collarGeo);
      const collarMesh = new THREE.Mesh(collarGeo, hardenedAnvilMat);
      collarMesh.position.z = zPos;
      drumSpindleGroup.add(collarMesh);
    });

    // --- 12 HELICAL TUNGSTEN-CARBIDE CUTTER TEETH ---
    // Double helix spiral arrangement around drum circumference
    const teethCount = 12;
    for (let t = 0; t < teethCount; t++) {
      const toothGroup = new THREE.Group();
      const tFrac = t / teethCount;
      const angle = tFrac * Math.PI * 4; // 2 complete helical twists
      const zOffset = (tFrac - 0.5) * 0.28;

      // Tooth Base Socket
      const baseGeo = new THREE.BoxGeometry(0.024, 0.018, 0.024);
      geometriesToDispose.push(baseGeo);
      const baseMesh = new THREE.Mesh(baseGeo, toolSteelMat);
      baseMesh.position.y = 0.078;
      toothGroup.add(baseMesh);

      // Conical Tungsten-Carbide Tooth Tip
      const toothGeo = new THREE.ConeGeometry(0.022, 0.048, 6);
      geometriesToDispose.push(toothGeo);
      const toothMesh = new THREE.Mesh(toothGeo, tungstenCarbideMat);
      toothMesh.position.y = 0.104;
      toothMesh.castShadow = true;
      toothGroup.add(toothMesh);

      // Position tooth radially around drum center
      toothGroup.position.set(0, 0, zOffset);
      toothGroup.rotation.z = angle;

      drumSpindleGroup.add(toothGroup);
    }

    // --- B. STATIONARY COUNTER-SHEAR ANVIL (SHEAR BED) ---
    // Hardened stationary anvil positioned 1.5mm below rotating tooth envelope
    const anvilGroup = new THREE.Group();
    cutterRootGroup.add(anvilGroup);

    const anvilBarGeo = new THREE.BoxGeometry(0.05, 0.045, 0.36);
    geometriesToDispose.push(anvilBarGeo);
    const anvilBar = new THREE.Mesh(anvilBarGeo, hardenedAnvilMat);
    // Placed at y = -0.138 (1.5mm clearance under 0.13m tooth tip sweep)
    anvilBar.position.set(0, -0.145, 0);
    anvilBar.receiveShadow = true;
    anvilBar.castShadow = true;
    anvilGroup.add(anvilBar);

    // Serrated counter-shear teeth on anvil bar
    for (let i = 0; i < 7; i++) {
      const cToothGeo = new THREE.ConeGeometry(0.012, 0.022, 4);
      geometriesToDispose.push(cToothGeo);
      const cTooth = new THREE.Mesh(cToothGeo, tungstenCarbideMat);
      cTooth.position.set(0, -0.12, (i / 6 - 0.5) * 0.3);
      cTooth.rotation.z = Math.PI;
      anvilGroup.add(cTooth);
    }

    // --- C. DUAL HIGH-PRESSURE FLUIDIZING JET NOZZLES ---
    const jetSprayMeshes: THREE.Mesh[] = [];
    const jetMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    materialsToDispose.push(jetMat);

    [-0.21, 0.21].forEach((zSide) => {
      const nozzleGeo = new THREE.CylinderGeometry(0.018, 0.026, 0.07, 16);
      nozzleGeo.rotateX(Math.PI / 2);
      geometriesToDispose.push(nozzleGeo);
      const nozzle = new THREE.Mesh(nozzleGeo, jetNozzleMat);
      nozzle.position.set(0.12, 0.06, zSide);
      nozzle.rotation.y = zSide > 0 ? -0.35 : 0.35;
      cutterRootGroup.add(nozzle);

      // Jet Spray Cone (Active during fluidization)
      const sprayGeo = new THREE.ConeGeometry(0.04, 0.22, 12);
      sprayGeo.rotateX(-Math.PI / 2);
      geometriesToDispose.push(sprayGeo);
      const sprayMesh = new THREE.Mesh(sprayGeo, jetMat);
      sprayMesh.position.set(0.04, 0.02, zSide * 0.7);
      sprayMesh.rotation.y = zSide > 0 ? 0.35 : -0.35;
      sprayMesh.visible = false;
      cutterRootGroup.add(sprayMesh);
      jetSprayMeshes.push(sprayMesh);
    });

    // --- D. 3.5 kW BRUSHLESS PMAC DRIVE MOTOR & GEARBOX ---
    const motorGroup = new THREE.Group();
    motorGroup.position.set(0, 0, -0.26);
    cutterRootGroup.add(motorGroup);

    // Planetary Gearbox Housing
    const gearboxGeo = new THREE.CylinderGeometry(0.092, 0.092, 0.09, 24);
    gearboxGeo.rotateX(Math.PI / 2);
    geometriesToDispose.push(gearboxGeo);
    const gearboxMesh = new THREE.Mesh(gearboxGeo, hardenedAnvilMat);
    gearboxMesh.position.z = 0.045;
    gearboxMesh.castShadow = true;
    motorGroup.add(gearboxMesh);

    // Motor Stator Housing
    const motorGeo = new THREE.CylinderGeometry(0.082, 0.082, 0.22, 24);
    motorGeo.rotateX(Math.PI / 2);
    geometriesToDispose.push(motorGeo);
    const motorMesh = new THREE.Mesh(motorGeo, motorHousingMat);
    motorMesh.position.z = -0.11;
    motorMesh.castShadow = true;
    motorGroup.add(motorMesh);

    // 8 Radial Heat Sink Cooling Fins
    for (let f = 0; f < 8; f++) {
      const finAngle = (f / 8) * Math.PI * 2;
      const finGeo = new THREE.BoxGeometry(0.016, 0.035, 0.2);
      geometriesToDispose.push(finGeo);
      const fin = new THREE.Mesh(finGeo, toolSteelMat);
      fin.position.set(Math.cos(finAngle) * 0.09, Math.sin(finAngle) * 0.09, -0.11);
      fin.rotation.z = finAngle;
      motorGroup.add(fin);
    }

    // IP68 Sealed Electrical Terminal Junction Box
    const jBoxGeo = new THREE.BoxGeometry(0.065, 0.045, 0.065);
    geometriesToDispose.push(jBoxGeo);
    const jBox = new THREE.Mesh(jBoxGeo, hardenedAnvilMat);
    jBox.position.set(0, 0.11, -0.11);
    motorGroup.add(jBox);

    // High-Voltage Orange Conduit Cable
    const cableCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.13, -0.11),
      new THREE.Vector3(0.04, 0.18, -0.14),
      new THREE.Vector3(0.08, 0.22, -0.22)
    ]);
    const cableGeo = new THREE.TubeGeometry(cableCurve, 12, 0.01, 8, false);
    geometriesToDispose.push(cableGeo);
    const cableMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.35 });
    materialsToDispose.push(cableMat);
    const cableMesh = new THREE.Mesh(cableGeo, cableMat);
    motorGroup.add(cableMesh);

    // --- E. SUCTION INTAKE HOOD & CAMLOCK COUPLER ---
    const intakeGroup = new THREE.Group();
    intakeGroup.position.set(-0.16, 0, 0);
    cutterRootGroup.add(intakeGroup);

    // Intake Transition Throat (Casts into suction line)
    const throatGeo = new THREE.CylinderGeometry(0.075, 0.11, 0.13, 24);
    throatGeo.rotateZ(Math.PI / 2);
    geometriesToDispose.push(throatGeo);
    const throatMesh = new THREE.Mesh(throatGeo, suctionHoodMat);
    throatMesh.castShadow = true;
    intakeGroup.add(throatMesh);

    // Camlock Quick-Disconnect Clamping Collar
    const camlockGeo = new THREE.CylinderGeometry(0.088, 0.088, 0.03, 24);
    camlockGeo.rotateZ(Math.PI / 2);
    geometriesToDispose.push(camlockGeo);
    const camlockMesh = new THREE.Mesh(camlockGeo, chromeMat);
    camlockMesh.position.x = -0.07;
    intakeGroup.add(camlockMesh);

    // --- F. DYNAMIC SLURRY & DEBRIS PARTICLE SYSTEM ---
    const particleCount = 48;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities: { x: number; y: number; z: number }[] = [];

    for (let p = 0; p < particleCount; p++) {
      // Spawn around cutter drum
      particlePositions[p * 3] = (Math.random() - 0.5) * 0.15;
      particlePositions[p * 3 + 1] = (Math.random() - 0.5) * 0.15;
      particlePositions[p * 3 + 2] = (Math.random() - 0.5) * 0.28;

      particleVelocities.push({
        x: -0.8 - Math.random() * 0.8, // pulled into intake throat (-x)
        y: (Math.random() - 0.5) * 0.4,
        z: (Math.random() - 0.5) * 0.4
      });
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    geometriesToDispose.push(particleGeo);

    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.016,
      transparent: true,
      opacity: 0.7
    });
    materialsToDispose.push(particleMat);

    const particles = new THREE.Points(particleGeo, particleMat);
    cutterRootGroup.add(particles);

    // Center the whole cutter assembly nicely in view
    cutterRootGroup.position.set(0.05, 0.02, 0.08);

    // ==========================================
    // 7. ANIMATION RENDER LOOP
    // ==========================================
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const renderLoop = () => {
      animationFrameId = requestAnimationFrame(renderLoop);
      const delta = Math.min(0.1, clock.getDelta());
      controls.update();

      const isEnabled = enabledRef.current;
      const rpm = rpmRef.current;
      const isReversed = reversedRef.current;

      // 1. Spindle Drum Rotation
      if (isEnabled && rpm > 0) {
        // (RPM / 60) * 2 * PI radians/sec
        const rotSpeed = (rpm / 60) * Math.PI * 2 * delta * (isReversed ? -1 : 1);
        drumSpindleGroup.rotation.z += rotSpeed;

        // Visual Jet Sprays active when spinning
        jetSprayMeshes.forEach((mesh) => {
          mesh.visible = true;
          mesh.scale.setScalar(0.9 + Math.sin(clock.getElapsedTime() * 15) * 0.1);
        });

        // 2. Animate Slurry Particles streaming into intake hood
        particles.visible = true;
        const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
        const array = posAttr.array as Float32Array;
        const speedFactor = (rpm / 1450) * 0.4;

        for (let p = 0; p < particleCount; p++) {
          array[p * 3] += particleVelocities[p].x * delta * speedFactor;
          array[p * 3 + 1] += particleVelocities[p].y * delta * speedFactor;
          array[p * 3 + 2] += particleVelocities[p].z * delta * speedFactor;

          // Recycle particle once pulled deep into intake hood
          if (array[p * 3] < -0.22) {
            array[p * 3] = 0.1 + (Math.random() - 0.5) * 0.08;
            array[p * 3 + 1] = (Math.random() - 0.5) * 0.12;
            array[p * 3 + 2] = (Math.random() - 0.5) * 0.28;
          }
        }
        posAttr.needsUpdate = true;

        // Particle color: Heated turquoise or unheated amber/blue
        particleMat.color.setHex(heaterActiveRef.current ? 0x14b8a6 : (isReversed ? 0xf59e0b : 0x38bdf8));
      } else {
        // Stopped
        jetSprayMeshes.forEach((mesh) => {
          mesh.visible = false;
        });
        particles.visible = false;
      }

      renderer.render(scene, camera);
    };

    renderLoop();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // ==========================================
    // 8. TEARDOWN & MEMORY CLEANUP
    // ==========================================
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();

      geometriesToDispose.forEach((g) => g.dispose());
      materialsToDispose.forEach((m) => m.dispose());
      renderer.dispose();

      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Quick Camera Presets
  const setCameraPreset = (preset: 'iso' | 'front' | 'top' | 'motor') => {
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    if (!cam || !ctrl) return;

    setActiveCamPreset(preset);

    switch (preset) {
      case 'iso':
        cam.position.set(0.65, 0.38, 0.65);
        ctrl.target.set(0, 0, 0);
        break;
      case 'front':
        cam.position.set(0.72, 0.02, 0.08);
        ctrl.target.set(0, 0, 0.08);
        break;
      case 'top':
        cam.position.set(0.05, 0.82, 0.08);
        ctrl.target.set(0.05, 0, 0.08);
        break;
      case 'motor':
        cam.position.set(-0.25, 0.28, -0.55);
        ctrl.target.set(0, 0, -0.22);
        break;
    }
    ctrl.update();
  };

  return (
    <div className={`relative w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl ${className}`}>
      {/* 3D Canvas Mount Point */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left: Subsystem HUD Pill */}
      <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 shadow-lg pointer-events-auto">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="font-mono text-xs font-bold text-slate-200">
            3D MECHANICAL TWIN: ROTARY CUTTER
          </span>
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              cutterTelemetry.enabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
            }`}
          />
        </div>

        <div className="font-mono text-[10px] text-slate-400 bg-slate-950/80 px-2.5 py-1 rounded border border-slate-800 backdrop-blur-sm">
          <span>DRUM: 12x Tungsten-Carbide Helical Teeth · 1.5mm Shear Gap</span>
        </div>
      </div>

      {/* Top Right: Camera Presets Bar */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-700/80 shadow-lg">
        <span className="text-[10px] font-mono text-slate-400 px-1 flex items-center gap-1">
          <Camera className="w-3 h-3 text-cyan-400" />
          <span>CAM:</span>
        </span>
        <button
          type="button"
          onClick={() => setCameraPreset('iso')}
          className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
            activeCamPreset === 'iso'
              ? 'bg-cyan-500 text-slate-950 font-bold'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          ISO
        </button>
        <button
          type="button"
          onClick={() => setCameraPreset('front')}
          className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
            activeCamPreset === 'front'
              ? 'bg-cyan-500 text-slate-950 font-bold'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          FRONT
        </button>
        <button
          type="button"
          onClick={() => setCameraPreset('top')}
          className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
            activeCamPreset === 'top'
              ? 'bg-cyan-500 text-slate-950 font-bold'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          TOP
        </button>
        <button
          type="button"
          onClick={() => setCameraPreset('motor')}
          className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
            activeCamPreset === 'motor'
              ? 'bg-cyan-500 text-slate-950 font-bold'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          MOTOR
        </button>
        <button
          type="button"
          onClick={() => setCameraPreset('iso')}
          title="Reset Camera Orientation"
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition ml-0.5"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>

      {/* Bottom Left: Live Mechanical Telemetry Overlay */}
      <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-2 font-mono text-[11px] pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 text-slate-200 shadow-md">
          <span className="text-slate-400 text-[10px] block">ROTARY VELOCITY</span>
          <span className={`font-bold ${cutterTelemetry.enabled ? 'text-amber-400' : 'text-slate-500'}`}>
            {cutterTelemetry.enabled ? `${cutterTelemetry.rpm} RPM` : '0 RPM (HALTED)'}
          </span>
        </div>

        <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 text-slate-200 shadow-md">
          <span className="text-slate-400 text-[10px] block">DRIVE ROTATION</span>
          <span className={`font-bold ${cutterTelemetry.isReversed ? 'text-amber-400' : 'text-emerald-400'}`}>
            {cutterTelemetry.isReversed ? '↺ REVERSE (ANTI-JAM)' : '↻ FORWARD (DE-AGGLOMERATE)'}
          </span>
        </div>

        <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 text-slate-200 shadow-md">
          <span className="text-slate-400 text-[10px] block">FLUIDIZING JET</span>
          <span className="font-bold text-cyan-400">
            {cutterTelemetry.enabled && cutterTelemetry.rpm > 100 ? 'ACTIVE (140 BAR)' : 'STANDBY'}
          </span>
        </div>
      </div>

      {/* Bottom Right: OrbitControls Hint */}
      <div className="absolute bottom-3 right-3 hidden sm:flex items-center gap-1.5 font-mono text-[10px] text-slate-400 bg-slate-950/80 backdrop-blur-sm px-2.5 py-1 rounded border border-slate-800 pointer-events-none">
        <Eye className="w-3 h-3 text-cyan-400" />
        <span>Drag to Orbit · Scroll to Zoom · Right-Click to Pan</span>
      </div>
    </div>
  );
};

export default Cutter3DMechanicalViewer;
