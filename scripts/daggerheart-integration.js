/**
 * Daggerheart-Specific Integration for RagNarok's Mark v4.0.0
 * Handles FoundryBorne system mechanics including defeated/dead status management
 */

export const DAGGERHEART_INTEGRATION = {
  enabled: false,
  defeatedConditionKey: "defeated",
  deadConditionKey: "dead",

  /**
   * Initialize Daggerheart integration
   * Automatically detects FoundryBorne system
   */
  init() {
    // Check if we're running FoundryBorne (Daggerheart) system
    if (game.system.id === 'daggerheart' || game.system.id === 'foundryborne') {
      this.enabled = true;
      this.registerHooks();
      console.log('RagNarok\'s Mark: Daggerheart/FoundryBorne integration enabled');
    }
  },

  /**
   * Register Foundry hooks for HP monitoring
   */
  registerHooks() {
    // Monitor actor updates for HP changes
    Hooks.on('updateActor', (actor, changes, options, userId) => {
      this.handleActorUpdate(actor, changes, options, userId);
    });

    // Monitor token updates for HP changes (for unlinked tokens)
    Hooks.on('updateToken', (token, changes, options, userId) => {
      this.handleTokenUpdate(token, changes, options, userId);
    });

    console.log('RagNarok\'s Mark: Daggerheart HP monitoring hooks registered');
  },

  /**
   * Handle actor updates - check for HP reaching 0
   * @param {Actor} actor - The actor being updated
   * @param {object} changes - The changes being applied
   * @param {object} options - Update options
   * @param {string} userId - User making the change
   */
  async handleActorUpdate(actor, changes, options, userId) {
    // Check if HP was modified
    const hpPath = 'system.resources.hp.value'; // Adjust path based on FoundryBorne data structure
    
    // Try common HP paths for Daggerheart/FoundryBorne
    const hpValue = foundry.utils.getProperty(changes, hpPath) 
                 || foundry.utils.getProperty(changes, 'system.hp.value')
                 || foundry.utils.getProperty(changes, 'data.resources.hp.value')
                 || foundry.utils.getProperty(changes, 'data.hp.value');

    if (hpValue !== undefined) {
      const currentHP = foundry.utils.getProperty(actor, hpPath)
                     || foundry.utils.getProperty(actor, 'system.hp.value')
                     || foundry.utils.getProperty(actor, 'data.resources.hp.value')
                     || foundry.utils.getProperty(actor, 'data.hp.value')
                     || hpValue;

      // Check if HP has reached 0
      if (currentHP <= 0) {
        await this.handleZeroHP(actor);
      } else if (currentHP > 0) {
        // HP is above 0, remove defeated/dead conditions if present
        await this.handleRevival(actor);
      }
    }
  },

  /**
   * Handle token updates - for unlinked tokens
   * @param {TokenDocument} tokenDoc - The token document being updated
   * @param {object} changes - The changes being applied
   * @param {object} options - Update options
   * @param {string} userId - User making the change
   */
  async handleTokenUpdate(tokenDoc, changes, options, userId) {
    if (!tokenDoc.actor) return;

    // Similar HP path checking for token data
    const hpPath = 'actorData.system.resources.hp.value';
    const hpValue = foundry.utils.getProperty(changes, hpPath)
                 || foundry.utils.getProperty(changes, 'actorData.system.hp.value')
                 || foundry.utils.getProperty(changes, 'delta.system.resources.hp.value')
                 || foundry.utils.getProperty(changes, 'delta.system.hp.value');

    if (hpValue !== undefined) {
      const currentHP = hpValue;

      if (currentHP <= 0) {
        await this.handleZeroHP(tokenDoc.actor, tokenDoc);
      } else if (currentHP > 0) {
        await this.handleRevival(tokenDoc.actor, tokenDoc);
      }
    }
  },

  /**
   * Handle when HP reaches 0
   * Automatically applies "Defeated" condition
   * @param {Actor} actor - The actor that reached 0 HP
   * @param {TokenDocument} token - Optional token document
   */
  async handleZeroHP(actor, token = null) {
    // Find the actor's token(s) if not provided
    const tokens = token ? [token] : actor.getActiveTokens();
    
    if (tokens.length === 0) {
      console.warn('RagNarok\'s Mark: No active tokens found for actor reaching 0 HP');
      return;
    }

    // Apply "Defeated" condition to all tokens of this actor
    for (const tokenDoc of tokens) {
      const tokenObject = tokenDoc.object || tokenDoc;
      
      // Check if already defeated or dead
      const hasDefeated = this.hasCondition(tokenObject, this.defeatedConditionKey);
      const hasDead = this.hasCondition(tokenObject, this.deadConditionKey);

      if (!hasDefeated && !hasDead) {
        await this.applyCondition(tokenObject, this.defeatedConditionKey);
        
        // Notification to GM and players
        const actorType = actor.type === 'character' ? 'PC' : (actor.type === 'npc' ? 'Adversary/NPC' : 'Token');
        const message = `${actor.name} (${actorType}) has reached 0 HP and is now <strong>Defeated</strong>. 
                        <br><em>Right-click the token and select "Mark as Dead" if narratively appropriate.</em>`;
        
        ui.notifications.info(`${actor.name} is Defeated!`);
        
        // Post to chat for visibility
        ChatMessage.create({
          content: message,
          speaker: ChatMessage.getSpeaker({ actor: actor }),
          type: CONST.CHAT_MESSAGE_TYPES.OTHER
        });
      }
    }
  },

  /**
   * Handle when HP goes above 0 (revival/healing)
   * Removes "Defeated" condition but preserves "Dead" if present
   * @param {Actor} actor - The actor being healed
   * @param {TokenDocument} token - Optional token document
   */
  async handleRevival(actor, token = null) {
    const tokens = token ? [token] : actor.getActiveTokens();
    
    if (tokens.length === 0) return;

    for (const tokenDoc of tokens) {
      const tokenObject = tokenDoc.object || tokenDoc;
      
      const hasDefeated = this.hasCondition(tokenObject, this.defeatedConditionKey);
      const hasDead = this.hasCondition(tokenObject, this.deadConditionKey);

      // Only remove "Defeated" automatically
      // "Dead" must be manually removed (narrative choice)
      if (hasDefeated && !hasDead) {
        await this.removeCondition(tokenObject, this.defeatedConditionKey);
        
        ui.notifications.info(`${actor.name} has recovered from Defeated status!`);
      } else if (hasDefeated && hasDead) {
        // They're marked as dead - don't auto-remove defeated
        // GM must manually handle resurrection
        console.log(`${actor.name} is marked Dead - manual intervention required for revival`);
      }
    }
  },

  /**
   * Check if a token has a specific condition
   * @param {Token} token - The token to check
   * @param {string} conditionKey - Condition identifier
   * @returns {boolean} True if condition is present
   */
  hasCondition(token, conditionKey) {
    if (!token?.actor) return false;

    // Check active effects for this condition
    return token.actor.effects.some(effect => {
      const effectName = effect.name?.toLowerCase() || '';
      const effectLabel = effect.label?.toLowerCase() || '';
      const conditionName = conditionKey.toLowerCase();
      
      return effectName === conditionName || 
             effectLabel === conditionName ||
             effect.flags?.['ragnars-mark']?.conditionKey === conditionKey;
    });
  },

  /**
   * Apply a condition to a token
   * @param {Token} token - The token to apply condition to
   * @param {string} conditionKey - Condition identifier
   */
  async applyCondition(token, conditionKey) {
    if (!token?.actor) return;

    // Get condition configuration from RagNarok's Mark settings
    const conditionSettings = game.settings.get('ragnars-mark', 'conditionSettings') || {};
    const conditionConfig = conditionSettings[conditionKey] || {};

    // Create the effect
    const effectData = {
      name: conditionKey.charAt(0).toUpperCase() + conditionKey.slice(1),
      label: conditionKey.charAt(0).toUpperCase() + conditionKey.slice(1),
      icon: 'icons/svg/skull.svg', // Default icon
      flags: {
        'ragnars-mark': {
          conditionKey: conditionKey,
          appliedBy: 'daggerheart-integration',
          timestamp: Date.now()
        }
      },
      changes: [],
      disabled: false,
      transfer: false // Don't transfer to actor, keep on token
    };

    // Apply the effect
    await token.actor.createEmbeddedDocuments('ActiveEffect', [effectData]);

    // Trigger RagNarok's Mark visual effects if available
    if (window.RagnarsMarkAPI?.visualEffects) {
      window.RagnarsMarkAPI.visualEffects.applyConditionEffect(token, conditionKey);
    }
  },

  /**
   * Remove a condition from a token
   * @param {Token} token - The token to remove condition from
   * @param {string} conditionKey - Condition identifier
   */
  async removeCondition(token, conditionKey) {
    if (!token?.actor) return;

    // Find and remove the effect
    const effectToRemove = token.actor.effects.find(effect => {
      const effectName = effect.name?.toLowerCase() || '';
      const effectLabel = effect.label?.toLowerCase() || '';
      const conditionName = conditionKey.toLowerCase();
      
      return effectName === conditionName || 
             effectLabel === conditionName ||
             effect.flags?.['ragnars-mark']?.conditionKey === conditionKey;
    });

    if (effectToRemove) {
      await effectToRemove.delete();
      
      // Trigger RagNarok's Mark visual effect removal if available
      if (window.RagnarsMarkAPI?.visualEffects) {
        window.RagnarsMarkAPI.visualEffects.removeConditionEffect(token, conditionKey);
      }
    }
  },

  /**
   * Manually mark a defeated token as dead
   * Called from context menu or UI
   * @param {Token} token - The token to mark as dead
   */
  async markAsDead(token) {
    if (!token?.actor) return;

    const hasDefeated = this.hasCondition(token, this.defeatedConditionKey);
    const hasDead = this.hasCondition(token, this.deadConditionKey);

    if (!hasDead) {
      // Remove defeated, add dead
      if (hasDefeated) {
        await this.removeCondition(token, this.defeatedConditionKey);
      }
      await this.applyCondition(token, this.deadConditionKey);

      const actorType = token.actor.type === 'character' ? 'PC' : 'Adversary/NPC';
      ui.notifications.warn(`${token.name} (${actorType}) has been marked as Dead.`);

      // Post to chat
      ChatMessage.create({
        content: `<strong>${token.name}</strong> has been marked as <strong>Dead</strong>.`,
        speaker: ChatMessage.getSpeaker({ token: token }),
        type: CONST.CHAT_MESSAGE_TYPES.OTHER
      });
    }
  },

  /**
   * Manually mark a dead token back to defeated (resurrection prep)
   * @param {Token} token - The token to revive
   */
  async markAsDefeated(token) {
    if (!token?.actor) return;

    const hasDead = this.hasCondition(token, this.deadConditionKey);

    if (hasDead) {
      await this.removeCondition(token, this.deadConditionKey);
      await this.applyCondition(token, this.defeatedConditionKey);

      ui.notifications.info(`${token.name} has been revived to Defeated status (requires healing to recover fully).`);
    }
  },

  /**
   * Remove all defeated/dead conditions (full resurrection)
   * @param {Token} token - The token to fully revive
   */
  async fullyRevive(token) {
    if (!token?.actor) return;

    const hasDefeated = this.hasCondition(token, this.defeatedConditionKey);
    const hasDead = this.hasCondition(token, this.deadConditionKey);

    if (hasDefeated) {
      await this.removeCondition(token, this.defeatedConditionKey);
    }
    if (hasDead) {
      await this.removeCondition(token, this.deadConditionKey);
    }

    ui.notifications.info(`${token.name} has been fully revived!`);
  }
};

/**
 * Add context menu options for defeated/dead management
 */
Hooks.on('getTokenHUDButtons', (hud, buttons, token) => {
  if (!DAGGERHEART_INTEGRATION.enabled) return;

  const hasDefeated = DAGGERHEART_INTEGRATION.hasCondition(token.object, DAGGERHEART_INTEGRATION.defeatedConditionKey);
  const hasDead = DAGGERHEART_INTEGRATION.hasCondition(token.object, DAGGERHEART_INTEGRATION.deadConditionKey);

  // Add "Mark as Dead" button if defeated
  if (hasDefeated && !hasDead) {
    buttons.unshift({
      label: '☠️ Mark as Dead',
      class: 'ragnars-mark-dead',
      icon: 'fas fa-skull-crossbones',
      onclick: async () => {
        await DAGGERHEART_INTEGRATION.markAsDead(token.object);
      }
    });
  }

  // Add "Revive to Defeated" button if dead
  if (hasDead) {
    buttons.unshift({
      label: '💚 Revive (Defeated)',
      class: 'ragnars-mark-revive-defeated',
      icon: 'fas fa-heart',
      onclick: async () => {
        await DAGGERHEART_INTEGRATION.markAsDefeated(token.object);
      }
    });
  }

  // Add "Fully Revive" button if defeated or dead
  if (hasDefeated || hasDead) {
    buttons.unshift({
      label: '✨ Fully Revive',
      class: 'ragnars-mark-revive-full',
      icon: 'fas fa-magic',
      onclick: async () => {
        await DAGGERHEART_INTEGRATION.fullyRevive(token.object);
      }
    });
  }
});

// Initialize when Foundry is ready
Hooks.once('ready', () => {
  DAGGERHEART_INTEGRATION.init();
});

// Export for use in main module
export default DAGGERHEART_INTEGRATION;
