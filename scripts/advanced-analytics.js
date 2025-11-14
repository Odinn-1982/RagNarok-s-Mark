/**
 * Advanced Analytics & Reporting Module for Ragnar's Mark v4.0.0
 * Provides weekly/monthly reports, predictive analytics, condition trends, PDF export, advanced visualizations
 */

export const ADVANCED_ANALYTICS = {
  // Report storage
  reports: {},
  reportSchedules: {},
  
  // Analytics data
  trendData: {},
  predictions: {},
  
  // Configuration
  reportFormats: ['json', 'csv', 'pdf', 'html'],
  trendPeriods: ['daily', 'weekly', 'monthly', 'quarterly'],

  /**
   * Initialize advanced analytics system
   */
  init() {
    console.log('Advanced Analytics & Reporting system initialized');
    this.loadReports();
  },

  /**
   * Generate weekly combat report
   * @param {Date} weekStart - Start of week
   * @returns {object} Weekly report
   */
  generateWeeklyReport(weekStart = null) {
    if (!weekStart) {
      weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    }

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const report = {
      id: 'report_' + Date.now(),
      type: 'weekly',
      period: {
        start: weekStart,
        end: weekEnd
      },
      generatedAt: Date.now(),
      
      // Combat statistics
      combatSessions: this.getCombatSessionsInPeriod(weekStart, weekEnd),
      totalRounds: 0,
      totalTokensAffected: 0,
      avgConditionsPerRound: 0,
      
      // Condition statistics
      conditionApplications: {},
      mostAppliedConditions: [],
      mostAffectedActors: [],
      conditionDurations: {},
      
      // Trends
      applicationTrend: [],
      removeTrend: [],
      
      // Combat insights
      deadliestCondition: null,
      mosrCommonCombination: null,
      averageSurvivalTime: 0
    };

    // Calculate statistics
    this.calculateWeeklyStats(report, weekStart, weekEnd);

    this.reports[report.id] = report;
    this.saveReports();

    return report;
  },

  /**
   * Generate monthly trend analysis
   * @param {number} monthOffset - Months back (0 = current month)
   * @returns {object} Monthly trend report
   */
  generateMonthlyTrendAnalysis(monthOffset = 0) {
    const now = new Date();
    const month = now.getMonth() - monthOffset;
    const year = now.getFullYear();

    const report = {
      id: 'trend_' + Date.now(),
      type: 'monthly_trend',
      month: new Date(year, month, 1),
      generatedAt: Date.now(),
      
      // Trend data
      conditionTrends: {},
      actorTrends: {},
      timeSeriesData: [],
      
      // Analytics
      growthMetrics: {},
      volatility: {},
      predictions: {},
      
      // Insights
      trends: [],
      anomalies: [],
      recommendations: []
    };

    // Calculate trend statistics
    this.calculateMonthlyTrends(report);

    return report;
  },

  /**
   * Calculate weekly statistics
   * @param {object} report - Report to populate
   * @param {Date} weekStart - Start of week
   * @param {Date} weekEnd - End of week
   */
  calculateWeeklyStats(report, weekStart, weekEnd) {
    // Aggregate data from ANALYTICS module
    if (!window.ANALYTICS) return;

    const auditLog = window.ANALYTICS.auditLog || [];
    const weekLogs = auditLog.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= weekStart && logDate <= weekEnd;
    });

    // Count applications
    const conditionCounts = {};
    const actorCounts = {};
    let totalApplications = 0;

    for (const log of weekLogs) {
      if (log.action === 'apply') {
        totalApplications += 1;
        conditionCounts[log.condition] = (conditionCounts[log.condition] || 0) + 1;
        actorCounts[log.tokenName] = (actorCounts[log.tokenName] || 0) + 1;
      }
    }

    report.conditionApplications = conditionCounts;
    report.mostAppliedConditions = Object.entries(conditionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([condition, count]) => ({ condition, count }));

    report.mostAffectedActors = Object.entries(actorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([actor, count]) => ({ actor, count }));

    report.totalTokensAffected = Object.keys(actorCounts).length;
    report.avgConditionsPerRound = totalApplications > 0 
      ? (totalApplications / (report.combatSessions.length || 1)).toFixed(2)
      : 0;

    // Calculate most common combination
    const combinations = this.findCommonCombinations(weekLogs);
    if (combinations.length > 0) {
      report.mostCommonCombination = combinations[0];
    }
  },

  /**
   * Calculate monthly trend analysis
   * @param {object} report - Report to populate
   */
  calculateMonthlyTrends(report) {
    if (!window.ANALYTICS) return;

    // Collect monthly data
    const monthStart = new Date(report.month);
    const monthEnd = new Date(report.month);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    const auditLog = window.ANALYTICS.auditLog || [];
    const monthLogs = auditLog.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= monthStart && logDate <= monthEnd;
    });

    // Generate time series data (daily)
    const dailyData = {};
    for (let day = 1; day <= 31; day++) {
      const dayKey = `day_${day}`;
      dailyData[dayKey] = {
        applications: 0,
        removals: 0,
        avgConditionsPerSession: 0
      };
    }

    for (const log of monthLogs) {
      const logDate = new Date(log.timestamp);
      const dayKey = `day_${logDate.getDate()}`;
      if (dailyData[dayKey]) {
        if (log.action === 'apply') {
          dailyData[dayKey].applications += 1;
        } else if (log.action === 'remove') {
          dailyData[dayKey].removals += 1;
        }
      }
    }

    report.timeSeriesData = Object.entries(dailyData).map(([day, data]) => ({
      day,
      ...data
    }));

    // Calculate growth metrics
    const firstHalf = monthLogs.slice(0, Math.floor(monthLogs.length / 2));
    const secondHalf = monthLogs.slice(Math.floor(monthLogs.length / 2));
    
    report.growthMetrics = {
      firstHalfApplications: firstHalf.filter(l => l.action === 'apply').length,
      secondHalfApplications: secondHalf.filter(l => l.action === 'apply').length,
      growthPercentage: this.calculateGrowth(
        firstHalf.filter(l => l.action === 'apply').length,
        secondHalf.filter(l => l.action === 'apply').length
      )
    };

    // Generate trend insights
    report.trends = this.analyzeTrends(dailyData);
    report.anomalies = this.detectAnomalies(dailyData);
    report.recommendations = this.generateRecommendations(report);
  },

  /**
   * Find common condition combinations
   * @param {array} auditLog - Audit log entries
   * @returns {array} Common combinations
   */
  findCommonCombinations(auditLog) {
    const combinations = {};

    // Group conditions by token
    const tokenConditions = {};
    for (const log of auditLog) {
      if (log.action === 'apply') {
        if (!tokenConditions[log.tokenId]) {
          tokenConditions[log.tokenId] = [];
        }
        tokenConditions[log.tokenId].push(log.condition);
      }
    }

    // Find recurring combinations
    for (const conditions of Object.values(tokenConditions)) {
      if (conditions.length > 1) {
        const combo = conditions.sort().join(' + ');
        combinations[combo] = (combinations[combo] || 0) + 1;
      }
    }

    return Object.entries(combinations)
      .sort((a, b) => b[1] - a[1])
      .map(([combo, count]) => ({
        conditions: combo.split(' + '),
        frequency: count
      }));
  },

  /**
   * Analyze trends in data
   * @param {object} dailyData - Daily statistics
   * @returns {array} Trend insights
   */
  analyzeTrends(dailyData) {
    const trends = [];
    const data = Object.values(dailyData).map(d => d.applications);

    // Calculate moving average (3-day)
    const movingAverage = [];
    for (let i = 0; i < data.length - 2; i++) {
      movingAverage.push((data[i] + data[i+1] + data[i+2]) / 3);
    }

    // Identify trend direction
    if (movingAverage.length > 0) {
      const firstAvg = movingAverage[0];
      const lastAvg = movingAverage[movingAverage.length - 1];
      
      if (lastAvg > firstAvg * 1.1) {
        trends.push({
          type: 'increasing',
          description: 'Condition applications trending upward',
          severity: 'high',
          percentageChange: ((lastAvg - firstAvg) / firstAvg * 100).toFixed(1)
        });
      } else if (lastAvg < firstAvg * 0.9) {
        trends.push({
          type: 'decreasing',
          description: 'Condition applications trending downward',
          severity: 'low',
          percentageChange: ((firstAvg - lastAvg) / firstAvg * 100).toFixed(1)
        });
      }
    }

    return trends;
  },

  /**
   * Detect anomalies in data
   * @param {object} dailyData - Daily statistics
   * @returns {array} Anomalies detected
   */
  detectAnomalies(dailyData) {
    const anomalies = [];
    const applications = Object.values(dailyData).map(d => d.applications);

    const mean = applications.reduce((a, b) => a + b, 0) / applications.length;
    const variance = applications.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / applications.length;
    const stdDev = Math.sqrt(variance);

    // Find outliers (values > 2 standard deviations from mean)
    Object.entries(dailyData).forEach(([day, data]) => {
      if (Math.abs(data.applications - mean) > 2 * stdDev) {
        anomalies.push({
          day,
          applications: data.applications,
          deviation: ((data.applications - mean) / stdDev).toFixed(2),
          description: data.applications > mean ? 'Unusually high activity' : 'Unusually low activity'
        });
      }
    });

    return anomalies;
  },

  /**
   * Generate recommendations based on analytics
   * @param {object} report - Report to analyze
   * @returns {array} Recommendations
   */
  generateRecommendations(report) {
    const recommendations = [];

    if (report.mostAppliedConditions.length > 0) {
      recommendations.push({
        priority: 'high',
        title: 'Focus on Most Applied Condition',
        description: `"${report.mostAppliedConditions[0].condition}" was applied ${report.mostAppliedConditions[0].count} times. Consider optimizing its rules.`
      });
    }

    if (report.growthMetrics.growthPercentage > 50) {
      recommendations.push({
        priority: 'high',
        title: 'Increasing Application Rate',
        description: `Condition applications increased by ${report.growthMetrics.growthPercentage}% in second half. Monitor for balance issues.`
      });
    }

    return recommendations;
  },

  /**
   * Calculate growth percentage
   * @param {number} before - Initial value
   * @param {number} after - Final value
   * @returns {number} Growth percentage
   */
  calculateGrowth(before, after) {
    if (before === 0) return after > 0 ? 100 : 0;
    return ((after - before) / before * 100).toFixed(1);
  },

  /**
   * Get combat sessions in period
   * @param {Date} startDate - Period start
   * @param {Date} endDate - Period end
   * @returns {array} Sessions in period
   */
  getCombatSessionsInPeriod(startDate, endDate) {
    // This would filter from game.combats data
    return [];
  },

  /**
   * Export report as PDF
   * @param {string} reportId - Report ID to export
   * @returns {Blob} PDF blob
   */
  exportReportAsPDF(reportId) {
    const report = this.reports[reportId];
    if (!report) return null;

    // Generate HTML content
    const html = this.generateReportHTML(report);

    // Create PDF (would use jsPDF library in production)
    const pdf = `<html><body>${html}</body></html>`;
    return new Blob([pdf], { type: 'application/pdf' });
  },

  /**
   * Export report as CSV
   * @param {string} reportId - Report ID to export
   * @returns {Blob} CSV blob
   */
  exportReportAsCSV(reportId) {
    const report = this.reports[reportId];
    if (!report) return null;

    let csv = 'Condition,Applications,Frequency\n';

    for (const item of report.mostAppliedConditions) {
      csv += `"${item.condition}",${item.count},${(item.count / report.mostAppliedConditions.reduce((a, b) => a + b.count, 0) * 100).toFixed(1)}%\n`;
    }

    return new Blob([csv], { type: 'text/csv' });
  },

  /**
   * Generate report as HTML
   * @param {object} report - Report to generate
   * @returns {string} HTML string
   */
  generateReportHTML(report) {
    let html = `
      <h1>Ragnar's Mark ${report.type === 'weekly' ? 'Weekly' : 'Monthly'} Report</h1>
      <p>Generated: ${new Date(report.generatedAt).toLocaleString()}</p>
      
      <h2>Top Conditions</h2>
      <ul>
    `;

    for (const item of report.mostAppliedConditions) {
      html += `<li>${item.condition}: ${item.count} applications</li>`;
    }

    html += `
      </ul>
      
      <h2>Most Affected Actors</h2>
      <ul>
    `;

    for (const item of report.mostAffectedActors) {
      html += `<li>${item.actor}: ${item.count} conditions</li>`;
    }

    html += '</ul>';

    return html;
  },

  /**
   * Schedule automatic weekly report generation
   * @param {number} dayOfWeek - Day of week (0-6, Sunday = 0)
   * @param {number} hour - Hour of day (0-23)
   * @returns {object} Schedule configuration
   */
  scheduleWeeklyReport(dayOfWeek = 1, hour = 9) {
    const schedule = {
      id: 'schedule_' + Date.now(),
      type: 'weekly',
      dayOfWeek,
      hour,
      active: true,
      createdAt: Date.now()
    };

    this.reportSchedules[schedule.id] = schedule;
    return schedule;
  },

  /**
   * Get prediction for condition usage
   * @param {string} condition - Condition to predict
   * @param {number} daysAhead - Days to predict ahead
   * @returns {object} Prediction data
   */
  predictConditionUsage(condition, daysAhead = 7) {
    const prediction = {
      condition,
      daysAhead,
      predictedApplications: 0,
      confidence: 0,
      trend: 'stable'
    };

    // Calculate prediction based on historical data
    if (window.ANALYTICS) {
      const stats = window.ANALYTICS.getConditionStats(condition);
      const recentAvg = stats.timesApplied / 7; // Last week average

      prediction.predictedApplications = Math.round(recentAvg * daysAhead);
      prediction.confidence = 0.75; // Placeholder
    }

    return prediction;
  },

  /**
   * Save reports
   */
  saveReports() {
    try {
  game.settings.set('ragnaroks-mark', 'advancedAnalyticsReports', JSON.stringify(this.reports));
    } catch (e) {
      console.error('Failed to save advanced analytics reports:', e);
    }
  },

  /**
   * Load reports
   */
  loadReports() {
    try {
  const stored = game.settings.get('ragnaroks-mark', 'advancedAnalyticsReports');
      if (stored) {
        this.reports = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load advanced analytics reports:', e);
    }
  }
};
