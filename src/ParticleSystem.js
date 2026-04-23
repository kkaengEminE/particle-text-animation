import { Particle, ParticleState } from './Particle.js';
import { TextSampler } from './TextSampler.js';
import { drawParticle, SHAPE_NAMES } from './shapes.js';
import { lerp, easeOutCubic } from './easing.js';

const PARTICLE_COUNT = 4000;
const MIN_FLOATING = 200;
const TEXT_RATIO = 0.90;

export class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.textSampler = new TextSampler();
    this.currentText = '';
    this.elapsed = 0;
    this.randomColorMode = false;
    this.particleColor = '#ffffff';
    this.particleShape = 'circle';

    // Phase 1: Sliders
    this.speedMultiplier = 1.0;
    this.density = 1.0;
    this.fontSizeOverride = 0;

    // Phase 2: Shape cycling
    this.cycleShapeMode = false;

    // Phase 4: Text area bounds
    this.textAreaLeft = 0;
    this.textAreaRight = 0;

    this._depthSorted = [];
    this._initParticles();
  }

  _initParticles() {
    this.particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = new Particle(this.canvas.width, this.canvas.height);
      p.color = this.particleColor;
      p.shape = this.particleShape;
      this.particles.push(p);
    }
    this._depthSorted = [...this.particles].sort((a, b) => a.depth - b.depth);
  }

  _getSampleOpts(maxPoints) {
    return {
      maxPoints,
      density: this.density,
      fontSizeOverride: this.fontSizeOverride,
      textAreaLeft: this.textAreaLeft,
      textAreaRight: this.textAreaRight,
    };
  }

  setText(text) {
    this.currentText = text;

    const maxTextParticles = Math.min(
      PARTICLE_COUNT - MIN_FLOATING,
      Math.floor(PARTICLE_COUNT * TEXT_RATIO)
    );

    const targets = this.textSampler.sample(
      text, this.canvas.width, this.canvas.height,
      this._getSampleOpts(maxTextParticles)
    );

    if (targets.length === 0) {
      for (const p of this.particles) {
        p.hasTarget = false;
        p.state = ParticleState.FLOATING;
      }
      return;
    }

    this._assignTargets(targets);
  }

  _assignTargets(targets) {
    const indices = Array.from({ length: this.particles.length }, (_, i) => i);
    // Fisher-Yates shuffle — ensures particles from all over the screen participate
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[indices[i]];
      if (i < targets.length) {
        p.targetX = targets[i].x;
        p.targetY = targets[i].y;
        p.hasTarget = true;
        p.startX = p.x;
        p.startY = p.y;
        p.startZ = p.z;
        p.convergeProgress = 0;
        p.state = ParticleState.CONVERGING;
      } else {
        p.hasTarget = false;
        p.state = ParticleState.FLOATING;
      }
    }
  }

  setShape(shape) {
    this.particleShape = shape;
    for (const p of this.particles) {
      p.shape = shape;
    }
  }

  setColor(color) {
    this.particleColor = color;
    this.randomColorMode = false;
    for (const p of this.particles) {
      p.color = color;
    }
  }

  setRandomColorMode(enabled) {
    this.randomColorMode = enabled;
  }

  setSpeedMultiplier(value) {
    this.speedMultiplier = value;
  }

  setDensity(value) {
    this.density = value;
    if (this.currentText) {
      this.setText(this.currentText);
    }
  }

  setFontSize(value) {
    this.fontSizeOverride = value;
    if (this.currentText) {
      this.setText(this.currentText);
    }
  }

  setCycleShapeMode(enabled) {
    this.cycleShapeMode = enabled;
  }

  setTextAreaBounds(left, right) {
    this.textAreaLeft = left;
    this.textAreaRight = right;
    if (this.currentText) {
      this.setText(this.currentText);
    }
  }

  update(deltaTime) {
    this.elapsed += deltaTime;

    for (const p of this.particles) {
      if (this.randomColorMode) {
        const hue = (this.elapsed * 30 + p.depth * 360 + p.wobblePhase * 57) % 360;
        p.color = `hsl(${hue}, 80%, 60%)`;
      }

      if (this.cycleShapeMode) {
        const shapeIdx = Math.floor(
          (this.elapsed * 0.5 + p.depth * 3 + p.wobblePhase) % SHAPE_NAMES.length
        );
        p.shape = SHAPE_NAMES[shapeIdx];
      }

      switch (p.state) {
        case ParticleState.FLOATING:
          this._updateFloating(p, deltaTime);
          break;
        case ParticleState.CONVERGING:
          this._updateConverging(p, deltaTime);
          break;
        case ParticleState.FORMED:
          this._updateFormed(p, deltaTime);
          break;
      }
    }
  }

  _updateFloating(p, dt) {
    const speed = p.baseSpeed;

    p.wobblePhase += p.wobbleSpeed * dt;
    const wobbleX = Math.sin(p.wobblePhase) * p.wobbleAmplitude;
    const wobbleY = Math.cos(p.wobblePhase * 0.7) * p.wobbleAmplitude;

    p.x += (p.vx * speed + wobbleX) * dt * 60;
    p.y += (p.vy * speed + wobbleY) * dt * 60;
    p.z += Math.sin(p.wobblePhase * 0.5) * 0.3 * dt * 60;

    const w = this.canvas.width;
    const h = this.canvas.height;
    if (p.x < -10) p.x = w + 10;
    if (p.x > w + 10) p.x = -10;
    if (p.y < -10) p.y = h + 10;
    if (p.y > h + 10) p.y = -10;
    if (p.z < -300) p.z = 300;
    if (p.z > 300) p.z = -300;

    p.size = p.baseSize;
    p.opacity = p.baseOpacity;
  }

  _updateConverging(p, dt) {
    p.convergeProgress += p.convergeSpeed * this.speedMultiplier * dt * 60;

    if (p.convergeProgress >= 1) {
      p.convergeProgress = 1;
      p.state = ParticleState.FORMED;
      p.x = p.targetX;
      p.y = p.targetY;
      p.z = 0;
      return;
    }

    const t = easeOutCubic(p.convergeProgress);
    p.x = lerp(p.startX, p.targetX, t);
    p.y = lerp(p.startY, p.targetY, t);
    p.z = lerp(p.startZ, 0, t);

    p.opacity = lerp(p.baseOpacity, 1, t);
    p.size = lerp(p.baseSize, p.baseSize * 1.2, t * (1 - t) * 4);
  }

  _updateFormed(p, dt) {
    p.jitterPhase += dt * 2;
    p.x = p.targetX + Math.sin(p.jitterPhase) * p.jitterAmplitude;
    p.y = p.targetY + Math.cos(p.jitterPhase * 1.3) * p.jitterAmplitude;
    p.z = Math.sin(p.jitterPhase * 0.9) * p.jitterAmplitude;
    p.opacity = 1;
    p.size = p.baseSize;
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (const p of this._depthSorted) {
      drawParticle(this.ctx, p);
    }
  }

  handleResize(w, h) {
    if (this.currentText) {
      const maxTextParticles = Math.min(
        PARTICLE_COUNT - MIN_FLOATING,
        Math.floor(PARTICLE_COUNT * TEXT_RATIO)
      );
      const targets = this.textSampler.sample(
        this.currentText, w, h,
        this._getSampleOpts(maxTextParticles)
      );
      if (targets.length > 0) {
        this._assignTargets(targets);
      }
    }

    for (const p of this.particles) {
      if (p.state === ParticleState.FLOATING) {
        p.x = Math.min(p.x, w);
        p.y = Math.min(p.y, h);
      }
    }
  }

  resetParticles() {
    for (const p of this.particles) {
      p.reset(this.canvas.width, this.canvas.height);
    }
    this.currentText = '';
  }
}
