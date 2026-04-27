import {
  IS_DEV, ADSENSE_CLIENT_ID, AD_SLOTS, MODAL_AD_SLOT, DEV_AD_DELAY_MS
} from './config.js';

export class AdManager {
  constructor() {
    /** @type {boolean} */
    this._scriptLoaded = false;
    /** @type {boolean} */
    this._scriptLoading = false;
  }

  /**
   * Load the Google AdSense script into the page.
   * No-op if already loaded or in dev mode.
   * @returns {Promise<void>}
   */
  async loadScript() {
    if (IS_DEV || this._scriptLoaded || this._scriptLoading) return;
    if (!ADSENSE_CLIENT_ID) {
      console.warn('[AdManager] No VITE_ADSENSE_CLIENT_ID set. Ads disabled.');
      return;
    }

    this._scriptLoading = true;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;
      script.onload = () => {
        this._scriptLoaded = true;
        this._scriptLoading = false;
        resolve();
      };
      script.onerror = (err) => {
        this._scriptLoading = false;
        console.error('[AdManager] Failed to load AdSense script', err);
        reject(err);
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Replace all placeholder ad slots with real AdSense <ins> elements.
   * In dev mode, leaves placeholders intact.
   */
  fillSlots() {
    if (IS_DEV || !this._scriptLoaded) return;

    for (const slot of AD_SLOTS) {
      this._fillSlot(slot);
    }
  }

  /**
   * @param {import('./config.js').AdSlotConfig} slot
   * @private
   */
  _fillSlot(slot) {
    const container = document.getElementById(slot.elementId);
    if (!container || !slot.adSlot) return;

    const placeholder = container.querySelector('.ad-placeholder');
    if (placeholder) placeholder.remove();

    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.dataset.adClient = ADSENSE_CLIENT_ID;
    ins.dataset.adSlot = slot.adSlot;
    ins.dataset.adFormat = 'auto';
    ins.dataset.fullWidthResponsive = 'true';
    container.appendChild(ins);

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error('[AdManager] adsbygoogle push error', e);
    }
  }

  /**
   * Fill the modal ad slot. Called when modal is about to be shown.
   */
  fillModalSlot() {
    if (IS_DEV || !this._scriptLoaded) return;

    const modal = document.getElementById(MODAL_AD_SLOT.elementId);
    if (!modal) return;

    const adContainer = modal.querySelector(MODAL_AD_SLOT.containerSelector);
    if (!adContainer) return;

    // Only fill once
    if (adContainer.querySelector('.adsbygoogle')) return;

    adContainer.textContent = '';

    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'inline-block';
    ins.style.width = '300px';
    ins.style.height = '250px';
    ins.dataset.adClient = ADSENSE_CLIENT_ID;
    ins.dataset.adSlot = MODAL_AD_SLOT.adSlot;
    adContainer.appendChild(ins);

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error('[AdManager] Modal ad push error', e);
    }
  }

  /**
   * Show a rewarded/interstitial ad.
   * Dev mode: 3-second countdown simulation.
   * Production: fills modal with real ad.
   *
   * @param {Object} options
   * @param {function} options.showModal
   * @param {function} options.waitForDismissal
   * @returns {Promise<void>}
   */
  async showRewardedAd({ showModal, waitForDismissal }) {
    if (IS_DEV) {
      return this._simulateRewardedAd({ showModal, waitForDismissal });
    }

    this.fillModalSlot();
    showModal();
    await waitForDismissal();
  }

  /**
   * Dev simulation: show modal with countdown, auto-enable close after delay.
   * @private
   */
  async _simulateRewardedAd({ showModal, waitForDismissal }) {
    const modal = document.getElementById(MODAL_AD_SLOT.elementId);
    const closeBtn = document.getElementById('ad-modal-close');
    const adContainer = modal?.querySelector(MODAL_AD_SLOT.containerSelector);

    if (closeBtn) {
      closeBtn.disabled = true;
    }

    if (adContainer) {
      adContainer.textContent = '[DEV] Ad simulation: 3s...';
    }

    showModal();

    let remaining = Math.ceil(DEV_AD_DELAY_MS / 1000);
    const interval = setInterval(() => {
      remaining--;
      if (adContainer) {
        adContainer.textContent = remaining > 0
          ? `[DEV] Ad simulation: ${remaining}s...`
          : '[DEV] Ad complete!';
      }
    }, 1000);

    await new Promise((resolve) => setTimeout(resolve, DEV_AD_DELAY_MS));

    clearInterval(interval);

    if (closeBtn) {
      closeBtn.disabled = false;
    }

    await waitForDismissal();

    if (adContainer) {
      adContainer.textContent = 'AD 300x250';
    }
  }
}
