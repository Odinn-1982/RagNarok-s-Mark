import { OverlayRenderer, EXPANDED_CONDITIONS } from './overlay-renderer.js';

/**
 * RagNarok's Mark - Expanded Overlay Configuration
 * Allows customization of all conditions and their overlay appearance
 */

class ExpandedOverlayConfigForm extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: 'ragnaroks-mark-overlay-config',
      title: 'RagNarok\'s Mark - Overlay Customization',
      template: 'modules/ragnaroks-mark/templates/overlay-config.hbs',
      width: 700,
      height: 'auto',
      closeOnSubmit: false,
      resizable: true,
      scrollY: ['.condition-list']
    });
  }

  /**
   * Get form data
   */
  getData() {
    const enabledConditions = game.settings.get('ragnaroks-mark', 'enabledConditions') || {};
    const conditionSettings = game.settings.get('ragnaroks-mark', 'conditionSettings') || {};

    const collectedKeys = new Set();

    const addKey = (key) => {
      if (typeof key !== 'string') return;
      const trimmed = key.toLowerCase().trim();
      if (trimmed) collectedKeys.add(trimmed);
    };

    Object.keys(EXPANDED_CONDITIONS || {}).forEach(addKey);
    Object.keys(enabledConditions || {}).forEach(addKey);
    Object.keys(conditionSettings || {}).forEach(addKey);

    // Collect any additional status effect entries from the system
    const statusEffects = CONFIG?.statusEffects;
    let stack = [];
    if (Array.isArray(statusEffects)) {
      stack = statusEffects.flat(Infinity);
    } else if (statusEffects && typeof statusEffects === 'object') {
      stack = Object.values(statusEffects).flat ? Object.values(statusEffects).flat(Infinity) : Object.values(statusEffects);
    }
    stack.forEach(effect => {
      if (!effect) return;
      addKey(effect.id || effect.statusId || effect.name || effect.label);
    });

    // Gather any effect names from active actors to ensure custom conditions appear
    game.actors?.forEach(actor => {
      actor?.effects?.forEach(effect => {
        addKey(effect.name || effect.label);
        if (effect.statuses instanceof Set) {
          effect.statuses.forEach(addKey);
        }
        addKey(effect.flags?.core?.statusId);
      });
    });

    const conditions = Array.from(collectedKeys)
      .sort((a, b) => a.localeCompare(b))
      .map((key) => {
        const defaults = EXPANDED_CONDITIONS[key] || { color: '#FFFFFF', scale: 1.0, glow: 1.0, animation: 'none' };
        const settings = conditionSettings[key] || {};
        const enabled = enabledConditions[key];
        const scaleValue = settings.scale ?? defaults.scale ?? 1.0;
        const glowValue = settings.glow ?? defaults.glow ?? 1.0;

        return {
          key,
          name: key.charAt(0).toUpperCase() + key.slice(1),
          enabled: Boolean(enabled),
          color: settings.color || defaults.color,
          scale: typeof scaleValue === 'number' ? scaleValue : parseFloat(scaleValue) || 1.0,
          glow: typeof glowValue === 'number' ? glowValue : parseFloat(glowValue) || 1.0,
          animation: settings.animation || defaults.animation || 'none'
        };
      });

    return {
      conditions,
      animationOptions: [
        { value: 'none', label: 'None' },
        { value: 'pulse', label: 'Pulse' },
        { value: 'fade', label: 'Fade' },
        { value: 'glow', label: 'Glow' }
      ]
    };
  }

  /**
   * Update settings when form is submitted
   */
  async _updateObject(event, formData) {
    const existingEnabled = foundry.utils.deepClone(game.settings.get('ragnaroks-mark', 'enabledConditions') || {});
    const existingSettings = foundry.utils.deepClone(game.settings.get('ragnaroks-mark', 'conditionSettings') || {});

    const allKeys = new Set([
      ...Object.keys(EXPANDED_CONDITIONS || {}),
      ...Object.keys(existingEnabled || {}),
      ...Object.keys(existingSettings || {})
    ]);

    const enabledConditions = {};
    const conditionSettings = {};

    allKeys.forEach(key => {
      enabledConditions[key] = Boolean(existingEnabled[key]);
      conditionSettings[key] = foundry.utils.deepClone(existingSettings[key] || {});
    });

    for (const [key, value] of Object.entries(formData)) {
      if (key.startsWith('condition-enabled-')) {
        const conditionKey = key.replace('condition-enabled-', '');
  enabledConditions[conditionKey] = value === true || value === 'on';
      } else if (key.startsWith('condition-color-')) {
        const conditionKey = key.replace('condition-color-', '');
        conditionSettings[conditionKey] = conditionSettings[conditionKey] || {};
        conditionSettings[conditionKey].color = value;
      } else if (key.startsWith('condition-scale-')) {
        const conditionKey = key.replace('condition-scale-', '');
        conditionSettings[conditionKey] = conditionSettings[conditionKey] || {};
        conditionSettings[conditionKey].scale = parseFloat(value) || 1.0;
      } else if (key.startsWith('condition-glow-')) {
        const conditionKey = key.replace('condition-glow-', '');
        conditionSettings[conditionKey] = conditionSettings[conditionKey] || {};
        conditionSettings[conditionKey].glow = parseFloat(value) || 1.0;
      } else if (key.startsWith('condition-animation-')) {
        const conditionKey = key.replace('condition-animation-', '');
        conditionSettings[conditionKey] = conditionSettings[conditionKey] || {};
        conditionSettings[conditionKey].animation = value;
      }
    }

    await game.settings.set('ragnaroks-mark', 'enabledConditions', enabledConditions);
    await game.settings.set('ragnaroks-mark', 'conditionSettings', conditionSettings);
    try {
      OverlayRenderer.refreshAllTokenOverlays();
    } catch (err) {
      console.warn('RagNarok\'s Mark | Overlay refresh failed', err);
    }
    
    ui.notifications.info('RagNarok\'s Mark: Overlay settings updated');
  }

  /**
   * Activate listeners
   */
  activateListeners(html) {
    html = $(html);
    super.activateListeners(html);

    // Enable/disable all buttons
    html.find('.btn-enable-all').on('click', () => {
      html.find('input[name^="condition-enabled-"]').each((i, el) => {
        el.checked = true;
      });
    });

    html.find('.btn-disable-all').on('click', () => {
      html.find('input[name^="condition-enabled-"]').each((i, el) => {
        el.checked = false;
      });
    });

    // Reset to defaults
    html.find('.btn-reset-defaults').on('click', async () => {
      if (confirm('Reset all overlays to default settings?')) {
        location.reload();
      }
    });

    // Live update value displays
    html.find('.scale-slider').on('input', (event) => {
      const value = event.currentTarget.value;
      $(event.currentTarget).closest('.control-group').find('.value-display').text(value);
    });

    html.find('.glow-slider').on('input', (event) => {
      const value = event.currentTarget.value;
      $(event.currentTarget).closest('.control-group').find('.value-display').text(value);
    });

    html.find('.color-picker').on('input', (event) => {
      const value = event.currentTarget.value;
      $(event.currentTarget).siblings('.color-preview').css('background-color', value);
    });
  }
}

export { ExpandedOverlayConfigForm };
