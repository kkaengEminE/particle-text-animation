import { AdManager } from './AdManager.js';
import { PaymentManager } from './PaymentManager.js';
import { IS_DEV } from './config.js';

/**
 * @typedef {Object} MonetizationState
 * @property {boolean} isPaid
 * @property {import('./PaymentManager.js').LicenseStatus} licenseStatus
 * @property {boolean} adsEnabled
 * @property {boolean} initialized
 */

/** @type {Monetization|null} */
let _instance = null;

export class Monetization extends EventTarget {
  /**
   * Get the singleton instance.
   * @returns {Monetization}
   */
  static getInstance() {
    if (!_instance) {
      _instance = new Monetization();
    }
    return _instance;
  }

  /** @private */
  constructor() {
    super();
    /** @type {AdManager} */
    this.ads = new AdManager();
    /** @type {PaymentManager} */
    this.payments = new PaymentManager();
    /** @type {boolean} */
    this._initialized = false;

    this.payments.addEventListener('statuschange', () => {
      this.dispatchEvent(new CustomEvent('statechange', {
        detail: this.getState()
      }));
    });
  }

  /**
   * Initialize all monetization services.
   * Call once during app startup.
   * @returns {Promise<void>}
   */
  async init() {
    if (this._initialized) return;

    const tasks = [];

    tasks.push(
      this.ads.loadScript()
        .then(() => this.ads.fillSlots())
        .catch((err) => console.warn('[Monetization] Ad init failed:', err))
    );

    tasks.push(
      this.payments.loadSDK()
        .catch((err) => console.warn('[Monetization] Payment init failed:', err))
    );

    await Promise.allSettled(tasks);
    this._initialized = true;

    this.dispatchEvent(new CustomEvent('statechange', {
      detail: this.getState()
    }));

    if (IS_DEV) {
      console.log('[Monetization] Initialized (DEV mode)', this.getState());
    }
  }

  /**
   * Get current monetization state.
   * @returns {MonetizationState}
   */
  getState() {
    return {
      isPaid: this.payments.isPaid,
      licenseStatus: this.payments.status,
      adsEnabled: !this.payments.isPaid,
      initialized: this._initialized,
    };
  }

  /**
   * Show a rewarded ad. Paid users skip entirely.
   * @param {Object} modalCallbacks
   * @param {function} modalCallbacks.showModal
   * @param {function} modalCallbacks.waitForDismissal
   * @returns {Promise<void>}
   */
  async showAd(modalCallbacks) {
    if (this.payments.isPaid) return;
    await this.ads.showRewardedAd(modalCallbacks);
  }

  /**
   * Initiate a one-time purchase.
   * @returns {Promise<boolean>}
   */
  async pay() {
    return this.payments.purchaseOneTime();
  }

  /**
   * Initiate a subscription.
   * @returns {Promise<boolean>}
   */
  async subscribe() {
    return this.payments.subscribe();
  }
}
