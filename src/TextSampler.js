export class TextSampler {
  constructor() {
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
  }

  sample(text, canvasWidth, canvasHeight, opts = {}) {
    if (!text) return [];

    const {
      maxPoints = 3600,
      density = 1,
      fontSizeOverride = 0,
      textAreaLeft = 0,
      textAreaRight = 0,
    } = opts;

    const oc = this.offscreenCanvas;
    const ctx = this.offscreenCtx;

    oc.width = canvasWidth;
    oc.height = canvasHeight;
    ctx.clearRect(0, 0, oc.width, oc.height);

    const hasTextArea = textAreaLeft > 0 && textAreaRight > 0;
    const textAreaWidth = hasTextArea ? (textAreaRight - textAreaLeft) : 0;

    const fontSize = fontSizeOverride > 0
      ? fontSizeOverride
      : this._calculateFontSize(text, canvasWidth, canvasHeight, textAreaWidth);

    ctx.font = `800 ${fontSize}px "Inter", Arial, sans-serif`;
    ctx.fillStyle = '#ffffff';

    if (hasTextArea) {
      this._renderMultiline(ctx, text, fontSize, textAreaLeft, textAreaRight, canvasHeight);
    } else {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, oc.width / 2, oc.height / 2);
    }

    const imageData = ctx.getImageData(0, 0, oc.width, oc.height);
    const data = imageData.data;

    const gap = Math.max(1, Math.round(2 / density));
    const adjustedMaxPoints = Math.floor(maxPoints * density);

    const points = [];
    for (let y = 0; y < oc.height; y += gap) {
      for (let x = 0; x < oc.width; x += gap) {
        const index = (y * oc.width + x) * 4;
        if (data[index + 3] > 128) {
          points.push({ x, y });
        }
      }
    }

    if (points.length > adjustedMaxPoints) {
      return this._subsample(points, adjustedMaxPoints);
    }
    return points;
  }

  _renderMultiline(ctx, text, fontSize, textAreaLeft, textAreaRight, canvasHeight) {
    const lineHeight = fontSize * 1.3;
    const maxWidth = textAreaRight - textAreaLeft;
    const centerX = (textAreaLeft + textAreaRight) / 2;

    const lines = this._wrapText(ctx, text, maxWidth);

    const totalHeight = lines.length * lineHeight;
    const startY = (canvasHeight - totalHeight) / 2 + fontSize * 0.35;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], centerX, startY + i * lineHeight);
    }
  }

  _wrapText(ctx, text, maxWidth) {
    const lines = [];
    let currentLine = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const testLine = currentLine + char;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    return lines.length > 0 ? lines : [''];
  }

  _calculateFontSize(text, width, height, textAreaWidth = 0) {
    if (textAreaWidth > 0) {
      const charsPerLine = Math.max(4, Math.min(text.length, 10));
      const maxByWidth = (textAreaWidth * 0.9) / (charsPerLine * 0.6);
      const maxByHeight = height * 0.35;
      return Math.max(30, Math.min(150, Math.min(maxByHeight, maxByWidth)));
    }
    const maxByHeight = height * 0.5;
    const maxByWidth = (width * 0.8) / Math.max(text.length * 0.6, 1);
    return Math.max(40, Math.min(200, Math.min(maxByHeight, maxByWidth)));
  }

  _subsample(points, count) {
    const result = [...points];
    for (let i = result.length - 1; i > result.length - 1 - count && i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result.slice(result.length - count);
  }
}
