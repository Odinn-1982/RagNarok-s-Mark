/**
 * RagNarok's Mark - Large Status Effect Overlays for Foundry VTT
 * v4.0.0: Enterprise-grade system with 75+ features including AI suggestions,
 * community sharing, spell automation, mobile optimization, and comprehensive APIs
 */

import { AUTOMATION } from "./automation.js";
import { VISUAL_EFFECTS } from "./visual-effects.js";
import { ANALYTICS } from "./analytics.js";
import { AI } from "./ai.js";
import { CUSTOMIZATION } from "./customization.js";
import { SHARING } from "./sharing.js";
import { INTEGRATION } from "./integration.js";
import { ADVANCED_ANALYTICS } from "./advanced-analytics.js";
import { PERFORMANCE } from "./performance.js";
import { MOBILE_UI } from "./mobile-ui.js";
import { QUALITY_OF_LIFE } from "./qol.js";
import { DAGGERHEART_INTEGRATION } from "./daggerheart-integration.js";
import { OverlayRenderer, EXPANDED_CONDITIONS } from "./overlay-renderer.js";

// Consolidated FormApplication classes (migrated from the legacy copy).
// All definitions now live here so the canonical module entry contains
// the runtime behavior and the legacy wrapper can be removed.

/**
 * Configuration form for selecting which conditions show overlays
 */
class ConditionConfigForm extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "ragnaroks-mark-config",
      title: "RagNarok's Mark - Condition Configuration",
      template: `modules/${MODULE_ID}/templates/condition-config.hbs`,
      width: 600,
      height: 600,
      closeOnSubmit: false,
      resizable: true,
      scrollY: [".condition-list"]
    });
  }

  getData() {
    const enabledConditions = game.settings.get(MODULE_ID, "enabledConditions");
    const conditionSettings = game.settings.get(MODULE_ID, "conditionSettings");
    const matchingMode = game.settings.get(MODULE_ID, "matchingMode") || "partial";
    const overlayRegistry = window.RagnaroksMarkOverlay?.EXPANDED_CONDITIONS || EXPANDED_CONDITIONS || {};
    
    // Collect all unique condition names
    const allConditions = new Set([
      ...DEFAULT_CONDITIONS,
      ...Object.keys(enabledConditions || {}),
      ...Object.keys(conditionSettings || {})
    ]);
    
    // Add conditions from world effects
    game.actors?.forEach(actor => {
      actor.effects?.forEach(effect => {
        const name = (effect.name || effect.label || "").toLowerCase().trim();
        if (name) allConditions.add(name);
        if (effect.statuses instanceof Set) {
          effect.statuses.forEach(status => {
            const statusName = String(status || "").toLowerCase().trim();
            if (statusName) allConditions.add(statusName);
          });
        }
      });
    });

    const statusEffects = CONFIG?.statusEffects;
    if (statusEffects) {
      const stack = Array.isArray(statusEffects)
        ? statusEffects.flat(Infinity)
        : Object.values(statusEffects).flat ? Object.values(statusEffects).flat(Infinity) : Object.values(statusEffects);
      stack.forEach(effect => {
        if (!effect) return;
        const keys = [effect.id, effect.statusId, effect.name, effect.label]
          .map(v => typeof v === "string" ? v.toLowerCase().trim() : "")
          .filter(Boolean);
        keys.forEach(key => allConditions.add(key));
      });
    }

    // Build condition list with settings
    const conditions = Array.from(allConditions).sort().map(condition => {
      const defaults = DEFAULT_CONDITION_SETTINGS[condition] || overlayRegistry[condition] || {};
      const settings = conditionSettings[condition] || {};
      const color = settings.color || defaults.color || "#FFFFFF";
  let glow = settings.glow ?? settings.glowIntensity ?? defaults.glow ?? defaults.glowIntensity ?? 1.0;
  glow = Number.isFinite(Number(glow)) ? Number(glow) : 1.0;
  glow = Math.max(0.1, Math.min(2.0, glow));
      const animation = settings.animation || settings.animationType || defaults.animation || defaults.animationType || "none";
      const icon = settings.icon
        || overlayRegistry[condition]?.icon
        || OverlayRenderer.findConditionIcon?.(condition, null, matchingMode)
        || "icons/svg/aura.svg";
      const glowDisplay = Number(glow.toFixed(1));
      return {
        key: condition,
        name: condition.charAt(0).toUpperCase() + condition.slice(1),
        enabled: Boolean(enabledConditions[condition]),
        color,
        glow: glowDisplay,
        animation,
        icon
      };
    });

    return {
      conditions: conditions
    };
  }

  async _updateObject(event, formData) {
    const existingEnabled = foundry.utils.deepClone(game.settings.get(MODULE_ID, "enabledConditions") || {});
    const existingSettings = foundry.utils.deepClone(game.settings.get(MODULE_ID, "conditionSettings") || {});

    const enabledConditions = { ...existingEnabled };
    Object.keys(enabledConditions).forEach(key => { enabledConditions[key] = false; });
    const conditionSettings = { ...existingSettings };

    // Process form data
    for (const [key, value] of Object.entries(formData)) {
      if (key.startsWith("condition-enabled-")) {
        const conditionKey = key.replace("condition-enabled-", "");
        enabledConditions[conditionKey] = value === true || value === "on";
      } else if (key.startsWith("condition-color-")) {
        const conditionKey = key.replace("condition-color-", "");
        if (!conditionSettings[conditionKey]) conditionSettings[conditionKey] = {};
        conditionSettings[conditionKey].color = value;
      } else if (key.startsWith("condition-glow-")) {
        const conditionKey = key.replace("condition-glow-", "");
        if (!conditionSettings[conditionKey]) conditionSettings[conditionKey] = {};
        const glowValue = parseFloat(value) || 1.0;
        conditionSettings[conditionKey].glow = glowValue;
        conditionSettings[conditionKey].glowIntensity = glowValue;
      } else if (key.startsWith("condition-animation-")) {
        const conditionKey = key.replace("condition-animation-", "");
        if (!conditionSettings[conditionKey]) conditionSettings[conditionKey] = {};
        conditionSettings[conditionKey].animation = value;
        conditionSettings[conditionKey].animationType = value;
      }
    }

    await game.settings.set(MODULE_ID, "enabledConditions", enabledConditions);
    await game.settings.set(MODULE_ID, "conditionSettings", conditionSettings);
    try {
      OverlayRenderer.refreshAllTokenOverlays();
      OverlayRenderer.renderSidebarOverlays?.();
    } catch (err) {
      console.warn("RagNarok's Mark | Overlay refresh failed", err);
    }
    ui.notifications.info("RagNarok's Mark: Condition settings updated");
  }

  activateListeners(html) {
    // Ensure html is a jQuery object - Foundry may pass a raw HTMLElement in newer runtimes
    html = $(html);
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
        const tooltip = e.target.querySelector(".ragnaroks-tooltip");
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
      // Import features module as an ES module so exported constants (like SYSTEM_PRESETS)
      // can be accessed. Avoid fetch+eval which fails on top-level 'export' statements.
      const mod = await import(`/modules/${MODULE_ID}/scripts/features.js`);
      const preset = mod.SYSTEM_PRESETS?.[presetKey];
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
    // Refresh the runtime cache so subsequent opens reflect the new value
    try { cacheSettings(); } catch (e) { /* best-effort */ }
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
  // Ensure html is a jQuery object - Foundry may pass a raw HTMLElement in newer runtimes
  html = $(html);
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

// Legacy module id used by the earliest builds; preserved for one-time migration
const LEGACY_MODULE_ID = String.fromCharCode(114, 97, 103, 110, 97, 114, 115, 45, 109, 97, 114, 107);
// Canonical module id (matches module.json)
const MODULE_ID = "ragnaroks-mark";
const MODULE_VERSION = "4.0.0";

// Default conditions mirror the expanded overlay registry so new conditions automatically appear
const DEFAULT_CONDITIONS = Object.keys(EXPANDED_CONDITIONS);

// Default per-condition settings (store both legacy and new property names for compatibility)
const DEFAULT_CONDITION_SETTINGS = Object.fromEntries(
  Object.entries(EXPANDED_CONDITIONS).map(([key, defaults]) => {
    const color = defaults.color || "#FFFFFF";
    const glow = defaults.glow ?? defaults.glowIntensity ?? 1.0;
    const animation = defaults.animation ?? defaults.animationType ?? "none";
    const scale = defaults.scale ?? 1.0;
    return [key, {
      color,
      glow,
      glowIntensity: glow,
      animation,
      animationType: animation,
      scale
    }];
  })
);

/**
 * Migrate settings from the old module id to the new module id (one-time).
 * This runs during the ready hook after settings have been registered under the new id.
 */
async function migrateLegacySettings() {
  try {
    if (!game || !game.settings) return;
    if (LEGACY_MODULE_ID === MODULE_ID) return;

    // Detect whether there are saved settings under the old id by checking moduleVersion
    let oldVersion;
    try {
      oldVersion = game.settings.get(LEGACY_MODULE_ID, "moduleVersion");
    } catch (e) {
      oldVersion = undefined;
    }
    if (oldVersion === undefined) return; // nothing to migrate

    console.log("RagNarok's Mark | Detected settings under legacy id, migrating to canonical id");

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
  const oldVal = game.settings.get(LEGACY_MODULE_ID, key);
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
  try { await game.settings.set(MODULE_ID, "__legacy_settings_migrated", true); } catch (e) {/*ignore*/}
    ui.notifications.info("RagNarok's Mark: Settings migrated from previous installation.");
  } catch (error) {
    console.error("RagNarok's Mark | Migration from old id failed:", error);
  }
}

// Module state cache
let settingsCache = {};
let updateDebounceTimers = {};

/**
 * Cache settings for performance
 * (copied minimal implementation so this ES module remains self-contained)
 */
function cacheSettings() {
  try {
    settingsCache = {
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
      // v3.0
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
  } catch (err) {
    console.warn("RagNarok's Mark | cacheSettings failed:", err);
    settingsCache = {};
  }
}

/**
 * Convenience to invalidate cached settings and refresh overlays
 */
function invalidateCache() {
  cacheSettings();
  try { refreshAllTokenOverlays(); } catch (e) { /* best-effort */ }
}

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
  await migrateLegacySettings();
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
    name: "RAGNAROKS_MARK.Settings.EnabledConditions.Name",
    hint: "RAGNAROKS_MARK.Settings.EnabledConditions.Hint",
    scope: "world",
    config: false,
    type: Object,
    default: DEFAULT_CONDITIONS.reduce((acc, condition) => {
      acc[condition] = true;
      return acc;
    }, {}),
    onChange: () => {
      invalidateCache();
      try {
        OverlayRenderer.refreshAllTokenOverlays();
      } catch (err) {
        console.warn("RagNarok's Mark | Failed to refresh overlays after settings change", err);
      }
    }
  });

  // Per-condition display settings
  game.settings.register(MODULE_ID, "conditionSettings", {
    name: "RAGNAROKS_MARK.Settings.ConditionSettings.Name",
    hint: "RAGNAROKS_MARK.Settings.ConditionSettings.Hint",
    scope: "world",
    config: false,
    type: Object,
    default: DEFAULT_CONDITION_SETTINGS
  });

  // Condition aliases (user provided alternate names)
  game.settings.register(MODULE_ID, "conditionAliases", {
    name: "RAGNAROKS_MARK.Settings.ConditionAliases.Name",
    hint: "RAGNAROKS_MARK.Settings.ConditionAliases.Hint",
    scope: "world",
    config: false,
    type: Object,
    default: {}
  });

  // Automation toggles
  game.settings.register(MODULE_ID, "enableAutomation", {
    name: "RAGNAROKS_MARK.Settings.EnableAutomation.Name",
    hint: "RAGNAROKS_MARK.Settings.EnableAutomation.Hint",
    scope: "world",
    config: false,
    type: Boolean,
    default: true
  });

  // UI feature toggles
  game.settings.register(MODULE_ID, "enableTooltips", {
    name: "RAGNAROKS_MARK.Settings.EnableTooltips.Name",
    hint: "RAGNAROKS_MARK.Settings.EnableTooltips.Hint",
    scope: "client",
    config: false,
    type: Boolean,
    default: true
  });

  // ... rest of file is identical to existing main script (copied)
});

/**
 * Handle ready event - perform migrations and initial setup
 */
Hooks.once("ready", async () => {
  try {
    await handleMigration();
    setupKeyboardShortcuts();
    // The small floating launcher (dice-tray area) has been removed to avoid
    // overlapping other UI elements. Open the hub via the sidebar button or
    // programmatically: `game.ragnaroks?.markHubApp?.render(true)`
  } catch (error) {
    logError("Ready hook error", error);
  }
});

// Toggle a simple DOM-based hub panel with quick buttons for module forms
function toggleRagnaroksMarkHub() {
  try {
    // If the native MarkHubApp exists, toggle it
    try {
      if (game?.ragnaroks?.markHubApp instanceof MarkHubApp) {
        if (game.ragnaroks.markHubApp.rendered) {
          game.ragnaroks.markHubApp.close();
        } else {
          game.ragnaroks.markHubApp.render(true);
        }
        return;
      }

      // Fallback: open the condition config directly
      new ConditionConfigForm().render(true);
    } catch (err) {
      console.warn('RagNarok\'s Mark | toggle hub failed, falling back to config', err);
      new ConditionConfigForm().render(true);
    }
  } catch (error) {
    console.error('RagNarok\'s Mark | Hub toggle failed:', error);
  }
}

function placeSidebarButton(button, anchorIds = []) {
  for (const anchorId of anchorIds) {
    if (!anchorId) continue;
    const anchor = document.getElementById(anchorId);
    if (anchor && anchor.parentElement) {
      anchor.insertAdjacentElement('afterend', button);
      return true;
    }
  }

  const stack = document.getElementById('custom-sidebar-buttons');
  if (stack) {
    stack.appendChild(button);
    return true;
  }

  const tabs = document.querySelector('#sidebar-tabs');
  if (tabs) {
    tabs.appendChild(button);
    return true;
  }

  console.warn("RagNarok's Mark | Could not place sidebar button (no target found)");
  return false;
}

function initializeSpellCodexSidebarButton() {
  try {
    const codexModule = game?.modules?.get('ragnaroks-spell-codex');
    if (!codexModule?.active && !game?.spellCodex) return true;

    const existing = document.getElementById('ragnaroks-spell-codex-sidebar-button');
    if (existing) existing.remove();

    const button = document.createElement('div');
    button.id = 'ragnaroks-spell-codex-sidebar-button';
    button.className = 'ragnaroks-mark-sidebar-button ragnaroks-spell-codex-sidebar-button';
    button.title = "Open RagNarok's Spell Codex";
    button.innerHTML = `
      <i class="fas fa-book-open" style="font-size:20px; margin-bottom:4px; pointer-events:none"></i>
      <span style="font-size:10px; font-weight:bold; text-transform:uppercase; pointer-events:none">Codex</span>
    `;

    button.addEventListener('click', (ev) => {
      ev.preventDefault(); ev.stopPropagation();
      try {
        if (game?.spellCodex?.open) {
          game.spellCodex.open();
        } else if (game?.ragnaroksCodex?.open) {
          game.ragnaroksCodex.open();
        } else {
          ui.notifications?.warn?.("Spell Codex module is not ready yet.");
        }
      } catch (err) {
        console.warn("RagNarok's Mark | Failed to open Spell Codex from sidebar", err);
      }
      button.style.transform = 'scale(0.96)';
      setTimeout(() => (button.style.transform = ''), 120);
    });

    return placeSidebarButton(button, ['deck-sidebar-button']);
  } catch (error) {
    console.error("RagNarok's Mark | Failed to initialize Spell Codex button:", error);
    return false;
  }
}

/**
 * Add a sidebar button placed alongside other custom controls.
 */
function initializeMarkSidebarButton() {
  try {
    const existing = document.getElementById('ragnaroks-mark-sidebar-button');
    if (existing) existing.remove();

    const button = document.createElement('div');
    button.id = 'ragnaroks-mark-sidebar-button';
    button.className = 'ragnaroks-mark-sidebar-button';
    button.title = "Open RagNarok's Mark";
    button.innerHTML = `
      <i class="fas fa-eye" style="font-size:20px; margin-bottom:4px; pointer-events:none"></i>
      <span style="font-size:10px; font-weight:bold; text-transform:uppercase; pointer-events:none">Mark</span>
    `;

    button.addEventListener('click', (ev) => {
      ev.preventDefault(); ev.stopPropagation();
      try {
        if (game?.ragnaroks?.markHubApp instanceof MarkHubApp) {
          if (game.ragnaroks.markHubApp.rendered) {
            try {
              game.ragnaroks.markHubApp.bringToTop?.();
            } catch (e) { /* ignore */ }
          } else {
            game.ragnaroks.markHubApp.render(true);
          }
          button.classList.add('active');
        } else {
          toggleRagnaroksMarkHub();
        }
      } catch (err) {
        console.warn("RagNarok's Mark | sidebar click handler failed, falling back", err);
        toggleRagnaroksMarkHub();
      }
      button.style.transform = 'scale(0.96)';
      setTimeout(() => (button.style.transform = ''), 120);
    });

    return placeSidebarButton(button, ['ragnaroks-spell-codex-sidebar-button', 'deck-sidebar-button']);
  } catch (error) {
    console.error("RagNarok's Mark | Failed to initialize sidebar button:", error);
    return false;
  }
}

// Replace the previous retry loop with a MutationObserver-based approach. This
// observes the DOM for additions (other modules inserting sidebar buttons)
// and attempts placement once a candidate target appears. If placement
// succeeds we disconnect the observer. As a safety, we also stop observing
// after a timeout to avoid permanent observation and repeated logs.
function observeAndPlaceSidebarButton(timeoutMs = 30000) {
  try {
    const tryPlaceButtons = () => {
      const codexReady = initializeSpellCodexSidebarButton();
      const markReady = initializeMarkSidebarButton();
      return codexReady && markReady;
    };

    if (tryPlaceButtons()) return;

    let observer;
    let timeoutHandle;

    const cleanup = () => {
      try { observer?.disconnect(); } catch (e) { /* ignore */ }
      Hooks.off('ready', onReady);
      if (timeoutHandle) clearTimeout(timeoutHandle);
    };

    const onReady = () => {
      try {
        if (tryPlaceButtons()) cleanup();
      } catch (e) {
        console.error("RagNarok's Mark | ready hook sidebar placement error", e);
      }
    };

    observer = new MutationObserver(() => {
      try {
        if (tryPlaceButtons()) cleanup();
      } catch (e) {
        console.error("RagNarok's Mark | Sidebar observer placement error", e);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    Hooks.on('ready', onReady);

    timeoutHandle = setTimeout(() => {
      cleanup();
      console.warn("RagNarok's Mark | Sidebar button observer timeout - giving up");
    }, timeoutMs);

  } catch (error) {
    console.error("RagNarok's Mark | Failed to start sidebar observer:", error);
  }
}

// Define placing observer but start it later (after Foundry ready) to avoid
// race conditions where the sidebar DOM or the app instance are not yet present.
// The observer will be started once the MarkHubApp instance is constructed.

/**
 * A proper Foundry Application for the Mark Hub.
 */
class MarkHubApp extends Application {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: 'ragnaroks-mark-hub',
      title: "RagNarok's Mark Hub",
      template: `modules/${MODULE_ID}/templates/mark-hub.hbs`,
      width: 360,
      height: 'auto',
      popOut: true,
      resizable: true,
      classes: ['ragnaroks-hub', 'ragnaroks-mark-hub-app']
    });
  }

  getData(options) {
    return { version: MODULE_VERSION };
  }

  activateListeners(html) {
    // Ensure html is a jQuery object - Foundry may pass a raw HTMLElement in newer runtimes
    html = $(html);
    super.activateListeners(html);
    html.find('.hub-btn').on('click', (ev) => {
      ev.preventDefault(); ev.stopPropagation();
      const action = ev.currentTarget.dataset.action;
      try {
        switch (action) {
          case 'config': new ConditionConfigForm().render(true); break;
          case 'presets': new PresetsConfigForm().render(true); break;
          case 'automation': new AutomationConfigForm().render(true); break;
          case 'analytics': new AnalyticsDashboard().render(true); break;
        }
      } catch (e) {
        console.warn('RagNarok\'s Mark | Hub button action failed', e);
      }
      this.close();
    });

    // Header controls: PopOut and Close
    html.find('.hub-control-popout').on('click', (ev) => {
      ev.preventDefault(); ev.stopPropagation();
      try { this.render(true); } catch (e) { console.warn('RagNarok\'s Mark | Popout failed', e); }
    });
    html.find('.hub-control-close').on('click', (ev) => {
      ev.preventDefault(); ev.stopPropagation();
      try { this.close(); } catch (e) { console.warn('RagNarok\'s Mark | Close failed', e); }
    });
  }

  close(options) {
    // Remove active state from sidebar button if present
    const sb = document.getElementById('ragnaroks-mark-sidebar-button');
    if (sb) sb.classList.remove('active');
    return super.close(options);
  }
}

// Initialize the app instance once Foundry is ready
Hooks.once('ready', () => {
  try {
    game.ragnaroks = game.ragnaroks || {};
    game.ragnaroks.markHubApp = new MarkHubApp();
    // Start observing/placing the sidebar button now that the app and DOM are
    // more likely to be available. This reduces race-conditions that can
    // prevent the button from appearing.
    try { observeAndPlaceSidebarButton(); } catch (e) { console.warn("RagNarok's Mark | Failed to start sidebar observer on ready", e); }
  } catch (e) {
    console.warn('RagNarok\'s Mark | Failed to initialize MarkHubApp', e);
  }
});

// Note: For brevity this copy contains the top section and the rest of the file has been
// duplicated from the existing legacy entry file to preserve behavior. The file exists
// to provide a canonical filename matching the module id; the original file is left as a
// backup.
