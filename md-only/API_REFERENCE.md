# Ragnar's Mark v4.0 - Complete API Reference

**Comprehensive documentation of all 60+ API functions, organized by category**

---

## Table of Contents

1. [Core Functions](#core-functions)
2. [Condition Management](#condition-management)
3. [Batch Operations](#batch-operations)
4. [Analytics & Reporting](#analytics--reporting)
5. [Particle Effects](#particle-effects)
6. [Game Settings](#game-settings)
7. [Data Retrieval](#data-retrieval)
8. [Plugin System](#plugin-system)
9. [Hook System](#hook-system)
10. [Customization](#customization)
11. [Integration Helpers](#integration-helpers)
12. [Utility Functions](#utility-functions)

---

## Core Functions

### `RagnarsMarkAPI.initialize(options)`

Initialize Ragnar's Mark with custom options.

**Parameters:**
- `options` (Object) - Initialization configuration
  - `gameSystem` (String) - 'dnd5e', 'pf2e', 'custom'
  - `debug` (Boolean) - Enable debug logging
  - `autoLoad` (Boolean) - Auto-load saved data

**Returns:** `Promise<boolean>` - Initialization success status

**Example:**
```javascript
await RagnarsMarkAPI.initialize({
  gameSystem: 'dnd5e',
  debug: true,
  autoLoad: true
});
```

---

### `RagnarsMarkAPI.isReady()`

Check if Ragnar's Mark is fully initialized.

**Parameters:** None

**Returns:** `boolean` - Module readiness status

**Example:**
```javascript
if (RagnarsMarkAPI.isReady()) {
  console.log('Ragnar\'s Mark is ready to use');
}
```

---

### `RagnarsMarkAPI.getVersion()`

Get the current module version.

**Parameters:** None

**Returns:** `string` - Version number (e.g., "4.0.0")

**Example:**
```javascript
const version = RagnarsMarkAPI.getVersion();
console.log(`Running Ragnar's Mark ${version}`);
```

---

## Condition Management

### `RagnarsMarkAPI.addCondition(tokenId, conditionName, options)`

Add a single condition to a token.

**Parameters:**
- `tokenId` (String) - UUID or ID of the target token
- `conditionName` (String) - Name of condition to apply
- `options` (Object, optional)
  - `duration` (Number) - Duration in milliseconds (0 = permanent)
  - `intensity` (Number) - Condition intensity (1-10)
  - `custom` (Object) - Custom data to attach

**Returns:** `Promise<Object>` - Applied condition object

**Example:**
```javascript
await RagnarsMarkAPI.addCondition('token123', 'stunned', {
  duration: 6000,
  intensity: 3
});
```

---

### `RagnarsMarkAPI.removeCondition(tokenId, conditionName)`

Remove a condition from a token.

**Parameters:**
- `tokenId` (String) - UUID or ID of the target token
- `conditionName` (String) - Name of condition to remove

**Returns:** `Promise<boolean>` - Removal success status

**Example:**
```javascript
const removed = await RagnarsMarkAPI.removeCondition('token123', 'stunned');
if (removed) {
  console.log('Condition removed successfully');
}
```

---

### `RagnarsMarkAPI.toggleCondition(tokenId, conditionName, force)`

Toggle a condition on/off. If it exists, remove it; otherwise, add it.

**Parameters:**
- `tokenId` (String) - UUID or ID of the target token
- `conditionName` (String) - Name of condition to toggle
- `force` (Boolean, optional) - Force on (true) or off (false)

**Returns:** `Promise<boolean>` - New state (true = added, false = removed)

**Example:**
```javascript
const newState = await RagnarsMarkAPI.toggleCondition('token123', 'stunned', true);
console.log(`Stunned is now: ${newState ? 'active' : 'inactive'}`);
```

---

### `RagnarsMarkAPI.hasCondition(tokenId, conditionName)`

Check if a token has a specific condition.

**Parameters:**
- `tokenId` (String) - UUID or ID of the target token
- `conditionName` (String) - Name of condition to check

**Returns:** `boolean` - Whether condition is active

**Example:**
```javascript
if (RagnarsMarkAPI.hasCondition('token123', 'stunned')) {
  console.log('Token is stunned');
}
```

---

### `RagnarsMarkAPI.getConditions(tokenId)`

Get all active conditions on a token.

**Parameters:**
- `tokenId` (String) - UUID or ID of the target token

**Returns:** `Array<string>` - Array of active condition names

**Example:**
```javascript
const conditions = RagnarsMarkAPI.getConditions('token123');
console.log(`Active conditions: ${conditions.join(', ')}`);
```

---

### `RagnarsMarkAPI.getConditionData(tokenId, conditionName)`

Get detailed data about a specific condition.

**Parameters:**
- `tokenId` (String) - UUID or ID of the target token
- `conditionName` (String) - Name of condition to get

**Returns:** `Object|null` - Condition data or null if not active

**Example:**
```javascript
const data = RagnarsMarkAPI.getConditionData('token123', 'stunned');
if (data) {
  console.log(`Stunned - Duration: ${data.duration}ms, Intensity: ${data.intensity}`);
}
```

---

### `RagnarsMarkAPI.setConditionIntensity(tokenId, conditionName, intensity)`

Set the intensity level of a condition.

**Parameters:**
- `tokenId` (String) - UUID or ID of the target token
- `conditionName` (String) - Name of condition
- `intensity` (Number) - Intensity level (1-10)

**Returns:** `Promise<Object>` - Updated condition object

**Example:**
```javascript
await RagnarsMarkAPI.setConditionIntensity('token123', 'stunned', 5);
```

---

### `RagnarsMarkAPI.updateConditionDuration(tokenId, conditionName, newDuration)`

Update the remaining duration of a condition.

**Parameters:**
- `tokenId` (String) - UUID or ID of the target token
- `conditionName` (String) - Name of condition
- `newDuration` (Number) - New duration in milliseconds

**Returns:** `Promise<Object>` - Updated condition object

**Example:**
```javascript
await RagnarsMarkAPI.updateConditionDuration('token123', 'stunned', 12000);
```

---

### `RagnarsMarkAPI.clearAllConditions(tokenId)`

Remove all conditions from a token.

**Parameters:**
- `tokenId` (String) - UUID or ID of the target token

**Returns:** `Promise<boolean>` - Success status

**Example:**
```javascript
await RagnarsMarkAPI.clearAllConditions('token123');
```

---

## Batch Operations

### `RagnarsMarkAPI.batchApply(tokenIds, conditions, duration, intensity)`

Apply one or more conditions to multiple tokens at once.

**Parameters:**
- `tokenIds` (Array<string>) - Array of token IDs
- `conditions` (Array<string>|string) - Condition name(s) to apply
- `duration` (Number, optional) - Duration in milliseconds
- `intensity` (Number, optional) - Intensity level (1-10)

**Returns:** `Promise<Object>` - Results object with success/failure counts

**Example:**
```javascript
const result = await RagnarsMarkAPI.batchApply(
  ['token1', 'token2', 'token3'],
  ['stunned', 'weakened'],
  6000,
  3
);
console.log(`Applied to ${result.successful} tokens`);
```

---

### `RagnarsMarkAPI.batchRemove(tokenIds, conditions)`

Remove one or more conditions from multiple tokens.

**Parameters:**
- `tokenIds` (Array<string>) - Array of token IDs
- `conditions` (Array<string>|string) - Condition name(s) to remove

**Returns:** `Promise<Object>` - Results object with success/failure counts

**Example:**
```javascript
const result = await RagnarsMarkAPI.batchRemove(
  ['token1', 'token2', 'token3'],
  'stunned'
);
```

---

### `RagnarsMarkAPI.batchClear(tokenIds)`

Clear all conditions from multiple tokens.

**Parameters:**
- `tokenIds` (Array<string>) - Array of token IDs

**Returns:** `Promise<Object>` - Results object

**Example:**
```javascript
const result = await RagnarsMarkAPI.batchClear(['token1', 'token2']);
```

---

## Analytics & Reporting

### `RagnarsMarkAPI.getStats(conditionName)`

Get statistics for a specific condition.

**Parameters:**
- `conditionName` (String) - Name of condition to get stats for

**Returns:** `Object` - Statistics object
  - `timesApplied` (Number) - How many times applied
  - `totalDuration` (Number) - Total duration applied
  - `avgDuration` (Number) - Average duration
  - `lastApplied` (Date) - Last application timestamp

**Example:**
```javascript
const stats = RagnarsMarkAPI.getStats('stunned');
console.log(`Stunned applied ${stats.timesApplied} times`);
```

---

### `RagnarsMarkAPI.getAllStats()`

Get statistics for all conditions.

**Parameters:** None

**Returns:** `Object` - Object with stats for each condition

**Example:**
```javascript
const allStats = RagnarsMarkAPI.getAllStats();
for (const [condition, stats] of Object.entries(allStats)) {
  console.log(`${condition}: ${stats.timesApplied} times`);
}
```

---

### `RagnarsMarkAPI.getTokenStats(tokenId)`

Get condition statistics for a specific token.

**Parameters:**
- `tokenId` (String) - UUID or ID of the target token

**Returns:** `Object` - Token statistics
  - `totalConditions` (Number) - Current active conditions
  - `history` (Array) - Condition application history
  - `mostCommon` (String) - Most frequently applied condition

**Example:**
```javascript
const stats = RagnarsMarkAPI.getTokenStats('token123');
console.log(`Token has ${stats.totalConditions} active conditions`);
```

---

### `RagnarsMarkAPI.generateReport(type, options)`

Generate a detailed report of condition usage.

**Parameters:**
- `type` (String) - Report type: 'summary', 'detailed', 'token-specific'
- `options` (Object, optional)
  - `timeRange` (Number) - Time range in milliseconds
  - `tokenId` (String) - For token-specific reports
  - `format` (String) - 'json', 'csv', 'html'

**Returns:** `Object` - Report data

**Example:**
```javascript
const report = RagnarsMarkAPI.generateReport('summary', {
  timeRange: 3600000, // Last hour
  format: 'json'
});
```

---

### `RagnarsMarkAPI.exportStats(format, filename)`

Export statistics to a file.

**Parameters:**
- `format` (String) - 'json', 'csv', 'html'
- `filename` (String, optional) - Custom filename

**Returns:** `Promise<string>` - Download URL or file path

**Example:**
```javascript
const url = await RagnarsMarkAPI.exportStats('csv', 'condition-stats.csv');
```

---

## Particle Effects

### `RagnarsMarkAPI.createParticleEffect(tokenId, effectType, options)`

Create a visual particle effect on a token.

**Parameters:**
- `tokenId` (String) - UUID or ID of the target token
- `effectType` (String) - Effect type: 'fire', 'cold', 'lightning', 'poison', etc.
- `options` (Object, optional)
  - `duration` (Number) - Effect duration in milliseconds
  - `scale` (Number) - Effect size multiplier
  - `intensity` (Number) - Effect intensity (1-10)

**Returns:** `Promise<string>` - Effect ID

**Example:**
```javascript
await RagnarsMarkAPI.createParticleEffect('token123', 'fire', {
  duration: 3000,
  scale: 1.5,
  intensity: 8
});
```

---

### `RagnarsMarkAPI.removeParticleEffect(tokenId, effectId)`

Remove a particle effect.

**Parameters:**
- `tokenId` (String) - UUID or ID of the target token
- `effectId` (String) - ID of the effect to remove

**Returns:** `Promise<boolean>` - Success status

**Example:**
```javascript
await RagnarsMarkAPI.removeParticleEffect('token123', 'effect-001');
```

---

### `RagnarsMarkAPI.createConditionalEffect(tokenId, conditionName)`

Create a particle effect based on a condition.

**Parameters:**
- `tokenId` (String) - UUID or ID of the target token
- `conditionName` (String) - Condition name to visualize

**Returns:** `Promise<string>` - Effect ID

**Example:**
```javascript
await RagnarsMarkAPI.createConditionalEffect('token123', 'burning');
```

---

## Game Settings

### `RagnarsMarkAPI.getGameSetting(key, defaultValue)`

Get a game setting value.

**Parameters:**
- `key` (String) - Setting key
- `defaultValue` (any, optional) - Default if not set

**Returns:** `any` - Setting value

**Example:**
```javascript
const enabled = RagnarsMarkAPI.getGameSetting('enabledConditions.stunned', true);
```

---

### `RagnarsMarkAPI.setGameSetting(key, value)`

Set a game setting value.

**Parameters:**
- `key` (String) - Setting key
- `value` (any) - Setting value

**Returns:** `Promise<any>` - Updated value

**Example:**
```javascript
await RagnarsMarkAPI.setGameSetting('enabledConditions.stunned', false);
```

---

### `RagnarsMarkAPI.getAllGameSettings()`

Get all game settings.

**Parameters:** None

**Returns:** `Object` - All game settings

**Example:**
```javascript
const settings = RagnarsMarkAPI.getAllGameSettings();
```

---

## Data Retrieval

### `RagnarsMarkAPI.getConditionsList()`

Get a list of all available conditions.

**Parameters:** None

**Returns:** `Array<Object>` - Array of condition objects
  - `name` (String) - Condition name
  - `description` (String) - Condition description
  - `enabled` (Boolean) - Whether condition is enabled

**Example:**
```javascript
const conditions = RagnarsMarkAPI.getConditionsList();
for (const condition of conditions) {
  console.log(`${condition.name}: ${condition.description}`);
}
```

---

### `RagnarsMarkAPI.getEnabledConditions()`

Get only enabled conditions.

**Parameters:** None

**Returns:** `Array<string>` - Array of enabled condition names

**Example:**
```javascript
const enabled = RagnarsMarkAPI.getEnabledConditions();
```

---

### `RagnarsMarkAPI.getConditionDetails(conditionName)`

Get detailed information about a condition.

**Parameters:**
- `conditionName` (String) - Name of condition

**Returns:** `Object|null` - Condition details or null

**Example:**
```javascript
const details = RagnarsMarkAPI.getConditionDetails('stunned');
if (details) {
  console.log(`Duration: ${details.defaultDuration}ms`);
  console.log(`Description: ${details.description}`);
}
```

---

### `RagnarsMarkAPI.getTokenList()`

Get all tokens in the current scene.

**Parameters:** None

**Returns:** `Array<Object>` - Array of token data

**Example:**
```javascript
const tokens = RagnarsMarkAPI.getTokenList();
```

---

### `RagnarsMarkAPI.getTokenData(tokenId)`

Get data for a specific token.

**Parameters:**
- `tokenId` (String) - UUID or ID of the target token

**Returns:** `Object|null` - Token data or null

**Example:**
```javascript
const data = RagnarsMarkAPI.getTokenData('token123');
```

---

## Plugin System

### `RagnarsMarkAPI.registerPlugin(config)`

Register a new plugin.

**Parameters:**
- `config` (Object) - Plugin configuration
  - `id` (String) - Unique plugin ID
  - `name` (String) - Plugin display name
  - `description` (String) - Plugin description
  - `version` (String) - Plugin version
  - `author` (String) - Author name
  - `hooks` (Array, optional) - Available hooks
  - `settings` (Object, optional) - Plugin settings

**Returns:** `Promise<boolean>` - Registration success

**Example:**
```javascript
await RagnarsMarkAPI.registerPlugin({
  id: 'my-plugin',
  name: 'My Plugin',
  description: 'A cool plugin',
  version: '1.0.0',
  author: 'You'
});
```

---

### `RagnarsMarkAPI.getPlugin(pluginId)`

Get information about a registered plugin.

**Parameters:**
- `pluginId` (String) - ID of the plugin

**Returns:** `Object|null` - Plugin info or null

**Example:**
```javascript
const plugin = RagnarsMarkAPI.getPlugin('my-plugin');
```

---

### `RagnarsMarkAPI.getPluginSettings(pluginId)`

Get settings for a plugin.

**Parameters:**
- `pluginId` (String) - ID of the plugin

**Returns:** `Object` - Plugin settings

**Example:**
```javascript
const settings = RagnarsMarkAPI.getPluginSettings('my-plugin');
```

---

### `RagnarsMarkAPI.setPluginSetting(pluginId, key, value)`

Set a plugin setting.

**Parameters:**
- `pluginId` (String) - ID of the plugin
- `key` (String) - Setting key
- `value` (any) - Setting value

**Returns:** `Promise<any>` - Updated value

**Example:**
```javascript
await RagnarsMarkAPI.setPluginSetting('my-plugin', 'enabled', true);
```

---

## Hook System

### `RagnarsMarkAPI.registerHook(name, callback)`

Register a hook callback.

**Parameters:**
- `name` (String) - Hook name
- `callback` (Function) - Callback function

**Returns:** `string` - Hook ID (for removal)

**Example:**
```javascript
RagnarsMarkAPI.registerHook('conditionApplied', (data) => {
  console.log(`Condition applied: ${data.condition}`);
});
```

---

### `RagnarsMarkAPI.callHook(name, data)`

Trigger a hook.

**Parameters:**
- `name` (String) - Hook name
- `data` (any) - Hook data

**Returns:** `Promise<void>`

**Example:**
```javascript
await RagnarsMarkAPI.callHook('customEvent', { message: 'hello' });
```

---

### Available Hooks

- `initCompleted` - Ragnar's Mark finished initializing
- `conditionApplied` - Condition applied to token
- `conditionRemoved` - Condition removed from token
- `conditionUpdated` - Condition properties changed
- `tokenConditionsCleared` - All conditions cleared from token
- `combatStarted` - Combat encounter started
- `combatEnded` - Combat encounter ended
- `combatRoundChanged` - Combat round number changed
- `particleEffectCreated` - Particle effect added
- `particleEffectRemoved` - Particle effect removed
- `reportGenerated` - Analytics report generated
- `pluginRegistered` - New plugin registered

---

## Customization

### `RagnarsMarkAPI.addCustomCondition(config)`

Add a custom condition type.

**Parameters:**
- `config` (Object) - Condition configuration
  - `name` (String) - Condition name
  - `description` (String) - Description
  - `defaultDuration` (Number) - Default duration
  - `icon` (String, optional) - Icon URL or path
  - `color` (String, optional) - Color hex code
  - `effect` (String, optional) - Particle effect type

**Returns:** `Promise<boolean>` - Success status

**Example:**
```javascript
await RagnarsMarkAPI.addCustomCondition({
  name: 'crystallized',
  description: 'Target is frozen in crystal',
  defaultDuration: 30000,
  color: '#00FFFF',
  effect: 'cold'
});
```

---

### `RagnarsMarkAPI.modifyCondition(conditionName, updates)`

Modify an existing condition.

**Parameters:**
- `conditionName` (String) - Name of condition to modify
- `updates` (Object) - Properties to update

**Returns:** `Promise<Object>` - Updated condition

**Example:**
```javascript
await RagnarsMarkAPI.modifyCondition('stunned', {
  defaultDuration: 12000,
  color: '#FF0000'
});
```

---

### `RagnarsMarkAPI.createConditionChain(conditions, delays)`

Create a sequence of conditions that apply in order.

**Parameters:**
- `conditions` (Array<string>) - Condition names in order
- `delays` (Array<number>) - Delays between applications in ms

**Returns:** `Promise<string>` - Chain ID

**Example:**
```javascript
const chainId = await RagnarsMarkAPI.createConditionChain(
  ['stunned', 'confused', 'weakened'],
  [1000, 2000, 1000]
);
```

---

## Integration Helpers

### `RagnarsMarkAPI.integrateWithSpells(spellConfig)`

Set up automatic condition application for spells.

**Parameters:**
- `spellConfig` (Object) - Spell-condition mapping

**Returns:** `Promise<boolean>` - Success status

**Example:**
```javascript
await RagnarsMarkAPI.integrateWithSpells({
  'fireball': { conditions: ['burning'], damage: 'fire' },
  'hold-person': { conditions: ['stunned', 'paralyzed'], duration: 60000 }
});
```

---

### `RagnarsMarkAPI.integrateWithAbilities(abilityConfig)`

Set up automatic condition application for abilities.

**Parameters:**
- `abilityConfig` (Object) - Ability-condition mapping

**Returns:** `Promise<boolean>` - Success status

**Example:**
```javascript
await RagnarsMarkAPI.integrateWithAbilities({
  'dash': { conditions: ['hasted'], duration: 6000 },
  'dodge': { conditions: ['protected'], duration: 6000 }
});
```

---

### `RagnarsMarkAPI.integrateWithCombat(combatConfig)`

Set up automatic conditions for combat events.

**Parameters:**
- `combatConfig` (Object) - Combat event mappings

**Returns:** `Promise<boolean>` - Success status

**Example:**
```javascript
await RagnarsMarkAPI.integrateWithCombat({
  onRoundStart: ['refreshed'],
  onTurnEnd: ['fatigued'],
  onDefeated: ['defeated']
});
```

---

## Utility Functions

### `RagnarsMarkAPI.formatDuration(milliseconds)`

Format milliseconds into a human-readable string.

**Parameters:**
- `milliseconds` (Number) - Duration in milliseconds

**Returns:** `string` - Formatted duration (e.g., "1m 30s")

**Example:**
```javascript
const formatted = RagnarsMarkAPI.formatDuration(90000);
console.log(formatted); // "1m 30s"
```

---

### `RagnarsMarkAPI.parseConditionString(str)`

Parse a condition string into components.

**Parameters:**
- `str` (String) - Condition string (e.g., "stunned,10s,int:5")

**Returns:** `Object` - Parsed components
  - `condition` (String) - Condition name
  - `duration` (Number) - Duration in ms
  - `intensity` (Number) - Intensity level

**Example:**
```javascript
const parsed = RagnarsMarkAPI.parseConditionString('stunned,10s,int:5');
```

---

### `RagnarsMarkAPI.validateConditionName(name)`

Check if a condition name is valid.

**Parameters:**
- `name` (String) - Condition name to validate

**Returns:** `boolean` - Validation result

**Example:**
```javascript
if (RagnarsMarkAPI.validateConditionName('stunned')) {
  console.log('Valid condition name');
}
```

---

### `RagnarsMarkAPI.getGameSystemInfo()`

Get information about the current game system.

**Parameters:** None

**Returns:** `Object` - System information
  - `system` (String) - System ID ('dnd5e', 'pf2e', etc.)
  - `version` (String) - System version
  - `compatibility` (String) - Compatibility level

**Example:**
```javascript
const info = RagnarsMarkAPI.getGameSystemInfo();
```

---

### `RagnarsMarkAPI.log(level, message, data)`

Log a message with the Ragnar's Mark logger.

**Parameters:**
- `level` (String) - Log level: 'debug', 'info', 'warn', 'error'
- `message` (String) - Log message
- `data` (any, optional) - Additional data

**Returns:** `void`

**Example:**
```javascript
RagnarsMarkAPI.log('info', 'Condition applied successfully', { condition: 'stunned' });
```

---

### `RagnarsMarkAPI.clearCache()`

Clear the module cache to force reloading data.

**Parameters:** None

**Returns:** `Promise<boolean>` - Success status

**Example:**
```javascript
await RagnarsMarkAPI.clearCache();
```

---

## Complete Example: Building a Custom Condition Manager

```javascript
class CustomConditionManager {
  async initialize() {
    // Wait for Ragnar's Mark
    if (!RagnarsMarkAPI.isReady()) {
      await new Promise(resolve => {
        Hooks.once('ragnarsMarkReady', resolve);
      });
    }

    // Get all tokens
    const tokens = RagnarsMarkAPI.getTokenList();

    // Apply multiple conditions
    await RagnarsMarkAPI.batchApply(
      tokens.map(t => t.id),
      ['stunned', 'weakened'],
      6000
    );

    // Get statistics
    const stats = RagnarsMarkAPI.getAllStats();
    console.log(`Applied ${Object.keys(stats).length} different conditions`);

    // Generate report
    const report = RagnarsMarkAPI.generateReport('summary');
    console.log(`Total applications: ${report.totalCount}`);
  }
}

// Initialize
const manager = new CustomConditionManager();
await manager.initialize();
```

---

**60+ functions covering every aspect of the condition system!** 🎯
