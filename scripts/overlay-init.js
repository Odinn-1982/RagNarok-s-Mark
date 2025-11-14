/**
 * RagNarok's Mark - Expanded Overlay System Initialization
 * Integrates the scaling overlay and configuration system
 */

import { OverlayRenderer, EXPANDED_CONDITIONS } from './overlay-renderer.js';
import { ExpandedOverlayConfigForm } from './overlay-config.js';

function buildDefaultEnabledConditions() {
  const defaults = {};
  for (const key of Object.keys(EXPANDED_CONDITIONS)) {
    defaults[key] = true;
  }
  return defaults;
}

function buildDefaultConditionSettings() {
  return foundry.utils.deepClone(EXPANDED_CONDITIONS);
}

function registerOverlaySettings() {
  const defaultEnabled = buildDefaultEnabledConditions();
  const defaultSettings = buildDefaultConditionSettings();

  const registered = game.settings.settings;

  if (!registered.has('ragnaroks-mark.enabledConditions')) {
    game.settings.register('ragnaroks-mark', 'enabledConditions', {
  name: game.i18n.localize('RAGNAROKS_MARK.Settings.EnabledConditions.Name') || 'Enabled Conditions',
      scope: 'world',
      config: false,
      type: Object,
      default: defaultEnabled,
      onChange: () => {
        try { OverlayRenderer.refreshAllTokenOverlays(); } catch (err) { /* ignore */ }
      }
    });
  }

  if (!registered.has('ragnaroks-mark.conditionSettings')) {
    game.settings.register('ragnaroks-mark', 'conditionSettings', {
  name: game.i18n.localize('RAGNAROKS_MARK.Settings.ConditionSettings.Name') || 'Condition Settings',
      scope: 'world',
      config: false,
      type: Object,
      default: defaultSettings,
      onChange: () => {
        try { OverlayRenderer.refreshAllTokenOverlays(); } catch (err) { /* ignore */ }
      }
    });
  }

  if (!registered.has('ragnaroks-mark.debugMode')) {
    game.settings.register('ragnaroks-mark', 'debugMode', {
  name: game.i18n.localize('RAGNAROKS_MARK.Settings.DebugMode.Name') || 'Debug Mode',
  hint: game.i18n.localize('RAGNAROKS_MARK.Settings.DebugMode.Hint') || 'Log overlay diagnostics to the console.',
      scope: 'world',
      config: true,
      type: Boolean,
      default: false,
      onChange: () => {
        try { OverlayRenderer.refreshAllTokenOverlays(); } catch (err) { /* ignore */ }
      }
    });
  }
}

async function ensureExpandedConditionCoverage() {
  if (!game.user?.isGM) return;

  let enabledConditions;
  let conditionSettings;

  try {
    enabledConditions = foundry.utils.deepClone(game.settings.get('ragnaroks-mark', 'enabledConditions') || {});
  } catch (err) {
    enabledConditions = buildDefaultEnabledConditions();
  }

  try {
    conditionSettings = foundry.utils.deepClone(game.settings.get('ragnaroks-mark', 'conditionSettings') || {});
  } catch (err) {
    conditionSettings = buildDefaultConditionSettings();
  }

  let enabledUpdated = false;
  let settingsUpdated = false;

  for (const [conditionKey, defaults] of Object.entries(EXPANDED_CONDITIONS)) {
    if (typeof enabledConditions[conditionKey] === 'undefined') {
      enabledConditions[conditionKey] = true;
      enabledUpdated = true;
    }

    if (!conditionSettings[conditionKey]) {
      conditionSettings[conditionKey] = foundry.utils.deepClone(defaults);
      settingsUpdated = true;
      continue;
    }

    const target = conditionSettings[conditionKey];
    if (target.color === undefined && defaults.color !== undefined) {
      target.color = defaults.color;
      settingsUpdated = true;
    }
    if (target.scale === undefined && defaults.scale !== undefined) {
      target.scale = defaults.scale;
      settingsUpdated = true;
    }
    if (target.glow === undefined && defaults.glow !== undefined) {
      target.glow = defaults.glow;
      settingsUpdated = true;
    }
    if (target.animation === undefined && defaults.animation !== undefined) {
      target.animation = defaults.animation;
      settingsUpdated = true;
    }
  }

  if (enabledUpdated) {
    await game.settings.set('ragnaroks-mark', 'enabledConditions', enabledConditions);
  }

  if (settingsUpdated) {
    await game.settings.set('ragnaroks-mark', 'conditionSettings', conditionSettings);
  }
}

/**
 * Initialize the overlay system
 */
Hooks.once('init', () => {
  console.log('RagNarok\'s Mark | Initializing Expanded Overlay System');

  try {
    registerOverlaySettings();
  } catch (err) {
    console.error('RagNarok\'s Mark | Failed to register overlay settings', err);
  }
  
  // Register global access
  window.RagnaroksMarkOverlay = {
    OverlayRenderer,
    EXPANDED_CONDITIONS,
    ExpandedOverlayConfigForm
  };
  
  // Initialize overlay rendering
  OverlayRenderer.init();
  
  // Register the overlay configuration form as a command when the API is available
  if (game.commands && typeof game.commands.register === 'function') {
    game.commands.register('ragnaroks-mark', 'overlay-config', {
      name: 'Open Overlay Configuration',
      icon: '<i class="fas fa-cog"></i>',
      condition: () => game.user.isGM,
      callback: () => {
        const form = new ExpandedOverlayConfigForm();
        form.render(true);
      }
    });
  } else {
    console.warn('RagNarok\'s Mark | game.commands API unavailable, skipping overlay command registration');
  }
});

/**
 * Setup ready hooks
 */
Hooks.once('ready', async () => {
  console.log('RagNarok\'s Mark | Expanded Overlay System Ready');

  try {
    await ensureExpandedConditionCoverage();
  } catch (err) {
    console.error('RagNarok\'s Mark | Failed to expand condition settings', err);
  }
  
  // Re-fetch settings after potential migration to keep local cache aligned
  let enabledConditions = {};
  let conditionSettings = {};
  try { enabledConditions = game.settings.get('ragnaroks-mark', 'enabledConditions') || {}; } catch (e) { enabledConditions = {}; }
  try { conditionSettings = game.settings.get('ragnaroks-mark', 'conditionSettings') || {}; } catch (e) { conditionSettings = {}; }
  
  // Render overlays on all tokens
  canvas.tokens?.placeables?.forEach(token => {
    OverlayRenderer.renderTokenOverlays(token);
  });

  // Cleanup legacy overlay containers left behind by old versions to avoid
  // duplicated or misplaced overlays.
  canvas.tokens?.placeables?.forEach(token => {
    const legacy = token.children.find(c => c.name === 'ragnaroks-mark-overlay');
    if (legacy) {
      try {
        token.removeChild(legacy);
        legacy.destroy({ children: true });
      } catch (err) {/* ignore */}
    }
  });
});

/**
 * Re-render overlays when tokens are created or updated
 */
Hooks.on('createToken', (tokenDoc) => {
  const token = tokenDoc.object;
  if (token) {
    OverlayRenderer.renderTokenOverlays(token);
  }
});

Hooks.on('updateToken', (tokenDoc, data) => {
  const token = tokenDoc.object;
  if (token) {
    OverlayRenderer.updateTokenOverlays(token);
  }
});

/**
 * Re-render sidebar overlays when actors are updated
 */
Hooks.on('updateActor', (actor) => {
  OverlayRenderer.renderSidebarOverlays();
});

Hooks.on('createActiveEffect', (effect) => {
  const actor = effect.parent;
  if (actor) {
    // Update all tokens for this actor
    canvas.tokens?.placeables?.forEach(token => {
      if (token.actor?.id === actor.id) {
        OverlayRenderer.renderTokenOverlays(token);
      }
    });
    // Update sidebar
    OverlayRenderer.renderSidebarOverlays();
  }
});

Hooks.on('deleteActiveEffect', (effect) => {
  const actor = effect.parent;
  if (actor) {
    // Update all tokens for this actor
    canvas.tokens?.placeables?.forEach(token => {
      if (token.actor?.id === actor.id) {
        OverlayRenderer.renderTokenOverlays(token);
      }
    });
    // Update sidebar
    OverlayRenderer.renderSidebarOverlays();
  }
});

export { OverlayRenderer, EXPANDED_CONDITIONS, ExpandedOverlayConfigForm };
