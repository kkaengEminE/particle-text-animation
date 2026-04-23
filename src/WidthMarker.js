export class WidthMarker {
  constructor(containerEl, canvasEl, onChange) {
    this.container = containerEl;
    this.canvas = canvasEl;
    this.onChange = onChange;

    this.leftRatio = 2 / 7;
    this.rightRatio = 5 / 7;

    this.leftHandle = containerEl.querySelector('.wm-handle-left');
    this.rightHandle = containerEl.querySelector('.wm-handle-right');
    this.trackFill = containerEl.querySelector('.wm-track-fill');

    this._dragging = null;

    this._onMove = this._onMove.bind(this);
    this._onUp = this._onUp.bind(this);

    this._bindDrag();
    this._updatePositions();
    this._emitChange();
  }

  _bindDrag() {
    const onDown = (side) => (e) => {
      e.preventDefault();
      this._dragging = side;
      document.addEventListener('mousemove', this._onMove);
      document.addEventListener('mouseup', this._onUp);
      document.addEventListener('touchmove', this._onMove, { passive: false });
      document.addEventListener('touchend', this._onUp);
    };

    this.leftHandle.addEventListener('mousedown', onDown('left'));
    this.rightHandle.addEventListener('mousedown', onDown('right'));
    this.leftHandle.addEventListener('touchstart', onDown('left'), { passive: false });
    this.rightHandle.addEventListener('touchstart', onDown('right'), { passive: false });
  }

  _onMove(e) {
    if (!this._dragging) return;
    e.preventDefault();

    const rect = this.container.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const ratio = Math.max(0.05, Math.min(0.95, (clientX - rect.left) / rect.width));

    if (this._dragging === 'left') {
      this.leftRatio = Math.min(ratio, this.rightRatio - 0.1);
    } else {
      this.rightRatio = Math.max(ratio, this.leftRatio + 0.1);
    }

    this._updatePositions();
    this._emitChange();
  }

  _onUp() {
    this._dragging = null;
    document.removeEventListener('mousemove', this._onMove);
    document.removeEventListener('mouseup', this._onUp);
    document.removeEventListener('touchmove', this._onMove);
    document.removeEventListener('touchend', this._onUp);
  }

  _updatePositions() {
    this.leftHandle.style.left = (this.leftRatio * 100) + '%';
    this.rightHandle.style.left = (this.rightRatio * 100) + '%';
    this.trackFill.style.left = (this.leftRatio * 100) + '%';
    this.trackFill.style.width = ((this.rightRatio - this.leftRatio) * 100) + '%';
  }

  _emitChange() {
    const canvasWidth = this.canvas.width;
    if (canvasWidth <= 0) return;
    this.onChange(
      Math.round(this.leftRatio * canvasWidth),
      Math.round(this.rightRatio * canvasWidth)
    );
  }

  handleResize() {
    this._updatePositions();
    this._emitChange();
  }
}
