/**
 * Advanced Customization Module for Ragnar's Mark v4.0.0
 * Provides drag-drop condition builder, custom effect creation, animation wizard, profile system
 */

export const CUSTOMIZATION = {
  // Customization data
  profiles: {},           // Saved customization profiles
  customEffects: {},      // User-defined custom effects
  animationWizards: {},   // Saved animation sequences
  filterPresets: {},      // Saved filter configurations

  /**
   * Initialize customization system
   */
  init() {
    console.log('Advanced Customization system initialized');
    this.loadProfiles();
  },

  /**
   * Create new customization profile
   * @param {string} profileName - Name for the profile
   * @param {object} settings - Settings to include in profile
   * @returns {object} Created profile
   */
  createProfile(profileName, settings = {}) {
    if (this.profiles[profileName]) {
      console.warn(`Profile "${profileName}" already exists`);
      return this.profiles[profileName];
    }

    this.profiles[profileName] = {
      name: profileName,
      createdAt: Date.now(),
      lastModified: Date.now(),
      settings: {
        overlaySize: settings.overlaySize || 1.0,
        overlayOpacity: settings.overlayOpacity || 0.8,
        overlayPosition: settings.overlayPosition || 'center',
        stackingMode: settings.stackingMode || 'circular',
        animationType: settings.animationType || 'pulse',
        animationSpeed: settings.animationSpeed || 'normal',
        colorScheme: settings.colorScheme || {},
        enabledConditions: settings.enabledConditions || [],
        customConditionColors: settings.customConditionColors || {}
      }
    };

    this.saveProfiles();
    return this.profiles[profileName];
  },

  /**
   * Apply a customization profile
   * @param {string} profileName - Profile name to apply
   * @returns {boolean} Success status
   */
  applyProfile(profileName) {
    const profile = this.profiles[profileName];
    if (!profile) {
      console.error(`Profile "${profileName}" not found`);
      return false;
    }

    try {
      // Apply profile settings
      for (const [key, value] of Object.entries(profile.settings)) {
        game.settings.set('ragnars-mark', key, value);
      }
      return true;
    } catch (e) {
      console.error('Failed to apply profile:', e);
      return false;
    }
  },

  /**
   * Create custom effect definition
   * @param {string} effectName - Name of custom effect
   * @param {object} config - Effect configuration
   * @returns {object} Custom effect definition
   */
  createCustomEffect(effectName, config = {}) {
    const customEffect = {
      name: effectName,
      createdAt: Date.now(),
      lastModified: Date.now(),
      color: config.color || '#ff0000',
      glowIntensity: config.glowIntensity || 1.0,
      animationType: config.animationType || 'pulse',
      animationSpeed: config.animationSpeed || 'normal',
      priority: config.priority || 5,
      group: config.group || 'Custom',
      icon: config.icon || null,
      description: config.description || '',
      particleEffect: config.particleEffect || 'default',
      soundEffect: config.soundEffect || null,
      duration: config.duration || null,
      stacking: config.stacking || 'replace'
    };

    this.customEffects[effectName] = customEffect;
    this.saveCustomEffects();
    return customEffect;
  },

  /**
   * Animation Wizard - Guide user through creating animation sequences
   * @param {string} sequenceName - Name for the animation sequence
   * @param {array} steps - Array of animation steps
   * @returns {object} Created animation wizard
   */
  createAnimationWizard(sequenceName, steps = []) {
    const wizard = {
      name: sequenceName,
      createdAt: Date.now(),
      lastModified: Date.now(),
      steps: steps.map((step, idx) => ({
        order: idx,
        type: step.type || 'pulse',           // pulse, glow, bounce, fade, spin, scale
        duration: step.duration || 500,
        intensity: step.intensity || 1.0,
        color: step.color || null,
        easing: step.easing || 'linear',     // linear, easeIn, easeOut, easeInOut
        delay: step.delay || 0
      })),
      loop: steps.loop !== false,
      loopCount: steps.loopCount || -1      // -1 for infinite
    };

    this.animationWizards[sequenceName] = wizard;
    return wizard;
  },

  /**
   * Build animation visually (step-by-step helper)
   * @param {string} wizardName - Name for new wizard
   * @returns {object} Animation wizard builder interface
   */
  startAnimationBuilder(wizardName) {
    return {
      name: wizardName,
      steps: [],
      
      addStep(type, config = {}) {
        this.steps.push({
          type,
          duration: config.duration || 500,
          intensity: config.intensity || 1.0,
          color: config.color || null,
          easing: config.easing || 'linear',
          delay: config.delay || 0
        });
        return this;
      },

      removeStep(index) {
        this.steps.splice(index, 1);
        return this;
      },

      preview() {
        // Would show animation preview in UI
        return {
          name: this.name,
          stepCount: this.steps.length,
          totalDuration: this.steps.reduce((sum, s) => sum + s.duration, 0)
        };
      },

      save() {
        return CUSTOMIZATION.createAnimationWizard(this.name, this.steps);
      }
    };
  },

  /**
   * Create filter preset for quick condition filtering
   * @param {string} presetName - Name for filter preset
   * @param {object} filterConfig - Filter configuration
   * @returns {object} Filter preset
   */
  createFilterPreset(presetName, filterConfig = {}) {
    const preset = {
      name: presetName,
      createdAt: Date.now(),
      lastModified: Date.now(),
      filters: {
        groups: filterConfig.groups || [],           // Include specific condition groups
        excludeGroups: filterConfig.excludeGroups || [],
        conditions: filterConfig.conditions || [],    // Include specific conditions
        excludeConditions: filterConfig.excludeConditions || [],
        priority: filterConfig.priority || { min: 0, max: 13 },
        animation: filterConfig.animation || [],      // Filter by animation type
        color: filterConfig.color || null,            // Filter by color range
        tags: filterConfig.tags || [],                // User-defined tags
        sourceType: filterConfig.sourceType || 'all'  // actor, token, both
      }
    };

    this.filterPresets[presetName] = preset;
    return preset;
  },

  /**
   * Apply filter preset
   * @param {string} presetName - Filter preset name
   * @returns {array} Filtered conditions
   */
  applyFilterPreset(presetName) {
    const preset = this.filterPresets[presetName];
    if (!preset) {
      console.error(`Filter preset "${presetName}" not found`);
      return [];
    }

    // This would integrate with main condition system
    // For now return preset info
    return {
      preset: presetName,
      filters: preset.filters,
      appliedAt: Date.now()
    };
  },

  /**
   * Drag-and-drop condition reordering helper
   * @param {array} conditions - Array of condition names
   * @param {number} fromIndex - Source index
   * @param {number} toIndex - Destination index
   * @returns {array} Reordered conditions
   */
  reorderConditions(conditions, fromIndex, toIndex) {
    const reordered = [...conditions];
    const [removed] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, removed);
    return reordered;
  },

  /**
   * Export customization profile as JSON
   * @param {string} profileName - Profile to export
   * @returns {string} JSON string
   */
  exportProfile(profileName) {
    const profile = this.profiles[profileName];
    if (!profile) return null;
    return JSON.stringify(profile, null, 2);
  },

  /**
   * Import customization profile from JSON
   * @param {string} jsonString - JSON profile data
   * @param {string} newName - Optional new name for imported profile
   * @returns {object} Imported profile
   */
  importProfile(jsonString, newName = null) {
    try {
      const profile = JSON.parse(jsonString);
      const name = newName || profile.name || 'Imported Profile';
      this.profiles[name] = profile;
      this.saveProfiles();
      return profile;
    } catch (e) {
      console.error('Failed to import profile:', e);
      return null;
    }
  },

  /**
   * List all available profiles
   * @returns {array} Array of profile names and metadata
   */
  listProfiles() {
    return Object.values(this.profiles).map(p => ({
      name: p.name,
      createdAt: p.createdAt,
      lastModified: p.lastModified,
      settingCount: Object.keys(p.settings).length
    }));
  },

  /**
   * List all custom effects
   * @returns {array} Array of custom effect names
   */
  listCustomEffects() {
    return Object.values(this.customEffects).map(e => ({
      name: e.name,
      color: e.color,
      animationType: e.animationType,
      group: e.group
    }));
  },

  /**
   * Delete profile
   * @param {string} profileName - Profile to delete
   * @returns {boolean} Success status
   */
  deleteProfile(profileName) {
    if (delete this.profiles[profileName]) {
      this.saveProfiles();
      return true;
    }
    return false;
  },

  /**
   * Save profiles to world settings
   */
  saveProfiles() {
    try {
      game.settings.set('ragnars-mark', 'customizationProfiles', JSON.stringify(this.profiles));
    } catch (e) {
      console.error('Failed to save customization profiles:', e);
    }
  },

  /**
   * Load profiles from world settings
   */
  loadProfiles() {
    try {
      const stored = game.settings.get('ragnars-mark', 'customizationProfiles');
      if (stored) {
        this.profiles = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load customization profiles:', e);
    }
  },

  /**
   * Save custom effects to world settings
   */
  saveCustomEffects() {
    try {
      game.settings.set('ragnars-mark', 'customEffects', JSON.stringify(this.customEffects));
    } catch (e) {
      console.error('Failed to save custom effects:', e);
    }
  },

  /**
   * Load custom effects from world settings
   */
  loadCustomEffects() {
    try {
      const stored = game.settings.get('ragnars-mark', 'customEffects');
      if (stored) {
        this.customEffects = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load custom effects:', e);
    }
  }
};
