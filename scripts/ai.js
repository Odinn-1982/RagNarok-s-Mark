/**
 * AI & Intelligent Features Module for Ragnar's Mark v4.0.0
 * Provides machine learning-based suggestions, predictive effects, and smart recommendations
 */

export const AI = {
  // Learning system data storage
  learningData: {
    conditionPairs: {},      // Track condition co-occurrences
    tokenProfiles: {},       // Learning profiles per token/actor
    combatPatterns: {},      // Combat scenario patterns
    userPreferences: {},     // User preference learning
    suggestionAccuracy: {}   // Track suggestion success rates
  },

  // Configuration
  maxSuggestions: 5,
  learningThreshold: 3,     // Minimum occurrences to suggest
  confidenceThreshold: 0.6, // Minimum confidence for suggestions

  /**
   * Initialize AI learning system
   */
  init() {
    console.log('AI Learning System initialized');
    this.loadLearningData();
  },

  /**
   * Generate intelligent condition suggestions based on context
   * @param {string} tokenId - Token ID to analyze
   * @param {object} context - Contextual information (combatState, scene, etc)
   * @returns {array} Array of suggested conditions with confidence scores
   */
  generateConditionSuggestions(tokenId, context = {}) {
    const token = canvas.tokens.get(tokenId);
    if (!token) return [];

    const suggestions = [];
    const activeConditions = this.getActiveConditions(tokenId);
    
    // Check condition co-occurrence patterns
    for (const condition of activeConditions) {
      const pairs = this.learningData.conditionPairs[condition] || {};
      for (const [suggestedCondition, count] of Object.entries(pairs)) {
        if (!activeConditions.includes(suggestedCondition) && count >= this.learningThreshold) {
          suggestions.push({
            condition: suggestedCondition,
            confidence: Math.min(count / 10, 1.0),
            reason: 'Often appears with ' + condition,
            type: 'pattern'
          });
        }
      }
    }

    // Analyze token profile patterns
    const profile = this.getOrCreateTokenProfile(token);
    if (profile.commonConditions) {
      for (const [condition, frequency] of Object.entries(profile.commonConditions)) {
        if (!activeConditions.includes(condition) && frequency >= this.learningThreshold) {
          suggestions.push({
            condition,
            confidence: Math.min(frequency / 10, 1.0),
            reason: 'Common for this token type',
            type: 'profile'
          });
        }
      }
    }

    // Combat context suggestions
    if (context.inCombat) {
      const combatSuggestions = this.getCombatContextSuggestions(token, context);
      suggestions.push(...combatSuggestions);
    }

    // Filter by confidence threshold and deduplicate
    const uniqueSuggestions = new Map();
    for (const suggestion of suggestions) {
      if (suggestion.confidence >= this.confidenceThreshold) {
        if (!uniqueSuggestions.has(suggestion.condition)) {
          uniqueSuggestions.set(suggestion.condition, suggestion);
        } else {
          const existing = uniqueSuggestions.get(suggestion.condition);
          if (suggestion.confidence > existing.confidence) {
            uniqueSuggestions.set(suggestion.condition, suggestion);
          }
        }
      }
    }

    // Sort by confidence and return top N
    return Array.from(uniqueSuggestions.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, this.maxSuggestions);
  },

  /**
   * Get combat context-based suggestions
   * @param {object} token - Token object
   * @param {object} context - Combat context
   * @returns {array} Combat-specific suggestions
   */
  getCombatContextSuggestions(token, context) {
    const suggestions = [];
    const hp = token.actor?.system?.attributes?.hp;

    // Low HP suggestions
    if (hp && hp.value / hp.max < 0.25) {
      suggestions.push({
        condition: 'wounded',
        confidence: 0.8,
        reason: 'Token health is critically low',
        type: 'health'
      });
    }

    // Turn-based suggestions
    if (context.turn !== undefined) {
      const patterns = this.learningData.combatPatterns['turn_' + context.turn] || {};
      for (const [condition, score] of Object.entries(patterns)) {
        suggestions.push({
          condition,
          confidence: Math.min(score, 0.9),
          reason: 'Common condition on round ' + context.turn,
          type: 'timing'
        });
      }
    }

    return suggestions;
  },

  /**
   * Predict effect chains based on learning
   * @param {string} sourceCondition - Initial condition
   * @returns {array} Predicted chain of effects
   */
  predictEffectChain(sourceCondition) {
    const chain = [sourceCondition];
    let currentCondition = sourceCondition;
    const visited = new Set([sourceCondition]);
    const maxChainLength = 5;

    while (chain.length < maxChainLength) {
      const pairs = this.learningData.conditionPairs[currentCondition] || {};
      let nextCondition = null;
      let maxScore = this.learningThreshold;

      // Find most likely next condition
      for (const [condition, score] of Object.entries(pairs)) {
        if (!visited.has(condition) && score > maxScore) {
          nextCondition = condition;
          maxScore = score;
        }
      }

      if (!nextCondition) break;

      chain.push(nextCondition);
      visited.add(nextCondition);
      currentCondition = nextCondition;
    }

    return chain;
  },

  /**
   * Learn from user's condition application patterns
   * @param {string} tokenId - Token that received condition
   * @param {string} condition - Condition applied
   * @param {object} activeConditions - Set of conditions already active
   * @param {object} context - Additional context
   */
  learnFromApplication(tokenId, condition, activeConditions, context = {}) {
    const token = canvas.tokens.get(tokenId);
    if (!token) return;

    // Track condition pairs
    for (const active of activeConditions) {
      if (active !== condition) {
        this.learningData.conditionPairs[active] = this.learningData.conditionPairs[active] || {};
        this.learningData.conditionPairs[active][condition] = 
          (this.learningData.conditionPairs[active][condition] || 0) + 1;
      }
    }

    // Update token profile
    const profile = this.getOrCreateTokenProfile(token);
    profile.commonConditions[condition] = (profile.commonConditions[condition] || 0) + 1;
    profile.lastUpdated = Date.now();

    // Track combat patterns if in combat
    if (game.combat?.active) {
      const roundKey = 'turn_' + game.combat.round;
      this.learningData.combatPatterns[roundKey] = this.learningData.combatPatterns[roundKey] || {};
      this.learningData.combatPatterns[roundKey][condition] = 
        (this.learningData.combatPatterns[roundKey][condition] || 0) + 1;
    }

    // Periodically save learning data
    if (Math.random() < 0.1) {
      this.saveLearningData();
    }
  },

  /**
   * Track suggestion accuracy for model improvement
   * @param {string} suggestion - Suggested condition
   * @param {boolean} accepted - Was suggestion accepted/used?
   */
  trackSuggestionResult(suggestion, accepted) {
    this.learningData.suggestionAccuracy[suggestion] = 
      this.learningData.suggestionAccuracy[suggestion] || { total: 0, accepted: 0 };
    this.learningData.suggestionAccuracy[suggestion].total += 1;
    if (accepted) {
      this.learningData.suggestionAccuracy[suggestion].accepted += 1;
    }
  },

  /**
   * Get or create learning profile for token
   * @param {object} token - Token object
   * @returns {object} Token learning profile
   */
  getOrCreateTokenProfile(token) {
    const profileKey = token.actor?.id || token.id;
    if (!this.learningData.tokenProfiles[profileKey]) {
      this.learningData.tokenProfiles[profileKey] = {
        commonConditions: {},
        createdAt: Date.now(),
        lastUpdated: Date.now(),
        type: token.actor?.type || 'unknown',
        name: token.name
      };
    }
    return this.learningData.tokenProfiles[profileKey];
  },

  /**
   * Get active conditions on token
   * @param {string} tokenId - Token ID
   * @returns {array} Array of active condition names
   */
  getActiveConditions(tokenId) {
    const token = canvas.tokens.get(tokenId);
    if (!token?.actor) return [];
    return token.actor.effects?.map(e => e.name) || [];
  },

  /**
   * Get AI insights about condition usage
   * @returns {object} Analytics about learning patterns
   */
  getAIInsights() {
    const insights = {
      totalPatterns: Object.keys(this.learningData.conditionPairs).length,
      totalProfiles: Object.keys(this.learningData.tokenProfiles).length,
      totalPatternPairs: 0,
      averagePairStrength: 0,
      mostCommonPair: null,
      suggestionAccuracy: {},
      topConditions: {}
    };

    // Calculate pattern statistics
    let totalPairs = 0;
    let totalStrength = 0;
    let maxPair = { strength: 0 };

    for (const [condition, pairs] of Object.entries(this.learningData.conditionPairs)) {
      for (const [target, strength] of Object.entries(pairs)) {
        totalPairs += 1;
        totalStrength += strength;
        if (strength > maxPair.strength) {
          maxPair = { from: condition, to: target, strength };
        }
      }
    }

    insights.totalPatternPairs = totalPairs;
    insights.averagePairStrength = totalPairs > 0 ? totalStrength / totalPairs : 0;
    if (maxPair.from) insights.mostCommonPair = maxPair;

    // Calculate suggestion accuracy
    for (const [suggestion, data] of Object.entries(this.learningData.suggestionAccuracy)) {
      insights.suggestionAccuracy[suggestion] = 
        data.total > 0 ? (data.accepted / data.total * 100).toFixed(1) + '%' : '0%';
    }

    // Top conditions by frequency
    const conditionFreq = {};
    for (const profile of Object.values(this.learningData.tokenProfiles)) {
      for (const [condition, freq] of Object.entries(profile.commonConditions)) {
        conditionFreq[condition] = (conditionFreq[condition] || 0) + freq;
      }
    }
    insights.topConditions = Object.entries(conditionFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([condition, freq]) => ({ condition, frequency: freq }));

    return insights;
  },

  /**
   * Save learning data to world flags
   */
  saveLearningData() {
    try {
      game.settings.set('ragnars-mark', 'aiLearningData', JSON.stringify(this.learningData));
    } catch (e) {
      console.error('Failed to save AI learning data:', e);
    }
  },

  /**
   * Load learning data from world flags
   */
  loadLearningData() {
    try {
      const stored = game.settings.get('ragnars-mark', 'aiLearningData');
      if (stored) {
        this.learningData = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load AI learning data:', e);
    }
  },

  /**
   * Reset learning data (admin function)
   */
  resetLearningData() {
    this.learningData = {
      conditionPairs: {},
      tokenProfiles: {},
      combatPatterns: {},
      userPreferences: {},
      suggestionAccuracy: {}
    };
    this.saveLearningData();
  }
};
