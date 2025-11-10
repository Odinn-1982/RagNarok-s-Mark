/**
 * RagNarok's Mark - Extended Features Module
 * Contains all advanced features: system presets, condition groups, animations, etc.
 */

// System-specific presets for quick setup
export const SYSTEM_PRESETS = {
  daggerheart: {
    name: "Daggerheart (Default)",
    conditions: {
      vulnerable: { color: "#FF6B6B", glowIntensity: 1.0, animationType: "pulse", priority: 1, group: "conditions" },
      hidden: { color: "#4A90E2", glowIntensity: 0.8, animationType: "fade", priority: 3, group: "conditions" },
      restrained: { color: "#FFD700", glowIntensity: 0.9, animationType: "none", priority: 2, group: "conditions" },
      unconscious: { color: "#808080", glowIntensity: 0.7, animationType: "fade", priority: 4, group: "conditions" },
      defeated: { color: "#8B4513", glowIntensity: 1.0, animationType: "pulse", priority: 5, group: "conditions" },
      dead: { color: "#000000", glowIntensity: 0.5, animationType: "fade", priority: 6, group: "conditions" }
    }
  },
  dnd5e: {
    name: "D&D 5e",
    conditions: {
      blinded: { color: "#404040", glowIntensity: 0.8, animationType: "fade", priority: 1, group: "disadvantage" },
      charmed: { color: "#FF69B4", glowIntensity: 1.0, animationType: "pulse", priority: 2, group: "control" },
      deafened: { color: "#87CEEB", glowIntensity: 0.7, animationType: "none", priority: 3, group: "disadvantage" },
      frightened: { color: "#FF4500", glowIntensity: 1.2, animationType: "bounce", priority: 4, group: "control" },
      grappled: { color: "#228B22", glowIntensity: 0.9, animationType: "none", priority: 5, group: "restrained" },
      incapacitated: { color: "#696969", glowIntensity: 0.8, animationType: "fade", priority: 6, group: "disabled" },
      invisible: { color: "#E6E6FA", glowIntensity: 0.5, animationType: "fade", priority: 2, group: "hidden" },
      paralyzed: { color: "#00CED1", glowIntensity: 1.0, animationType: "none", priority: 7, group: "disabled" },
      petrified: { color: "#A9A9A9", glowIntensity: 0.7, animationType: "none", priority: 8, group: "disabled" },
      poisoned: { color: "#32CD32", glowIntensity: 0.9, animationType: "pulse", priority: 3, group: "damage" },
      prone: { color: "#D2B48C", glowIntensity: 0.6, animationType: "none", priority: 2, group: "disadvantage" },
      restrained: { color: "#FFD700", glowIntensity: 0.9, animationType: "none", priority: 5, group: "restrained" },
      stunned: { color: "#FFD700", glowIntensity: 1.2, animationType: "bounce", priority: 9, group: "disabled" },
      unconscious: { color: "#808080", glowIntensity: 0.7, animationType: "fade", priority: 10, group: "disabled" }
    }
  },
  pathfinder2e: {
    name: "Pathfinder 2e",
    conditions: {
      blinded: { color: "#404040", glowIntensity: 0.8, animationType: "fade", priority: 1, group: "perception" },
      broken: { color: "#8B0000", glowIntensity: 0.9, animationType: "pulse", priority: 2, group: "damage" },
      clumsy: { color: "#FFD700", glowIntensity: 0.7, animationType: "bounce", priority: 3, group: "disadvantage" },
      confused: { color: "#FF00FF", glowIntensity: 1.0, animationType: "bounce", priority: 4, group: "control" },
      controlled: { color: "#FF69B4", glowIntensity: 1.0, animationType: "pulse", priority: 5, group: "control" },
      drained: { color: "#696969", glowIntensity: 0.7, animationType: "fade", priority: 6, group: "damage" },
      dying: { color: "#000000", glowIntensity: 0.5, animationType: "fade", priority: 11, group: "critical" },
      enfeebled: { color: "#A9A9A9", glowIntensity: 0.8, animationType: "fade", priority: 7, group: "damage" },
      fascinated: { color: "#FF00FF", glowIntensity: 0.9, animationType: "pulse", priority: 5, group: "control" },
      fatigued: { color: "#808080", glowIntensity: 0.7, animationType: "fade", priority: 8, group: "disadvantage" },
      fleeing: { color: "#FF4500", glowIntensity: 1.0, animationType: "bounce", priority: 5, group: "control" },
      frightened: { color: "#FF4500", glowIntensity: 1.2, animationType: "bounce", priority: 9, group: "control" },
      grabbed: { color: "#228B22", glowIntensity: 0.9, animationType: "none", priority: 10, group: "restrained" },
      immobilized: { color: "#00CED1", glowIntensity: 1.0, animationType: "none", priority: 11, group: "restrained" },
      invisible: { color: "#E6E6FA", glowIntensity: 0.5, animationType: "fade", priority: 2, group: "hidden" },
      quickened: { color: "#00FF00", glowIntensity: 1.0, animationType: "pulse", priority: 1, group: "beneficial" },
      restrained: { color: "#FFD700", glowIntensity: 0.9, animationType: "none", priority: 10, group: "restrained" },
      slowed: { color: "#87CEEB", glowIntensity: 0.8, animationType: "none", priority: 2, group: "disadvantage" },
      stunned: { color: "#FFD700", glowIntensity: 1.2, animationType: "bounce", priority: 12, group: "disabled" },
      unconscious: { color: "#808080", glowIntensity: 0.7, animationType: "fade", priority: 13, group: "critical" }
    }
  }
};

// Sound effect URLs (can be customized)
export const SOUND_EFFECTS = {
  applied: "modules/ragnaroks-mark/sounds/condition-applied.ogg",
  removed: "modules/ragnaroks-mark/sounds/condition-removed.ogg"
};

// Animation speed presets (milliseconds for cycle time)
export const ANIMATION_SPEEDS = {
  verySlow: 3000,
  slow: 2000,
  normal: 1500,
  fast: 1000,
  veryFast: 500
};

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  toggleOverlays: { key: "o", ctrl: true, shift: false, alt: true }, // Ctrl+Alt+O
  openConfig: { key: "c", ctrl: true, shift: false, alt: true }     // Ctrl+Alt+C
};

/**
 * Priority system - determines which conditions are shown when space is limited
 */
export function getConditionPriority(conditionKey, conditionSettings) {
  const settings = conditionSettings[conditionKey];
  return settings?.priority || 999; // Lower number = higher priority
}

/**
 * Group system for organizing conditions
 */
export function getConditionGroup(conditionKey, conditionSettings) {
  const settings = conditionSettings[conditionKey];
  return settings?.group || "other";
}

/**
 * Apply system preset
 */
export function applySystemPreset(systemKey) {
  const preset = SYSTEM_PRESETS[systemKey];
  if (!preset) {
    console.warn(`RagNarok's Mark | Preset not found: ${systemKey}`);
    return null;
  }

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

  return { enabledConditions, conditionSettings };
}
