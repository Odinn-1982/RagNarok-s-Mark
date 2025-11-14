# Ragnar's Mark v4.0 - Advanced Tutorials

**Deep-dive guides for power users and developers**

---

## Table of Contents

1. [Condition Chains & Cascading Effects](#condition-chains--cascading-effects)
2. [Particle Effects Mastery](#particle-effects-mastery)
3. [Performance Optimization](#performance-optimization-deep-dive)
4. [Custom Themes System](#custom-themes-system)
5. [Advanced Automation](#advanced-automation)
6. [Database & Caching](#database--caching-strategy)
7. [Multi-Module Integration](#multi-module-integration)
8. [Large-Scale Campaign Management](#large-scale-campaign-management)

---

## Condition Chains & Cascading Effects

### Understanding Condition Chains

A condition chain is a series of conditions that apply sequentially, creating complex multi-stage effects.

**Example: Spell Sequence Chain**

```
Round 1: Burning (high intensity)
        ↓ (1 second delay)
Round 2: Weakened (applies automatically)
        ↓ (1 second delay)  
Round 3: Confused (final effect)
```

### Building Your First Chain

#### Step 1: Define the Conditions

```javascript
const fireSpellChain = {
  name: 'fire-spell-sequence',
  description: 'Complex fire spell effect progression',
  conditions: [
    {
      name: 'burning',
      duration: 6000,
      intensity: 8,
      effects: 'fire_particles'
    },
    {
      name: 'weakened',
      duration: 9000,
      intensity: 5,
      effects: 'smoke_particles'
    },
    {
      name: 'fatigued',
      duration: 12000,
      intensity: 3,
      effects: 'dust_particles'
    }
  ],
  delayBetweenStages: 1000 // 1 second between each
};
```

#### Step 2: Create the Chain

```javascript
async function createSpellChain(tokenId, chainConfig) {
  let currentDelay = 0;
  
  for (const condition of chainConfig.conditions) {
    // Schedule condition application
    setTimeout(async () => {
  await RagnaroksMarkAPI.addCondition(tokenId, condition.name, {
        duration: condition.duration,
        intensity: condition.intensity
      });
      
      // Create visual effect
      if (condition.effects) {
  await RagnaroksMarkAPI.createParticleEffect(
          tokenId,
          condition.effects
        );
      }
      
      console.log(`Applied ${condition.name}`);
    }, currentDelay);
    
    currentDelay += chainConfig.delayBetweenStages;
  }
}

// Use it
await createSpellChain('token123', fireSpellChain);
```

#### Step 3: Add Triggers

Chains can be triggered by events:

```javascript
// Trigger chain on spell cast
Hooks.on('dnd5e.useSpell', async (item, config, options) => {
  if (item.system.damage.parts[0][1] === 'fire') {
    const targets = game.user.targets;
    
    for (let target of targets) {
      await createSpellChain(target.id, fireSpellChain);
    }
  }
});
```

### Advanced: Conditional Branching

```javascript
async function createConditionalChain(tokenId, branchConfig) {
  let continueChain = true;
  
  for (const stage of branchConfig.stages) {
    if (!continueChain) break;
    
    // Apply condition
  const applied = await RagnaroksMarkAPI.addCondition(
      tokenId,
      stage.condition,
      { duration: stage.duration }
    );
    
    // Check continuation condition
    if (stage.checkCondition) {
  const hasCondition = await RagnaroksMarkAPI.hasCondition(
        tokenId,
        stage.checkCondition
      );
      
      if (!hasCondition) {
        continueChain = false;
      }
    }
    
    // Wait before next stage
    await new Promise(resolve => setTimeout(resolve, stage.delay));
  }
}

// Example: Chain continues only if target survives
const resistanceChain = {
  stages: [
    {
      condition: 'burning',
      duration: 6000,
      delay: 1000,
      checkCondition: null // Always continue
    },
    {
      condition: 'weakened',
      duration: 9000,
      delay: 1000,
      checkCondition: 'conscious' // Only if still conscious
    },
    {
      condition: 'recovering',
      duration: 3000,
      delay: 0,
      checkCondition: 'conscious'
    }
  ]
};
```

---

## Particle Effects Mastery

### Effect Types Available

```javascript
const effectTypes = {
  // Elemental
  fire: { color: '#FF4500', speed: 'fast', size: 'large' },
  cold: { color: '#00FFFF', speed: 'slow', size: 'small' },
  lightning: { color: '#FFFF00', speed: 'instant', size: 'medium' },
  poison: { color: '#00FF00', speed: 'medium', size: 'medium' },
  
  // Status
  holy: { color: '#FFFF99', speed: 'slow', size: 'large' },
  dark: { color: '#333333', speed: 'fast', size: 'large' },
  
  // Misc
  sparkles: { color: '#FFFFFF', speed: 'fast', size: 'small' },
  smoke: { color: '#888888', speed: 'slow', size: 'large' },
  water: { color: '#0066FF', speed: 'medium', size: 'medium' }
};
```

### Creating Custom Effects

```javascript
async function createCustomEffect(tokenId, config) {
  const effect = {
    id: `effect-${Date.now()}`,
    tokenId: tokenId,
    type: config.type,
    position: config.position || 'center', // 'center', 'above', 'below'
    color: config.color || '#FFFFFF',
    intensity: config.intensity || 1,
    duration: config.duration || 3000,
    scale: config.scale || 1.0,
    animationType: config.animation || 'burst' // 'burst', 'spiral', 'rain', 'beam'
  };

  // Apply effect
  await RagnaroksMarkAPI.createParticleEffect(tokenId, effect.type, {
    duration: effect.duration,
    scale: effect.scale,
    intensity: effect.intensity
  });

  return effect.id;
}

// Usage
await createCustomEffect('token123', {
  type: 'fire',
  position: 'above',
  intensity: 8,
  duration: 5000,
  animation: 'spiral'
});
```

### Effect Sequences

Chain effects together for visual stories:

```javascript
async function playEffectSequence(tokenId, sequence) {
  for (const effect of sequence) {
    await createCustomEffect(tokenId, effect);
    
    // Wait for effect to finish before next
    await new Promise(resolve => setTimeout(resolve, effect.duration + 200));
  }
}

// Example: Spell casting visual
const spellCastingSequence = [
  { type: 'sparkles', duration: 1000, intensity: 3, animation: 'burst' },
  { type: 'lightning', duration: 1500, intensity: 7, animation: 'beam' },
  { type: 'fire', duration: 2000, intensity: 8, animation: 'spiral' }
];

await playEffectSequence('token123', spellCastingSequence);
```

---

## Performance Optimization Deep-Dive

### Profiling Your Setup

```javascript
// Profile condition application time
const startTime = performance.now();

await RagnaroksMarkAPI.batchApply(
  tokenIds,
  ['stunned', 'weakened', 'slowed'],
  6000
);

const endTime = performance.now();
console.log(`Batch apply took ${(endTime - startTime).toFixed(2)}ms`);
```

### Memory Management

```javascript
// Monitor memory usage
async function getMemoryStats() {
  if (performance.memory) {
    return {
      used: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
      limit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB',
      percentage: (
        (performance.memory.usedJSHeapSize / 
         performance.memory.jsHeapSizeLimit) * 100
      ).toFixed(1) + '%'
    };
  }
}

const stats = await getMemoryStats();
console.log(`Memory: ${stats.used}/${stats.limit} (${stats.percentage})`);
```

### Optimization Strategies

#### 1. Batch Operations

```javascript
// ❌ BAD: Multiple sequential calls
for (let i = 0; i < 100; i++) {
  await RagnaroksMarkAPI.addCondition(`token${i}`, 'stunned');
}
// Time: ~5 seconds

// ✅ GOOD: Single batch operation
const tokenIds = Array.from({ length: 100 }, (_, i) => `token${i}`);
await RagnaroksMarkAPI.batchApply(tokenIds, 'stunned');
// Time: ~0.5 seconds (10x faster!)
```

#### 2. Lazy Loading Effects

```javascript
// Only create visual effects for visible tokens
async function applyConditionVisually(tokenId, condition) {
  const token = canvas.tokens.get(tokenId);
  
  // Only apply effect if token is visible on screen
  if (token && token.isVisible) {
  await RagnaroksMarkAPI.createParticleEffect(tokenId, condition);
  } else {
    // Just apply condition without visual
  await RagnaroksMarkAPI.addCondition(tokenId, condition);
  }
}
```

#### 3. Condition Debouncing

```javascript
// Prevent rapid condition updates
let debounceTimer = null;

async function debouncedAddCondition(tokenId, condition) {
  clearTimeout(debounceTimer);
  
  debounceTimer = setTimeout(async () => {
  await RagnaroksMarkAPI.addCondition(tokenId, condition);
  }, 100); // Wait 100ms for no new calls
}

// Usage: Multiple rapid calls become one
debouncedAddCondition('token1', 'stunned');
debouncedAddCondition('token1', 'stunned');
debouncedAddCondition('token1', 'stunned');
// Result: Only one actual condition application
```

#### 4. Smart Caching

```javascript
class ConditionCache {
  constructor() {
    this.cache = new Map();
    this.ttl = 5000; // 5 second TTL
  }

  async getConditions(tokenId) {
    const cached = this.cache.get(tokenId);
    
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.conditions;
    }

    // Fetch fresh data
  const conditions = await RagnaroksMarkAPI.getConditions(tokenId);
    
    // Store in cache
    this.cache.set(tokenId, {
      conditions: conditions,
      timestamp: Date.now()
    });

    return conditions;
  }

  invalidate(tokenId) {
    this.cache.delete(tokenId);
  }
}

const cache = new ConditionCache();
```

---

## Custom Themes System

### Theme Structure

```javascript
const customTheme = {
  id: 'my-theme',
  name: 'My Custom Theme',
  description: 'A unique visual style',
  
  // Colors
  colors: {
    primary: '#FF6B6B',      // Main condition color
    secondary: '#4ECDC4',    // Accent color
    background: '#2D3436',   // UI background
    text: '#FFFFFF',         // Text color
    success: '#00B894',      // Success feedback
    warning: '#FDCB6E',      // Warning feedback
    error: '#D63031'         // Error feedback
  },
  
  // Visual effects
  effects: {
    glowIntensity: 1.5,      // 0.0 - 2.0
    shadowDepth: 0.8,        // 0.0 - 1.0
    particleQuality: 'high', // 'low', 'medium', 'high'
    animationSpeed: 1.0      // 0.5 - 2.0
  },
  
  // Condition-specific styling
  conditions: {
    stunned: {
      color: '#FFD700',
      effect: 'sparkles',
      icon: 'fas fa-star'
    },
    burning: {
      color: '#FF4500',
      effect: 'fire',
      icon: 'fas fa-fire'
    },
    weakened: {
      color: '#8B7355',
      effect: 'smoke',
      icon: 'fas fa-arrow-down'
    }
  },
  
  // CSS customization
  css: `
  .ragnaroks-mark-condition {
      border-radius: 8px;
      font-weight: bold;
      text-shadow: 1px 1px 3px rgba(0,0,0,0.5);
    }
  `
};
```

### Applying a Theme

```javascript
async function applyTheme(themeId) {
  const theme = customTheme; // Your theme object
  
  // Create style element
  const styleId = `ragnar-theme-${themeId}`;
  let styleEl = document.getElementById(styleId);
  
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  // Generate CSS
  let css = `
    :root {
      --ragnar-primary: ${theme.colors.primary};
      --ragnar-secondary: ${theme.colors.secondary};
      --ragnar-background: ${theme.colors.background};
      --ragnar-text: ${theme.colors.text};
    }
    
  .ragnaroks-mark-overlay {
      filter: drop-shadow(0 0 ${theme.effects.glowIntensity * 10}px 
        rgba(${hexToRgb(theme.colors.primary)}, 0.6));
    }
  `;
  
  // Add condition-specific styles
  for (const [condition, style] of Object.entries(theme.conditions)) {
    css += `
  .ragnaroks-mark-condition.${condition} {
        background-color: ${style.color};
      }
    `;
  }
  
  // Add custom CSS
  if (theme.css) {
    css += theme.css;
  }

  styleEl.innerHTML = css;

  // Save theme preference
  await RagnaroksMarkAPI.setGameSetting('activeTheme', themeId);
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? 
    `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
    '255, 255, 255';
}
```

---

## Advanced Automation

### Event-Driven Automation

```javascript
class AutomationEngine {
  constructor() {
    this.rules = [];
    this.hooks = [];
  }

  registerRule(rule) {
    this.rules.push(rule);
    
    // Hook the rule trigger
    const hookId = Hooks.on(rule.trigger, async (data) => {
      if (await rule.condition(data)) {
        await rule.action(data);
      }
    });
    
    this.hooks.push(hookId);
  }

  async evaluateRules(context) {
    for (const rule of this.rules) {
      if (await rule.condition(context)) {
        await rule.action(context);
      }
    }
  }

  cleanup() {
    for (const hookId of this.hooks) {
      Hooks.off(hookId);
    }
  }
}

// Usage
const engine = new AutomationEngine();

// Rule: Heal on ability cast
engine.registerRule({
  trigger: 'useAbility',
  condition: async (data) => data.ability.name === 'healing-word',
  action: async (data) => {
    const targets = game.user.targets;
  await RagnaroksMarkAPI.batchRemove(
      Array.from(targets).map(t => t.id),
      ['weakened', 'poisoned']
    );
  }
});

// Rule: Apply curse on spell failure
engine.registerRule({
  trigger: 'savingThrowFailed',
  condition: async (data) => data.spell.school === 'necromancy',
  action: async (data) => {
  await RagnaroksMarkAPI.addCondition(data.targetId, 'cursed', {
      duration: 300000,
      intensity: 5
    });
  }
});
```

### Smart Condition Management

```javascript
class SmartConditionManager {
  async autoRemoveExpiredConditions() {
  const tokens = RagnaroksMarkAPI.getTokenList();
    
    for (const token of tokens) {
  const conditions = RagnaroksMarkAPI.getConditions(token.id);
      
      for (const condition of conditions) {
  const data = RagnaroksMarkAPI.getConditionData(token.id, condition);
        
        if (data && data.remainingDuration <= 0) {
          await RagnaroksMarkAPI.removeCondition(token.id, condition);
        }
      }
    }
  }

  async autoApplyRecoveryConditions() {
    // After combat, remove combat-specific conditions
    const combatConditions = ['readied', 'defending', 'engaged'];
  const tokens = RagnaroksMarkAPI.getTokenList();
    
  await RagnaroksMarkAPI.batchRemove(
      tokens.map(t => t.id),
      combatConditions
    );
    
    // Apply recovery condition
  await RagnaroksMarkAPI.batchApply(
      tokens.map(t => t.id),
      'recovered',
      30000
    );
  }

  async syncWithTokenState() {
  const tokens = RagnaroksMarkAPI.getTokenList();
    
    for (const token of tokens) {
      const actor = token.actor;
      
      // Remove unconscious if HP > 0
      if (actor.system.hp.value > 0) {
  await RagnaroksMarkAPI.removeCondition(token.id, 'unconscious');
      }
      
      // Add unconscious if HP <= 0
      if (actor.system.hp.value <= 0) {
  await RagnaroksMarkAPI.addCondition(token.id, 'unconscious');
      }
    }
  }
}

const manager = new SmartConditionManager();

// Run every round
Hooks.on('updateCombat', () => manager.autoRemoveExpiredConditions());
```

---

## Database & Caching Strategy

### Multi-Level Caching

```javascript
class CachingStrategy {
  constructor() {
    // Level 1: Memory cache (fastest)
    this.L1_memory = new Map();
    
    // Level 2: Session storage (persistent in tab)
    this.L2_session = window.sessionStorage;
    
    // Level 3: Local storage (persistent across sessions)
    this.L3_local = window.localStorage;
  }

  async get(key) {
    // Try L1
    if (this.L1_memory.has(key)) {
      return this.L1_memory.get(key);
    }

    // Try L2
    const sessionData = this.L2_session.getItem(key);
    if (sessionData) {
      const value = JSON.parse(sessionData);
      this.L1_memory.set(key, value);
      return value;
    }

    // Try L3
    const localData = this.L3_local.getItem(key);
    if (localData) {
      const value = JSON.parse(localData);
      this.L1_memory.set(key, value);
      this.L2_session.setItem(key, localData);
      return value;
    }

    return null;
  }

  async set(key, value, persist = false) {
    // Always set L1
    this.L1_memory.set(key, value);
    
    // Set L2
    this.L2_session.setItem(key, JSON.stringify(value));
    
    // Optionally set L3
    if (persist) {
      this.L3_local.setItem(key, JSON.stringify(value));
    }
  }

  invalidate(key) {
    this.L1_memory.delete(key);
    this.L2_session.removeItem(key);
    this.L3_local.removeItem(key);
  }
}
```

---

## Multi-Module Integration

### Compatible Modules

```javascript
class ModuleIntegration {
  async integrateWithCombatEnhancer() {
    // Combat Enhancer provides turn tracking
    Hooks.on('combatEnhancer.turnStart', async (combatant) => {
      // Apply turn-based conditions
      if (combatant.defeated) {
  await RagnaroksMarkAPI.addCondition(combatant.tokenId, 'defeated');
      }
    });
  }

  async integrateWithTokenMagic() {
    // Token Magic FX provides visual effects
    const applyConditionWithMagic = async (tokenId, condition) => {
  await RagnaroksMarkAPI.addCondition(tokenId, condition);
      
      // Apply matching Token Magic effect
      const magicEffect = {
        'burning': 'Fire',
        'frozen': 'Ice',
        'poisoned': 'Poison'
      }[condition];
      
      if (magicEffect && window.TokenMagic) {
        await window.TokenMagic.addUpdateStatusEffects(tokenId, [magicEffect]);
      }
    };
    
    return applyConditionWithMagic;
  }

  async integrateWithDiceRoller() {
    // Use dice roller for condition intensity
    Hooks.on('diceRoller.roll', async (result) => {
      if (result.type === 'condition-intensity') {
        return {
          intensity: Math.min(result.total, 10)
        };
      }
    });
  }
}
```

---

## Large-Scale Campaign Management

### Organization Systems

```javascript
class CampaignOrganizer {
  async createCampaignTemplate(campaignName) {
    return {
      name: campaignName,
      encounters: [],
      npcConditions: {},
      playerConditions: {},
      factionModifiers: {}
    };
  }

  async createEncounterPack(name, conditions) {
    return {
      name: name,
      conditions: conditions,
      difficulty: this.calculateDifficulty(conditions)
    };
  }

  calculateDifficulty(conditions) {
    let difficulty = 0;
    for (const cond of conditions) {
      difficulty += this.getConditionWeight(cond);
    }
    return Math.min(Math.ceil(difficulty / 5), 5); // 1-5 difficulty
  }

  getConditionWeight(condition) {
    const weights = {
      'stunned': 3,
      'weakened': 2,
      'confused': 2,
      'blinded': 1,
      'slowed': 1
    };
    return weights[condition] || 0;
  }

  async applyEncounter(tokenIds, encounterPack) {
    for (const condition of encounterPack.conditions) {
  await RagnaroksMarkAPI.batchApply(tokenIds, condition.name);
    }
  }
}
```

---

**Master these advanced techniques to unlock Ragnar's Mark's full potential!** 🚀
