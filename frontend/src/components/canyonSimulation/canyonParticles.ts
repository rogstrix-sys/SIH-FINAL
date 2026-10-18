import * as THREE from 'three';

/**
 * GPU BufferGeometry Particle Systems for Canyon Expedition
 * 1. Dynamic 6-Wheel Tire Dust & Mud Spray
 * 2. Vertical Exhaust Diesel Smoke Puffs
 * 3. Cascading Waterfall Spray & Mist
 * 4. River Ford Water Splashes
 * 5. Alpine Weather (Rain / Snow)
 */

export class CanyonParticleEngine {
  public tireDustParticles: THREE.Points;
  public exhaustParticles: THREE.Points;
  public waterfallParticles: THREE.Points;
  public weatherParticles: THREE.Points;

  private tireCount = 450;
  private exhaustCount = 180;
  private waterfallCount = 650;
  private weatherCount = 900;

  private tireGeo: THREE.BufferGeometry;
  private exhaustGeo: THREE.BufferGeometry;
  private waterfallGeo: THREE.BufferGeometry;
  private weatherGeo: THREE.BufferGeometry;

  private tireVelocities: Float32Array;
  private tireLifetimes: Float32Array;
  private exhaustVelocities: Float32Array;
  private waterfallVelocities: Float32Array;
  private weatherVelocities: Float32Array;

  constructor() {
    // 1. Tire Dust Particles
    this.tireGeo = new THREE.BufferGeometry();
    const tirePos = new Float32Array(this.tireCount * 3);
    const tireCols = new Float32Array(this.tireCount * 3);
    this.tireVelocities = new Float32Array(this.tireCount * 3);
    this.tireLifetimes = new Float32Array(this.tireCount);

    for (let i = 0; i < this.tireCount; i++) {
      tirePos[i * 3] = 0;
      tirePos[i * 3 + 1] = -100;
      tirePos[i * 3 + 2] = 0;

      // Dust ochre/tan
      tireCols[i * 3] = 0.72 + Math.random() * 0.15;
      tireCols[i * 3 + 1] = 0.62 + Math.random() * 0.12;
      tireCols[i * 3 + 2] = 0.45 + Math.random() * 0.10;
      this.tireLifetimes[i] = Math.random();
    }
    this.tireGeo.setAttribute('position', new THREE.BufferAttribute(tirePos, 3));
    this.tireGeo.setAttribute('color', new THREE.BufferAttribute(tireCols, 3));
    const tireMat = new THREE.PointsMaterial({
      size: 0.22,
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      depthWrite: false
    });
    this.tireDustParticles = new THREE.Points(this.tireGeo, tireMat);

    // 2. Exhaust Diesel Smoke
    this.exhaustGeo = new THREE.BufferGeometry();
    const exhaustPos = new Float32Array(this.exhaustCount * 3);
    const exhaustCols = new Float32Array(this.exhaustCount * 3);
    this.exhaustVelocities = new Float32Array(this.exhaustCount * 3);

    for (let i = 0; i < this.exhaustCount; i++) {
      exhaustPos[i * 3] = 0;
      exhaustPos[i * 3 + 1] = -100;
      exhaustPos[i * 3 + 2] = 0;

      // Dark grey / black soot
      const g = 0.15 + Math.random() * 0.15;
      exhaustCols[i * 3] = g;
      exhaustCols[i * 3 + 1] = g;
      exhaustCols[i * 3 + 2] = g;
    }
    this.exhaustGeo.setAttribute('position', new THREE.BufferAttribute(exhaustPos, 3));
    this.exhaustGeo.setAttribute('color', new THREE.BufferAttribute(exhaustCols, 3));
    const exhaustMat = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      depthWrite: false
    });
    this.exhaustParticles = new THREE.Points(this.exhaustGeo, exhaustMat);

    // 3. Waterfall Cascading Spray
    this.waterfallGeo = new THREE.BufferGeometry();
    const waterPos = new Float32Array(this.waterfallCount * 3);
    const waterCols = new Float32Array(this.waterfallCount * 3);
    this.waterfallVelocities = new Float32Array(this.waterfallCount * 3);

    for (let i = 0; i < this.waterfallCount; i++) {
      // Plunging from cliff at (-32, 18, -12) down to river at y = -2
      waterPos[i * 3] = -32 + (Math.random() - 0.5) * 4.5;
      waterPos[i * 3 + 1] = -2 + Math.random() * 20;
      waterPos[i * 3 + 2] = -12 + (Math.random() - 0.5) * 3.5;

      this.waterfallVelocities[i * 3] = (Math.random() - 0.5) * 0.6;
      this.waterfallVelocities[i * 3 + 1] = -8.0 - Math.random() * 6.0;
      this.waterfallVelocities[i * 3 + 2] = 1.2 + Math.random() * 1.5;

      waterCols[i * 3] = 0.85 + Math.random() * 0.15;
      waterCols[i * 3 + 1] = 0.95;
      waterCols[i * 3 + 2] = 1.0;
    }
    this.waterfallGeo.setAttribute('position', new THREE.BufferAttribute(waterPos, 3));
    this.waterfallGeo.setAttribute('color', new THREE.BufferAttribute(waterCols, 3));
    const waterMat = new THREE.PointsMaterial({
      size: 0.14,
      vertexColors: true,
      transparent: true,
      opacity: 0.82,
      blending: THREE.AdditiveBlending
    });
    this.waterfallParticles = new THREE.Points(this.waterfallGeo, waterMat);

    // 4. Weather Particles (Snow / Alpine precipitation)
    this.weatherGeo = new THREE.BufferGeometry();
    const weatherPos = new Float32Array(this.weatherCount * 3);
    this.weatherVelocities = new Float32Array(this.weatherCount * 3);

    for (let i = 0; i < this.weatherCount; i++) {
      weatherPos[i * 3] = (Math.random() - 0.5) * 120;
      weatherPos[i * 3 + 1] = Math.random() * 45;
      weatherPos[i * 3 + 2] = (Math.random() - 0.5) * 120;

      this.weatherVelocities[i * 3] = -0.5 - Math.random() * 0.5;
      this.weatherVelocities[i * 3 + 1] = -3.5 - Math.random() * 2.5;
      this.weatherVelocities[i * 3 + 2] = 0.2 + Math.random() * 0.4;
    }
    this.weatherGeo.setAttribute('position', new THREE.BufferAttribute(weatherPos, 3));
    const weatherMat = new THREE.PointsMaterial({
      size: 0.12,
      color: 0xffffff,
      transparent: true,
      opacity: 0.75
    });
    this.weatherParticles = new THREE.Points(this.weatherGeo, weatherMat);
  }

  public update(
    delta: number,
    wheelPositions: THREE.Vector3[],
    exhaustPos: THREE.Vector3,
    vehicleSpeedKmh: number,
    throttle: number,
    weatherType: 'snow' | 'rain' | 'clear'
  ) {
    // 1. Tire Dust Spray
    const absSpeed = Math.abs(vehicleSpeedKmh);
    const tirePosAttr = this.tireGeo.attributes.position as THREE.BufferAttribute;
    const tireArray = tirePosAttr.array as Float32Array;

    if (absSpeed > 2 && wheelPositions.length > 0) {
      this.tireDustParticles.visible = true;
      const speedFactor = Math.min(1.0, absSpeed / 30);

      for (let i = 0; i < this.tireCount; i++) {
        this.tireLifetimes[i] += delta * (1.2 + speedFactor);
        if (this.tireLifetimes[i] >= 1.0) {
          // Respawn at random wheel contact patch
          this.tireLifetimes[i] = 0;
          const wheel = wheelPositions[i % wheelPositions.length];
          tireArray[i * 3] = wheel.x + (Math.random() - 0.5) * 0.4;
          tireArray[i * 3 + 1] = wheel.y + 0.05;
          tireArray[i * 3 + 2] = wheel.z + (Math.random() - 0.5) * 0.4;

          this.tireVelocities[i * 3] = (Math.random() - 0.5) * 1.5;
          this.tireVelocities[i * 3 + 1] = 0.6 + Math.random() * 1.2 * speedFactor;
          this.tireVelocities[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
        } else {
          tireArray[i * 3] += this.tireVelocities[i * 3] * delta;
          tireArray[i * 3 + 1] += this.tireVelocities[i * 3 + 1] * delta;
          tireArray[i * 3 + 2] += this.tireVelocities[i * 3 + 2] * delta;
          this.tireVelocities[i * 3 + 1] *= 0.95; // Drag
        }
      }
      tirePosAttr.needsUpdate = true;
    } else {
      this.tireDustParticles.visible = false;
    }

    // 2. Exhaust Puffs
    const exhaustPosAttr = this.exhaustGeo.attributes.position as THREE.BufferAttribute;
    const exhaustArray = exhaustPosAttr.array as Float32Array;

    for (let i = 0; i < this.exhaustCount; i++) {
      let py = exhaustArray[i * 3 + 1];
      if (py < 0 || py > exhaustPos.y + 2.5) {
        if (Math.abs(throttle) > 0.1 || absSpeed > 1) {
          exhaustArray[i * 3] = exhaustPos.x + (Math.random() - 0.5) * 0.06;
          exhaustArray[i * 3 + 1] = exhaustPos.y;
          exhaustArray[i * 3 + 2] = exhaustPos.z + (Math.random() - 0.5) * 0.06;

          this.exhaustVelocities[i * 3] = -0.3 + (Math.random() - 0.5) * 0.4;
          this.exhaustVelocities[i * 3 + 1] = 1.5 + Math.random() * 1.5;
          this.exhaustVelocities[i * 3 + 2] = -0.4 + (Math.random() - 0.5) * 0.4;
        }
      } else {
        exhaustArray[i * 3] += this.exhaustVelocities[i * 3] * delta;
        exhaustArray[i * 3 + 1] += this.exhaustVelocities[i * 3 + 1] * delta;
        exhaustArray[i * 3 + 2] += this.exhaustVelocities[i * 3 + 2] * delta;
      }
    }
    exhaustPosAttr.needsUpdate = true;

    // 3. Waterfall Cascading Droplets
    const waterPosAttr = this.waterfallGeo.attributes.position as THREE.BufferAttribute;
    const waterArray = waterPosAttr.array as Float32Array;

    for (let i = 0; i < this.waterfallCount; i++) {
      waterArray[i * 3] += this.waterfallVelocities[i * 3] * delta;
      waterArray[i * 3 + 1] += this.waterfallVelocities[i * 3 + 1] * delta;
      waterArray[i * 3 + 2] += this.waterfallVelocities[i * 3 + 2] * delta;

      if (waterArray[i * 3 + 1] < -2.2) {
        // Respawn at waterfall crest
        waterArray[i * 3] = -32 + (Math.random() - 0.5) * 4.5;
        waterArray[i * 3 + 1] = 18.0;
        waterArray[i * 3 + 2] = -12 + (Math.random() - 0.5) * 2.0;
      }
    }
    waterPosAttr.needsUpdate = true;

    // 4. Weather Particles
    if (weatherType === 'clear') {
      this.weatherParticles.visible = false;
    } else {
      this.weatherParticles.visible = true;
      const weatherPosAttr = this.weatherGeo.attributes.position as THREE.BufferAttribute;
      const weatherArray = weatherPosAttr.array as Float32Array;
      const fallSpeedMult = weatherType === 'rain' ? 2.5 : 1.0;

      for (let i = 0; i < this.weatherCount; i++) {
        weatherArray[i * 3] += this.weatherVelocities[i * 3] * delta;
        weatherArray[i * 3 + 1] += this.weatherVelocities[i * 3 + 1] * delta * fallSpeedMult;
        weatherArray[i * 3 + 2] += this.weatherVelocities[i * 3 + 2] * delta;

        if (weatherArray[i * 3 + 1] < -3) {
          weatherArray[i * 3] = (Math.random() - 0.5) * 120;
          weatherArray[i * 3 + 1] = 35 + Math.random() * 10;
          weatherArray[i * 3 + 2] = (Math.random() - 0.5) * 120;
        }
      }
      weatherPosAttr.needsUpdate = true;
    }
  }

  public dispose() {
    this.tireGeo.dispose();
    this.exhaustGeo.dispose();
    this.waterfallGeo.dispose();
    this.weatherGeo.dispose();
    (this.tireDustParticles.material as THREE.Material).dispose();
    (this.exhaustParticles.material as THREE.Material).dispose();
    (this.waterfallParticles.material as THREE.Material).dispose();
    (this.weatherParticles.material as THREE.Material).dispose();
  }
}
