/**
 * Automation system for Ragnar's Mark
 * Handles condition chains, auto-apply rules, batch operations
 */

export const AUTOMATION = {
  // Condition chains: when A is active, apply B
  conditionChains: {},
  
  // Auto-apply rules based on turn number or other triggers
  autoApplyRules: {},
  
  // Batch operation queue
  batchQueue: [],
  batchProcessing: false,

  /**
   * Add a condition chain rule
   * Example: When "vulnerable" active, also show "targeted"
   */
  addConditionChain(sourceCondition, targetCondition, options = {}) {
    if (!this.conditionChains[sourceCondition]) {
      this.conditionChains[sourceCondition] = [];
    }
    this.conditionChains[sourceCondition].push({
      target: targetCondition,
      autoApply: options.autoApply !== false,
      removeTogether: options.removeTogether === true,
      priority: options.priority || 0
    });
  },

  /**
   * Process condition chains for a token
   */
  async processConditionChains(token, activeConditions) {
    const chainedConditions = [...activeConditions];
    
    for (const condition of activeConditions) {
      if (this.conditionChains[condition]) {
        for (const chain of this.conditionChains[condition]) {
          if (chain.autoApply && !chainedConditions.includes(chain.target)) {
            chainedConditions.push(chain.target);
          }
        }
      }
    }
    
    return chainedConditions;
  },

  /**
   * Add auto-apply rule
   * Example: Apply "exhausted" on turn 10 of combat
   */
  addAutoApplyRule(ruleName, trigger, action) {
    this.autoApplyRules[ruleName] = {
      trigger, // function(token, combat) -> boolean
      action,  // function(token) -> void (applies effect)
      enabled: true
    };
  },

  /**
   * Check and process auto-apply rules during combat
   */
  async checkAutoApplyRules(token, combat) {
    for (const [name, rule] of Object.entries(this.autoApplyRules)) {
      if (rule.enabled && rule.trigger(token, combat)) {
        await rule.action(token);
      }
    }
  },

  /**
   * Batch apply conditions to multiple tokens
   */
  async batchApplyConditions(tokens, conditions, options = {}) {
    const operation = {
      tokens,
      conditions,
      action: options.action || 'add', // add, remove, toggle
      duration: options.duration || null,
      timestamp: Date.now(),
      id: `batch_${Date.now()}`
    };

    this.batchQueue.push(operation);
    
    if (!this.batchProcessing) {
      await this.processBatchQueue();
    }

    return operation.id;
  },

  /**
   * Process queued batch operations
   */
  async processBatchQueue() {
    if (this.batchProcessing || this.batchQueue.length === 0) return;

    this.batchProcessing = true;
    const settings = game.settings.get('ragnars-mark', 'enabledConditions');

    while (this.batchQueue.length > 0) {
      const operation = this.batchQueue.shift();
      
      for (const token of operation.tokens) {
        for (const condition of operation.conditions) {
          if (operation.action === 'add') {
            await this.applyConditionToToken(token, condition, operation.duration);
          } else if (operation.action === 'remove') {
            await this.removeConditionFromToken(token, condition);
          } else if (operation.action === 'toggle') {
            const hasEffect = token.actor?.effects.some(e => 
              e.name.toLowerCase() === condition.toLowerCase()
            );
            if (hasEffect) {
              await this.removeConditionFromToken(token, condition);
            } else {
              await this.applyConditionToToken(token, condition, operation.duration);
            }
          }
        }
      }

      // Yield to prevent UI lock
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    this.batchProcessing = false;
  },

  /**
   * Apply a single condition to token
   */
  async applyConditionToToken(token, conditionName, duration = null) {
    if (!token.actor) return;

    const effect = {
      name: conditionName,
      type: 'effect',
      img: 'icons/svg/aura.svg', // Fallback icon
      changes: [],
      disabled: false,
      transfer: true
    };

    if (duration) {
      const durationData = typeof duration === 'number' 
        ? { rounds: duration }
        : duration;
      effect.duration = {
        startTime: game.time.worldTime,
        ...durationData
      };
    }

    await token.actor.createEmbeddedDocuments('ActiveEffect', [effect]);
  },

  /**
   * Remove condition from token
   */
  async removeConditionFromToken(token, conditionName) {
    if (!token.actor) return;

    const effects = token.actor.effects.filter(e =>
      e.name.toLowerCase() === conditionName.toLowerCase()
    );

    if (effects.length > 0) {
      await token.actor.deleteEmbeddedDocuments('ActiveEffect', 
        effects.map(e => e.id)
      );
    }
  },

  /**
   * Toggle condition on token
   */
  async toggleConditionOnToken(token, conditionName) {
    const hasEffect = token.actor?.effects.some(e =>
      e.name.toLowerCase() === conditionName.toLowerCase()
    );

    if (hasEffect) {
      await this.removeConditionFromToken(token, conditionName);
    } else {
      await this.applyConditionToToken(token, conditionName);
    }
  },

  /**
   * Get all active conditions on token considering chains
   */
  async getActiveConditions(token) {
    if (!token.actor) return [];

    const baseConditions = token.actor.effects
      .map(e => e.name)
      .filter(name => name);

    return await this.processConditionChains(token, baseConditions);
  },

  /**
   * Clear batch queue
   */
  clearBatchQueue() {
    this.batchQueue = [];
    this.batchProcessing = false;
  }
};
