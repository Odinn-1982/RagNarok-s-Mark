/**
 * Quality of Life Module for Ragnar's Mark v4.0.0
 * Provides quick add panel, favorites system, condition history, undo/redo, drag-drop reordering
 */

export const QUALITY_OF_LIFE = {
  // Quick access panel
  quickAddPanel: {
    visible: false,
    position: { x: 0, y: 0 },
    favorites: []
  },

  // Favorites system
  favorites: [],
  favoriteCategories: {},

  // History tracking
  history: {
    changes: [],
    currentIndex: -1,
    maxHistorySize: 100
  },

  // Undo/redo stacks
  undoStack: [],
  redoStack: [],

  // Condition history
  recentConditions: [],
  maxRecent: 10,

  /**
   * Initialize QOL system
   */
  init() {
    console.log('Quality of Life system initialized');
    this.loadFavorites();
    this.loadHistory();
  },

  /**
   * Toggle quick add panel visibility
   * @returns {boolean} New visibility state
   */
  toggleQuickAddPanel() {
    this.quickAddPanel.visible = !this.quickAddPanel.visible;

    if (this.quickAddPanel.visible) {
      this.renderQuickAddPanel();
    }

    return this.quickAddPanel.visible;
  },

  /**
   * Render quick add panel
   */
  renderQuickAddPanel() {
    // Create or show quick add panel
  let panel = document.getElementById('ragnaroks-mark-quick-panel');
    
    if (!panel) {
      panel = document.createElement('div');
  panel.id = 'ragnaroks-mark-quick-panel';
  panel.className = 'ragnaroks-mark-quick-panel';
      panel.innerHTML = `
        <div class="quick-panel-header">
          <h3>Quick Add Conditions</h3>
          <button class="close-btn" onclick="this.parentElement.parentElement.style.display='none'">×</button>
        </div>
        <div class="quick-panel-content">
          <div class="favorites-list" id="favorites-list"></div>
          <div class="recent-list" id="recent-list"></div>
          <input type="text" class="search-input" placeholder="Search conditions..." />
        </div>
      `;
      document.body.appendChild(panel);
    }

    panel.style.display = 'block';
    this.populateQuickPanel();
  },

  /**
   * Populate quick add panel with favorites and recent
   */
  populateQuickPanel() {
  const panel = document.getElementById('ragnaroks-mark-quick-panel');
    if (!panel) return;

    // Populate favorites
    const favoritesList = panel.querySelector('#favorites-list');
    if (favoritesList) {
      favoritesList.innerHTML = '<h4>Favorites</h4>';
      for (const fav of this.favorites) {
        const item = document.createElement('button');
        item.className = 'quick-item favorite';
        item.textContent = fav.condition;
        item.onclick = () => this.quickAddCondition(fav.condition);
        favoritesList.appendChild(item);
      }
    }

    // Populate recent
    const recentList = panel.querySelector('#recent-list');
    if (recentList) {
      recentList.innerHTML = '<h4>Recently Used</h4>';
      for (const recent of this.recentConditions) {
        const item = document.createElement('button');
        item.className = 'quick-item recent';
        item.textContent = recent;
        item.onclick = () => this.quickAddCondition(recent);
        recentList.appendChild(item);
      }
    }
  },

  /**
   * Quickly add condition to selected tokens
   * @param {string} condition - Condition to add
   */
  quickAddCondition(condition) {
    const selectedTokens = Array.from(canvas.tokens.controlled);
    
    if (selectedTokens.length === 0) {
      ui.notifications.warn('No tokens selected');
      return;
    }

    // Add condition to all selected tokens
    for (const token of selectedTokens) {
      if (window.RagnaroksMarkAPI) {
        window.RagnaroksMarkAPI.addCondition(token.id, condition);
      }
    }

    // Track as recent
    this.addToRecent(condition);

    // Provide feedback
    this.vibrate(50);
    ui.notifications.info(`Added "${condition}" to ${selectedTokens.length} token(s)`);
  },

  /**
   * Add condition to favorites
   * @param {string} condition - Condition to favorite
   * @param {string} category - Optional category
   * @returns {object} Favorite entry
   */
  addToFavorites(condition, category = 'General') {
    const existing = this.favorites.find(f => f.condition === condition);
    
    if (existing) {
      console.warn(`"${condition}" is already favorited`);
      return existing;
    }

    const favorite = {
      condition,
      category,
      addedAt: Date.now(),
      usageCount: 0
    };

    this.favorites.push(favorite);

    // Track category
    if (!this.favoriteCategories[category]) {
      this.favoriteCategories[category] = [];
    }
    this.favoriteCategories[category].push(condition);

    this.saveFavorites();
    return favorite;
  },

  /**
   * Remove condition from favorites
   * @param {string} condition - Condition to unfavorite
   * @returns {boolean} Success status
   */
  removeFromFavorites(condition) {
    const index = this.favorites.findIndex(f => f.condition === condition);
    
    if (index === -1) {
      return false;
    }

    this.favorites.splice(index, 1);
    this.saveFavorites();
    return true;
  },

  /**
   * Add condition to recent history
   * @param {string} condition - Condition to track
   */
  addToRecent(condition) {
    // Remove if already in recent
    this.recentConditions = this.recentConditions.filter(c => c !== condition);

    // Add to front
    this.recentConditions.unshift(condition);

    // Trim to max size
    this.recentConditions = this.recentConditions.slice(0, this.maxRecent);
  },

  /**
   * Track change for undo/redo
   * @param {string} action - Action description
   * @param {object} data - Change data
   */
  trackChange(action, data) {
    const change = {
      timestamp: Date.now(),
      action,
      data,
      // Store before/after state for undo
      undo: data.before,
      redo: data.after
    };

    // Remove any redo history if we make a new change
    this.redoStack = [];

    // Add to history
    this.undoStack.push(change);

    // Limit history size
    if (this.undoStack.length > this.history.maxHistorySize) {
      this.undoStack.shift();
    }

    this.history.changes.push(change);
    this.history.currentIndex += 1;
  },

  /**
   * Undo last action
   * @returns {boolean} Success status
   */
  undo() {
    if (this.undoStack.length === 0) {
      console.warn('No actions to undo');
      return false;
    }

    const change = this.undoStack.pop();
    this.redoStack.push(change);

    // Restore previous state
    try {
      this.restoreState(change.undo);
      ui.notifications.info(`Undid: ${change.action}`);
      return true;
    } catch (e) {
      console.error('Undo failed:', e);
      return false;
    }
  },

  /**
   * Redo last undone action
   * @returns {boolean} Success status
   */
  redo() {
    if (this.redoStack.length === 0) {
      console.warn('No actions to redo');
      return false;
    }

    const change = this.redoStack.pop();
    this.undoStack.push(change);

    // Restore new state
    try {
      this.restoreState(change.redo);
      ui.notifications.info(`Redid: ${change.action}`);
      return true;
    } catch (e) {
      console.error('Redo failed:', e);
      return false;
    }
  },

  /**
   * Restore state from change
   * @param {object} state - State to restore
   */
  restoreState(state) {
    // This would integrate with main system to restore state
    // For now, just log
    console.log('Restoring state:', state);
  },

  /**
   * Get condition history
   * @param {string} condition - Optional filter by condition
   * @returns {array} History entries
   */
  getConditionHistory(condition = null) {
    let history = this.history.changes;

    if (condition) {
      history = history.filter(h => h.data.condition === condition);
    }

    return history.map(h => ({
      timestamp: new Date(h.timestamp).toLocaleString(),
      action: h.action,
      condition: h.data.condition,
      target: h.data.token
    }));
  },

  /**
   * Clear history
   */
  clearHistory() {
    this.history = {
      changes: [],
      currentIndex: -1,
      maxHistorySize: 100
    };
    this.undoStack = [];
    this.redoStack = [];
  },

  /**
   * Get favorites list
   * @param {string} category - Optional category filter
   * @returns {array} Favorites
   */
  getFavorites(category = null) {
    if (category) {
      return this.favorites.filter(f => f.category === category);
    }
    return this.favorites;
  },

  /**
   * Reorder favorites (drag-drop)
   * @param {array} orderedConditions - Reordered condition names
   */
  reorderFavorites(orderedConditions) {
    // Reorder favorites array based on provided order
    const newFavorites = [];
    
    for (const condition of orderedConditions) {
      const fav = this.favorites.find(f => f.condition === condition);
      if (fav) {
        newFavorites.push(fav);
      }
    }

    // Add any missing favorites
    for (const fav of this.favorites) {
      if (!newFavorites.includes(fav)) {
        newFavorites.push(fav);
      }
    }

    this.favorites = newFavorites;
    this.saveFavorites();
  },

  /**
   * Enable keyboard shortcuts
   */
  enableKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      // Ctrl+Z: Undo
      if (event.ctrlKey && event.key === 'z') {
        event.preventDefault();
        this.undo();
      }

      // Ctrl+Y or Ctrl+Shift+Z: Redo
      if ((event.ctrlKey && event.key === 'y') || 
          (event.ctrlKey && event.shiftKey && event.key === 'z')) {
        event.preventDefault();
        this.redo();
      }

      // Ctrl+Q: Quick add panel
      if (event.ctrlKey && event.key === 'q') {
        event.preventDefault();
        this.toggleQuickAddPanel();
      }
    });
  },

  /**
   * Vibrate (mobile feedback)
   * @param {number} duration - Vibration duration in ms
   */
  vibrate(duration = 100) {
    if (navigator.vibrate) {
      navigator.vibrate(duration);
    }
  },

  /**
   * Save favorites to settings
   */
  saveFavorites() {
    try {
      game.settings.set('ragnaroks-mark', 'favoriteConditions', JSON.stringify(this.favorites));
    } catch (e) {
      console.error('Failed to save favorites:', e);
    }
  },

  /**
   * Load favorites from settings
   */
  loadFavorites() {
    try {
      const stored = game.settings.get('ragnaroks-mark', 'favoriteConditions');
      if (stored) {
        this.favorites = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load favorites:', e);
    }
  },

  /**
   * Save history to settings
   */
  saveHistory() {
    try {
      game.settings.set('ragnaroks-mark', 'conditionHistory', JSON.stringify(this.history));
    } catch (e) {
      console.error('Failed to save history:', e);
    }
  },

  /**
   * Load history from settings
   */
  loadHistory() {
    try {
      const stored = game.settings.get('ragnaroks-mark', 'conditionHistory');
      if (stored) {
        this.history = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load history:', e);
    }
  }
};
