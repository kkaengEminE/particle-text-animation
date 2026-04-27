import {
  IS_DEV, LEMON_SQUEEZY_STORE_ID, LEMON_SQUEEZY_PRODUCT_ID,
  LEMON_SQUEEZY_SUBSCRIPTION_VARIANT_ID
} from './config.js';

/**
 * @typedef {'free' | 'purchased' | 'subscribed'} LicenseStatus
 */

const STORAGE_KEY = 'monetization_license';

export class PaymentManager extends EventTarget {
  constructor() {
    super();
    /** @type {LicenseStatus} */
    this._status = this._loadStatus();
    /** @type {boolean} */
    this._sdkLoaded = false;
  }

  /** @returns {LicenseStatus} */
  get status() {
    return this._status;
  }

  /** @returns {boolean} */
  get isPaid() {
    return this._status === 'purchased' || this._status === 'subscribed';
  }

  /**
   * Load the Lemon Squeezy JS SDK (lemon.js).
   * @returns {Promise<void>}
   */
  async loadSDK() {
    if (this._sdkLoaded) return;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://app.lemonsqueezy.com/js/lemon.js';
      script.defer = true;
      script.onload = () => {
        this._sdkLoaded = true;
        if (window.createLemonSqueezy) {
          window.createLemonSqueezy();
        }
        resolve();
      };
      script.onerror = (err) => {
        console.error('[PaymentManager] Failed to load Lemon Squeezy SDK', err);
        reject(err);
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Open checkout for a one-time purchase.
   * @returns {Promise<boolean>} true if purchase completed
   */
  async purchaseOneTime() {
    if (IS_DEV) return this._simulatePurchase('purchased');
    if (!LEMON_SQUEEZY_PRODUCT_ID || !LEMON_SQUEEZY_STORE_ID) {
      console.error('[PaymentManager] Missing Lemon Squeezy product/store config');
      return false;
    }

    const url = `https://${LEMON_SQUEEZY_STORE_ID}.lemonsqueezy.com/buy/${LEMON_SQUEEZY_PRODUCT_ID}?embed=1`;
    return this._openCheckout(url, 'purchased');
  }

  /**
   * Open checkout for a subscription.
   * @returns {Promise<boolean>} true if subscription activated
   */
  async subscribe() {
    if (IS_DEV) return this._simulatePurchase('subscribed');
    if (!LEMON_SQUEEZY_SUBSCRIPTION_VARIANT_ID || !LEMON_SQUEEZY_STORE_ID) {
      console.error('[PaymentManager] Missing Lemon Squeezy subscription config');
      return false;
    }

    const url = `https://${LEMON_SQUEEZY_STORE_ID}.lemonsqueezy.com/buy/${LEMON_SQUEEZY_SUBSCRIPTION_VARIANT_ID}?embed=1`;
    return this._openCheckout(url, 'subscribed');
  }

  /**
   * Open the Lemon Squeezy overlay checkout.
   * @param {string} checkoutUrl
   * @param {LicenseStatus} successStatus
   * @returns {Promise<boolean>}
   * @private
   */
  _openCheckout(checkoutUrl, successStatus) {
    return new Promise((resolve) => {
      const handler = (event) => {
        if (event.data && event.data.event === 'Checkout.Success') {
          window.removeEventListener('message', handler);
          this._setStatus(successStatus);
          resolve(true);
        }
      };
      window.addEventListener('message', handler);

      if (window.LemonSqueezy) {
        window.LemonSqueezy.Url.Open(checkoutUrl);
      } else {
        window.open(checkoutUrl, '_blank');
        resolve(false);
      }

      // Timeout after 10 minutes
      setTimeout(() => {
        window.removeEventListener('message', handler);
        resolve(false);
      }, 600000);
    });
  }

  /**
   * Dev mode: simulate purchase with immediate success.
   * @param {LicenseStatus} status
   * @returns {Promise<boolean>}
   * @private
   */
  async _simulatePurchase(status) {
    console.log(`[PaymentManager] DEV: Simulating ${status}`);
    await new Promise((r) => setTimeout(r, 500));
    this._setStatus(status);
    return true;
  }

  /**
   * Update license status and persist to localStorage.
   * @param {LicenseStatus} status
   * @private
   */
  _setStatus(status) {
    this._status = status;
    try {
      localStorage.setItem(STORAGE_KEY, status);
    } catch (e) {
      // localStorage may be unavailable
    }
    this.dispatchEvent(new CustomEvent('statuschange', { detail: { status } }));
  }

  /**
   * Load persisted status from localStorage.
   * @returns {LicenseStatus}
   * @private
   */
  _loadStatus() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'purchased' || saved === 'subscribed') return saved;
    } catch (e) {
      // Ignore
    }
    return 'free';
  }

  /**
   * Reset status to free (useful for testing).
   */
  resetStatus() {
    this._setStatus('free');
  }
}
