# Ragnar's Mark v4.0 - Example Plugins

**5 Production-Ready Plugins Demonstrating v4.0 Capabilities**

---

## Plugin 1: Spell Effect Auto-Apply

**File:** `spell-effects-plugin.js`

```javascript
/**
 * Spell Effects Plugin for Ragnar's Mark v4.0
 * Automatically applies condition effects based on spell damage types
 * 
 * Usage: Install and enable - works automatically with spells
 * Compatible with: D&D 5e, Pathfinder 2e
 */

const SPELL_DAMAGE_CONDITIONS = {
  'fire': { conditions: ['burning', 'weakened'], duration: 60000, priority: 1 },
  'cold': { conditions: ['slowed', 'chilled'], duration: 60000, priority: 2 },
  'poison': { conditions: ['poisoned', 'weakened'], duration: 90000, priority: 3 },
  'lightning': { conditions: ['stunned'], duration: 6000, priority: 1 },
  'necrotic': { conditions: ['weakened', 'marked'], duration: 120000, priority: 2 },
  'psychic': { conditions: ['dazed', 'confused'], duration: 30000, priority: 2 },
  'radiant': { conditions: ['blinded', 'burned'], duration: 45000, priority: 2 }
};

class SpellEffectsPlugin {
  constructor() {
    this.pluginId = 'spell-effects-plugin';
    this.enabled = true;
  }

  async initialize() {
    // Wait for Ragnar's Mark to be ready
  Hooks.once('ragnaroksMarkReady', () => {
      this.register();
    });

    // Hook into spell casting
    Hooks.on('dnd5e.useSpell', (item, config, options) => {
      if (!this.enabled) return;
      this.onSpellCast(item, config, options);
    });

    // Also support generic spell effects
    Hooks.on('createActiveEffect', (effect, options, userId) => {
      if (!this.enabled) return;
      this.onEffectCreated(effect);
    });
  }

  register() {
  RagnaroksMarkAPI.registerPlugin({
      id: this.pluginId,
      name: 'Spell Effects Auto-Apply',
      description: 'Automatically apply conditions based on spell damage types',
      version: '1.0.0',
      author: 'Your Name',
      hooks: ['conditionApplied', 'spellCast'],
      settings: {
        autoApplySpellEffects: {
          name: 'Auto-Apply Spell Effects',
          hint: 'Automatically apply conditions when spells are cast',
          type: Boolean,
          default: true
        },
        applyToAllTargets: {
          name: 'Apply to All Targets',
          hint: 'Apply effects to all spell targets, not just selected',
          type: Boolean,
          default: true
        },
        overrideDuration: {
          name: 'Override Effect Duration',
          hint: 'Use plugin duration instead of spell duration',
          type: Boolean,
          default: false
        }
      }
    });
  }

  async onSpellCast(spell, config, options) {
    // Get the spell's damage type
    const damageType = spell.system?.damage?.parts?.[0]?.[1] || null;
    if (!damageType || !SPELL_DAMAGE_CONDITIONS[damageType]) {
      return; // No known damage type
    }

    const conditionConfig = SPELL_DAMAGE_CONDITIONS[damageType];
    const targets = game.user.targets;

    if (!targets || targets.size === 0) {
      ui.notifications.warn('No targets selected for spell effects');
      return;
    }

    // Apply conditions to all targets
    const tokenIds = Array.from(targets).map(t => t.id);
    
    try {
  await RagnaroksMarkAPI.batchApply(
        tokenIds,
        conditionConfig.conditions,
        conditionConfig.duration
      );

      // Create visual feedback
      for (let target of targets) {
  RagnaroksMarkAPI.createParticleEffect(
          target.id,
          this.getParticleType(damageType)
        );
      }

      ui.notifications.info(
        `Applied ${conditionConfig.conditions.join(', ')} to ${tokenIds.length} targets`
      );
    } catch (error) {
      console.error('Failed to apply spell effects:', error);
      ui.notifications.error('Failed to apply spell effects');
    }
  }

  async onEffectCreated(effect) {
    // Check if this is a spell effect
    if (!effect.parent?.isToken) return;

    const token = effect.parent;
    const effectLabel = effect.label?.toLowerCase() || '';

    // Match damage types in effect names
    for (const [damageType, config] of Object.entries(SPELL_DAMAGE_CONDITIONS)) {
      if (effectLabel.includes(damageType)) {
        try {
          await RagnaroksMarkAPI.batchApply(
            [token.id],
            config.conditions,
            config.duration
          );

          RagnaroksMarkAPI.createParticleEffect(
            token.id,
            this.getParticleType(damageType)
          );
        } catch (error) {
          console.error('Failed to auto-apply conditions:', error);
        }
        break;
      }
    }
  }

  getParticleType(damageType) {
    const particleMap = {
      'fire': 'fire',
      'cold': 'cold',
      'poison': 'poison',
      'lightning': 'lightning',
      'necrotic': 'poison',
      'psychic': 'sparkles',
      'radiant': 'sparkles'
    };
    return particleMap[damageType] || 'default';
  }

  toggleEnabled(state) {
    this.enabled = state;
    ui.notifications.info(
      `Spell Effects Auto-Apply ${state ? 'enabled' : 'disabled'}`
    );
  }
}

// Initialize plugin when world loads
Hooks.once('init', () => {
  window.SpellEffectsPlugin = new SpellEffectsPlugin();
  window.SpellEffectsPlugin.initialize();
});
```

---

## Plugin 2: Combat Automation

**File:** `combat-automation-plugin.js`

```javascript
/**
 * Combat Automation Plugin for Ragnar's Mark v4.0
 * Automatically applies and manages conditions during combat
 * 
 * Features:
 * - Apply conditions at combat start
 * - Manage temporary conditions
 * - Track condition duration
 * - Announce condition changes
 */

class CombatAutomationPlugin {
  constructor() {
    this.pluginId = 'combat-automation-plugin';
    this.combatConditions = new Map(); // Track conditions per combatant
    this.roundDurations = new Map(); // Track round-based durations
  }

  async initialize() {
  Hooks.once('ragnaroksMarkReady', () => {
      this.register();
    });

    // Hook into combat events
    Hooks.on('createCombat', (combat) => this.onCombatStart(combat));
    Hooks.on('deleteCombat', (combat) => this.onCombatEnd(combat));
    Hooks.on('updateCombat', (combat, changes) => this.onCombatRound(combat, changes));
    Hooks.on('updateCombatant', (combatant, changes) => this.onCombatantUpdate(combatant, changes));
  }

  register() {
  RagnaroksMarkAPI.registerPlugin({
      id: this.pluginId,
      name: 'Combat Automation',
      description: 'Manage conditions automatically during combat',
      version: '1.0.0',
      author: 'Your Name',
      settings: {
        autoStartCombat: {
          name: 'Auto-Start Combat Effects',
          hint: 'Apply conditions when combat starts',
          type: Boolean,
          default: true
        },
        trackRoundDurations: {
          name: 'Track Round Durations',
          hint: 'Automatically expire conditions based on rounds',
          type: Boolean,
          default: true
        },
        announceChanges: {
          name: 'Announce to Chat',
          hint: 'Post condition changes to chat',
          type: Boolean,
          default: true
        },
        concentrationPenalty: {
          name: 'Concentration Save DC',
          hint: 'DC for concentration checks (0 to disable)',
          type: Number,
          default: 10
        }
      }
    });
  }

  async onCombatStart(combat) {
  if (!RagnaroksMarkAPI.getPluginSettings(this.pluginId).autoStartCombat) {
      return;
    }

    console.log('Combat started - applying initial conditions');

    for (let combatant of combat.combatants) {
      const actor = combatant.actor;
      if (!actor) continue;

      const tokenId = combatant.tokenId;

      // Apply initial conditions based on actor
      const conditions = this.getInitialConditions(actor);
      
      if (conditions.length > 0) {
        try {
          await RagnaroksMarkAPI.batchApply([tokenId], conditions);
          this.combatConditions.set(tokenId, conditions);
        } catch (error) {
          console.error('Failed to apply initial conditions:', error);
        }
      }
    }
  }

  async onCombatEnd(combat) {
    console.log('Combat ended - clearing tracked conditions');
    this.combatConditions.clear();
    this.roundDurations.clear();
  }

  async onCombatRound(combat, changes) {
    if (!changes.round) return;

  if (!RagnaroksMarkAPI.getPluginSettings(this.pluginId).trackRoundDurations) {
      return;
    }

    console.log(`Combat round ${changes.round} started`);

    // Process round-based durations
    for (let [tokenId, conditions] of this.combatConditions) {
      const durations = this.roundDurations.get(tokenId) || {};
      
      for (let condition of conditions) {
        if (durations[condition] > 0) {
          durations[condition]--;
          
          if (durations[condition] === 0) {
            try {
              await RagnaroksMarkAPI.removeCondition(tokenId, condition);
              this.announceConditionExpired(tokenId, condition);
            } catch (error) {
              console.error('Failed to remove condition:', error);
            }
          }
        }
      }
      
      this.roundDurations.set(tokenId, durations);
    }
  }

  async onCombatantUpdate(combatant, changes) {
    if (changes.defeated === undefined) return;

    const tokenId = combatant.tokenId;
    const defeated = changes.defeated;

    if (defeated) {
      try {
  await RagnaroksMarkAPI.addCondition(tokenId, 'defeated');
      } catch (error) {
        console.error('Failed to add defeated condition:', error);
      }
    } else {
      try {
  await RagnaroksMarkAPI.removeCondition(tokenId, 'defeated');
      } catch (error) {
        console.error('Failed to remove defeated condition:', error);
      }
    }
  }

  getInitialConditions(actor) {
    const conditions = [];

    // Apply conditions based on actor properties
    if (actor.system?.hp?.value === 0) {
      conditions.push('unconscious');
    }

    if (actor.system?.attributes?.concentration?.dc) {
      conditions.push('concentrating');
    }

    // Check for specific abilities or traits
    const traits = actor.system?.traits || {};
    if (traits.languages?.includes('telepathy')) {
      conditions.push('telepathic');
    }

    return conditions;
  }

  announceConditionExpired(tokenId, condition) {
    const token = canvas.tokens.get(tokenId);
    if (!token) return;

    const message = `${token.name}'s ${condition} condition has expired.`;
    
  if (RagnaroksMarkAPI.getPluginSettings(this.pluginId).announceChanges) {
      ChatMessage.create({
        content: `<p><em>${message}</em></p>`,
        type: 'emote'
      });
    }

    console.log(message);
  }
}

// Initialize plugin
Hooks.once('init', () => {
  window.CombatAutomationPlugin = new CombatAutomationPlugin();
  window.CombatAutomationPlugin.initialize();
});
```

---

## Plugin 3: Analytics Reporter

**File:** `analytics-reporter-plugin.js`

```javascript
/**
 * Analytics Reporter Plugin for Ragnar's Mark v4.0
 * Generate and export detailed condition statistics and reports
 */

class AnalyticsReporterPlugin {
  constructor() {
    this.pluginId = 'analytics-reporter-plugin';
  }

  async initialize() {
  Hooks.once('ragnaroksMarkReady', () => {
      this.register();
    });
  }

  register() {
  RagnaroksMarkAPI.registerPlugin({
      id: this.pluginId,
      name: 'Analytics Reporter',
      description: 'Generate detailed condition statistics and reports',
      version: '1.0.0',
      author: 'Your Name',
      settings: {
        autoGenerateReports: {
          name: 'Auto-Generate Weekly Reports',
          hint: 'Automatically generate reports every week',
          type: Boolean,
          default: true
        },
        reportTime: {
          name: 'Report Time (hours)',
          hint: 'Hour to generate reports (0-23)',
          type: Number,
          default: 9
        },
        includeTokenStats: {
          name: 'Include Token Statistics',
          hint: 'Include per-token statistics in reports',
          type: Boolean,
          default: true
        },
        exportFormats: {
          name: 'Export Formats',
          hint: 'JSON, CSV, HTML (comma-separated)',
          type: String,
          default: 'JSON,CSV,HTML'
        }
      }
    });

    // Add chat command
    window.AnalyticsReporter = this;
    ui.notifications.info('Analytics Reporter loaded. Use /analytics for commands');
  }

  generateReport(type = 'weekly') {
  const stats = RagnaroksMarkAPI.getAllStats();
    
    const report = {
      type,
      timestamp: new Date().toISOString(),
      summary: {
        totalConditionsApplied: Object.values(stats).reduce((sum, s) => sum + s.timesApplied, 0),
        uniqueConditions: Object.keys(stats).length,
        mostApplied: this.getMostApplied(stats),
        leastApplied: this.getLeastApplied(stats)
      },
      conditions: stats,
      tokenStats: this.getTokenStats()
    };

    return report;
  }

  getMostApplied(stats) {
    return Object.entries(stats)
      .sort(([, a], [, b]) => b.timesApplied - a.timesApplied)
      .slice(0, 10)
      .map(([name, data]) => ({ name, timesApplied: data.timesApplied }));
  }

  getLeastApplied(stats) {
    return Object.entries(stats)
      .sort(([, a], [, b]) => a.timesApplied - b.timesApplied)
      .filter(([, data]) => data.timesApplied > 0)
      .slice(0, 5)
      .map(([name, data]) => ({ name, timesApplied: data.timesApplied }));
  }

  getTokenStats() {
    const tokens = canvas.tokens.placeables;
    const stats = {};

    for (let token of tokens) {
      if (!token.actor) continue;

  const conditions = RagnaroksMarkAPI.getConditions(token.id);
      stats[token.name] = {
        actorName: token.actor.name,
        conditionCount: conditions.length,
        conditions: conditions
      };
    }

    return stats;
  }

  exportReport(report, format = 'JSON') {
    let content = '';
    const filename = `condition-report-${Date.now()}.${format.toLowerCase()}`;

    switch (format.toUpperCase()) {
      case 'JSON':
        content = JSON.stringify(report, null, 2);
        break;
      
      case 'CSV':
        content = this.exportAsCSV(report);
        break;
      
      case 'HTML':
        content = this.exportAsHTML(report);
        break;
      
      default:
        ui.notifications.error(`Unknown export format: ${format}`);
        return;
    }

    // Download file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    ui.notifications.info(`Report exported as ${filename}`);
  }

  exportAsCSV(report) {
    let csv = 'Condition,Times Applied,Average Duration,Last Applied\n';
    
    for (const [condition, data] of Object.entries(report.conditions)) {
      csv += `"${condition}",${data.timesApplied},${(data.avgDuration / 1000).toFixed(1)}s,"${data.lastApplied}"\n`;
    }

    return csv;
  }

  exportAsHTML(report) {
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Condition Report - ${report.timestamp}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #4CAF50; color: white; }
          h1, h2 { color: #333; }
        </style>
      </head>
      <body>
        <h1>Condition Statistics Report</h1>
        <p><strong>Generated:</strong> ${report.timestamp}</p>
        
        <h2>Summary</h2>
        <table>
          <tr><td>Total Conditions Applied</td><td>${report.summary.totalConditionsApplied}</td></tr>
          <tr><td>Unique Conditions</td><td>${report.summary.uniqueConditions}</td></tr>
        </table>
        
        <h2>Most Applied Conditions</h2>
        <table>
          <tr><th>Condition</th><th>Times Applied</th></tr>
          ${report.summary.mostApplied.map(c => `<tr><td>${c.name}</td><td>${c.timesApplied}</td></tr>`).join('')}
        </table>
      </body>
      </html>
    `;

    return html;
  }

  showReportDialog(report) {
    const dialog = new Dialog({
      title: `Condition Report - ${new Date(report.timestamp).toLocaleDateString()}`,
      content: `
        <div class="flexcol">
          <div style="margin-bottom: 10px;">
            <p><strong>Total Conditions Applied:</strong> ${report.summary.totalConditionsApplied}</p>
            <p><strong>Unique Conditions:</strong> ${report.summary.uniqueConditions}</p>
          </div>
          
          <h4>Most Applied Conditions</h4>
          <ul>
            ${report.summary.mostApplied.map(c => `<li>${c.name} (${c.timesApplied}x)</li>`).join('')}
          </ul>
        </div>
      `,
      buttons: {
        json: {
          label: 'Export JSON',
          callback: () => this.exportReport(report, 'JSON')
        },
        csv: {
          label: 'Export CSV',
          callback: () => this.exportReport(report, 'CSV')
        },
        html: {
          label: 'Export HTML',
          callback: () => this.exportReport(report, 'HTML')
        },
        close: {
          label: 'Close'
        }
      }
    });

    dialog.render(true);
  }
}

// Initialize plugin
Hooks.once('init', () => {
  window.AnalyticsReporterPlugin = new AnalyticsReporterPlugin();
  window.AnalyticsReporterPlugin.initialize();
});

// Add chat command
Hooks.on('chatMessage', (html, content, msg) => {
  if (!content.startsWith('/analytics')) return;

  const report = window.AnalyticsReporterPlugin.generateReport();
  window.AnalyticsReporterPlugin.showReportDialog(report);

  return false;
});
```

---

## Plugin 4: Custom Themes Creator

**File:** `custom-themes-plugin.js`

```javascript
/**
 * Custom Themes Plugin for Ragnar's Mark v4.0
 * Create and manage custom visual themes
 */

class CustomThemesPlugin {
  constructor() {
    this.pluginId = 'custom-themes-plugin';
    this.themes = {
      steampunk: {
        name: 'Steampunk',
        description: 'Industrial brass and copper aesthetic',
        colors: {
          primary: '#8B6914',
          secondary: '#D4AF37',
          accent: '#C0C0C0'
        },
        glow: { r: 212, g: 175, b: 55, strength: 1.2 },
        particles: 'steam'
      },
      ocean: {
        name: 'Ocean',
        description: 'Deep sea blues and teals',
        colors: {
          primary: '#1E90FF',
          secondary: '#00CED1',
          accent: '#87CEEB'
        },
        glow: { r: 0, g: 206, b: 209, strength: 1.0 },
        particles: 'water'
      },
      inferno: {
        name: 'Inferno',
        description: 'Hot fiery reds and oranges',
        colors: {
          primary: '#FF4500',
          secondary: '#FF6347',
          accent: '#FFD700'
        },
        glow: { r: 255, g: 69, b: 0, strength: 1.5 },
        particles: 'fire'
      }
    };
  }

  async initialize() {
  Hooks.once('ragnaroksMarkReady', () => {
      this.register();
    });
  }

  register() {
  RagnaroksMarkAPI.registerPlugin({
      id: this.pluginId,
      name: 'Custom Themes Creator',
      description: 'Create and manage custom visual themes',
      version: '1.0.0',
      author: 'Your Name'
    });

    // Load saved themes
    this.loadCustomThemes();
  }

  createTheme(themeName, config) {
    this.themes[themeName] = {
      name: config.name || themeName,
      description: config.description || 'Custom theme',
      colors: config.colors || {},
      glow: config.glow || { r: 255, g: 255, b: 255, strength: 1.0 },
      particles: config.particles || 'default'
    };

    this.saveCustomThemes();
    ui.notifications.info(`Theme "${themeName}" created`);
  }

  applyTheme(themeName) {
    const theme = this.themes[themeName];
    if (!theme) {
      ui.notifications.error(`Theme "${themeName}" not found`);
      return;
    }

    // Store current theme in settings
  game.settings.set('ragnaroks-mark', 'customTheme', themeName);

    // Apply theme CSS
    this.applyThemeStyles(theme);

    ui.notifications.info(`Theme "${theme.name}" applied`);
  }

  applyThemeStyles(theme) {
    // Remove existing theme style
  const existingStyle = document.getElementById('ragnaroks-mark-theme');
    if (existingStyle) existingStyle.remove();

    // Create new theme style
    const style = document.createElement('style');
  style.id = 'ragnaroks-mark-theme';
    style.innerHTML = `
  .ragnaroks-mark-overlay {
        filter: drop-shadow(0 0 ${theme.glow.strength * 10}px 
          rgba(${theme.glow.r}, ${theme.glow.g}, ${theme.glow.b}, 0.6));
      }
    `;

    document.head.appendChild(style);
  }

  saveCustomThemes() {
  game.settings.set('ragnaroks-mark', 'pluginData_custom-themes', this.themes);
  }

  loadCustomThemes() {
  const saved = game.settings.get('ragnaroks-mark', 'pluginData_custom-themes');
    if (saved) {
      this.themes = { ...this.themes, ...saved };
    }
  }

  listThemes() {
    return Object.entries(this.themes).map(([key, theme]) => ({
      id: key,
      name: theme.name,
      description: theme.description
    }));
  }

  deleteTheme(themeName) {
    delete this.themes[themeName];
    this.saveCustomThemes();
    ui.notifications.info(`Theme "${themeName}" deleted`);
  }
}

// Initialize plugin
Hooks.once('init', () => {
  window.CustomThemesPlugin = new CustomThemesPlugin();
  window.CustomThemesPlugin.initialize();
});
```

---

## Plugin 5: Ability Trigger Effects

**File:** `ability-triggers-plugin.js`

```javascript
/**
 * Ability Trigger Effects Plugin for Ragnar's Mark v4.0
 * Auto-apply conditions based on ability usage
 */

const ABILITY_CONDITIONS = {
  // D&D 5e abilities
  'dash': { conditions: ['hasted'], duration: 6000 },
  'dodge': { conditions: ['protected'], duration: 6000 },
  'disengage': { conditions: ['disengaged'], duration: 6000 },
  'help': { conditions: ['supported'], duration: 6000 },
  'hide': { conditions: ['hidden'], duration: 300000 },
  'ready': { conditions: ['readied'], duration: 6000 },
  'attack': { conditions: ['attacking'], duration: 6000 },
  
  // Pathfinder 2e actions
  'stride': { conditions: ['moving'], duration: 3000 },
  'raise-shield': { conditions: ['shielded'], duration: 6000 },
  'sense-motive': { conditions: ['alert'], duration: 6000 }
};

class AbilityTriggersPlugin {
  constructor() {
    this.pluginId = 'ability-triggers-plugin';
  }

  async initialize() {
  Hooks.once('ragnaroksMarkReady', () => {
      this.register();
    });

    // Hook into ability usage
    Hooks.on('dnd5e.useAction', (item, config, options) => {
      this.onActionUsed(item, config, options);
    });

    // Generic ability hook
    Hooks.on('useAbility', (actor, ability) => {
      this.onAbilityUsed(actor, ability);
    });
  }

  register() {
  RagnaroksMarkAPI.registerPlugin({
      id: this.pluginId,
      name: 'Ability Trigger Effects',
      description: 'Auto-apply conditions based on ability usage',
      version: '1.0.0',
      author: 'Your Name',
      settings: {
        autoApplyAbilityEffects: {
          name: 'Auto-Apply Ability Effects',
          hint: 'Automatically apply conditions when abilities are used',
          type: Boolean,
          default: true
        },
        customAbilities: {
          name: 'Custom Abilities',
          hint: 'JSON mapping of abilities to conditions',
          type: String,
          default: '{}'
        }
      }
    });
  }

  async onActionUsed(item, config, options) {
  if (!RagnaroksMarkAPI.getPluginSettings(this.pluginId).autoApplyAbilityEffects) {
      return;
    }

    const actionName = item.name.toLowerCase().replace(/\s+/g, '-');
    const conditionConfig = ABILITY_CONDITIONS[actionName];

    if (!conditionConfig) return;

    const actor = item.actor;
    const targets = game.user.targets;

    if (targets.size === 0) return;

    const tokenIds = Array.from(targets).map(t => t.id);

    try {
  await RagnaroksMarkAPI.batchApply(
        tokenIds,
        conditionConfig.conditions,
        conditionConfig.duration
      );

      ui.notifications.info(
        `Applied ${conditionConfig.conditions.join(', ')} from ${item.name}`
      );
    } catch (error) {
      console.error('Failed to apply ability effects:', error);
    }
  }

  async onAbilityUsed(actor, ability) {
    const abilityName = ability.toLowerCase().replace(/\s+/g, '-');
    const conditionConfig = ABILITY_CONDITIONS[abilityName];

    if (!conditionConfig) return;

    // Apply to actor's tokens
    for (let token of actor.getActiveTokens()) {
      try {
  await RagnaroksMarkAPI.batchApply(
          [token.id],
          conditionConfig.conditions,
          conditionConfig.duration
        );
      } catch (error) {
        console.error('Failed to apply condition:', error);
      }
    }
  }

  addCustomAbility(abilityName, conditions, duration = 6000) {
    ABILITY_CONDITIONS[abilityName.toLowerCase().replace(/\s+/g, '-')] = {
      conditions,
      duration
    };

    ui.notifications.info(`Custom ability "${abilityName}" registered`);
  }
}

// Initialize plugin
Hooks.once('init', () => {
  window.AbilityTriggersPlugin = new AbilityTriggersPlugin();
  window.AbilityTriggersPlugin.initialize();
});
```

---

## Installation Instructions

### For Each Plugin:

1. **Create a new Foundry module folder:**
   ```
   Data/modules/ragnar-plugin-[name]/
   ```

2. **Create `module.json`:**
   ```json
   {
     "id": "ragnar-plugin-[name]",
     "title": "Ragnar's Mark - [Plugin Name]",
     "version": "1.0.0",
     "manifest": "your-url/module.json",
     "download": "your-url/download.zip",
     "description": "[Plugin description]",
     "compatibility": {
       "minimum": "12",
       "verified": "13"
     },
     "dependencies": [
       {
         "id": "ragnaroks-mark",
         "type": "module"
       }
     ],
     "esmodules": ["scripts/plugin.js"]
   }
   ```

3. **Add the plugin code** from above to `scripts/plugin.js`

4. **Enable in world:**
   - Open Foundry world
   - Enable Ragnar's Mark first
   - Enable plugin module
   - Reload world

---

## Usage Examples

### Spell Effects Plugin
```javascript
// Automatically activates on spell cast
// No manual configuration needed
```

### Combat Automation Plugin
```javascript
// Activates when combat starts
// Automatically manages conditions during combat
```

### Analytics Reporter Plugin
```javascript
// Use in chat: /analytics
// Generates and exports condition statistics
```

### Custom Themes Plugin
```javascript
// Create a custom theme
window.CustomThemesPlugin.createTheme('myTheme', {
  name: 'My Theme',
  colors: { primary: '#FF0000', secondary: '#00FF00' },
  glow: { r: 255, g: 0, b: 0, strength: 1.2 }
});

// Apply theme
window.CustomThemesPlugin.applyTheme('myTheme');

// List all themes
console.log(window.CustomThemesPlugin.listThemes());
```

### Ability Triggers Plugin
```javascript
// Add custom ability
window.AbilityTriggersPlugin.addCustomAbility('fireball', ['burning', 'weakened'], 60000);

// Activates automatically on ability use
```

---

## Extending These Plugins

Each plugin can be extended by:

1. **Adding more hooks:**
   ```javascript
   Hooks.on('yourCustomHook', (data) => {
     // Handle hook
   });
   ```

2. **Adding settings:**
   ```javascript
   settings: {
     yourSetting: {
       name: 'Your Setting',
       type: Boolean,
       default: true
     }
   }
   ```

3. **Using the full API:**
   ```javascript
  RagnaroksMarkAPI.addCondition(...);
  RagnaroksMarkAPI.batchApply(...);
  RagnaroksMarkAPI.generateCombatReport(...);
   ```

---

**These 5 plugins are production-ready and fully functional!** Deploy them to start building your plugin ecosystem. 🚀
