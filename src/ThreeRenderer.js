import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class ThreeRenderer {
  constructor(container, particleCount) {
    this.container = container;
    this.particleCount = particleCount;
    this.particles = null;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a1a);

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      1,
      3000
    );
    this.camera.position.set(0, 0, 800);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.rendererDom = this.renderer.domElement;
    this.rendererDom.style.position = 'absolute';
    this.rendererDom.style.inset = '0';
    this.rendererDom.style.zIndex = '1';
    this.rendererDom.style.display = 'none';
    container.appendChild(this.rendererDom);

    this.controls = new OrbitControls(this.camera, this.rendererDom);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enableZoom = true;
    this.controls.minDistance = 200;
    this.controls.maxDistance = 2000;

    this.positions = new Float32Array(particleCount * 3);
    this.colors = new Float32Array(particleCount * 3);
    this.sizes = new Float32Array(particleCount);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('customColor', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    this.material = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: `
        attribute float size;
        attribute vec3 customColor;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vColor = customColor;
          vAlpha = 1.0;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (400.0 / -mvPosition.z);
          gl_PointSize = max(gl_PointSize, 1.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = vAlpha * (1.0 - smoothstep(0.3, 0.5, dist));
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);

    this._colorCache = new Map();
  }

  setParticles(particles) {
    this.particles = particles;
  }

  show() {
    this.rendererDom.style.display = 'block';
  }

  hide() {
    this.rendererDom.style.display = 'none';
  }

  handleResize(width, height) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  draw() {
    if (!this.particles) return;

    const canvasW = this.container.clientWidth;
    const canvasH = this.container.clientHeight;
    const halfW = canvasW / 2;
    const halfH = canvasH / 2;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      this.positions[i * 3] = p.x - halfW;
      this.positions[i * 3 + 1] = -(p.y - halfH);
      this.positions[i * 3 + 2] = p.z || 0;

      const rgb = this._parseColor(p.color);
      this.colors[i * 3] = rgb[0];
      this.colors[i * 3 + 1] = rgb[1];
      this.colors[i * 3 + 2] = rgb[2];

      this.sizes[i] = Math.max(p.size * 2 * p.opacity, 0.5);
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.customColor.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  _parseColor(cssColor) {
    const cached = this._colorCache.get(cssColor);
    if (cached) return cached;

    let r = 1, g = 1, b = 1;

    if (cssColor.startsWith('#')) {
      const hex = cssColor.slice(1);
      r = parseInt(hex.substr(0, 2), 16) / 255;
      g = parseInt(hex.substr(2, 2), 16) / 255;
      b = parseInt(hex.substr(4, 2), 16) / 255;
    } else if (cssColor.startsWith('hsl')) {
      const match = cssColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
      if (match) {
        const c = new THREE.Color();
        c.setHSL(parseInt(match[1]) / 360, parseInt(match[2]) / 100, parseInt(match[3]) / 100);
        r = c.r;
        g = c.g;
        b = c.b;
      }
    }

    const result = [r, g, b];
    // Only cache hex colors (stable); HSL changes every frame in rainbow mode
    if (cssColor.startsWith('#')) {
      this._colorCache.set(cssColor, result);
    }
    return result;
  }

  dispose() {
    this.controls.dispose();
    this.geometry.dispose();
    this.material.dispose();
    this.renderer.dispose();
    if (this.rendererDom.parentNode) {
      this.rendererDom.parentNode.removeChild(this.rendererDom);
    }
  }
}
