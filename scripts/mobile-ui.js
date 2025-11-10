/**
 * Mobile & Responsive UI Module for Ragnar's Mark v4.0.0
 * Provides mobile UI redesign, touch gestures, responsive layouts, tablet optimization
 */

export const MOBILE_UI = {
  // Device detection
  deviceType: 'desktop',  // desktop, tablet, mobile
  viewportWidth: 0,
  viewportHeight: 0,

  // Touch gesture tracking
  touches: new Map(),
  gestures: {
    swipe: null,
    pinch: null,
    longpress: null
  },

  // Mobile-specific settings
  mobileSettings: {
    enableTouchControls: true,
    enableGestures: true,
    enableVibration: false,
    compactMode: false,
    largerButtons: false,
    highContrast: false
  },

  // Responsive breakpoints
  breakpoints: {
    mobile: 480,
    tablet: 768,
    desktop: 1024,
    wide: 1440
  },

  /**
   * Initialize mobile UI system
   */
  init() {
    console.log('Mobile & Responsive UI system initialized');
    this.detectDevice();
    this.setupResponsiveListeners();
    this.setupTouchEvents();
  },

  /**
   * Detect device type based on viewport
   */
  detectDevice() {
    this.viewportWidth = window.innerWidth;
    this.viewportHeight = window.innerHeight;

    if (this.viewportWidth < this.breakpoints.mobile) {
      this.deviceType = 'mobile';
    } else if (this.viewportWidth < this.breakpoints.desktop) {
      this.deviceType = 'tablet';
    } else {
      this.deviceType = 'desktop';
    }

    console.log(`Device detected: ${this.deviceType} (${this.viewportWidth}x${this.viewportHeight})`);
  },

  /**
   * Setup responsive design listeners
   */
  setupResponsiveListeners() {
    window.addEventListener('resize', () => {
      const oldType = this.deviceType;
      this.detectDevice();

      if (oldType !== this.deviceType) {
        console.log(`Device type changed: ${oldType} -> ${this.deviceType}`);
        this.applyResponsiveLayout();
      }
    });
  },

  /**
   * Apply responsive layout based on device type
   */
  applyResponsiveLayout() {
    const html = document.documentElement;

    // Clear previous device class
    html.classList.remove('device-mobile', 'device-tablet', 'device-desktop');

    // Add new device class
    html.classList.add(`device-${this.deviceType}`);

    // Apply device-specific styles
    if (this.deviceType === 'mobile') {
      this.applyMobileLayout();
    } else if (this.deviceType === 'tablet') {
      this.applyTabletLayout();
    } else {
      this.applyDesktopLayout();
    }
  },

  /**
   * Apply mobile-specific layout
   */
  applyMobileLayout() {
  const style = document.createElement('style');
  style.id = 'ragnaroks-mark-mobile-styles';
    style.innerHTML = `
      .ragnaroks-mark-container {
        max-width: 100%;
        padding: 10px;
      }

      .ragnaroks-mark-button {
        min-height: 44px;
        min-width: 44px;
        font-size: 16px;
        padding: 12px 16px;
      }

      .ragnaroks-mark-form {
        font-size: 16px;
      }

      .ragnaroks-mark-form input,
      .ragnaroks-mark-form select,
      .ragnaroks-mark-form textarea {
        font-size: 16px;
        min-height: 44px;
        padding: 12px;
      }

      .ragnaroks-mark-grid {
        grid-template-columns: 1fr;
        gap: 8px;
      }

      .ragnaroks-mark-condition-item {
        flex-direction: column;
        padding: 12px;
      }

      @media (max-width: 480px) {
        .ragnaroks-mark-overlay-config {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 10000;
          overflow-y: auto;
        }
      }
    `;

    // Remove old mobile styles if exist
  const existing = document.getElementById('ragnaroks-mark-mobile-styles');
  if (existing) existing.remove();

    document.head.appendChild(style);
  },

  /**
   * Apply tablet-specific layout
   */
  applyTabletLayout() {
  const style = document.createElement('style');
  style.id = 'ragnaroks-mark-tablet-styles';
    style.innerHTML = `
      .ragnaroks-mark-container {
        max-width: 100%;
        padding: 15px;
      }

      .ragnaroks-mark-button {
        min-height: 40px;
        font-size: 14px;
        padding: 10px 14px;
      }

      .ragnaroks-mark-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .ragnaroks-mark-form {
        max-width: 600px;
      }

      .ragnaroks-mark-overlay-config {
        width: 90%;
        max-width: 600px;
      }
    `;

  const existing = document.getElementById('ragnaroks-mark-tablet-styles');
  if (existing) existing.remove();

    document.head.appendChild(style);
  },

  /**
   * Apply desktop layout
   */
  applyDesktopLayout() {
  const style = document.createElement('style');
  style.id = 'ragnaroks-mark-desktop-styles';
    style.innerHTML = `
      .ragnaroks-mark-container {
        max-width: 100%;
      }

      .ragnaroks-mark-button {
        min-height: 36px;
        font-size: 12px;
        padding: 8px 12px;
      }

      .ragnaroks-mark-grid {
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
      }

      .ragnaroks-mark-overlay-config {
        width: 500px;
      }
    `;

  const existing = document.getElementById('ragnaroks-mark-desktop-styles');
  if (existing) existing.remove();

    document.head.appendChild(style);
  },

  /**
   * Setup touch event handlers
   */
  setupTouchEvents() {
    document.addEventListener('touchstart', (e) => this.handleTouchStart(e), false);
    document.addEventListener('touchmove', (e) => this.handleTouchMove(e), false);
    document.addEventListener('touchend', (e) => this.handleTouchEnd(e), false);
    document.addEventListener('touchcancel', (e) => this.handleTouchCancel(e), false);
  },

  /**
   * Handle touch start event
   * @param {TouchEvent} event - Touch event
   */
  handleTouchStart(event) {
  if (!event.target.closest('.ragnaroks-mark-container')) return;

    const touches = event.touches;
    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      this.touches.set(touch.identifier, {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now()
      });
    }

    // Long press detection
    if (touches.length === 1) {
      const timeout = setTimeout(() => {
        this.gestures.longpress = {
          x: touches[0].clientX,
          y: touches[0].clientY,
          timestamp: Date.now()
        };
      }, 500);

      event.target.dataset.longpressTimer = timeout;
    }
  },

  /**
   * Handle touch move event
   * @param {TouchEvent} event - Touch event
   */
  handleTouchMove(event) {
  if (!event.target.closest('.ragnaroks-mark-container')) return;

    // Cancel long press on move
    if (event.target.dataset.longpressTimer) {
      clearTimeout(parseInt(event.target.dataset.longpressTimer));
      delete event.target.dataset.longpressTimer;
    }

    // Pinch detection
    if (event.touches.length === 2) {
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];

      const distance = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      );

      if (!this.gestures.pinch) {
        this.gestures.pinch = { startDistance: distance };
      } else {
        this.gestures.pinch.currentDistance = distance;
        const scale = distance / this.gestures.pinch.startDistance;
        this.onPinch(scale);
      }
    }
  },

  /**
   * Handle touch end event
   * @param {TouchEvent} event - Touch event
   */
  handleTouchEnd(event) {
  if (!event.target.closest('.ragnaroks-mark-container')) return;

    const changedTouches = event.changedTouches;

    for (let i = 0; i < changedTouches.length; i++) {
      const touch = changedTouches[i];
      const startTouch = this.touches.get(touch.identifier);

      if (startTouch) {
        // Detect swipe
        const dx = touch.clientX - startTouch.x;
        const dy = touch.clientY - startTouch.y;
        const distance = Math.hypot(dx, dy);
        const time = Date.now() - startTouch.timestamp;
        const velocity = distance / time;

        if (distance > 50 && velocity > 0.5) {
          // Swipe detected
          const direction = this.getSwipeDirection(dx, dy);
          this.onSwipe(direction, dx, dy);
        }

        this.touches.delete(touch.identifier);
      }
    }

    // Reset gestures
    this.gestures.pinch = null;
    this.gestures.longpress = null;
  },

  /**
   * Handle touch cancel event
   * @param {TouchEvent} event - Touch event
   */
  handleTouchCancel(event) {
    this.touches.clear();
    this.gestures = { swipe: null, pinch: null, longpress: null };
  },

  /**
   * Get swipe direction
   * @param {number} dx - X distance
   * @param {number} dy - Y distance
   * @returns {string} Direction (left, right, up, down)
   */
  getSwipeDirection(dx, dy) {
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx > absDy) {
      return dx > 0 ? 'right' : 'left';
    } else {
      return dy > 0 ? 'down' : 'up';
    }
  },

  /**
   * Handle swipe gesture
   * @param {string} direction - Swipe direction
   * @param {number} dx - X distance
   * @param {number} dy - Y distance
   */
  onSwipe(direction, dx, dy) {
    console.log(`Swipe detected: ${direction} (${dx}, ${dy})`);

    // Trigger appropriate action based on direction
    switch (direction) {
      case 'left':
        this.nextCondition();
        break;
      case 'right':
        this.previousCondition();
        break;
      case 'up':
        this.scrollConditionsUp();
        break;
      case 'down':
        this.scrollConditionsDown();
        break;
    }
  },

  /**
   * Handle pinch gesture
   * @param {number} scale - Pinch scale factor
   */
  onPinch(scale) {
    // Adjust overlay size based on pinch
    const currentSize = parseFloat(document.documentElement.style.getPropertyValue('--overlay-size') || '1.0');
    const newSize = Math.max(0.5, Math.min(2.0, currentSize * scale));
    
    document.documentElement.style.setProperty('--overlay-size', newSize.toFixed(2));
  },

  /**
   * Navigate to next condition
   */
  nextCondition() {
    // Implementation would depend on current UI state
    console.log('Next condition');
  },

  /**
   * Navigate to previous condition
   */
  previousCondition() {
    console.log('Previous condition');
  },

  /**
   * Scroll conditions up
   */
  scrollConditionsUp() {
  const container = document.querySelector('.ragnaroks-mark-condition-list');
    if (container) {
      container.scrollBy(0, -50);
    }
  },

  /**
   * Scroll conditions down
   */
  scrollConditionsDown() {
  const container = document.querySelector('.ragnaroks-mark-condition-list');
    if (container) {
      container.scrollBy(0, 50);
    }
  },

  /**
   * Enable vibration feedback (if supported)
   * @param {number} pattern - Vibration pattern in ms
   */
  vibrate(pattern = 100) {
    if (navigator.vibrate && this.mobileSettings.enableVibration) {
      navigator.vibrate(pattern);
    }
  },

  /**
   * Get mobile settings
   * @returns {object} Current mobile settings
   */
  getMobileSettings() {
    return {
      ...this.mobileSettings,
      deviceType: this.deviceType,
      viewportSize: `${this.viewportWidth}x${this.viewportHeight}`
    };
  },

  /**
   * Apply mobile setting
   * @param {string} setting - Setting name
   * @param {any} value - Setting value
   */
  setSetting(setting, value) {
    if (setting in this.mobileSettings) {
      this.mobileSettings[setting] = value;
      this.applyResponsiveLayout();
    }
  }
};
