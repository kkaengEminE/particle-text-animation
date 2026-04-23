export class UIController {
  constructor(callbacks) {
    this.callbacks = callbacks;
    this._adModalResolve = null;

    this._bindInput();
    this._bindShapeSelector();
    this._bindColorPicker();
    this._bindCycleShape();
    this._bindSpeedSlider();
    this._bindDensitySlider();
    this._bindFontSizeSlider();
    this._bindGifControls();
    this._bindExportButton();
    this._bindAdModal();
    this._bindModeToggle();
  }

  _bindInput() {
    const input = document.getElementById('text-input');
    const exportBtn = document.getElementById('export-btn');
    let debounceTimer = null;

    input.addEventListener('input', (e) => {
      const text = e.target.value;
      exportBtn.disabled = !text.length;

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.callbacks.onTextChange(text);
      }, 80);
    });
  }

  _bindShapeSelector() {
    const buttons = document.querySelectorAll('.shape-btn');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        buttons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.callbacks.onShapeChange(btn.dataset.shape);
      });
    });
  }

  _bindColorPicker() {
    const picker = document.getElementById('color-picker');
    const randomCheckbox = document.getElementById('random-color');

    picker.addEventListener('input', (e) => {
      if (!randomCheckbox.checked) {
        this.callbacks.onColorChange(e.target.value);
      }
    });

    randomCheckbox.addEventListener('change', (e) => {
      this.callbacks.onRandomColor(e.target.checked);
      if (!e.target.checked) {
        this.callbacks.onColorChange(picker.value);
      }
    });
  }

  _bindCycleShape() {
    const checkbox = document.getElementById('cycle-shape');
    checkbox.addEventListener('change', (e) => {
      this.callbacks.onCycleShape(e.target.checked);
    });
  }

  _bindSpeedSlider() {
    const slider = document.getElementById('speed-slider');
    const display = document.getElementById('speed-value');
    slider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      display.textContent = val.toFixed(1) + 'x';
      this.callbacks.onSpeedChange(val);
    });
  }

  _bindDensitySlider() {
    const slider = document.getElementById('density-slider');
    const display = document.getElementById('density-value');
    slider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      display.textContent = val.toFixed(1);
      this.callbacks.onDensityChange(val);
    });
  }

  _bindFontSizeSlider() {
    const slider = document.getElementById('fontsize-slider');
    const display = document.getElementById('fontsize-value');
    slider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      display.textContent = val === 0 ? 'Auto' : val + 'px';
      this.callbacks.onFontSizeChange(val);
    });
  }

  _bindGifControls() {
    const durationSlider = document.getElementById('gif-duration');
    const durationDisplay = document.getElementById('gif-duration-value');
    const qualitySelect = document.getElementById('gif-quality');

    durationSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      durationDisplay.textContent = val + 's';
      this.callbacks.onGifDurationChange(val);
    });

    qualitySelect.addEventListener('change', (e) => {
      this.callbacks.onGifQualityChange(e.target.value);
    });
  }

  _bindExportButton() {
    const btn = document.getElementById('export-btn');
    btn.addEventListener('click', () => {
      this.callbacks.onExport();
    });
  }

  _bindAdModal() {
    const closeBtn = document.getElementById('ad-modal-close');
    closeBtn.addEventListener('click', () => {
      this.hideAdModal();
      if (this._adModalResolve) {
        this._adModalResolve();
        this._adModalResolve = null;
      }
    });
  }

  _bindModeToggle() {
    const btn = document.getElementById('mode-toggle');
    if (btn) {
      btn.addEventListener('click', () => {
        this.callbacks.onModeToggle();
      });
    }
  }

  showAdModal() {
    document.getElementById('ad-modal').classList.remove('hidden');
  }

  hideAdModal() {
    document.getElementById('ad-modal').classList.add('hidden');
  }

  waitForAdDismissal() {
    return new Promise((resolve) => {
      this._adModalResolve = resolve;
    });
  }

  showExportProgress() {
    document.getElementById('export-progress').classList.remove('hidden');
  }

  hideExportProgress() {
    document.getElementById('export-progress').classList.add('hidden');
  }
}
