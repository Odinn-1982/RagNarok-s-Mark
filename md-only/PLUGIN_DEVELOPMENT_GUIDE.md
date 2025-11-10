# Ragnar's Mark v4.0 - Plugin Development Guide

**Complete guide to building plugins for Ragnar's Mark using the v4.0 Plugin Architecture**

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Plugin Architecture](#plugin-architecture)
3. [Core Concepts](#core-concepts)
4. [Plugin Lifecycle](#plugin-lifecycle)
5. [API Reference](#api-reference)
6. [Hook System](#hook-system)
7. [Best Practices](#best-practices)
8. [Example Plugins](#example-plugins)
9. [Troubleshooting](#troubleshooting)
10. [Template Repository](#template-repository)

---

## Getting Started

### What is a Ragnar's Mark Plugin?

A plugin is a Foundry VTT module that extends Ragnar's Mark functionality. Plugins can:
- Add custom condition types
- Modify how conditions are applied
- Integrate with other modules
- Create custom UI elements
- Process analytics data
- Define custom effects

### Requirements

- Foundry VTT v12+ installed
- Understanding of JavaScript (ES6+)
- Ragnar's Mark v4.0+ enabled
- Basic Foundry module knowledge

### Quick Setup

1. Create a new Foundry module in `Data/modules/your-plugin-name/`
2. Create `module.json` with proper manifest
3. Create `scripts/plugin.js` with your plugin code
4. Enable in Foundry world
5. Use `RagnarsMarkAPI.registerPlugin()` to register

---

## Plugin Architecture

### File Structure

```
your-plugin-name/
├── module.json              # Module manifest
├── scripts/
│   ├── plugin.js           # Main plugin file
│   └── hooks.js            # Hook handlers (optional)
├── templates/              # Handlebars templates (optional)
├── styles/
│   └── plugin.css          # Plugin styles (optional)
└── README.md               # Documentation
```

### module.json Example

```json
{
  "id": "ragnar-plugin-example",
  "title": "Ragnar's Mark - Example Plugin",
  "description": "Example plugin demonstrating v4.0 plugin capabilities",
  "version": "1.0.0",
  "compatibility": {
    "minimum": "12",
    "verified": "13"
  },
  "authors": [
    {
      "name": "Your Name",
      "email": "your.email@example.com"
    }
  ],
  "dependencies": [
    {
      "id": "ragnars-mark",
      "type": "module",
      "manifest": "your-manifest-url"
    }
  ],
  "esmodules": [
    "scripts/plugin.js"
  ],
  "styles": [
    "styles/plugin.css"
  ],
  "scripts": [],
  "manifest": "your-manifest-url/module.json",
  "download": "your-manifest-url/download.zip"
}
```

---

## Core Concepts

### 1. The Plugin Registry

All plugins must register with Ragnar's Mark:

```javascript
// In your plugin.js
Hooks.once('ragnarsMarkPluginReady', () => {
  RagnarsMarkAPI.registerPlugin({
    id: 'my-plugin',
    name: 'My Plugin',
    description: 'Does something cool',
    version: '1.0.0',
    author: 'Your Name',
    hooks: ['conditionApplied', 'conditionRemoved'],
    settings: {
      enableCustomEffects: {
        name: 'Enable Custom Effects',
        hint: 'Add custom visual effects',
        type: Boolean,
        default: true
      }
    }
  });
});
```

### 2. Settings Management

Plugins can define settings that are automatically registered:

```javascript
// Settings are registered automatically in registerPlugin()
const settings = RagnarsMarkAPI.getPluginSettings('my-plugin');

// Update a setting
RagnarsMarkAPI.updatePluginSetting('my-plugin', 'enableCustomEffects', false);

// Listen for setting changes
Hooks.on('ragnarsMarkSettingChanged', (pluginId, settingKey, newValue) => {
  if (pluginId === 'my-plugin' && settingKey === 'enableCustomEffects') {
    // React to change
  }
});
```

### 3. Event Hooks

Hook into Ragnar's Mark lifecycle events:

```javascript
// When a condition is applied
Hooks.on('ragnarsMarkConditionApplied', (tokenId, conditionName, duration) => {
  console.log(`${conditionName} applied to token ${tokenId}`);
});

// When a condition is removed
Hooks.on('ragnarsMarkConditionRemoved', (tokenId, conditionName) => {
  console.log(`${conditionName} removed from token ${tokenId}`);
});

// When conditions change
Hooks.on('ragnarsMarkConditionsChanged', (tokenId, conditions) => {
  console.log(`Token ${tokenId} now has conditions:`, conditions);
});
```

### 4. Condition Chains

Create custom condition relationships:

```javascript
// Define a chain: vulnerable → marked
RagnarsMarkAPI.addConditionChain('vulnerable', 'marked', {
  autoApply: true,        // Auto-apply when source active
  removeTogether: true,   // Remove together
  priority: 1,            // Chain priority
  description: 'Marked as vulnerable target'
});
```

---

## Plugin Lifecycle

### Initialization Flow

```
1. Foundry Initializes
   ↓
2. Ragnar's Mark Core Loads
   ↓
3. "ragnarsMarkReady" Hook Fires
   ↓
4. Plugin registerPlugin() Called
   ↓
5. "ragnarsMarkPluginRegistered" Hook Fires
   ↓
6. Plugin Ready to Handle Events
```

### Proper Initialization

```javascript
// CORRECT: Wait for Ragnar's Mark to be ready
Hooks.once('ragnarsMarkReady', () => {
  // Safe to access RagnarsMarkAPI
  const api = window.RagnarsMarkAPI;
  
  api.registerPlugin({
    id: 'my-plugin',
    name: 'My Plugin',
    version: '1.0.0'
  });
});

// WRONG: Trying to access API before ready
const api = window.RagnarsMarkAPI; // May be undefined!
```

---

## API Reference

### Plugin Management

```javascript
// Register a plugin
RagnarsMarkAPI.registerPlugin(pluginConfig);

// Get plugin info
RagnarsMarkAPI.getPlugin(pluginId);

// List all plugins
RagnarsMarkAPI.getPlugins();

// Enable/disable plugin
RagnarsMarkAPI.enablePlugin(pluginId);
RagnarsMarkAPI.disablePlugin(pluginId);
```

### Condition Management

```javascript
// Add condition to token
RagnarsMarkAPI.addCondition(tokenId, 'vulnerable', 300);

// Remove condition
RagnarsMarkAPI.removeCondition(tokenId, 'vulnerable');

// Toggle condition
RagnarsMarkAPI.toggleCondition(tokenId, 'vulnerable');

// Get active conditions
RagnarsMarkAPI.getConditions(tokenId);

// Check if token has condition
RagnarsMarkAPI.hasCondition(tokenId, 'vulnerable');
```

### Batch Operations

```javascript
// Apply multiple conditions to multiple tokens
RagnarsMarkAPI.batchApply(
  [tokenId1, tokenId2, tokenId3],
  ['vulnerable', 'marked'],
  300  // duration in milliseconds
);

// Remove multiple conditions from multiple tokens
RagnarsMarkAPI.batchRemove(
  [tokenId1, tokenId2, tokenId3],
  ['vulnerable', 'marked']
);
```

### Analytics

```javascript
// Get condition statistics
const stats = RagnarsMarkAPI.getConditionStats('vulnerable');
// Returns: { timesApplied, avgDuration, lastApplied, tokens }

// Get all statistics
const allStats = RagnarsMarkAPI.getAllStats();

// Generate combat report
const report = RagnarsMarkAPI.generateCombatReport();
// Returns: { conditions, tokens, duration, topConditions }
```

### Visual Effects

```javascript
// Create particle effect
RagnarsMarkAPI.createParticleEffect(tokenId, 'fire');
// Supported: 'fire', 'poison', 'cold', 'lightning', 'sparkles', 'default'

// Apply visual theme
RagnarsMarkAPI.applyTheme('cyberpunk');

// Get available themes
RagnarsMarkAPI.getThemes();
```

### Settings & Data

```javascript
// Get plugin settings
const settings = RagnarsMarkAPI.getPluginSettings('my-plugin');

// Update plugin setting
RagnarsMarkAPI.updatePluginSetting('my-plugin', 'settingKey', newValue);

// Store plugin data
game.settings.set('ragnars-mark', 'pluginData_my-plugin', customData);

// Retrieve plugin data
const data = game.settings.get('ragnars-mark', 'pluginData_my-plugin');
```

---

## Hook System

### Available Hooks

```javascript
// Lifecycle Hooks
Hooks.on('ragnarsMarkReady', () => {});           // Core ready
Hooks.on('ragnarsMarkPluginRegistered', (id) => {}); // Plugin registered

// Condition Hooks
Hooks.on('ragnarsMarkConditionApplied', (tokenId, condition, duration) => {});
Hooks.on('ragnarsMarkConditionRemoved', (tokenId, condition) => {});
Hooks.on('ragnarsMarkConditionsChanged', (tokenId, conditions) => {});

// Batch Hooks
Hooks.on('ragnarsMarkBatchApplied', (tokenIds, conditions) => {});
Hooks.on('ragnarsMarkBatchRemoved', (tokenIds, conditions) => {});

// Chain Hooks
Hooks.on('ragnarsMarkChainTriggered', (source, target) => {});
Hooks.on('ragnarsMarkChainRemoved', (source, target) => {});

// Setting Hooks
Hooks.on('ragnarsMarkSettingChanged', (pluginId, key, value) => {});

// Analytics Hooks
Hooks.on('ragnarsMarkAnalyticsUpdated', (tokenId, stats) => {});
```

### Creating Custom Hooks

Your plugin can fire its own hooks:

```javascript
// In your plugin
Hooks.callAll('myPluginConditionProcessed', tokenId, condition);

// Other plugins can listen
Hooks.on('myPluginConditionProcessed', (tokenId, condition) => {
  console.log('My plugin processed condition!');
});
```

---

## Best Practices

### 1. Error Handling

```javascript
// Always wrap API calls in try-catch
try {
  RagnarsMarkAPI.addCondition(tokenId, 'custom-condition', 300);
} catch (error) {
  console.error('Failed to add condition:', error);
  ui.notifications.error('Failed to add condition');
}
```

### 2. Validation

```javascript
// Validate inputs
function applyConditionSafely(tokenId, condition) {
  if (!tokenId || typeof tokenId !== 'string') {
    throw new Error('Invalid tokenId');
  }
  
  if (!condition || typeof condition !== 'string') {
    throw new Error('Invalid condition');
  }
  
  // Safe to proceed
  RagnarsMarkAPI.addCondition(tokenId, condition);
}
```

### 3. Performance

```javascript
// Don't call API repeatedly in loops
// WRONG:
for (let token of tokens) {
  RagnarsMarkAPI.addCondition(token.id, 'vulnerable');  // Multiple calls
}

// RIGHT:
const tokenIds = tokens.map(t => t.id);
RagnarsMarkAPI.batchApply(tokenIds, ['vulnerable']);    // Single call
```

### 4. Cleanup

```javascript
// Remove event listeners when plugin disables
Hooks.on('ragnarsMarkPluginDisabled', (pluginId) => {
  if (pluginId === 'my-plugin') {
    // Clean up resources
    this.removeEventListeners();
  }
});
```

### 5. Documentation

```javascript
/**
 * Apply special combat conditions
 * @param {string} tokenId - Token to affect
 * @param {string[]} conditions - Conditions to apply
 * @param {number} duration - Duration in milliseconds
 * @returns {Promise<void>}
 */
async function applyCombatConditions(tokenId, conditions, duration) {
  return RagnarsMarkAPI.batchApply([tokenId], conditions, duration);
}
```

### 6. Versioning

```javascript
// Check API version compatibility
const apiVersion = RagnarsMarkAPI.getVersion();
if (!apiVersion.startsWith('4.0')) {
  ui.notifications.error('This plugin requires Ragnar\'s Mark v4.0+');
  return;
}
```

---

## Example Plugins

### Example 1: Combat Round Tracker

```javascript
// Automatically apply conditions at the start of each round

Hooks.once('ragnarsMarkReady', () => {
  RagnarsMarkAPI.registerPlugin({
    id: 'combat-round-tracker',
    name: 'Combat Round Tracker',
    description: 'Track conditions across combat rounds',
    version: '1.0.0',
    author: 'Your Name'
  });
});

// Hook into combat round changes
Hooks.on('updateCombat', (combat, changes, diff) => {
  if (!changes.round) return; // Only on round change
  
  // Apply concentration check penalties
  for (let token of canvas.tokens.placeables) {
    if (token.actor?.hasCondition?.('concentrating')) {
      RagnarsMarkAPI.addCondition(token.id, 'concentration-check', 6000);
    }
  }
});
```

### Example 2: Spell Effect Auto-Apply

```javascript
// Automatically apply conditions when spells are cast

const SPELL_CONDITIONS = {
  'Magic Missile': ['weakened'],
  'Fireball': ['burning', 'weakened'],
  'Hold Person': ['restrained', 'dazed'],
  'Slow': ['slowed']
};

Hooks.once('ragnarsMarkReady', () => {
  RagnarsMarkAPI.registerPlugin({
    id: 'spell-effects',
    name: 'Spell Effects Auto-Apply',
    description: 'Automatically apply conditions based on spell effects'
  });
});

// Hook into effect application
Hooks.on('createActiveEffect', (effect, options, userId) => {
  const spellName = effect.data.label;
  const conditions = SPELL_CONDITIONS[spellName];
  
  if (!conditions) return;
  
  // Apply conditions to affected tokens
  for (let token of effect.parent.getActiveTokens?.() || []) {
    RagnarsMarkAPI.batchApply([token.id], conditions, 30000);
  }
});
```

### Example 3: Analytics Reporter

```javascript
// Generate weekly condition reports

Hooks.once('ragnarsMarkReady', () => {
  RagnarsMarkAPI.registerPlugin({
    id: 'analytics-reporter',
    name: 'Analytics Reporter',
    description: 'Generate weekly condition usage reports',
    settings: {
      autoReport: {
        name: 'Auto-Generate Reports',
        hint: 'Automatically generate reports each week',
        type: Boolean,
        default: true
      }
    }
  });
  
  // Schedule weekly reports
  scheduleWeeklyReport();
});

function scheduleWeeklyReport() {
  // Run every Monday at 9 AM
  const now = new Date();
  const daysUntilMonday = (1 - now.getDay() + 7) % 7 || 7;
  const nextMonday = new Date();
  nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
  nextMonday.setHours(9, 0, 0, 0);
  
  const timeout = nextMonday.getTime() - now.getTime();
  
  setTimeout(() => {
    generateWeeklyReport();
    scheduleWeeklyReport(); // Reschedule
  }, timeout);
}

function generateWeeklyReport() {
  const stats = RagnarsMarkAPI.getAllStats();
  const report = `
    Weekly Condition Report
    ${new Date().toLocaleDateString()}
    
    Top Conditions: ${Object.entries(stats)
      .sort((a, b) => b[1].timesApplied - a[1].timesApplied)
      .slice(0, 5)
      .map(([cond, data]) => `${cond} (${data.timesApplied}x)`)
      .join(', ')}
  `;
  
  console.log(report);
}
```

### Example 4: Custom Theme Plugin

```javascript
// Create custom visual themes

Hooks.once('ragnarsMarkReady', () => {
  RagnarsMarkAPI.registerPlugin({
    id: 'custom-themes',
    name: 'Custom Themes',
    description: 'Add custom visual themes'
  });
  
  // Register custom theme
  registerCustomTheme('steampunk', {
    name: 'Steampunk',
    colors: {
      primary: '#8B6914',
      secondary: '#D4AF37',
      accent: '#C0C0C0'
    },
    effects: {
      glow: 'copper',
      particles: 'steam'
    }
  });
});
```

### Example 5: Ability Trigger Integration

```javascript
// Auto-apply conditions based on ability usage

Hooks.once('ragnarsMarkReady', () => {
  RagnarsMarkAPI.registerPlugin({
    id: 'ability-triggers',
    name: 'Ability Trigger Conditions',
    description: 'Apply conditions when abilities are used'
  });
});

// Hook into ability activation
Hooks.on('dnd5e.useAbility', async (item, config, options) => {
  const actor = item.actor;
  const targets = game.user.targets;
  
  if (!targets) return;
  
  // Map abilities to conditions
  const abilityConditions = {
    'Dash': ['hasted'],
    'Dodge': ['protected'],
    'Help': ['supported']
  };
  
  const conditions = abilityConditions[item.name];
  if (!conditions) return;
  
  // Apply to targets
  const tokenIds = Array.from(targets).map(t => t.id);
  await RagnarsMarkAPI.batchApply(tokenIds, conditions, 6000);
});
```

---

## Troubleshooting

### API Not Available

**Problem**: `RagnarsMarkAPI is undefined`

**Solution**: 
```javascript
// Wait for the ready hook
Hooks.once('ragnarsMarkReady', () => {
  // Safe to use now
  RagnarsMarkAPI.registerPlugin({...});
});
```

### Plugin Not Registered

**Problem**: Plugin doesn't appear in settings

**Solution**:
1. Check module.json has correct id format (lowercase, hyphens)
2. Verify module depends on 'ragnars-mark'
3. Enable Ragnar's Mark first, then enable plugin
4. Check browser console for errors

### Hooks Not Firing

**Problem**: Custom hooks aren't triggering

**Solution**:
```javascript
// Verify hook name exactly matches
// Must be: 'ragnarsMarkConditionApplied' not 'conditionApplied'

// Test with log
Hooks.on('ragnarsMarkConditionApplied', (tokenId, condition) => {
  console.log('Hook fired!', tokenId, condition);
});
```

### Performance Issues

**Problem**: Plugin slows down game

**Solution**:
1. Use batch operations instead of loops
2. Debounce hook handlers
3. Cache results when possible
4. Use workers for heavy processing

```javascript
// Debounce example
const debouncedHandler = _.debounce((tokenId, condition) => {
  // Do expensive work
}, 500);

Hooks.on('ragnarsMarkConditionApplied', debouncedHandler);
```

---

## Template Repository

To get started quickly, use our plugin template:

```bash
# Clone the template
git clone https://github.com/example/ragnar-plugin-template.git

# Or download from GitHub
# https://github.com/example/ragnar-plugin-template
```

**Template includes:**
- Proper module.json structure
- Example plugin.js with hooks
- Sample CSS styling
- Plugin icon (256x256 PNG)
- Example README.md
- Pre-configured settings

---

## Resources

### Official Documentation
- [Ragnar's Mark API Reference](v4.0.0_COMPLETE_FEATURES.md)
- [Foundry VTT Developer Documentation](https://foundryvtt.com/article/api/)
- [Foundry Module Development Guide](https://foundryvtt.com/article/tutorial/)

### Example Repositories
- Spell Effects Plugin
- Combat Automation Plugin
- Analytics Dashboard Plugin
- Custom Themes Plugin

### Community
- Foundry Discord #module-development
- Foundry Forums
- GitHub Discussions

---

## FAQ

### Q: Can my plugin add new conditions?
**A**: Yes! Use the API to add conditions dynamically:
```javascript
RagnarsMarkAPI.addCondition(tokenId, 'my-custom-condition', 300);
```

### Q: Can plugins conflict with each other?
**A**: Unlikely if following best practices. Use unique IDs and avoid global namespace pollution.

### Q: Do plugins persist across updates?
**A**: Yes, plugins are independent modules. They update separately from Ragnar's Mark.

### Q: How do I debug my plugin?
**A**: Use browser console (F12) and enable Debug Mode in Ragnar's Mark settings.

### Q: Can plugins modify existing conditions?
**A**: Not directly, but they can remove/re-apply with modifications through hooks and batch operations.

### Q: Is there a plugin security review process?
**A**: Plugins should only be downloaded from trusted sources. Review code before installing.

---

**Happy plugin development! 🚀**

For support, visit the Foundry Forums or GitHub Issues.
