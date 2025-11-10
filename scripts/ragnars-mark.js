/* LEGACY FILE - CONTENT REMOVED
 * This file was a legacy copy and has been archived. Its original content
 * was preserved in `legacy-backups/scripts/` for recovery. The canonical
 * module entry is `scripts/ragnaroks-mark.js` (listed in module.json).
 *
 * Keeping this placeholder prevents accidental loading or confusion.
 */


// Old ID used by prior releases — we'll migrate settings from this id to the new one
const OLD_MODULE_ID = "ragnars-mark";
// Canonical module id (matches module.json)
const MODULE_ID = "ragnaroks-mark";
const MODULE_VERSION = "4.0.0";

// Default Daggerheart conditions that should show large overlays
const DEFAULT_CONDITIONS = [
  "vulnerable",
  "hidden",
  "restrained",
  "unconscious",
  "defeated",
  "dead"
];

// Default per-condition settings
const DEFAULT_CONDITION_SETTINGS = {
  vulnerable: { color: "#FF6B6B", glowIntensity: 1.0, animationType: "pulse" },
  hidden: { color: "#4A90E2", glowIntensity: 0.8, animationType: "fade" },
  restrained: { color: "#FFD700", glowIntensity: 0.9, animationType: "none" },
  unconscious: { color: "#808080", glowIntensity: 0.7, animationType: "fade" },
  defeated: { color: "#8B4513", glowIntensity: 1.0, animationType: "pulse" },
  dead: { color: "#000000", glowIntensity: 0.5, animationType: "fade" }
};

/**
 * Migrate settings from the old module id to the new module id (one-time).
 * This runs during the ready hook after settings have been registered under the new id.
 */
async function migrateSettingsFromOldId() {
  try {
    if (!game || !game.settings) return;
    if (OLD_MODULE_ID === MODULE_ID) return;

    // Detect whether there are saved settings under the old id by checking moduleVersion
    let oldVersion;
    try {
      oldVersion = game.settings.get(OLD_MODULE_ID, "moduleVersion");
    } catch (e) {
      oldVersion = undefined;
    }
    if (oldVersion === undefined) return; // nothing to migrate

    console.log(`RagNarok's Mark | Detected settings under '${OLD_MODULE_ID}', migrating to '${MODULE_ID}'`);

    const KEYS_TO_MIGRATE = [
      "moduleVersion",
      "enabledConditions",
      "overlaySize",
      "overlayOpacity",
      "overlayPosition",
      "stackingMode",
      "globalAnimation",
      "conditionSettings",
      "matchingMode",
      "showDuration",
      "animationSpeed",
      "enableBorders",
      "enableBadges",
      "enableTooltips",
      "enableShake",
      "maxOverlays",
      "usePriority",
      "enableSounds",
      "darkMode",
      "systemPreset",
      "conditionAliases",
      "iconOverrides",
      "sceneSettings",
      "conditionGroups",
      "debugMode",
      "trackEffectDuration",
      "durationColorCoding",
      "effectSourceFilter",
      "enableParticleEffects",
      "visualTheme",
      "enableAutomation",
      "enableAnalytics",
      "playerConditionVisibility",
      "gmOnlyConditions",
      "excludeList",
      "compoundConditions",
      "accessibilityMode",
      "enableFilterButtons",
      "animationSequences",
      "enableAISuggestions",
      "enableCommunitySharing",
      "enableSpellAutoApply",
      "mobileOptimization",
      "performanceLevel",
      "enableQuickAdd",
      "enableUndoRedo",
      "enablePluginSystem",
      "aiLearningData",
      "customizationProfiles",
      "userLibrary",
      "communityLibraryCache",
      "spellAutoApply",
      "advancedAnalyticsReports",
      "favoriteConditions",
      "conditionHistory"
    ];

    for (const key of KEYS_TO_MIGRATE) {
      try {
        const oldVal = game.settings.get(OLD_MODULE_ID, key);
        // Only set if oldVal is defined (could be null/false which are valid values)
        if (typeof oldVal !== "undefined") {
          // Only overwrite new key if it is not already set to a meaningful value
          try {
            const newVal = game.settings.get(MODULE_ID, key);
            const shouldOverwrite = (typeof newVal === "undefined" || newVal === null);
            if (shouldOverwrite) {
              await game.settings.set(MODULE_ID, key, oldVal);
            }
          } catch (e) {
            // If reading newVal fails, attempt to write anyway
            await game.settings.set(MODULE_ID, key, oldVal);
          }
        }
      } catch (err) {
        // Individual key migration failure should not stop the rest
        console.warn(`RagNarok's Mark | Failed to migrate setting ${key}:`, err);
      }
    }

    // Mark migration complete
    try { await game.settings.set(MODULE_ID, "__migrated_from_ragnars_mark", true); } catch (e) {/*ignore*/}
    ui.notifications.info("RagNarok's Mark: Settings migrated from previous installation.");
  } catch (error) {
    console.error("RagNarok's Mark | Migration from old id failed:", error);
  }
}

// Module state cache
let settingsCache = {};
let updateDebounceTimers = {};

/**
 * Error logging with context
 */
function logError(context, error) {
  console.error(`[RagNarok's Mark] ${context}:`, error);
  if (error.stack) console.error(error.stack);
}

/**
 * Handle migration for version updates
 */
async function handleMigration() {
  try {
    const savedVersion = game.settings.get(MODULE_ID, "moduleVersion") || "1.0.0";
    
    if (savedVersion !== MODULE_VERSION) {
  console.log(`RagNarok's Mark | Migrating from ${savedVersion} to ${MODULE_VERSION}`);
      
      // Add migration logic here as needed
      // Example: if migrating from 1.0.0 to 1.1.0, add new settings
      
      await game.settings.set(MODULE_ID, "moduleVersion", MODULE_VERSION);
      // Attempt to migrate settings from older module id if present
      try {
        await migrateSettingsFromOldId();
      } catch (mErr) {
        console.warn("RagNarok's Mark | Migration helper failed:", mErr);
      }
  ui.notifications.info(`RagNarok's Mark updated to v${MODULE_VERSION}`);
    }
  } catch (error) {
    logError("Migration failed", error);
  }
}

/**
 * Initialize module settings
 */
Hooks.once("init", () => {
  console.log("RagNarok's Mark | Initializing module");

  // Register module version setting for migrations
  game.settings.register(MODULE_ID, "moduleVersion", {
    scope: "world",
    config: false,
    type: String,
    default: MODULE_VERSION
  });

  // Register setting for which conditions show as large overlays
  game.settings.register(MODULE_ID, "enabledConditions", {
    name: "RAGNARS_MARK.Settings.EnabledConditions.Name",
    hint: "RAGNARS_MARK.Settings.EnabledConditions.Hint",
    scope: "world",
    config: false,
    type: Object,
    default: DEFAULT_CONDITIONS.reduce((acc, condition) => {
      acc[condition] = true;
      return acc;
    }, {}),
    onChange: () => {
      invalidateCache();
      refreshAllTokenOverlays();
    }
  });

  // Register setting for overlay size
  game.settings.register(MODULE_ID, "overlaySize", {
    name: "RAGNARS_MARK.Settings.OverlaySize.Name",
    hint: "RAGNARS_MARK.Settings.OverlaySize.Hint",
    scope: "world",
    config: true,
    type: Number,
    range: { min: 0.5, max: 2.0, step: 0.1 },
    default: 1.0,
    onChange: () => {
      invalidateCache();
      refreshAllTokenOverlays();
    }
  });

  // Register setting for overlay opacity
  game.settings.register(MODULE_ID, "overlayOpacity", {
    name: "RAGNARS_MARK.Settings.OverlayOpacity.Name",
    hint: "RAGNARS_MARK.Settings.OverlayOpacity.Hint",
    scope: "world",
    config: true,
    type: Number,
    range: { min: 0.1, max: 1.0, step: 0.1 },
    default: 0.8,
    onChange: () => {
      invalidateCache();
      refreshAllTokenOverlays();
    }
  });

  // Overlay position setting
  game.settings.register(MODULE_ID, "overlayPosition", {
    name: "RAGNARS_MARK.Settings.OverlayPosition.Name",
    hint: "RAGNARS_MARK.Settings.OverlayPosition.Hint",
    scope: "world",
    config: true,
    type: String,
    choices: {
      center: "Center",
      topLeft: "Top Left",
      topRight: "Top Right",
      bottomLeft: "Bottom Left",
      bottomRight: "Bottom Right"
    },
    default: "center",
    onChange: () => {
      invalidateCache();
      refreshAllTokenOverlays();
    }
  });

  // Stacking mode for multiple conditions
  game.settings.register(MODULE_ID, "stackingMode", {
    name: "RAGNARS_MARK.Settings.StackingMode.Name",
    hint: "RAGNARS_MARK.Settings.StackingMode.Hint",
    scope: "world",
    config: true,
    type: String,
    choices: {
      overlapping: "Overlapping (Center)",
      stack: "Stacked (Grid)",
      circular: "Circular (Around Token)"
    },
    default: "circular",
    onChange: () => {
      invalidateCache();
      refreshAllTokenOverlays();
    }
  });

  // Animation type setting
  game.settings.register(MODULE_ID, "globalAnimation", {
    name: "RAGNARS_MARK.Settings.GlobalAnimation.Name",
    hint: "RAGNARS_MARK.Settings.GlobalAnimation.Hint",
    scope: "world",
    config: true,
    type: String,
    choices: {
      none: "None",
      pulse: "Pulse",
      glow: "Glow",
      bounce: "Bounce",
      fade: "Fade"
    },
    default: "pulse",
    onChange: () => {
      invalidateCache();
      refreshAllTokenOverlays();
    }
  });

  // Per-condition settings
  game.settings.register(MODULE_ID, "conditionSettings", {
    name: "RAGNARS_MARK.Settings.ConditionSettings.Name",
    hint: "RAGNARS_MARK.Settings.ConditionSettings.Hint",
    scope: "world",
    config: false,
    type: Object,
    default: DEFAULT_CONDITION_SETTINGS,
    onChange: () => {
      invalidateCache();
      refreshAllTokenOverlays();
    }
  });

  // Matching mode setting
  game.settings.register(MODULE_ID, "matchingMode", {
    name: "RAGNARS_MARK.Settings.MatchingMode.Name",
    hint: "RAGNARS_MARK.Settings.MatchingMode.Hint",
    scope: "world",
    config: true,
    type: String,
    choices: {
      partial: "Partial Name Match (recommended)",
      exact: "Exact Name Match"
    },
    default: "partial",
    onChange: () => {
      invalidateCache();
      refreshAllTokenOverlays();
    }
  });

  // Show duration on overlay
  game.settings.register(MODULE_ID, "showDuration", {
    name: "RAGNARS_MARK.Settings.ShowDuration.Name",
    hint: "RAGNARS_MARK.Settings.ShowDuration.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    onChange: () => {
      invalidateCache();
      refreshAllTokenOverlays();
    }
  });

  // Animation speed setting
  game.settings.register(MODULE_ID, "animationSpeed", {
    name: "RAGNARS_MARK.Settings.AnimationSpeed.Name",
    hint: "RAGNARS_MARK.Settings.AnimationSpeed.Hint",
    scope: "world",
    config: true,
    type: String,
    choices: {
      verySlow: "Very Slow (3s)",
      slow: "Slow (2s)",
      normal: "Normal (1.5s)",
      fast: "Fast (1s)",
      veryFast: "Very Fast (0.5s)"
    },
    default: "normal",
    onChange: () => {
      invalidateCache();
      refreshAllTokenOverlays();
    }
  });

  // Enable token border highlights
  game.settings.register(MODULE_ID, "enableBorders", {
    name: "RAGNARS_MARK.Settings.EnableBorders.Name",
    hint: "RAGNARS_MARK.Settings.EnableBorders.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    onChange: () => {
      invalidateCache();
      refreshAllTokenOverlays();
    }
  });

  // Enable condition badges (count)
  game.settings.register(MODULE_ID, "enableBadges", {
    name: "RAGNARS_MARK.Settings.EnableBadges.Name",
    hint: "RAGNARS_MARK.Settings.EnableBadges.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    onChange: () => {
      invalidateCache();
      refreshAllTokenOverlays();
    }
  });

  // Enable hover tooltips
  game.settings.register(MODULE_ID, "enableTooltips", {
    name: "RAGNARS_MARK.Settings.EnableTooltips.Name",
    hint: "RAGNARS_MARK.Settings.EnableTooltips.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  // Enable shake animations
  game.settings.register(MODULE_ID, "enableShake", {
    name: "RAGNARS_MARK.Settings.EnableShake.Name",
    hint: "RAGNARS_MARK.Settings.EnableShake.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    onChange: () => {
      invalidateCache();
      refreshAllTokenOverlays();
    }
  });

  // Maximum overlays to display
  game.settings.register(MODULE_ID, "maxOverlays", {
    name: "RAGNARS_MARK.Settings.MaxOverlays.Name",
    hint: "RAGNARS_MARK.Settings.MaxOverlays.Hint",
    scope: "world",
    config: true,
    type: Number,
    range: { min: 1, max: 10, step: 1 },
    default: 5,
    onChange: () => {
      invalidateCache();
      refreshAllTokenOverlays();
    }
  });

  // Use priority system
  game.settings.register(MODULE_ID, "usePriority", {
    name: "RAGNARS_MARK.Settings.UsePriority.Name",
    hint: "RAGNARS_MARK.Settings.UsePriority.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    onChange: () => {
      invalidateCache();
      refreshAllTokenOverlays();
    }
  });

  // Enable sound effects
  game.settings.register(MODULE_ID, "enableSounds", {
    name: "RAGNARS_MARK.Settings.EnableSounds.Name",
    hint: "RAGNARS_MARK.Settings.EnableSounds.Hint",
    scope: "client",
    config: true,
    type: Boolean,
    default: false
  });

  // Dark mode support
  game.settings.register(MODULE_ID, "darkMode", {
    name: "RAGNARS_MARK.Settings.DarkMode.Name",
    hint: "RAGNARS_MARK.Settings.DarkMode.Hint",
    scope: "client",
    config: true,
    type: Boolean,
    default: false,
    onChange: () => {
      applyDarkModeStyles();
    }
  });

  // System presets
  game.settings.register(MODULE_ID, "systemPreset", {
    name: "RAGNARS_MARK.Settings.SystemPreset.Name",
    hint: "RAGNARS_MARK.Settings.SystemPreset.Hint",
    scope: "world",
    config: false,
    type: String,
    default: "daggerheart"
  });

  // Condition aliases
  game.settings.register(MODULE_ID, "conditionAliases", {
    name: "RAGNARS_MARK.Settings.ConditionAliases.Name",
    hint: "RAGNARS_MARK.Settings.ConditionAliases.Hint",
    scope: "world",
    config: false,
    type: Object,
    default: {}
  });

  // Icon overrides
  game.settings.register(MODULE_ID, "iconOverrides", {
    name: "RAGNARS_MARK.Settings.IconOverrides.Name",
    hint: "RAGNARS_MARK.Settings.IconOverrides.Hint",
    scope: "world",
    config: false,
    type: Object,
    default: {}
  });

  // Scene-specific settings
  game.settings.register(MODULE_ID, "sceneSettings", {
    name: "RAGNARS_MARK.Settings.SceneSettings.Name",
    hint: "RAGNARS_MARK.Settings.SceneSettings.Hint",
    scope: "world",
    config: false,
    type: Object,
    default: {}
  });

  // Condition groups
  game.settings.register(MODULE_ID, "conditionGroups", {
    name: "RAGNARS_MARK.Settings.ConditionGroups.Name",
    hint: "RAGNARS_MARK.Settings.ConditionGroups.Hint",
    scope: "world",
    config: false,
    type: Object,
    default: {}
  });

  // Debug mode
  game.settings.register(MODULE_ID, "debugMode", {
    name: "RAGNARS_MARK.Settings.DebugMode.Name",
    hint: "RAGNARS_MARK.Settings.DebugMode.Hint",
    scope: "client",
    config: true,
    type: Boolean,
    default: false
  });

  // Register the configuration menu
  game.settings.registerMenu(MODULE_ID, "conditionConfig", {
    name: "RAGNARS_MARK.Settings.ConfigMenu.Name",
    label: "RAGNARS_MARK.Settings.ConfigMenu.Label",
    hint: "RAGNARS_MARK.Settings.ConfigMenu.Hint",
    icon: "fas fa-cog",
    type: ConditionConfigForm,
    restricted: true
  });

  // Register presets menu
  game.settings.registerMenu(MODULE_ID, "presetsConfig", {
    name: "RAGNARS_MARK.Settings.PresetsMenu.Name",
    label: "RAGNARS_MARK.Settings.PresetsMenu.Label",
    hint: "RAGNARS_MARK.Settings.PresetsMenu.Hint",
    icon: "fas fa-save",
    type: PresetsConfigForm,
    restricted: true
  });

  // Register aliases menu
  game.settings.registerMenu(MODULE_ID, "aliasesConfig", {
    name: "RAGNARS_MARK.Settings.AliasesMenu.Name",
    label: "RAGNARS_MARK.Settings.AliasesMenu.Label",
    hint: "RAGNARS_MARK.Settings.AliasesMenu.Hint",
    icon: "fas fa-link",
    type: AliasesConfigForm,
    restricted: true
  });

  // === NEW v3.0 SETTINGS ===

  // Effect duration tracking
  game.settings.register(MODULE_ID, "trackEffectDuration", {
    name: "RAGNARS_MARK.Settings.TrackDuration.Name",
    hint: "RAGNARS_MARK.Settings.TrackDuration.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    onChange: () => invalidateCache()
  });

  // Duration color coding
  game.settings.register(MODULE_ID, "durationColorCoding", {
    name: "RAGNARS_MARK.Settings.DurationColorCoding.Name",
    hint: "RAGNARS_MARK.Settings.DurationColorCoding.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    onChange: () => invalidateCache()
  });

  // Actor vs Token effects filter
  game.settings.register(MODULE_ID, "effectSourceFilter", {
    name: "RAGNARS_MARK.Settings.EffectSourceFilter.Name",
    hint: "RAGNARS_MARK.Settings.EffectSourceFilter.Hint",
    scope: "world",
    config: true,
    type: String,
    choices: { both: "Both", actor: "Actor Only", token: "Token Only" },
    default: "both",
    onChange: () => {
      invalidateCache();
      refreshAllTokenOverlays();
    }
  });

  // Particle effects toggle
  game.settings.register(MODULE_ID, "enableParticleEffects", {
    name: "RAGNARS_MARK.Settings.EnableParticles.Name",
    hint: "RAGNARS_MARK.Settings.EnableParticles.Hint",
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
    onChange: () => invalidateCache()
  });

  // Custom visual theme
  game.settings.register(MODULE_ID, "visualTheme", {
    name: "RAGNARS_MARK.Settings.VisualTheme.Name",
    hint: "RAGNARS_MARK.Settings.VisualTheme.Hint",
    scope: "client",
    config: true,
    type: String,
    choices: {
      default: "Default",
      darkFantasy: "Dark Fantasy",
      cyberpunk: "Cyberpunk",
      minimalist: "Minimalist",
      neonWave: "Neon Wave",
      forestTheme: "Forest Theme"
    },
    default: "default",
    onChange: () => {
      if (game.settings.get(MODULE_ID, "visualTheme") !== "default") {
        VISUAL_EFFECTS.applyPredefinedTheme(game.settings.get(MODULE_ID, "visualTheme"));
      }
      refreshAllTokenOverlays();
    }
  });

  // Enable automation
  game.settings.register(MODULE_ID, "enableAutomation", {
    name: "RAGNARS_MARK.Settings.EnableAutomation.Name",
    hint: "RAGNARS_MARK.Settings.EnableAutomation.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  // Enable analytics
  game.settings.register(MODULE_ID, "enableAnalytics", {
    name: "RAGNARS_MARK.Settings.EnableAnalytics.Name",
    hint: "RAGNARS_MARK.Settings.EnableAnalytics.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  // Player visibility toggle
  game.settings.register(MODULE_ID, "playerConditionVisibility", {
    name: "RAGNARS_MARK.Settings.PlayerVisibility.Name",
    hint: "RAGNARS_MARK.Settings.PlayerVisibility.Hint",
    scope: "world",
    config: true,
    type: String,
    choices: {
      all: "All Conditions",
      public: "Public Only",
      gmOnly: "GM Only"
    },
    default: "all",
    onChange: () => {
      invalidateCache();
      refreshAllTokenOverlays();
    }
  });

  // GM-only conditions list
  game.settings.register(MODULE_ID, "gmOnlyConditions", {
    name: "RAGNARS_MARK.Settings.GMOnlyConditions.Name",
    hint: "RAGNARS_MARK.Settings.GMOnlyConditions.Hint",
    scope: "world",
    config: false,
    type: Object,
    default: {}
  });

  // Exclude list (tokens/actors to skip)
  game.settings.register(MODULE_ID, "excludeList", {
    name: "RAGNARS_MARK.Settings.ExcludeList.Name",
    hint: "RAGNARS_MARK.Settings.ExcludeList.Hint",
    scope: "world",
    config: false,
    type: Object,
    default: { tokens: [], actors: [] }
  });

  // Compound condition detection
  game.settings.register(MODULE_ID, "compoundConditions", {
    name: "RAGNARS_MARK.Settings.CompoundConditions.Name",
    hint: "RAGNARS_MARK.Settings.CompoundConditions.Hint",
    scope: "world",
    config: false,
    type: Object,
    default: {}
  });

  // Accessibility mode
  game.settings.register(MODULE_ID, "accessibilityMode", {
    name: "RAGNARS_MARK.Settings.Accessibility.Name",
    hint: "RAGNARS_MARK.Settings.Accessibility.Hint",
    scope: "client",
    config: true,
    type: String,
    choices: {
      normal: "Normal",
      highContrast: "High Contrast",
      colorblind: "Colorblind Friendly",
      textLabels: "Text Labels"
    },
    default: "normal",
    onChange: () => refreshAllTokenOverlays()
  });

  // Condition filter buttons
  game.settings.register(MODULE_ID, "enableFilterButtons", {
    name: "RAGNARS_MARK.Settings.FilterButtons.Name",
    hint: "RAGNARS_MARK.Settings.FilterButtons.Hint",
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });

  // Animation sequences
  game.settings.register(MODULE_ID, "animationSequences", {
    name: "RAGNARS_MARK.Settings.AnimationSequences.Name",
    hint: "RAGNARS_MARK.Settings.AnimationSequences.Hint",
    scope: "world",
    config: false,
    type: Object,
    default: {}
  });

  // Register the automation configuration menu
  game.settings.registerMenu(MODULE_ID, "automationConfig", {
    name: "RAGNARS_MARK.Settings.AutomationMenu.Name",
    label: "RAGNARS_MARK.Settings.AutomationMenu.Label",
    hint: "RAGNARS_MARK.Settings.AutomationMenu.Hint",
    icon: "fas fa-robot",
    type: AutomationConfigForm,
    restricted: true
  });

  // Register the analytics dashboard menu
  game.settings.registerMenu(MODULE_ID, "analyticsDashboard", {
    name: "RAGNARS_MARK.Settings.AnalyticsDashboard.Name",
    label: "RAGNARS_MARK.Settings.AnalyticsDashboard.Label",
    hint: "RAGNARS_MARK.Settings.AnalyticsDashboard.Hint",
    icon: "fas fa-chart-bar",
    type: AnalyticsDashboard,
    restricted: true
  });

  // === NEW v4.0 SETTINGS ===

  // AI suggestions enable
  game.settings.register(MODULE_ID, "enableAISuggestions", {
    name: "RAGNARS_MARK.Settings.EnableAISuggestions.Name",
    hint: "RAGNARS_MARK.Settings.EnableAISuggestions.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  // Community sharing enable
  game.settings.register(MODULE_ID, "enableCommunitySharing", {
    name: "RAGNARS_MARK.Settings.EnableSharing.Name",
    hint: "RAGNARS_MARK.Settings.EnableSharing.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  // Spell auto-apply enable
  game.settings.register(MODULE_ID, "enableSpellAutoApply", {
    name: "RAGNARS_MARK.Settings.EnableSpellAutoApply.Name",
    hint: "RAGNARS_MARK.Settings.EnableSpellAutoApply.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    onChange: () => INTEGRATION.loadSpellAutoApply()
  });

  // Mobile optimization
  game.settings.register(MODULE_ID, "mobileOptimization", {
    name: "RAGNARS_MARK.Settings.MobileOptimization.Name",
    hint: "RAGNARS_MARK.Settings.MobileOptimization.Hint",
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
    onChange: () => MOBILE_UI.applyResponsiveLayout()
  });

  // Performance optimization level
  game.settings.register(MODULE_ID, "performanceLevel", {
    name: "RAGNARS_MARK.Settings.PerformanceLevel.Name",
    hint: "RAGNARS_MARK.Settings.PerformanceLevel.Hint",
    scope: "client",
    config: true,
    type: String,
    choices: {
      high: "High (Best Quality)",
      balanced: "Balanced",
      low: "Low (Best Performance)"
    },
    default: "balanced",
    onChange: () => {
      if (game.settings.get(MODULE_ID, "performanceLevel") === "low") {
        PERFORMANCE.enableMemoryOptimization();
      }
    }
  });

  // Quick add panel enable
  game.settings.register(MODULE_ID, "enableQuickAdd", {
    name: "RAGNARS_MARK.Settings.EnableQuickAdd.Name",
    hint: "RAGNARS_MARK.Settings.EnableQuickAdd.Hint",
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });

  // Undo/redo enable
  game.settings.register(MODULE_ID, "enableUndoRedo", {
    name: "RAGNARS_MARK.Settings.EnableUndoRedo.Name",
    hint: "RAGNARS_MARK.Settings.EnableUndoRedo.Hint",
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });

  // Plugin system enable
  game.settings.register(MODULE_ID, "enablePluginSystem", {
    name: "RAGNARS_MARK.Settings.EnablePlugins.Name",
    hint: "RAGNARS_MARK.Settings.EnablePlugins.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  // AI learning data
  game.settings.register(MODULE_ID, "aiLearningData", {
    scope: "world",
    config: false,
    type: String,
    default: "{}"
  });

  // Customization profiles
  game.settings.register(MODULE_ID, "customizationProfiles", {
    scope: "world",
    config: false,
    type: String,
    default: "{}"
  });

  // User library (sharing)
  game.settings.register(MODULE_ID, "userLibrary", {
    scope: "world",
    config: false,
    type: String,
    default: "{}"
  });

  // Community library cache
  game.settings.register(MODULE_ID, "communityLibraryCache", {
    scope: "world",
    config: false,
    type: String,
    default: "{}"
  });

  // Spell auto-apply config
  game.settings.register(MODULE_ID, "spellAutoApply", {
    scope: "world",
    config: false,
    type: String,
    default: "{}"
  });

  // Advanced analytics reports
  game.settings.register(MODULE_ID, "advancedAnalyticsReports", {
    scope: "world",
    config: false,
    type: String,
    default: "{}"
  });

  // Favorite conditions (QOL)
  game.settings.register(MODULE_ID, "favoriteConditions", {
    scope: "client",
    config: false,
    type: String,
    default: "[]"
  });

  // Condition history (QOL)
  game.settings.register(MODULE_ID, "conditionHistory", {
    scope: "client",
    config: false,
    type: String,
    default: "{}"
  });

  // Initialize cache
  cacheSettings();
});

/**
 * Handle ready event - perform migrations and initial setup
 */
Hooks.once("ready", async () => {
  try {
    await handleMigration();
    setupKeyboardShortcuts();
  } catch (error) {
    logError("Ready hook error", error);
  }
});

/**
 * Setup keyboard shortcuts
 */
function setupKeyboardShortcuts() {
  document.addEventListener("keydown", (event) => {
    try {
      // Ctrl+Alt+O - Toggle overlays
      if (event.ctrlKey && event.altKey && event.code === "KeyO") {
        event.preventDefault();
        toggleAllOverlays();
      }
      // Ctrl+Alt+C - Open config
      if (event.ctrlKey && event.altKey && event.code === "KeyC") {
        event.preventDefault();
        new ConditionConfigForm().render(true);
      }
    } catch (error) {
      logError("Keyboard shortcut error", error);
    }
  });
}

/**
 * Toggle all overlays on/off
 */
function toggleAllOverlays() {
  const currentValue = game.settings.get(MODULE_ID, "enabledConditions");
  const allDisabled = Object.values(currentValue).every(v => !v);
  
  const newValue = {};
  for (const key of Object.keys(currentValue)) {
    newValue[key] = allDisabled;
  }
  
  game.settings.set(MODULE_ID, "enabledConditions", newValue);
  ui.notifications.info(`RagNarok's Mark: Overlays ${allDisabled ? "enabled" : "disabled"}`);
}

/**
 * Apply dark mode styles
 */
function applyDarkModeStyles() {
  const darkMode = game.settings.get(MODULE_ID, "darkMode");
  const style = document.getElementById("ragnaroks-mark-dark-mode");
  
  if (darkMode && !style) {
    const darkStyle = document.createElement("style");
    darkStyle.id = "ragnaroks-mark-dark-mode";
    darkStyle.innerHTML = `
      #ragnaroks-mark-config .control-buttons .btn {
        background: #2a2a2a;
        color: #e0e0e0;
      }
      #ragnaroks-mark-config .condition-row {
        background: #1a1a1a;
        border-color: #444;
      }
      #ragnaroks-mark-config .conditions-grid {
        background: #0a0a0a;
      }
    `;
    document.head.appendChild(darkStyle);
  } else if (!darkMode && style) {
    style.remove();
  }
}

/**
 * Hook into token refresh to add large overlays
 */
Hooks.on("refreshToken", (token) => {
  debouncedAddOverlays(token);
});

/**
 * Debounced overlay update to prevent excessive refreshes
 */
function debouncedAddOverlays(token) {
  const tokenId = token.document.id;
  
  // Clear existing debounce timer for this token
  if (updateDebounceTimers[tokenId]) {
    clearTimeout(updateDebounceTimers[tokenId]);
  }
  
  // Set new debounce timer
  updateDebounceTimers[tokenId] = setTimeout(() => {
    try {
      addStatusOverlays(token);
    } catch (error) {
  console.error("RagNarok's Mark | Error adding overlays:", error);
    }
    delete updateDebounceTimers[tokenId];
  }, 50); // 50ms debounce
}

/**
 * Refresh all token overlays (used when settings change)
 */
function refreshAllTokenOverlays() {
  if (!canvas.tokens) return;
  
  canvas.tokens.placeables.forEach(token => {
    removeStatusOverlays(token);
  });
  
  canvas.tokens.placeables.forEach(token => {
    try {
      addStatusOverlays(token);
    } catch (error) {
  console.error("RagNarok's Mark | Error refreshing token overlays:", error);
    }
  });
}

/**
 * Cache settings for performance
 */
function cacheSettings() {
  settingsCache = {
    // v2.0 settings
    enabledConditions: game.settings.get(MODULE_ID, "enabledConditions"),
    overlaySize: game.settings.get(MODULE_ID, "overlaySize"),
    overlayOpacity: game.settings.get(MODULE_ID, "overlayOpacity"),
    overlayPosition: game.settings.get(MODULE_ID, "overlayPosition"),
    stackingMode: game.settings.get(MODULE_ID, "stackingMode"),
    globalAnimation: game.settings.get(MODULE_ID, "globalAnimation"),
    conditionSettings: game.settings.get(MODULE_ID, "conditionSettings"),
    matchingMode: game.settings.get(MODULE_ID, "matchingMode"),
    showDuration: game.settings.get(MODULE_ID, "showDuration"),
    animationSpeed: game.settings.get(MODULE_ID, "animationSpeed"),
    enableBorders: game.settings.get(MODULE_ID, "enableBorders"),
    enableBadges: game.settings.get(MODULE_ID, "enableBadges"),
    enableTooltips: game.settings.get(MODULE_ID, "enableTooltips"),
    enableShake: game.settings.get(MODULE_ID, "enableShake"),
    maxOverlays: game.settings.get(MODULE_ID, "maxOverlays"),
    usePriority: game.settings.get(MODULE_ID, "usePriority"),
    enableSounds: game.settings.get(MODULE_ID, "enableSounds"),
    conditionAliases: game.settings.get(MODULE_ID, "conditionAliases"),
    iconOverrides: game.settings.get(MODULE_ID, "iconOverrides"),
    debugMode: game.settings.get(MODULE_ID, "debugMode"),
    
    // v3.0 settings
    trackEffectDuration: game.settings.get(MODULE_ID, "trackEffectDuration"),
    durationColorCoding: game.settings.get(MODULE_ID, "durationColorCoding"),
    effectSourceFilter: game.settings.get(MODULE_ID, "effectSourceFilter"),
    enableParticleEffects: game.settings.get(MODULE_ID, "enableParticleEffects"),
    visualTheme: game.settings.get(MODULE_ID, "visualTheme"),
    enableAutomation: game.settings.get(MODULE_ID, "enableAutomation"),
    enableAnalytics: game.settings.get(MODULE_ID, "enableAnalytics"),
    playerConditionVisibility: game.settings.get(MODULE_ID, "playerConditionVisibility"),
    gmOnlyConditions: game.settings.get(MODULE_ID, "gmOnlyConditions"),
    excludeList: game.settings.get(MODULE_ID, "excludeList"),
    compoundConditions: game.settings.get(MODULE_ID, "compoundConditions"),
    accessibilityMode: game.settings.get(MODULE_ID, "accessibilityMode"),
    enableFilterButtons: game.settings.get(MODULE_ID, "enableFilterButtons"),
    animationSequences: game.settings.get(MODULE_ID, "animationSequences")
  };
}

/**
 * Invalidate cache when settings change
 */
function invalidateCache() {
  cacheSettings();
}

/**
 * Add status overlays to a token
 */
function addStatusOverlays(token) {
  try {
    // Remove existing overlays
    removeStatusOverlays(token);
    removeBorderHighlight(token);

    // Validate token and actor exist
    if (!token?.document?.actor) return;

    const actor = token.document.actor;
    const tokenSize = token.document.width * canvas.grid.size;

    // Get active effects (exclude disabled ones)
    const activeEffects = actor.effects.filter(e => !e.disabled);
    if (activeEffects.length === 0) return;

    // Find matching conditions
    let activeOverlayConditions = findMatchingConditions(activeEffects);
    if (activeOverlayConditions.length === 0) return;

    // Apply priority system if enabled
    const { usePriority, maxOverlays } = settingsCache;
    if (usePriority && activeOverlayConditions.length > maxOverlays) {
      activeOverlayConditions = activeOverlayConditions
        .sort((a, b) => (a.priority || 999) - (b.priority || 999))
        .slice(0, maxOverlays);
    }

  // Create overlay container
  const overlayContainer = new PIXI.Container();
  overlayContainer.name = "ragnaroks-mark-overlay";

    // Get positioning data
    const positions = calculateOverlayPositions(activeOverlayConditions.length, tokenSize);

    // Create sprites for each condition
    activeOverlayConditions.forEach((condition, index) => {
      try {
        const sprite = createStatusSprite(condition, positions[index], tokenSize);
        if (sprite) {
          overlayContainer.addChild(sprite);
        }
      } catch (error) {
  console.warn(`RagNarok's Mark | Error creating sprite for ${condition.key}:`, error);
      }
    });

    if (overlayContainer.children.length > 0) {
      token.addChild(overlayContainer);

      // Add border highlight if enabled
      if (settingsCache.enableBorders && activeOverlayConditions.length > 0) {
        addBorderHighlight(token, activeOverlayConditions[0]);
      }

      // Add condition badge if enabled
      if (settingsCache.enableBadges && activeOverlayConditions.length > 0) {
        addConditionBadge(token, activeOverlayConditions.length, tokenSize);
      }

      // Add shake effect if enabled
      if (settingsCache.enableShake && activeOverlayConditions.some(c => c.shouldShake)) {
        applyShakeEffect(token);
      }
    }
  } catch (error) {
  console.error("RagNarok's Mark | Fatal error in addStatusOverlays:", error);
  }
}

/**
 * Add colored border to token
 */
function addBorderHighlight(token, condition) {
  const { conditionSettings } = settingsCache;
  const settings = conditionSettings[condition.key];
  if (!settings?.color) return;

  const hexColor = settings.color.replace('#', '');
  const borderColor = parseInt(hexColor, 16);

  token.borderColor = borderColor;
  
  if (!token.border) {
  const border = new PIXI.Graphics();
  border.name = "ragnaroks-mark-border";
    border.lineStyle(3, borderColor, 1);
    const size = token.document.width * canvas.grid.size;
    border.drawRect(0, 0, size, size);
    token.addChildAt(border, 0);
  }
}

/**
 * Remove border highlight
 */
function removeBorderHighlight(token) {
  const border = token.children.find(c => c.name === "ragnaroks-mark-border");
  if (border) {
    token.removeChild(border);
    border.destroy();
  }
}

/**
 * Add condition count badge
 */
function addConditionBadge(token, count, tokenSize) {
  const badge = new PIXI.Text(count.toString(), {
    fontFamily: "Arial",
    fontSize: Math.max(18, tokenSize * 0.35),
    fill: 0xFFFFFF,
    stroke: 0x000000,
    strokeThickness: 3,
    fontWeight: "bold"
  });

  badge.name = "ragnaroks-mark-badge";
  badge.anchor.set(0.5);
  badge.x = tokenSize - (tokenSize * 0.15);
  badge.y = tokenSize * 0.15;

  token.addChild(badge);
}

/**
 * Apply shake effect to token
 */
function applyShakeEffect(token) {
  const originalX = token.x;
  const originalY = token.y;
  let shakeCount = 0;
  const shakeAmount = 3;
  const shakeDuration = 500; // milliseconds
  const shakeSpeed = 20;

  const shakeInterval = setInterval(() => {
    if (!token.parent || shakeCount * shakeSpeed >= shakeDuration) {
      clearInterval(shakeInterval);
      token.x = originalX;
      token.y = originalY;
      return;
    }

    token.x = originalX + (Math.random() - 0.5) * shakeAmount;
    token.y = originalY + (Math.random() - 0.5) * shakeAmount;
    shakeCount++;
  }, shakeSpeed);
}

/**
 * Find conditions that match enabled settings
 */
function findMatchingConditions(activeEffects) {
  const { enabledConditions, matchingMode, conditionAliases, iconOverrides, conditionSettings } = settingsCache;
  const matchingConditions = [];

  for (const effect of activeEffects) {
    // Skip effects without icons
    if (!effect.icon) continue;

    const effectName = (effect.name || effect.label || "").toLowerCase().trim();
    
    for (const [conditionKey, isEnabled] of Object.entries(enabledConditions)) {
      if (!isEnabled) continue;

      // Check direct match
      let matches = matchingMode === "exact"
        ? effectName === conditionKey
        : effectName.includes(conditionKey);

      // Check aliases
      if (!matches && conditionAliases[conditionKey]) {
        const aliases = Array.isArray(conditionAliases[conditionKey]) 
          ? conditionAliases[conditionKey] 
          : [conditionAliases[conditionKey]];
        
        matches = aliases.some(alias => 
          matchingMode === "exact"
            ? effectName === alias.toLowerCase()
            : effectName.includes(alias.toLowerCase())
        );
      }

      if (matches) {
        const iconOverride = iconOverrides[conditionKey];
        const settings = conditionSettings[conditionKey] || {};

        matchingConditions.push({
          key: conditionKey,
          effect: effect,
          icon: iconOverride || effect.icon,
          duration: effect.duration,
          priority: settings.priority || 999,
          shouldShake: settings.shouldShake || false
        });
        break; // Don't match same effect multiple times
      }
    }
  }

  return matchingConditions;
}

/**
 * Calculate positions for overlays based on stacking mode
 */
function calculateOverlayPositions(count, tokenSize) {
  const { stackingMode, overlayPosition } = settingsCache;
  const positions = [];
  const centerX = tokenSize / 2;
  const centerY = tokenSize / 2;

  if (stackingMode === "overlapping") {
    // All centered with slight offset based on order
    for (let i = 0; i < count; i++) {
      positions.push({
        x: centerX,
        y: centerY,
        zIndex: i
      });
    }
  } else if (stackingMode === "stack") {
    // Grid stacking (2-column layout)
    const spacing = tokenSize * 0.35;
    for (let i = 0; i < count; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      positions.push({
        x: centerX - spacing / 2 + (col * spacing),
        y: centerY - spacing / 2 + (row * spacing),
        zIndex: i
      });
    }
  } else if (stackingMode === "circular") {
    // Circular arrangement around token
    const radius = tokenSize * 0.25;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      positions.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        zIndex: i
      });
    }
  }

  return positions;
}

/**
 * Create a sprite for a status condition
 */
function createStatusSprite(condition, position, tokenSize) {
  try {
    const { overlaySize, overlayOpacity, globalAnimation, conditionSettings, showDuration } = settingsCache;

    // Validate icon exists
    if (!condition.icon) return null;

    // Create sprite
    const sprite = PIXI.Sprite.from(condition.icon);
    
    // Size the sprite
    const size = tokenSize * overlaySize;
    sprite.width = size;
    sprite.height = size;
    sprite.anchor.set(0.5);
    
    // Position
    sprite.x = position.x;
    sprite.y = position.y;
    sprite.zIndex = position.zIndex || 0;
    
    // Opacity
    sprite.alpha = overlayOpacity;

    // Get per-condition settings or use defaults
    const condSettings = conditionSettings[condition.key] || DEFAULT_CONDITION_SETTINGS[condition.key] || {};
    
    // Apply color tint
    if (condSettings.color) {
      const hexColor = condSettings.color.replace('#', '');
      sprite.tint = parseInt(hexColor, 16);
    }

    // Apply animation
    const animationType = globalAnimation || condSettings.animationType || "none";
    applyAnimation(sprite, animationType, condSettings.glowIntensity || 1.0);

    // Add duration label if enabled
    if (showDuration && condition.duration) {
      const durationText = createDurationText(condition.duration, size);
      if (durationText) {
        sprite.addChild(durationText);
      }
    }

    return sprite;
  } catch (error) {
  console.warn("RagNarok's Mark | Error creating sprite:", error);
    return null;
  }
}

/**
 * Apply animation to sprite with variable speed
 */
function applyAnimation(sprite, animationType, glowIntensity) {
  if (animationType === "none") return;

  const startAlpha = sprite.alpha;
  const animationSpeed = getAnimationSpeed();

  switch (animationType) {
    case "pulse":
      sprite.filters = sprite.filters || [];
      let pulseDirection = 1;
      const pulseInterval = setInterval(() => {
        if (!sprite.parent) {
          clearInterval(pulseInterval);
          return;
        }
        const cycleTime = 1500 / animationSpeed; // Normalize to speed setting
        sprite.alpha += (0.02 * pulseDirection * (1500 / cycleTime));
        if (sprite.alpha >= startAlpha || sprite.alpha <= startAlpha * 0.5) {
          pulseDirection *= -1;
        }
      }, 16);
      break;

    case "glow":
      if (sprite.filters === undefined) sprite.filters = [];
      const glow = new PIXI.filters.GlowFilter({
        distance: 15 * glowIntensity,
        outerStrength: 2 * glowIntensity
      });
      sprite.filters.push(glow);
      break;

    case "bounce":
      const startY = sprite.y;
      let bounceDirection = -1;
      const bounceSpeed = 1000 / animationSpeed; // Normalize bounce speed
      const bounceInterval = setInterval(() => {
        if (!sprite.parent) {
          clearInterval(bounceInterval);
          return;
        }
        sprite.y += (2 * bounceDirection * bounceSpeed);
        if (Math.abs(sprite.y - startY) > 10) {
          bounceDirection *= -1;
        }
      }, Math.max(10, 20 - (animationSpeed * 2)));
      break;

    case "fade":
      let fadeDirection = -1;
      const fadeSpeed = 1000 / animationSpeed;
      const fadeInterval = setInterval(() => {
        if (!sprite.parent) {
          clearInterval(fadeInterval);
          return;
        }
        sprite.alpha += (0.015 * fadeDirection * fadeSpeed);
        if (sprite.alpha >= startAlpha || sprite.alpha <= startAlpha * 0.3) {
          fadeDirection *= -1;
        }
      }, Math.max(10, 20 - (animationSpeed * 2)));
      break;
  }
}

/**
 * Get animation speed multiplier
 */
function getAnimationSpeed() {
  const speedKey = settingsCache.animationSpeed || "normal";
  const speeds = {
    verySlow: 0.5,
    slow: 0.75,
    normal: 1.0,
    fast: 1.5,
    veryFast: 2.0
  };
  return speeds[speedKey] || 1.0;
}

/**
 * Create duration text for overlay
 */
function createDurationText(duration, spriteSize) {
  try {
    if (!duration || (!duration.seconds && !duration.rounds)) return null;

    const text = new PIXI.Text(getDurationString(duration), {
      fontFamily: "Arial",
      fontSize: Math.max(12, spriteSize * 0.3),
      fill: 0xFFFFFF,
      stroke: 0x000000,
      strokeThickness: 2,
      align: "center"
    });

    text.anchor.set(0.5);
    text.y = spriteSize * 0.35;
    return text;
  } catch (error) {
  console.warn("RagNarok's Mark | Error creating duration text:", error);
    return null;
  }
}

/**
 * Format duration for display
 */
function getDurationString(duration) {
  if (duration.seconds) {
    return `${Math.ceil(duration.seconds / 6)}`;
  } else if (duration.rounds) {
    return `${duration.rounds}R`;
  }
  return "";
}

/**
 * Remove existing status overlays from a token
 */
function removeStatusOverlays(token) {
  const existing = token.children.find(c => c.name === "ragnaroks-mark-overlay");
  if (existing) {
    // Clean up any running intervals/animations
    existing.children.forEach(child => {
      if (child.filters) child.filters = [];
    });
    token.removeChild(existing);
    existing.destroy();
  }
}

/**
 * Configuration form for selecting which conditions show overlays
 */
class ConditionConfigForm extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "ragnaroks-mark-config",
  title: "RagNarok's Mark - Condition Configuration",
      template: `modules/${MODULE_ID}/templates/condition-config.hbs`,
      width: 700,
      height: "auto",
      closeOnSubmit: false,
      resizable: true
    });
  }

  getData() {
    const enabledConditions = game.settings.get(MODULE_ID, "enabledConditions");
    const conditionSettings = game.settings.get(MODULE_ID, "conditionSettings");
    
    // Collect all unique condition names
    const allConditions = new Set(DEFAULT_CONDITIONS);
    
    // Add conditions from world effects
    game.actors?.forEach(actor => {
      actor.effects?.forEach(effect => {
        const name = (effect.name || effect.label || "").toLowerCase().trim();
        if (name) allConditions.add(name);
      });
    });

    // Build condition list with settings
    const conditions = Array.from(allConditions).sort().map(condition => {
      const settings = conditionSettings[condition] || DEFAULT_CONDITION_SETTINGS[condition] || {};
      return {
        key: condition,
        name: condition.charAt(0).toUpperCase() + condition.slice(1),
        enabled: enabledConditions[condition] ?? false,
        color: settings.color || "#FFFFFF",
        glowIntensity: settings.glowIntensity || 1.0,
        animationType: settings.animationType || "none"
      };
    });

    return {
      conditions: conditions
    };
  }

  async _updateObject(event, formData) {
    const enabledConditions = {};
    const conditionSettings = game.settings.get(MODULE_ID, "conditionSettings") || {};

    // Process form data
    for (const [key, value] of Object.entries(formData)) {
      if (key.startsWith("condition-enabled-")) {
        const conditionKey = key.replace("condition-enabled-", "");
        enabledConditions[conditionKey] = value;
      } else if (key.startsWith("condition-color-")) {
        const conditionKey = key.replace("condition-color-", "");
        if (!conditionSettings[conditionKey]) conditionSettings[conditionKey] = {};
        conditionSettings[conditionKey].color = value;
      } else if (key.startsWith("condition-glow-")) {
        const conditionKey = key.replace("condition-glow-", "");
        if (!conditionSettings[conditionKey]) conditionSettings[conditionKey] = {};
        conditionSettings[conditionKey].glowIntensity = parseFloat(value) || 1.0;
      } else if (key.startsWith("condition-animation-")) {
        const conditionKey = key.replace("condition-animation-", "");
        if (!conditionSettings[conditionKey]) conditionSettings[conditionKey] = {};
        conditionSettings[conditionKey].animationType = value;
      }
    }

    await game.settings.set(MODULE_ID, "enabledConditions", enabledConditions);
    await game.settings.set(MODULE_ID, "conditionSettings", conditionSettings);
  ui.notifications.info("RagNarok's Mark: Condition settings updated");
  }

  activateListeners(html) {
    super.activateListeners(html);

    // Bulk enable all
    html.find(".btn-enable-all").on("click", () => {
      const enabledConditions = {};
      html.find("input[name^='condition-enabled-']").each((i, el) => {
        const key = el.name.replace("condition-enabled-", "");
        enabledConditions[key] = true;
        el.checked = true;
      });
      game.settings.set(MODULE_ID, "enabledConditions", enabledConditions);
    });

    // Bulk disable all
    html.find(".btn-disable-all").on("click", () => {
      const enabledConditions = {};
      html.find("input[name^='condition-enabled-']").each((i, el) => {
        const key = el.name.replace("condition-enabled-", "");
        enabledConditions[key] = false;
        el.checked = false;
      });
      game.settings.set(MODULE_ID, "enabledConditions", enabledConditions);
    });

    // Reset to defaults
    html.find(".btn-reset-defaults").on("click", async () => {
      if (!confirm("Reset all conditions to default settings?")) return;
      await game.settings.set(MODULE_ID, "enabledConditions", 
        DEFAULT_CONDITIONS.reduce((acc, c) => { acc[c] = true; return acc; }, {}));
      await game.settings.set(MODULE_ID, "conditionSettings", DEFAULT_CONDITION_SETTINGS);
      this.render();
    });

    // Search/filter
    html.find(".condition-search").on("keyup", (e) => {
      const searchTerm = e.target.value.toLowerCase();
      html.find(".condition-row").each((i, el) => {
        const name = el.dataset.conditionName?.toLowerCase() || "";
        el.style.display = name.includes(searchTerm) ? "" : "none";
      });
    });

    // Tooltip handling for icon previews
    if (settingsCache.enableTooltips) {
      html.find(".condition-icon").on("mouseenter", (e) => {
  const tooltip = document.createElement("div");
  tooltip.className = "ragnaroks-tooltip";
        tooltip.innerHTML = e.target.dataset.tooltipText || "";
        e.target.appendChild(tooltip);
      }).on("mouseleave", (e) => {
        const tooltip = e.target.querySelector(".ragnars-tooltip");
        if (tooltip) tooltip.remove();
      });
    }
  }
}

/**
 * Presets Configuration Form
 */
class PresetsConfigForm extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "ragnaroks-mark-presets",
  title: "RagNarok's Mark - System Presets",
      template: `modules/${MODULE_ID}/templates/presets-config.hbs`,
      width: 500,
      height: "auto",
      closeOnSubmit: true
    });
  }

  getData() {
    return {
      presets: [
        { key: "daggerheart", name: "Daggerheart (Default)" },
        { key: "dnd5e", name: "D&D 5e" },
        { key: "pathfinder2e", name: "Pathfinder 2e" }
      ]
    };
  }

  async _updateObject(event, formData) {
    const presetKey = formData.selectedPreset;
    if (!presetKey) {
      ui.notifications.warn("Please select a preset");
      return;
    }

    try {
      // Import features module to get presets
      const response = await fetch(`modules/${MODULE_ID}/scripts/features.js`);
      const text = await response.text();
      // Dynamically execute to get presets
      eval(text);
      
      const preset = SYSTEM_PRESETS[presetKey];
      if (!preset) throw new Error("Preset not found");

      const enabledConditions = {};
      const conditionSettings = {};

      for (const [key, settings] of Object.entries(preset.conditions)) {
        enabledConditions[key] = true;
        conditionSettings[key] = {
          color: settings.color,
          glowIntensity: settings.glowIntensity,
          animationType: settings.animationType,
          priority: settings.priority || 999,
          group: settings.group || "other"
        };
      }

      await game.settings.set(MODULE_ID, "enabledConditions", enabledConditions);
      await game.settings.set(MODULE_ID, "conditionSettings", conditionSettings);
  ui.notifications.info(`RagNarok's Mark: Applied ${preset.name} preset`);
      
      cacheSettings();
      refreshAllTokenOverlays();
    } catch (error) {
      logError("Preset application failed", error);
      ui.notifications.error("Failed to apply preset");
    }
  }
}

/**
 * Aliases Configuration Form
 */
class AliasesConfigForm extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "ragnaroks-mark-aliases",
  title: "RagNarok's Mark - Condition Aliases",
      template: `modules/${MODULE_ID}/templates/aliases-config.hbs`,
      width: 600,
      height: "auto",
      closeOnSubmit: false,
      resizable: true
    });
  }

  getData() {
    const enabledConditions = game.settings.get(MODULE_ID, "enabledConditions");
    const conditionAliases = game.settings.get(MODULE_ID, "conditionAliases");

    const conditions = Object.keys(enabledConditions)
      .sort()
      .map(key => ({
        key: key,
        name: key.charAt(0).toUpperCase() + key.slice(1),
        aliases: Array.isArray(conditionAliases[key]) 
          ? conditionAliases[key].join(", ")
          : (conditionAliases[key] || "")
      }));

    return { conditions };
  }

  async _updateObject(event, formData) {
    const conditionAliases = {};

    for (const [key, value] of Object.entries(formData)) {
      if (key.startsWith("aliases-")) {
        const conditionKey = key.replace("aliases-", "");
        const aliasString = value?.trim() || "";
        if (aliasString) {
          conditionAliases[conditionKey] = aliasString
            .split(",")
            .map(a => a.trim())
            .filter(a => a);
        }
      }
    }

    await game.settings.set(MODULE_ID, "conditionAliases", conditionAliases);
  ui.notifications.info("RagNarok's Mark: Condition aliases updated");
    invalidateCache();
    refreshAllTokenOverlays();
  }
}

/**
 * Automation Configuration Form (v3.0)
 */
class AutomationConfigForm extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "ragnaroks-mark-automation-config",
  title: "RagNarok's Mark - Automation Settings",
  template: `modules/${MODULE_ID}/templates/automation-config.hbs`,
      width: 600,
      height: "auto",
      closeOnSubmit: true
    });
  }

  getData() {
    const conditionChains = AUTOMATION.conditionChains;
    const autoApplyRules = AUTOMATION.autoApplyRules;

    return {
      chains: Object.entries(conditionChains).map(([source, targets]) => ({
        source,
        targets: targets.map(t => t.target).join(", ")
      })),
      rules: Object.keys(autoApplyRules),
      enableAutomation: settingsCache.enableAutomation
    };
  }

  async _updateObject(event, formData) {
    await game.settings.set(MODULE_ID, "enableAutomation", formData.enableAutomation);
  ui.notifications.info("RagNarok's Mark: Automation settings updated");
  }
}

/**
 * Analytics Dashboard (v3.0)
 */
class AnalyticsDashboard extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "ragnaroks-mark-analytics-dashboard",
  title: "RagNarok's Mark - Analytics Dashboard",
  template: `modules/${MODULE_ID}/templates/analytics-dashboard.hbs`,
      width: 900,
      height: 700,
      resizable: true
    });
  }

  getData() {
    const stats = ANALYTICS.getAllConditionStats();
    const mostApplied = ANALYTICS.getMostAppliedConditions(10);
    const mostAffected = ANALYTICS.getMostAffectedTokens(10);

    return {
      conditions: stats,
      mostApplied,
      mostAffected,
      totalLogs: ANALYTICS.auditLog.length,
      recentLogs: ANALYTICS.getAuditLog({ limit: 20 })
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    // Export audit log
    html.find("button.export-logs").click(() => {
      const data = JSON.stringify(ANALYTICS.exportAuditLog(), null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
  a.href = url;
  a.download = `ragnaroks-mark-analytics-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    // Clear analytics
    html.find("button.clear-analytics").click(() => {
      if (confirm("Clear all analytics data? This cannot be undone.")) {
        ANALYTICS.clearStats();
        this.render(true);
      }
    });
  }
}

/**
 * Expose public API for module developers - v4.0 with 75+ features
 */
window.RagnarsMarkAPI = {
  // === Core Condition Management ===
  addCondition: (tokenId, conditionName, duration = null) => {
    const token = canvas.tokens.get(tokenId);
    if (token) AUTOMATION.applyConditionToToken(token, conditionName, duration);
  },
  removeCondition: (tokenId, conditionName) => {
    const token = canvas.tokens.get(tokenId);
    if (token) AUTOMATION.removeConditionFromToken(token, conditionName);
  },
  toggleCondition: (tokenId, conditionName) => {
    const token = canvas.tokens.get(tokenId);
    if (token) AUTOMATION.toggleConditionOnToken(token, conditionName);
  },
  
  // === Batch Operations ===
  batchApply: (tokenIds, conditions, options = {}) => {
    const tokens = tokenIds.map(id => canvas.tokens.get(id)).filter(t => t);
    return AUTOMATION.batchApplyConditions(tokens, conditions, options);
  },
  
  // === Condition Chains & Automation ===
  addConditionChain: (source, target, options = {}) => {
    AUTOMATION.addConditionChain(source, target, options);
  },
  processConditionChains: (tokenId) => {
    return AUTOMATION.processConditionChains(tokenId);
  },
  
  // === Analytics & Reporting ===
  getConditionStats: (conditionName) => ANALYTICS.getConditionStats(conditionName),
  getAllStats: () => ANALYTICS.getAllConditionStats(),
  generateCombatReport: () => ANALYTICS.generateCombatReport(),
  generateWeeklyReport: (weekStart) => ADVANCED_ANALYTICS.generateWeeklyReport(weekStart),
  generateMonthlyTrend: (monthOffset = 0) => ADVANCED_ANALYTICS.generateMonthlyTrendAnalysis(monthOffset),
  exportAuditLog: () => ANALYTICS.exportAuditLog(),
  
  // === Visual Effects & Themes ===
  applyTheme: (themeName) => VISUAL_EFFECTS.applyPredefinedTheme(themeName),
  getThemes: () => VISUAL_EFFECTS.getAvailableThemes(),
  createParticleEffect: (tokenId, condition) => {
    const token = canvas.tokens.get(tokenId);
    if (token) return VISUAL_EFFECTS.createParticleEffect(token, condition);
  },
  
  // === AI & Intelligent Features ===
  getConditionSuggestions: (tokenId, context = {}) => {
    return AI.generateConditionSuggestions(tokenId, context);
  },
  predictEffectChain: (sourceCondition) => AI.predictEffectChain(sourceCondition),
  getAIInsights: () => AI.getAIInsights(),
  
  // === Customization ===
  createProfile: (name, settings = {}) => CUSTOMIZATION.createProfile(name, settings),
  applyProfile: (name) => CUSTOMIZATION.applyProfile(name),
  createCustomEffect: (name, config = {}) => CUSTOMIZATION.createCustomEffect(name, config),
  listProfiles: () => CUSTOMIZATION.listProfiles(),
  listCustomEffects: () => CUSTOMIZATION.listCustomEffects(),
  
  // === Social & Sharing ===
  publishPreset: (presetName, metadata = {}) => SHARING.publishPreset(presetName, metadata),
  downloadPreset: (presetId) => SHARING.downloadPreset(presetId),
  ratePreset: (presetId, rating, review = '') => SHARING.ratePreset(presetId, rating, review),
  getTrendingPresets: (limit = 10) => SHARING.getTrendingPresets(limit),
  searchCommunity: (query, filters = {}) => SHARING.searchCommunityLibrary(query, filters),
  
  // === Integration & Extensions ===
  registerPlugin: (name, config) => INTEGRATION.registerPlugin(name, config),
  registerHook: (hookName, callback, options = {}) => INTEGRATION.registerHook(hookName, callback, options),
  triggerHook: async (...args) => INTEGRATION.triggerHook(...args),
  configureSpellAutoApply: (spellName, conditions = [], config = {}) => {
    return INTEGRATION.configureSpellAutoApply(spellName, conditions, config);
  },
  configureAbilityAutoApply: (abilityName, conditions = [], config = {}) => {
    return INTEGRATION.configureAbilityAutoApply(abilityName, conditions, config);
  },
  listPlugins: () => INTEGRATION.listPlugins(),
  
  // === Performance & Optimization ===
  getPerformanceMetrics: () => PERFORMANCE.getPerformanceMetrics(),
  getMemoryUsage: () => PERFORMANCE.getMemoryUsage(),
  enableLazyLoading: (options = {}) => PERFORMANCE.enableLazyLoading(options),
  enableMemoryOptimization: () => PERFORMANCE.enableMemoryOptimization(),
  
  // === Mobile & Responsive ===
  getMobileSettings: () => MOBILE_UI.getMobileSettings(),
  setMobileSetting: (setting, value) => MOBILE_UI.setSetting(setting, value),
  getDeviceType: () => MOBILE_UI.deviceType,
  
  // === Quality of Life ===
  toggleQuickAdd: () => QUALITY_OF_LIFE.toggleQuickAddPanel(),
  quickAddCondition: (condition) => QUALITY_OF_LIFE.quickAddCondition(condition),
  addToFavorites: (condition, category = 'General') => {
    return QUALITY_OF_LIFE.addToFavorites(condition, category);
  },
  removeFromFavorites: (condition) => QUALITY_OF_LIFE.removeFromFavorites(condition),
  getFavorites: (category = null) => QUALITY_OF_LIFE.getFavorites(category),
  undo: () => QUALITY_OF_LIFE.undo(),
  redo: () => QUALITY_OF_LIFE.redo(),
  getHistory: (condition = null) => QUALITY_OF_LIFE.getConditionHistory(condition),
  
  // === Utility Methods ===
  getVersion: () => MODULE_VERSION,
  getModuleId: () => MODULE_ID,
  isDebugEnabled: () => game.settings.get(MODULE_ID, 'debugMode')
};

// Export key classes so the canonical module entry can import them.
// This avoids adding globals while keeping the legacy source usable.
export { ConditionConfigForm, PresetsConfigForm, AutomationConfigForm, AnalyticsDashboard };

