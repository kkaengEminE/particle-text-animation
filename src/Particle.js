export const ParticleState = {
  FLOATING: 'floating',
  CONVERGING: 'converging',
  FORMED: 'formed',
};

export class Particle {
  constructor(canvasWidth, canvasHeight) {
    this.x = Math.random() * canvasWidth;
    this.y = Math.random() * canvasHeight;
    this.z = (Math.random() - 0.5) * 600;

    this.targetX = 0;
    this.targetY = 0;
    this.targetZ = 0;

    this.vx = (Math.random() - 0.5) * 0.8;
    this.vy = (Math.random() - 0.5) * 0.8;

    // Depth: 0 = far, 1 = near
    this.depth = Math.random();
    this.baseSize = 1 + this.depth * 3;
    this.size = this.baseSize;
    this.baseOpacity = 0.15 + this.depth * 0.85;
    this.opacity = this.baseOpacity;
    this.baseSpeed = 0.3 + this.depth * 0.7;

    this.color = '#ffffff';
    this.shape = 'circle';
    // For "random" shape mode: fixed shape per particle
    this.shapeIndex = Math.floor(Math.random() * 3);

    this.state = ParticleState.FLOATING;
    this.hasTarget = false;

    // Convergence
    this.convergeProgress = 0;
    this.convergeSpeed = 0.015 + Math.random() * 0.025;
    this.startX = this.x;
    this.startY = this.y;
    this.startZ = this.z;

    // Jitter when formed
    this.jitterPhase = Math.random() * Math.PI * 2;
    this.jitterAmplitude = 0.3 + Math.random() * 0.7;

    // Floating wobble
    this.wobblePhase = Math.random() * Math.PI * 2;
    this.wobbleSpeed = 0.5 + Math.random() * 1.5;
    this.wobbleAmplitude = 0.2 + Math.random() * 0.5;
  }

  reset(canvasWidth, canvasHeight) {
    this.x = Math.random() * canvasWidth;
    this.y = Math.random() * canvasHeight;
    this.z = (Math.random() - 0.5) * 600;
    this.startZ = this.z;
    this.state = ParticleState.FLOATING;
    this.hasTarget = false;
    this.convergeProgress = 0;
  }
}
