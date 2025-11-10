/**
 * Analytics and statistics system for Ragnar's Mark v3.0
 * Condition statistics, combat reports, audit logs
 */

export const ANALYTICS = {
  auditLog: [],
  conditionStats: {},
  combatStats: {},
  maxLogEntries: 1000,

  /**
   * Log condition change for audit trail
   */
  logConditionChange(tokenId, tokenName, conditionName, action, metadata = {}) {
    const entry = {
      timestamp: Date.now(),
      tokenId,
      tokenName,
      condition: conditionName,
      action, // 'applied', 'removed', 'updated'
      sceneId: game.canvas?.scene?.id || 'unknown',
      userId: game.userId,
      metadata
    };

    this.auditLog.push(entry);

    // Keep audit log size reasonable
    if (this.auditLog.length > this.maxLogEntries) {
      this.auditLog.shift();
    }

    // Update condition statistics
    if (!this.conditionStats[conditionName]) {
      this.conditionStats[conditionName] = {
        applied: 0,
        removed: 0,
        totalApplications: 0,
        tokensAffected: new Set(),
        averageDuration: 0
      };
    }

    const stats = this.conditionStats[conditionName];
    if (action === 'applied') {
      stats.applied++;
      stats.totalApplications++;
      stats.tokensAffected.add(tokenId);
    } else if (action === 'removed') {
      stats.removed++;
      if (metadata.duration) {
        const durations = stats._durations || [];
        durations.push(metadata.duration);
        stats._durations = durations;
        stats.averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      }
    }
  },

  /**
   * Get statistics for a condition
   */
  getConditionStats(conditionName) {
    if (!this.conditionStats[conditionName]) {
      return null;
    }

    const stats = this.conditionStats[conditionName];
    return {
      name: conditionName,
      timesApplied: stats.applied,
      timesRemoved: stats.removed,
      totalApplications: stats.totalApplications,
      tokensAffected: stats.tokensAffected.size,
      averageDuration: Math.round(stats.averageDuration),
      mostRecentApplication: this.auditLog
        .reverse()
        .find(e => e.condition === conditionName && e.action === 'applied')?.timestamp
    };
  },

  /**
   * Get all condition statistics
   */
  getAllConditionStats() {
    const stats = {};
    for (const [condition, data] of Object.entries(this.conditionStats)) {
      stats[condition] = this.getConditionStats(condition);
    }
    return stats;
  },

  /**
   * Generate combat report for current combat
   */
  generateCombatReport(combat = null) {
    const activeCombat = combat || game.combat;
    if (!activeCombat) return null;

    const report = {
      combatId: activeCombat.id,
      sceneId: activeCombat.scene.id,
      startTime: activeCombat.startTime,
      endTime: Date.now(),
      rounds: activeCombat.round,
      turns: activeCombat.turns.length,
      conditions: {},
      participantStats: {}
    };

    // Get all conditions applied during this combat
    const combatEntries = this.auditLog.filter(e =>
      e.timestamp >= (report.startTime || 0) && e.timestamp <= report.endTime
    );

    for (const entry of combatEntries) {
      if (!report.conditions[entry.condition]) {
        report.conditions[entry.condition] = {
          applied: 0,
          removed: 0,
          netActive: 0
        };
      }

      const condStats = report.conditions[entry.condition];
      if (entry.action === 'applied') {
        condStats.applied++;
        condStats.netActive++;
      } else if (entry.action === 'removed') {
        condStats.removed++;
        condStats.netActive--;
      }
    }

    // Participant statistics
    for (const combatant of activeCombat.combatants) {
      const participantEntries = combatEntries.filter(e => e.tokenId === combatant.tokenId);
      report.participantStats[combatant.name] = {
        conditionsApplied: participantEntries.filter(e => e.action === 'applied').length,
        conditionsRemoved: participantEntries.filter(e => e.action === 'removed').length,
        currentConditions: participantEntries.length,
        avgConditionsPerTurn: participantEntries.length / Math.max(activeCombat.round, 1)
      };
    }

    return report;
  },

  /**
   * Export audit log as JSON
   */
  exportAuditLog() {
    return {
      exportDate: new Date().toISOString(),
      totalEntries: this.auditLog.length,
      data: this.auditLog
    };
  },

  /**
   * Import audit log from JSON
   */
  importAuditLog(jsonData) {
    if (!Array.isArray(jsonData)) return false;
    this.auditLog = [...jsonData];
    return true;
  },

  /**
   * Get audit log entries filtered
   */
  getAuditLog(filters = {}) {
    let filtered = [...this.auditLog];

    if (filters.condition) {
      filtered = filtered.filter(e => e.condition === filters.condition);
    }

    if (filters.tokenId) {
      filtered = filtered.filter(e => e.tokenId === filters.tokenId);
    }

    if (filters.action) {
      filtered = filtered.filter(e => e.action === filters.action);
    }

    if (filters.since) {
      filtered = filtered.filter(e => e.timestamp >= filters.since);
    }

    if (filters.limit) {
      filtered = filtered.slice(-filters.limit);
    }

    return filtered;
  },

  /**
   * Clear all statistics
   */
  clearStats() {
    this.auditLog = [];
    this.conditionStats = {};
    this.combatStats = {};
  },

  /**
   * Get most applied conditions
   */
  getMostAppliedConditions(limit = 10) {
    return Object.entries(this.conditionStats)
      .map(([name, stats]) => ({ name, ...stats, total: stats.applied + stats.removed }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  },

  /**
   * Get most affected tokens
   */
  getMostAffectedTokens(limit = 10) {
    const tokenCounts = {};
    for (const entry of this.auditLog) {
      if (!tokenCounts[entry.tokenId]) {
        tokenCounts[entry.tokenId] = { name: entry.tokenName, count: 0 };
      }
      tokenCounts[entry.tokenId].count++;
    }

    return Object.entries(tokenCounts)
      .map(([id, data]) => ({ tokenId: id, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
};
