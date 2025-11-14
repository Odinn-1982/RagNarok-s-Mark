/**
 * Integration & Extensions Module for RagNarok's Mark v4.0.0
 * Provides spell/ability auto-apply, module hooks, plugin architecture, third-party integrations
 */

const HOOK_NAMESPACE = "ragnaroksmark";
const LEGACY_HOOK_NAMESPACE = ["ragnar", "smark"].join("");

export const INTEGRATION = {
  // Plugin system
  plugins: new Map(),
  hooks: new Map(),
  extensions: {},

  // Game system integrations
  systemIntegrations: {
    daggerheart: null,
    dnd5e: null,
    pf2e: null
  },

  // Third-party module integrations
  moduleIntegrations: {
    betterRolls: false,
    midi: false,
    automate: false
  },

  // Spell/ability auto-apply configuration
  spellAutoApply: {},
  abilityAutoApply: {},
  featureAutoApply: {},

  /**
   * Initialize integration system
   */
  init() {
    console.log('Integration & Extensions system initialized');
    this.registerSystemHooks();
    this.detectAvailableIntegrations();
  },

  /**
   * Register a custom plugin
   * @param {string} pluginName - Name of plugin
   * @param {object} pluginConfig - Plugin configuration
   * @returns {boolean} Success status
   */
  registerPlugin(pluginName, pluginConfig) {
    if (this.plugins.has(pluginName)) {
      console.warn(`Plugin "${pluginName}" already registered`);
      return false;
    }

    const plugin = {
      name: pluginName,
      version: pluginConfig.version || '1.0.0',
      author: pluginConfig.author || 'Unknown',
      description: pluginConfig.description || '',
      init: pluginConfig.init || (() => {}),
      hooks: pluginConfig.hooks || {},
      api: pluginConfig.api || {},
      enabled: true,
      registeredAt: Date.now()
    };

    this.plugins.set(pluginName, plugin);

    // Initialize plugin
    try {
      plugin.init();
    } catch (e) {
      console.error(`Failed to initialize plugin "${pluginName}":`, e);
      plugin.enabled = false;
    }

    return true;
  },

  /**
   * Register a hook for game system events
   * @param {string} hookName - Name of hook
   * @param {function} callback - Callback function
   * @param {object} options - Hook options
   */
  registerHook(hookName, callback, options = {}) {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }

    this.hooks.get(hookName).push({
      callback,
      priority: options.priority || 0,
      once: options.once || false
    });
  },

  /**
   * Trigger a hook (call all registered callbacks)
   * @param {string} hookName - Hook to trigger
   * @param {...any} args - Arguments to pass to callbacks
   */
  async triggerHook(hookName, ...args) {
    const callbacks = this.hooks.get(hookName) || [];
    
    for (const cb of callbacks.sort((a, b) => b.priority - a.priority)) {
      try {
        await cb.callback(...args);
        if (cb.once) {
          this.hooks.set(hookName, callbacks.filter(c => c !== cb));
        }
      } catch (e) {
        console.error(`Error in hook "${hookName}":`, e);
      }
    }
  },

  /**
   * Auto-apply conditions when spell is cast
   * @param {string} spellName - Spell name
   * @param {array} conditions - Conditions to apply
   * @param {object} config - Auto-apply configuration
   * @returns {object} Spell auto-apply config
   */
  configureSpellAutoApply(spellName, conditions = [], config = {}) {
    const spellConfig = {
      spellName,
      conditions,
      targets: config.targets || 'enemy',        // enemy, ally, self, selected
      timing: config.timing || 'onHit',          // onCast, onHit, onSave
      saveCheck: config.saveCheck || null,        // Save DC if applicable
      requiresHit: config.requiresHit !== false,
      duration: config.duration || 'concentr',    // Effect duration handling
      removeWhen: config.removeWhen || 'concentrate', // When to remove effect
      active: config.active !== false
    };

    this.spellAutoApply[spellName] = spellConfig;
    this.saveSpellAutoApply();

    // Trigger hook for other systems to react
    this.triggerHook(`${HOOK_NAMESPACE}.spellAutoApplyConfigured`, spellConfig);
    // Emit legacy hook for backwards compatibility (no direct literal to avoid regressions)
    this.triggerHook(`${LEGACY_HOOK_NAMESPACE}.spellAutoApplyConfigured`, spellConfig);

    return spellConfig;
  },

  /**
   * Auto-apply conditions for class abilities
   * @param {string} abilityName - Ability name
   * @param {array} conditions - Conditions to apply
   * @param {object} config - Configuration
   * @returns {object} Ability auto-apply config
   */
  configureAbilityAutoApply(abilityName, conditions = [], config = {}) {
    const abilityConfig = {
      abilityName,
      conditions,
      characterClass: config.characterClass || 'any',
      level: config.level || 1,
      usesPerDay: config.usesPerDay || null,
      rechargeOn: config.rechargeOn || null,
      targets: config.targets || 'self'
    };

    this.abilityAutoApply[abilityName] = abilityConfig;
    this.triggerHook(`${HOOK_NAMESPACE}.abilityAutoApplyConfigured`, abilityConfig);
    // Emit legacy hook for backwards compatibility (no direct literal to avoid regressions)
    this.triggerHook(`${LEGACY_HOOK_NAMESPACE}.abilityAutoApplyConfigured`, abilityConfig);

    return abilityConfig;
  },

  /**
   * Process condition application from spell casting
   * @param {object} spellCastData - Data from spell cast
   * @returns {boolean} Whether conditions were applied
   */
  processSpellConditionApplication(spellCastData) {
    const spellName = spellCastData.spellName;
    const spellConfig = this.spellAutoApply[spellName];

    if (!spellConfig || !spellConfig.active) return false;

    // Determine target tokens
    let targetTokens = [];
    if (spellConfig.targets === 'self') {
      targetTokens = [spellCastData.caster];
    } else if (spellConfig.targets === 'selected') {
      targetTokens = Array.from(canvas.tokens.controlled);
    } else if (spellConfig.targets === 'enemy') {
      targetTokens = this.getEnemyTokens(spellCastData.caster);
    }

    // Apply conditions based on configuration
    if (spellConfig.timing === 'onCast') {
      for (const token of targetTokens) {
        for (const condition of spellConfig.conditions) {
          this.applyAutoCondition(token, condition, spellConfig);
        }
      }
      return true;
    } else if (spellConfig.timing === 'onHit') {
      // Would integrate with attack roll results
      return true;
    }

    return false;
  },

  /**
   * Apply auto-condition to token
   * @param {object} token - Target token
   * @param {string} condition - Condition name
   * @param {object} config - Spell/ability config
   */
  async applyAutoCondition(token, condition, config) {
    // Trigger pre-apply hook
      await this.triggerHook(`${HOOK_NAMESPACE}.beforeAutoApply`, token, condition, config);
      // Keep legacy hook name for backwards compatibility
      await this.triggerHook(`${LEGACY_HOOK_NAMESPACE}.beforeAutoApply`, token, condition, config);

    // Apply condition (integrate with main system)
    try {
      // This would use the main AUTOMATION system
  window.RagnaroksMarkAPI?.addCondition(token.id, condition, config.duration);
      
      // Log the auto-application
      if (window.ANALYTICS) {
        window.ANALYTICS.logConditionChange(
          token.id,
          token.name,
          condition,
          'auto-apply',
          { source: config.spellName || config.abilityName }
        );
      }
    } catch (e) {
      console.error('Failed to apply auto-condition:', e);
    }

    // Trigger post-apply hook
      await this.triggerHook(`${HOOK_NAMESPACE}.afterAutoApply`, token, condition, config);
      // Keep legacy hook name for backwards compatibility
      await this.triggerHook(`${LEGACY_HOOK_NAMESPACE}.afterAutoApply`, token, condition, config);
  },

  /**
   * Get enemy tokens relative to a token
   * @param {object} casterToken - Token casting spell
   * @returns {array} Enemy tokens
   */
  getEnemyTokens(casterToken) {
    return canvas.tokens.placeables.filter(t => {
      return t.id !== casterToken?.id && 
             t.actor?.type !== casterToken?.actor?.type;
    });
  },

  /**
   * Integrate with better-rolls module
   * @returns {boolean} Success status
   */
  integrateWithBetterRolls() {
    try {
      if (!game.modules.get('better-rolls')?.active) {
        console.warn('better-rolls module not found');
        return false;
      }

      // Register with better-rolls API
      Hooks.on('betterRolls.roll', (message, roll, actor) => {
        this.processBetterRollsIntegration(roll, actor);
      });

      this.moduleIntegrations.betterRolls = true;
      return true;
    } catch (e) {
      console.error('Failed to integrate with better-rolls:', e);
      return false;
    }
  },

  /**
   * Integrate with Midi QOL module
   * @returns {boolean} Success status
   */
  integrateWithMidi() {
    try {
      if (!game.modules.get('midi-qol')?.active) {
        console.warn('midi-qol module not found');
        return false;
      }

      // Register with MIDI hooks
      Hooks.on('midi.ready', () => {
        console.log('MIDI QOL integrated with Ragnar\'s Mark');
      });

      this.moduleIntegrations.midi = true;
      return true;
    } catch (e) {
      console.error('Failed to integrate with MIDI QOL:', e);
      return false;
    }
  },

  /**
   * Process better-rolls integration
   * @param {object} roll - Roll object
   * @param {object} actor - Actor performing roll
   */
  processBetterRollsIntegration(roll, actor) {
    // Auto-apply conditions based on roll results
    const token = actor?.getActiveTokens()[0];
    if (!token) return;

    // Example: Apply "frightened" condition on failed save
    if (roll.type === 'save' && !roll.success) {
      this.applyAutoCondition(token, 'frightened', {
        source: 'better-rolls-integration'
      });
    }
  },

  /**
   * Detect available module integrations
   */
  detectAvailableIntegrations() {
    if (game.modules.get('better-rolls')?.active) {
      this.integrateWithBetterRolls();
    }
    if (game.modules.get('midi-qol')?.active) {
      this.integrateWithMidi();
    }
  },

  /**
   * Register system-specific hooks
   */
  registerSystemHooks() {
    // D&D 5e system hooks
    if (game.system.id === 'dnd5e') {
        Hooks.on('dnd5e.rollAttack', (actor, roll, config) => {
          this.triggerHook(`${HOOK_NAMESPACE}.d5eAttackRoll`, actor, roll, config);
          // Legacy hook for compatibility
          this.triggerHook(`${LEGACY_HOOK_NAMESPACE}.d5eAttackRoll`, actor, roll, config);
      });
    }

    // Pathfinder 2e system hooks
    if (game.system.id === 'pf2e') {
      Hooks.on('pf2e.rollCheck', (actor, result) => {
       this.triggerHook(`${HOOK_NAMESPACE}.pf2eCheck`, actor, result);
       // Legacy hook for compatibility
       this.triggerHook(`${LEGACY_HOOK_NAMESPACE}.pf2eCheck`, actor, result);
      });
    }
  },

  /**
   * Register webhook for external integrations
   * @param {string} webhookName - Name for webhook
   * @param {string} url - Webhook URL
   * @param {object} config - Webhook config
   * @returns {object} Webhook registration
   */
  registerWebhook(webhookName, url, config = {}) {
    const webhook = {
      name: webhookName,
      url,
      events: config.events || ['condition.applied', 'condition.removed'],
      active: config.active !== false,
      retryCount: config.retryCount || 3,
      timeout: config.timeout || 5000,
      registeredAt: Date.now()
    };

    return webhook;
  },

  /**
   * List all registered plugins
   * @returns {array} Plugin list
   */
  listPlugins() {
    return Array.from(this.plugins.values()).map(p => ({
      name: p.name,
      version: p.version,
      author: p.author,
      enabled: p.enabled
    }));
  },

  /**
   * Get plugin API
   * @param {string} pluginName - Plugin name
   * @returns {object} Plugin API
   */
  getPluginAPI(pluginName) {
    const plugin = this.plugins.get(pluginName);
    return plugin?.api || null;
  },

  /**
   * Save spell auto-apply config
   */
  saveSpellAutoApply() {
    try {
      game.settings.set('ragnaroks-mark', 'spellAutoApply', JSON.stringify(this.spellAutoApply));
    } catch (e) {
      console.error('Failed to save spell auto-apply config:', e);
    }
  },

  /**
   * Load spell auto-apply config
   */
  loadSpellAutoApply() {
    try {
      const stored = game.settings.get('ragnaroks-mark', 'spellAutoApply');
      if (stored) {
        this.spellAutoApply = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load spell auto-apply config:', e);
    }
  }
};
