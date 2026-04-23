export class GifExporter {
  constructor(canvas, particleSystem) {
    this.canvas = canvas;
    this.particleSystem = particleSystem;
    this.duration = 5;
    this.quality = 'medium';
  }

  setDuration(seconds) {
    this.duration = seconds;
  }

  setQuality(quality) {
    this.quality = quality;
  }

  _getQualityConfig() {
    const configs = {
      low: { maxWidth: 320, maxHeight: 180, frameSkip: 2, frameDelay: 100 },
      medium: { maxWidth: 480, maxHeight: 270, frameSkip: 1, frameDelay: 80 },
      high: { maxWidth: 640, maxHeight: 360, frameSkip: 1, frameDelay: 60 },
    };
    return configs[this.quality] || configs.medium;
  }

  async export() {
    const ps = this.particleSystem;
    const finalText = ps.currentText;
    if (!finalText) return null;

    const { encode } = await import('modern-gif');
    const workerUrl = (await import('modern-gif/worker?url')).default;

    const config = this._getQualityConfig();

    const steps = [];
    for (let i = 1; i <= finalText.length; i++) {
      steps.push(finalText.substring(0, i));
    }

    const savedText = ps.currentText;
    const savedRandomColor = ps.randomColorMode;
    const savedColor = ps.particleColor;

    const aspectRatio = this.canvas.width / this.canvas.height;
    let gifWidth = Math.min(this.canvas.width, config.maxWidth);
    let gifHeight = Math.round(gifWidth / aspectRatio);
    if (gifHeight > config.maxHeight) {
      gifHeight = config.maxHeight;
      gifWidth = Math.round(gifHeight * aspectRatio);
    }

    const offscreen = document.createElement('canvas');
    offscreen.width = gifWidth;
    offscreen.height = gifHeight;
    const offCtx = offscreen.getContext('2d');

    const simFps = 30;
    const totalSimFrames = this.duration * simFps;
    const framesPerStep = Math.max(10, Math.floor(totalSimFrames / steps.length));
    const convergenceFrames = Math.floor(framesPerStep * 0.65);
    const holdFrames = framesPerStep - convergenceFrames;

    const frames = [];
    ps.resetParticles();

    let frameCounter = 0;
    for (const step of steps) {
      ps.setText(step);

      for (let f = 0; f < convergenceFrames; f++) {
        ps.update(1 / simFps);
        ps.draw();
        frameCounter++;

        if (frameCounter % config.frameSkip === 0) {
          offCtx.fillStyle = '#0a0a1a';
          offCtx.fillRect(0, 0, gifWidth, gifHeight);
          offCtx.drawImage(this.canvas, 0, 0, gifWidth, gifHeight);
          const imageData = offCtx.getImageData(0, 0, gifWidth, gifHeight);
          frames.push({ data: imageData.data, delay: config.frameDelay });
        }
      }

      for (let f = 0; f < holdFrames; f++) {
        ps.update(1 / simFps);
        ps.draw();
        frameCounter++;

        if (frameCounter % config.frameSkip === 0) {
          offCtx.fillStyle = '#0a0a1a';
          offCtx.fillRect(0, 0, gifWidth, gifHeight);
          offCtx.drawImage(this.canvas, 0, 0, gifWidth, gifHeight);
          const imageData = offCtx.getImageData(0, 0, gifWidth, gifHeight);
          frames.push({ data: imageData.data, delay: config.frameDelay });
        }
      }
    }

    const output = await encode({
      workerUrl,
      width: gifWidth,
      height: gifHeight,
      frames,
    });

    ps.resetParticles();
    ps.currentText = savedText;
    ps.randomColorMode = savedRandomColor;
    ps.particleColor = savedColor;
    if (savedText) {
      ps.setText(savedText);
    }

    return new Blob([output], { type: 'image/gif' });
  }
}
