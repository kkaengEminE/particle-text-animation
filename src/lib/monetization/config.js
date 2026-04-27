/**
 * Monetization SDK — Configuration & Constants
 * Centralizes all environment variable access and ad slot definitions.
 *
 * @typedef {Object} AdSlotConfig
 * @property {string} elementId - DOM element ID
 * @property {string} format - AdSense ad format ('horizontal', 'vertical', 'rectangle')
 * @property {string} adSlot - AdSense ad slot ID from publisher dashboard
 */

/** @type {boolean} */
export const IS_DEV = import.meta.env.DEV;

// --- Google AdSense ---
/** @type {string} */
export const ADSENSE_CLIENT_ID = import.meta.env.VITE_ADSENSE_CLIENT_ID || '';
export const ADSENSE_SLOT_HEADER = import.meta.env.VITE_ADSENSE_SLOT_HEADER || '';
export const ADSENSE_SLOT_SIDEBAR_LEFT = import.meta.env.VITE_ADSENSE_SLOT_SIDEBAR_LEFT || '';
export const ADSENSE_SLOT_SIDEBAR_RIGHT = import.meta.env.VITE_ADSENSE_SLOT_SIDEBAR_RIGHT || '';
export const ADSENSE_SLOT_BOTTOM = import.meta.env.VITE_ADSENSE_SLOT_BOTTOM || '';
export const ADSENSE_SLOT_MODAL = import.meta.env.VITE_ADSENSE_SLOT_MODAL || '';

// --- Lemon Squeezy ---
export const LEMON_SQUEEZY_STORE_ID = import.meta.env.VITE_LEMON_SQUEEZY_STORE_ID || '';
export const LEMON_SQUEEZY_PRODUCT_ID = import.meta.env.VITE_LEMON_SQUEEZY_PRODUCT_ID || '';
export const LEMON_SQUEEZY_SUBSCRIPTION_VARIANT_ID = import.meta.env.VITE_LEMON_SQUEEZY_SUBSCRIPTION_VARIANT_ID || '';

/** Delay in ms for simulated ad in dev mode */
export const DEV_AD_DELAY_MS = 3000;

/** @type {AdSlotConfig[]} */
export const AD_SLOTS = [
  { elementId: 'ad-header', format: 'horizontal', adSlot: ADSENSE_SLOT_HEADER },
  { elementId: 'ad-left', format: 'vertical', adSlot: ADSENSE_SLOT_SIDEBAR_LEFT },
  { elementId: 'ad-right', format: 'vertical', adSlot: ADSENSE_SLOT_SIDEBAR_RIGHT },
  { elementId: 'ad-bottom', format: 'horizontal', adSlot: ADSENSE_SLOT_BOTTOM },
];

/** Modal ad slot (handled separately due to show/hide lifecycle) */
export const MODAL_AD_SLOT = {
  elementId: 'ad-modal',
  containerSelector: '.modal-ad',
  format: 'rectangle',
  adSlot: ADSENSE_SLOT_MODAL,
};
