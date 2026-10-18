import * as THREE from 'three';

/**
 * High-performance GPU BufferGeometry particle systems for:
 * 1. High-Pressure Hydro-Jet Water Spray & Splatter
 * 2. Suction Slurry Vortex Current
 * 3. Volumetric Hazardous Gas Clouds (H2S / CH4)
 * 4. Fresh Air Ventilation Inflow Streamlines
 * 5. Ultrasonic Depth Sonar Pulse
 */

export class VaultParticleEngine {
  public jetParticles: THREE.Points;
  public slurryParticles: THREE.Points;
  public gasParticles: THREE.Points;
  public ventParticles: THREE.Points;
  public sonarPulseMesh: THREE.Mesh;

  private jetCount = 600;
  private slurryCount = 450;
  private gasCount = 800;
  private ventCount = 400;

  private jetGeo: THREE.BufferGeometry;
  private slurryGeo: THREE.BufferGeometry;
  private gasGeo: THREE.BufferGeometry;
  private ventGeo: THREE.BufferGeometry;

  private jetVelocities: Float32Array;
  private slurryAngles: Float32Array;
  private gasDrift: Float32Array;
  private ventVelocities: Float32Array;

  constructor() {
    // 1. Water Jet Particles
    this.jetGeo = new THREE.BufferGeometry();
    const jetPos = new Float32Array(this.jetCount * 3);
    const jetCols = new Float32Array(this.jetCount * 3);
    this.jetVelocities = new Float32Array(this.jetCount * 3);

    for (let i = 0; i < this.jetCount; i++) {
      jetPos[i * 3] = 0;
      jetPos[i * 3 + 1] = -10;
      jetPos[i * 3 + 2] = 0;

      // Cyan-white water droplet tint
      jetCols[i * 3] = 0.6 + Math.random() * 0.4;
      jetCols[i * 3 + 1] = 0.85 + Math.random() * 0.15;
      jetCols[i * 3 + 2] = 1.0;
    }
    this.jetGeo.setAttribute('position', new THREE.BufferAttribute(jetPos, 3));
    this.jetGeo.setAttribute('color', new THREE.BufferAttribute(jetCols, 3));

    const jetMat = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    this.jetParticles = new THREE.Points(this.jetGeo, jetMat);

    // 2. Slurry Suction Vortex Particles
    this.slurryGeo = new THREE.BufferGeometry();
    const slurryPos = new Float32Array(this.slurryCount * 3);
    const slurryCols = new Float32Array(this.slurryCount * 3);
    this.slurryAngles = new Float32Array(this.slurryCount);

    for (let i = 0; i < this.slurryCount; i++) {
      slurryPos[i * 3] = 0;
      slurryPos[i * 3 + 1] = -10;
      slurryPos[i * 3 + 2] = 0;

      // Dark brown / organic green slurry particles
      slurryCols[i * 3] = 0.28 + Math.random() * 0.15;
      slurryCols[i * 3 + 1] = 0.18 + Math.random() * 0.12;
      slurryCols[i * 3 + 2] = 0.08 + Math.random() * 0.08;
      this.slurryAngles[i] = Math.random() * Math.PI * 2;
    }
    this.slurryGeo.setAttribute('position', new THREE.BufferAttribute(slurryPos, 3));
    this.slurryGeo.setAttribute('color', new THREE.BufferAttribute(slurryCols, 3));

    const slurryMat = new THREE.PointsMaterial({
      size: 0.065,
      vertexColors: true,
      transparent: true,
      opacity: 0.95
    });
    this.slurryParticles = new THREE.Points(this.slurryGeo, slurryMat);

    // 3. Volumetric Gas Cloud Particles
    this.gasGeo = new THREE.BufferGeometry();
    const gasPos = new Float32Array(this.gasCount * 3);
    const gasCols = new Float32Array(this.gasCount * 3);
    this.gasDrift = new Float32Array(this.gasCount * 3);

    for (let i = 0; i < this.gasCount; i++) {
      // Dispersed in vault headspace (x: -1.8 to 1.8, y: -0.8 to -2.2, z: -1.0 to 1.0)
      gasPos[i * 3] = (Math.random() - 0.5) * 3.6;
      gasPos[i * 3 + 1] = -1.0 - Math.random() * 1.3;
      gasPos[i * 3 + 2] = (Math.random() - 0.5) * 2.0;

      this.gasDrift[i * 3] = (Math.random() - 0.5) * 0.08;
      this.gasDrift[i * 3 + 1] = 0.04 + Math.random() * 0.06;
      this.gasDrift[i * 3 + 2] = (Math.random() - 0.5) * 0.08;

      // Toxic haze: amber-yellowish-greenish
      gasCols[i * 3] = 0.85;
      gasCols[i * 3 + 1] = 0.75;
      gasCols[i * 3 + 2] = 0.2;
    }
    this.gasGeo.setAttribute('position', new THREE.BufferAttribute(gasPos, 3));
    this.gasGeo.setAttribute('color', new THREE.BufferAttribute(gasCols, 3));

    const gasMat = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.gasParticles = new THREE.Points(this.gasGeo, gasMat);

    // 4. Ventilation Fresh Air Particles
    this.ventGeo = new THREE.BufferGeometry();
    const ventPos = new Float32Array(this.ventCount * 3);
    const ventCols = new Float32Array(this.ventCount * 3);
    this.ventVelocities = new Float32Array(this.ventCount);

    for (let i = 0; i < this.ventCount; i++) {
      ventPos[i * 3] = 0;
      ventPos[i * 3 + 1] = -10;
      ventPos[i * 3 + 2] = 0;

      ventCols[i * 3] = 0.3;
      ventCols[i * 3 + 1] = 0.8;
      ventCols[i * 3 + 2] = 1.0;
      this.ventVelocities[i] = 1.5 + Math.random() * 2.0;
    }
    this.ventGeo.setAttribute('position', new THREE.BufferAttribute(ventPos, 3));
    this.ventGeo.setAttribute('color', new THREE.BufferAttribute(ventCols, 3));

    const ventMat = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });
    this.ventParticles = new THREE.Points(this.ventGeo, ventMat);

    // 5. Ultrasonic Sonar Pulse Mesh (Inverted cone with pulsing opacity)
    const coneGeo = new THREE.ConeGeometry(0.45, 1.2, 16, 1, true);
    coneGeo.rotateX(Math.PI);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.45
    });
    this.sonarPulseMesh = new THREE.Mesh(coneGeo, coneMat);
    this.sonarPulseMesh.visible = false;
  }

  /**
   * Update particle positions per frame
   */
  public update(
    delta: number,
    robotPos: THREE.Vector3,
    nozzleLeftWorld: THREE.Vector3,
    nozzleRightWorld: THREE.Vector3,
    intakeWorld: THREE.Vector3,
    jetActive: boolean,
    jetPressureBar: number,
    suctionActive: boolean,
    ventActive: boolean,
    ventDuctMouthWorld: THREE.Vector3,
    gasHazardLevel: 'SAFE' | 'CAUTION' | 'CRITICAL_ALARM',
    sludgeSurfaceY: number
  ) {
    // 1. Water Jet Particles
    const jetPosAttr = this.jetGeo.attributes.position as THREE.BufferAttribute;
    const jetArray = jetPosAttr.array as Float32Array;

    if (jetActive && jetPressureBar > 5) {
      this.jetParticles.visible = true;
      const jetSpeed = (jetPressureBar / 60) * 8.0;

      for (let i = 0; i < this.jetCount; i++) {
        let px = jetArray[i * 3];
        let py = jetArray[i * 3 + 1];
        let pz = jetArray[i * 3 + 2];

        // If particle hit sludge bed or out of bounds, respawn at nozzle
        if (py <= sludgeSurfaceY || py < -3.5 || py > 1.0) {
          const isLeft = i % 2 === 0;
          const origin = isLeft ? nozzleLeftWorld : nozzleRightWorld;
          jetArray[i * 3] = origin.x + (Math.random() - 0.5) * 0.02;
          jetArray[i * 3 + 1] = origin.y;
          jetArray[i * 3 + 2] = origin.z + (Math.random() - 0.5) * 0.02;

          // Downward conical velocity vector
          const spread = 0.25;
          this.jetVelocities[i * 3] = (Math.random() - 0.5) * spread * jetSpeed;
          this.jetVelocities[i * 3 + 1] = -jetSpeed;
          this.jetVelocities[i * 3 + 2] = (Math.random() - 0.5) * spread * jetSpeed;
        } else {
          jetArray[i * 3] += this.jetVelocities[i * 3] * delta;
          jetArray[i * 3 + 1] += this.jetVelocities[i * 3 + 1] * delta;
          jetArray[i * 3 + 2] += this.jetVelocities[i * 3 + 2] * delta;
        }
      }
      jetPosAttr.needsUpdate = true;
    } else {
      this.jetParticles.visible = false;
    }

    // 2. Slurry Suction Vortex Particles
    const slurryPosAttr = this.slurryGeo.attributes.position as THREE.BufferAttribute;
    const slurryArray = slurryPosAttr.array as Float32Array;

    if (suctionActive) {
      this.slurryParticles.visible = true;
      for (let i = 0; i < this.slurryCount; i++) {
        let px = slurryArray[i * 3];
        let py = slurryArray[i * 3 + 1];
        let pz = slurryArray[i * 3 + 2];

        const dist = Math.hypot(px - intakeWorld.x, pz - intakeWorld.z);
        if (dist > 0.8 || py > intakeWorld.y + 0.5 || py < intakeWorld.y - 0.5) {
          // Respawn in circular swirl around intake
          this.slurryAngles[i] += 0.1;
          const r = 0.15 + Math.random() * 0.45;
          slurryArray[i * 3] = intakeWorld.x + Math.cos(this.slurryAngles[i]) * r;
          slurryArray[i * 3 + 1] = intakeWorld.y - 0.1 - Math.random() * 0.2;
          slurryArray[i * 3 + 2] = intakeWorld.z + Math.sin(this.slurryAngles[i]) * r;
        } else {
          // Swirl and converge into intake
          this.slurryAngles[i] += delta * 6.5;
          const targetX = intakeWorld.x;
          const targetY = intakeWorld.y + 0.15;
          const targetZ = intakeWorld.z;

          slurryArray[i * 3] += (targetX - px) * 4.0 * delta - Math.sin(this.slurryAngles[i]) * 0.4 * delta;
          slurryArray[i * 3 + 1] += (targetY - py) * 3.5 * delta;
          slurryArray[i * 3 + 2] += (targetZ - pz) * 4.0 * delta + Math.cos(this.slurryAngles[i]) * 0.4 * delta;
        }
      }
      slurryPosAttr.needsUpdate = true;
    } else {
      this.slurryParticles.visible = false;
    }

    // 3. Volumetric Gas Cloud Particles
    const gasPosAttr = this.gasGeo.attributes.position as THREE.BufferAttribute;
    const gasColAttr = this.gasGeo.attributes.color as THREE.BufferAttribute;
    const gasArray = gasPosAttr.array as Float32Array;
    const gasColArray = gasColAttr.array as Float32Array;

    const rTarget = gasHazardLevel === 'CRITICAL_ALARM' ? 0.95 : gasHazardLevel === 'CAUTION' ? 0.92 : 0.45;
    const gTarget = gasHazardLevel === 'CRITICAL_ALARM' ? 0.2 : gasHazardLevel === 'CAUTION' ? 0.65 : 0.75;
    const bTarget = gasHazardLevel === 'CRITICAL_ALARM' ? 0.15 : gasHazardLevel === 'CAUTION' ? 0.15 : 0.35;

    for (let i = 0; i < this.gasCount; i++) {
      gasArray[i * 3] += this.gasDrift[i * 3] * delta;
      gasArray[i * 3 + 1] += this.gasDrift[i * 3 + 1] * delta;
      gasArray[i * 3 + 2] += this.gasDrift[i * 3 + 2] * delta;

      // Wrap around vault headspace
      if (gasArray[i * 3 + 1] > -0.4) {
        gasArray[i * 3 + 1] = -2.1;
        gasArray[i * 3] = (Math.random() - 0.5) * 3.4;
        gasArray[i * 3 + 2] = (Math.random() - 0.5) * 1.8;
      }

      // Smooth color morph towards hazard level
      gasColArray[i * 3] += (rTarget - gasColArray[i * 3]) * 0.05;
      gasColArray[i * 3 + 1] += (gTarget - gasColArray[i * 3 + 1]) * 0.05;
      gasColArray[i * 3 + 2] += (bTarget - gasColArray[i * 3 + 2]) * 0.05;
    }
    gasPosAttr.needsUpdate = true;
    gasColAttr.needsUpdate = true;

    // 4. Ventilation Fresh Air Particles
    const ventPosAttr = this.ventGeo.attributes.position as THREE.BufferAttribute;
    const ventArray = ventPosAttr.array as Float32Array;

    if (ventActive) {
      this.ventParticles.visible = true;
      for (let i = 0; i < this.ventCount; i++) {
        let py = ventArray[i * 3 + 1];
        if (py < -2.3 || py > ventDuctMouthWorld.y) {
          ventArray[i * 3] = ventDuctMouthWorld.x + (Math.random() - 0.5) * 0.15;
          ventArray[i * 3 + 1] = ventDuctMouthWorld.y;
          ventArray[i * 3 + 2] = ventDuctMouthWorld.z + (Math.random() - 0.5) * 0.15;
        } else {
          ventArray[i * 3 + 1] -= this.ventVelocities[i] * delta;
          ventArray[i * 3] += (Math.random() - 0.5) * 0.15 * delta;
          ventArray[i * 3 + 2] += (Math.random() - 0.5) * 0.15 * delta;
        }
      }
      ventPosAttr.needsUpdate = true;
    } else {
      this.ventParticles.visible = false;
    }

    // 5. Ultrasonic Sonar Cone
    this.sonarPulseMesh.position.copy(robotPos);
    this.sonarPulseMesh.position.y += 0.25;
    this.sonarPulseMesh.visible = true;
  }

  public dispose() {
    this.jetGeo.dispose();
    this.slurryGeo.dispose();
    this.gasGeo.dispose();
    this.ventGeo.dispose();
    (this.jetParticles.material as THREE.Material).dispose();
    (this.slurryParticles.material as THREE.Material).dispose();
    (this.gasParticles.material as THREE.Material).dispose();
    (this.ventParticles.material as THREE.Material).dispose();
    this.sonarPulseMesh.geometry.dispose();
    (this.sonarPulseMesh.material as THREE.Material).dispose();
  }
}
