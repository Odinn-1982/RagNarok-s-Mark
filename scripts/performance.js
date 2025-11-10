/**
 * Performance & Scalability Module for Ragnar's Mark v4.0.0
 * Provides lazy loading, worker threads, condition compression, database optimization
 */

export const PERFORMANCE = {
  // Performance metrics
  metrics: {
    overlayRenderTime: 0,
    conditionCheckTime: 0,
    settingsLoadTime: 0,
    totalMemoryUsage: 0
  },

  // Lazy loading system
  lazyLoadQueue: [],
  loadingInProgress: false,
  batchSize: 50,      // Load N overlays at a time
  renderThreshold: 500, // Lazy load when > 500 overlays

  // Condition compression
  compressionEnabled: true,
  compressionMap: {},  // Maps long names to short codes

  // Worker thread support
  workers: {
    analytics: null,
    rendering: null
  },

  // Database optimization
  cacheInvalidationQueue: [],
  flushInterval: 5000,

  /**
   * Initialize performance system
   */
  init() {
    console.log('Performance & Scalability system initialized');
    this.initializeWorkers();
    this.setupCacheFlushing();
  },

  /**
   * Enable lazy loading for token overlays
   * @param {object} options - Configuration options
   */
  enableLazyLoading(options = {}) {
    this.batchSize = options.batchSize || 50;
    this.renderThreshold = options.renderThreshold || 500;
    
    console.log(`Lazy loading enabled (batch size: ${this.batchSize}, threshold: ${this.renderThreshold})`);
  },

  /**
   * Queue overlay for lazy loading
   * @param {object} token - Token to render
   * @param {array} conditions - Conditions to apply
   */
  queueForLazyLoad(token, conditions) {
    this.lazyLoadQueue.push({
      token,
      conditions,
      priority: this.calculatePriority(token)
    });

    // Sort by priority
    this.lazyLoadQueue.sort((a, b) => b.priority - a.priority);

    // Start processing if not already running
    if (!this.loadingInProgress) {
      this.processLazyLoadQueue();
    }
  },

  /**
   * Process lazy load queue in batches
   */
  async processLazyLoadQueue() {
    if (this.lazyLoadQueue.length === 0) {
      this.loadingInProgress = false;
      return;
    }

    this.loadingInProgress = true;

    // Process batch
    const batch = this.lazyLoadQueue.splice(0, this.batchSize);
    
    for (const item of batch) {
      try {
        await this.renderOverlays(item.token, item.conditions);
        // Yield to browser
        await new Promise(resolve => setTimeout(resolve, 0));
      } catch (e) {
        console.error('Error rendering overlay:', e);
      }
    }

    // Process next batch
    if (this.lazyLoadQueue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
      this.processLazyLoadQueue();
    } else {
      this.loadingInProgress = false;
    }
  },

  /**
   * Calculate priority for token rendering
   * @param {object} token - Token to calculate priority for
   * @returns {number} Priority score (higher = render sooner)
   */
  calculatePriority(token) {
    let priority = 0;

    // Is token controlled by player?
    if (token.isOwned) priority += 10;

    // Is token in current viewport?
    const canvas = game.canvas;
    if (canvas && token.position) {
      const dx = token.x - canvas.stage.pivot.x;
      const dy = token.y - canvas.stage.pivot.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 1000) {
        priority += 5 / (distance / 100 + 1); // Closer = higher priority
      }
    }

    // Is token in active scene?
    if (token.scene?.id === canvas.scene?.id) priority += 3;

    return priority;
  },

  /**
   * Render overlays for token
   * @param {object} token - Token to render
   * @param {array} conditions - Conditions to render
   */
  async renderOverlays(token, conditions) {
    const startTime = performance.now();

    try {
      // This would integrate with main rendering system
      // For now, just track the metric
      const endTime = performance.now();
      this.metrics.overlayRenderTime += (endTime - startTime);
    } catch (e) {
      console.error('Render error:', e);
    }
  },

  /**
   * Compress condition data for storage
   * @param {array} conditions - Conditions to compress
   * @returns {string} Compressed data
   */
  compressConditions(conditions) {
    if (!this.compressionEnabled) return JSON.stringify(conditions);

    let compressed = '';
    for (const condition of conditions) {
      const code = this.getOrCreateCompressionCode(condition);
      compressed += code + ',';
    }

    return compressed.slice(0, -1); // Remove trailing comma
  },

  /**
   * Decompress condition data
   * @param {string} compressed - Compressed data
   * @returns {array} Decompressed conditions
   */
  decompressConditions(compressed) {
    if (!this.compressionEnabled) return JSON.parse(compressed);

    const codes = compressed.split(',');
    const conditions = [];

    for (const code of codes) {
      const condition = this.getConditionFromCode(code);
      if (condition) {
        conditions.push(condition);
      }
    }

    return conditions;
  },

  /**
   * Get or create compression code for condition
   * @param {string} condition - Condition name
   * @returns {string} Compression code
   */
  getOrCreateCompressionCode(condition) {
    if (this.compressionMap[condition]) {
      return this.compressionMap[condition];
    }

    // Generate code: first 3 chars + count
    const code = condition.substring(0, 3).toUpperCase() + Object.keys(this.compressionMap).length;
    this.compressionMap[condition] = code;

    return code;
  },

  /**
   * Get condition from compression code
   * @param {string} code - Compression code
   * @returns {string|null} Condition name or null
   */
  getConditionFromCode(code) {
    for (const [condition, c] of Object.entries(this.compressionMap)) {
      if (c === code) return condition;
    }
    return null;
  },

  /**
   * Initialize web workers for heavy operations
   */
  initializeWorkers() {
    try {
      // Worker for analytics processing
      if (typeof(Worker) !== 'undefined') {
        // Create inline worker for analytics
        const analyticsWorkerCode = this.getAnalyticsWorkerCode();
        const blob = new Blob([analyticsWorkerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        this.workers.analytics = new Worker(workerUrl);

        console.log('Analytics worker initialized');
      }
    } catch (e) {
      console.warn('Failed to initialize workers:', e);
    }
  },

  /**
   * Get analytics worker code
   * @returns {string} Worker JavaScript code
   */
  getAnalyticsWorkerCode() {
    return `
      self.onmessage = function(event) {
        const data = event.data;
        
        if (data.type === 'calculateStats') {
          const result = {
            conditions: {},
            total: 0
          };

          for (const log of data.auditLog) {
            if (log.action === 'apply') {
              result.conditions[log.condition] = (result.conditions[log.condition] || 0) + 1;
              result.total += 1;
            }
          }

          self.postMessage({ type: 'statsComplete', result });
        }
      };
    `;
  },

  /**
   * Process analytics in worker thread
   * @param {array} auditLog - Audit log to process
   * @returns {Promise} Promise resolving to results
   */
  processAnalyticsInWorker(auditLog) {
    return new Promise((resolve, reject) => {
      if (!this.workers.analytics) {
        reject(new Error('Analytics worker not available'));
        return;
      }

      const handler = (event) => {
        if (event.data.type === 'statsComplete') {
          this.workers.analytics.removeEventListener('message', handler);
          resolve(event.data.result);
        }
      };

      this.workers.analytics.addEventListener('message', handler);
      this.workers.analytics.postMessage({
        type: 'calculateStats',
        auditLog
      });

      // Timeout after 30 seconds
      setTimeout(() => reject(new Error('Worker timeout')), 30000);
    });
  },

  /**
   * Optimize database queries
   * @param {string} query - Query to optimize
   * @returns {string} Optimized query
   */
  optimizeQuery(query) {
    // Add query optimization logic here
    return query;
  },

  /**
   * Setup automatic cache flushing
   */
  setupCacheFlushing() {
    setInterval(() => {
      if (this.cacheInvalidationQueue.length > 0) {
        this.flushCache();
      }
    }, this.flushInterval);
  },

  /**
   * Queue cache invalidation
   * @param {string} key - Cache key to invalidate
   */
  queueCacheInvalidation(key) {
    if (!this.cacheInvalidationQueue.includes(key)) {
      this.cacheInvalidationQueue.push(key);
    }
  },

  /**
   * Flush cache invalidation queue
   */
  flushCache() {
    // Invalidate queued cache entries
    for (const key of this.cacheInvalidationQueue) {
      // Clear cache entry
        try {
        game.settings.set('ragnaroks-mark', `cache_${key}`, null);
      } catch (e) {
        console.error(`Failed to invalidate cache for ${key}:`, e);
      }
    }

    this.cacheInvalidationQueue = [];
  },

  /**
   * Monitor performance metrics
   * @returns {object} Current metrics
   */
  getPerformanceMetrics() {
    return {
      overlayRenderTime: this.metrics.overlayRenderTime.toFixed(2) + 'ms',
      conditionCheckTime: this.metrics.conditionCheckTime.toFixed(2) + 'ms',
      settingsLoadTime: this.metrics.settingsLoadTime.toFixed(2) + 'ms',
      lazyLoadQueueSize: this.lazyLoadQueue.length,
      compressionEnabled: this.compressionEnabled,
      workersInitialized: Object.values(this.workers).filter(w => w !== null).length,
      cacheQueueSize: this.cacheInvalidationQueue.length
    };
  },

  /**
   * Profile a function's performance
   * @param {function} fn - Function to profile
   * @param {string} name - Function name for logging
   * @param {...any} args - Arguments to pass to function
   * @returns {any} Function result
   */
  async profileFunction(fn, name, ...args) {
    const startTime = performance.now();
    
    try {
      const result = await fn(...args);
      const endTime = performance.now();
      
      console.log(`${name} executed in ${(endTime - startTime).toFixed(2)}ms`);
      
      return result;
    } catch (e) {
      const endTime = performance.now();
      console.error(`${name} failed after ${(endTime - startTime).toFixed(2)}ms:`, e);
      throw e;
    }
  },

  /**
   * Enable memory optimization mode
   */
  enableMemoryOptimization() {
    console.log('Memory optimization mode enabled');
    this.compressionEnabled = true;
    this.enableLazyLoading({ batchSize: 25, renderThreshold: 300 });
  },

  /**
   * Get memory usage estimate
   * @returns {object} Memory usage info
   */
  getMemoryUsage() {
    if (performance.memory) {
      return {
        usedJSHeapSize: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + 'MB',
        totalJSHeapSize: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + 'MB',
        jsHeapSizeLimit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + 'MB'
      };
    }
    return { available: false };
  }
};
