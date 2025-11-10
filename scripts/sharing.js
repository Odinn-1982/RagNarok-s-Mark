/**
 * Social & Sharing Module for RagNarok's Mark v4.0.0
 * Provides condition preset sharing, community library, export/import, voting/ratings
 */

export const SHARING = {
  // Community library data
  communityLibrary: {
    presets: {},        // Shared condition presets
    themes: {},         // Shared visual themes
    effects: {},        // Shared custom effects
    profiles: {}        // Shared customization profiles
  },

  // Local sharing data
  userLibrary: {},      // User's own shared content
  likedPresets: [],     // User's liked presets
  ratings: {},          // User's ratings of presets

  // Community server settings
  communityServer: 'https://api.ragnarsmark.community',  // Example URL
  apiKey: null,
  userId: null,

  /**
   * Initialize sharing system
   */
  init() {
    console.log('Social & Sharing system initialized');
    this.loadLocalLibrary();
    this.loadCommunityLibrary();
  },

  /**
   * Publish preset to community library
   * @param {string} presetName - Name of preset to share
   * @param {object} metadata - Metadata for sharing
   * @returns {object} Published preset info
   */
  publishPreset(presetName, metadata = {}) {
    const preset = game.settings.get('ragnars-mark', 'customizationProfiles')?.[presetName];
    if (!preset) {
      console.error(`Preset "${presetName}" not found`);
      return null;
    }

    const published = {
      id: this.generateShareId(),
      name: presetName,
      author: metadata.author || 'Anonymous',
      description: metadata.description || '',
      preset: preset,
      tags: metadata.tags || [],
      gameSystem: metadata.gameSystem || game.system.id,
      publishedAt: Date.now(),
      version: '4.0.0',
      license: metadata.license || 'CC-BY-4.0',
      ratings: { total: 0, average: 0, reviews: [] },
      downloads: 0,
      shares: 0,
      public: metadata.public !== false
    };

    this.userLibrary[published.id] = published;
    this.saveLocalLibrary();

    // In production, would send to community server
    this.syncToCommunityServer('preset', published);

    return published;
  },

  /**
   * Download preset from community library
   * @param {string} presetId - ID of preset to download
   * @returns {object} Downloaded preset
   */
  downloadPreset(presetId) {
    const preset = this.communityLibrary.presets[presetId];
    if (!preset) {
      console.error(`Preset "${presetId}" not found in community library`);
      return null;
    }

    // Create imported copy with local name
    const localName = preset.name + ' (Community)';
    const imported = {
      ...preset.preset,
      name: localName,
      source: {
        id: presetId,
        author: preset.author,
        url: `${this.communityServer}/presets/${presetId}`
      }
    };

    try {
      game.settings.set('ragnars-mark', 'customizationProfiles', {
        [localName]: imported
      });
      
      // Track download
      this.trackPresetDownload(presetId);
      
      return imported;
    } catch (e) {
      console.error('Failed to import preset:', e);
      return null;
    }
  },

  /**
   * Rate and review a community preset
   * @param {string} presetId - Preset ID to rate
   * @param {number} rating - Rating 1-5
   * @param {string} review - Optional review text
   * @returns {object} Review info
   */
  ratePreset(presetId, rating, review = '') {
    if (rating < 1 || rating > 5) {
      console.error('Rating must be between 1 and 5');
      return null;
    }

    const preset = this.communityLibrary.presets[presetId];
    if (!preset) {
      console.error(`Preset "${presetId}" not found`);
      return null;
    }

    const reviewData = {
      id: this.generateShareId(),
      userId: this.userId || 'anonymous',
      rating,
      review,
      author: game.user?.name || 'Anonymous',
      createdAt: Date.now()
    };

    preset.ratings.reviews.push(reviewData);
    preset.ratings.total += 1;
    preset.ratings.average = 
      preset.ratings.reviews.reduce((sum, r) => sum + r.rating, 0) / preset.ratings.total;

    // Sync to community server
    this.syncRatingToCommunityServer(presetId, reviewData);

    return reviewData;
  },

  /**
   * Like a preset
   * @param {string} presetId - Preset to like
   * @returns {boolean} Success status
   */
  likePreset(presetId) {
    if (this.likedPresets.includes(presetId)) {
      // Already liked, unlike
      this.likedPresets = this.likedPresets.filter(id => id !== presetId);
      return false;
    } else {
      this.likedPresets.push(presetId);
      return true;
    }
  },

  /**
   * Get trending presets in community
   * @param {number} limit - Number of results
   * @returns {array} Top trending presets
   */
  getTrendingPresets(limit = 10) {
    return Object.values(this.communityLibrary.presets)
      .sort((a, b) => {
        // Sort by: downloads + shares, then by average rating
        const scoreA = a.downloads + a.shares * 2 + (a.ratings.average * 10);
        const scoreB = b.downloads + b.shares * 2 + (b.ratings.average * 10);
        return scoreB - scoreA;
      })
      .slice(0, limit)
      .map(p => ({
        id: p.id,
        name: p.name,
        author: p.author,
        rating: p.ratings.average,
        downloads: p.downloads,
        gameSystem: p.gameSystem
      }));
  },

  /**
   * Search community library
   * @param {string} query - Search query
   * @param {object} filters - Search filters
   * @returns {array} Matching presets
   */
  searchCommunityLibrary(query, filters = {}) {
    const results = Object.values(this.communityLibrary.presets)
      .filter(p => {
        // Text search
        if (query) {
          const searchText = (p.name + ' ' + p.description + ' ' + p.tags.join(' ')).toLowerCase();
          if (!searchText.includes(query.toLowerCase())) return false;
        }

        // Filter by game system
        if (filters.gameSystem && p.gameSystem !== filters.gameSystem) return false;

        // Filter by minimum rating
        if (filters.minRating && p.ratings.average < filters.minRating) return false;

        // Filter by tags
        if (filters.tags && filters.tags.length > 0) {
          if (!filters.tags.some(tag => p.tags.includes(tag))) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Sort by relevance/rating
        if (filters.sortBy === 'rating') {
          return b.ratings.average - a.ratings.average;
        }
        return b.downloads - a.downloads;
      });

    return results.map(p => ({
      id: p.id,
      name: p.name,
      author: p.author,
      description: p.description,
      tags: p.tags,
      rating: p.ratings.average,
      downloads: p.downloads
    }));
  },

  /**
   * Share preset link (create shareable URL)
   * @param {string} presetId - Preset ID
   * @returns {string} Share URL
   */
  getShareLink(presetId) {
    return `${this.communityServer}/share/preset/${presetId}`;
  },

  /**
   * Export preset as JSON file
   * @param {string} presetName - Preset name
   * @returns {Blob} JSON blob for download
   */
  exportPresetAsJSON(presetName) {
    const preset = game.settings.get('ragnars-mark', 'customizationProfiles')?.[presetName];
    if (!preset) return null;

    const json = JSON.stringify({
      version: '4.0.0',
      type: 'preset',
      preset,
      exportedAt: new Date().toISOString(),
      exportedBy: game.user?.name || 'Unknown'
    }, null, 2);

    return new Blob([json], { type: 'application/json' });
  },

  /**
   * Collaborate on a preset (share for editing)
   * @param {string} presetId - Preset to collaborate on
   * @param {array} collaborators - List of collaborator names
   * @returns {object} Collaboration info
   */
  startCollaboration(presetId, collaborators = []) {
    const preset = this.userLibrary[presetId];
    if (!preset) {
      console.error(`Preset "${presetId}" not found`);
      return null;
    }

    const collaboration = {
      id: this.generateShareId(),
      presetId,
      collaborators,
      createdAt: Date.now(),
      lastModified: Date.now(),
      changes: [],
      permissions: {
        canEdit: true,
        canComment: true,
        canView: true
      }
    };

    // In production, would sync to server
    this.syncCollaborationToServer(collaboration);

    return collaboration;
  },

  /**
   * Get collaboration history for preset
   * @param {string} presetId - Preset ID
   * @returns {array} Change history
   */
  getCollaborationHistory(presetId) {
    // Would fetch from server in production
    return [];
  },

  /**
   * Sync to community server (placeholder for API calls)
   * @param {string} type - Content type
   * @param {object} content - Content to sync
   */
  syncToCommunityServer(type, content) {
    // In production, this would make actual API calls
    console.log(`Syncing ${type} to community server:`, content);
    // Example: fetch(`${this.communityServer}/api/upload`, { method: 'POST', body: JSON.stringify(content) })
  },

  /**
   * Track preset download on community server
   * @param {string} presetId - Preset ID
   */
  trackPresetDownload(presetId) {
    const preset = this.communityLibrary.presets[presetId];
    if (preset) {
      preset.downloads += 1;
    }
  },

  /**
   * Sync rating to community server
   * @param {string} presetId - Preset ID
   * @param {object} reviewData - Review to sync
   */
  syncRatingToCommunityServer(presetId, reviewData) {
    console.log(`Syncing rating for preset ${presetId}:`, reviewData);
  },

  /**
   * Sync collaboration to server
   * @param {object} collaboration - Collaboration data
   */
  syncCollaborationToServer(collaboration) {
    console.log('Syncing collaboration:', collaboration);
  },

  /**
   * Generate unique share ID
   * @returns {string} Share ID
   */
  generateShareId() {
    return 'share_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

  /**
   * Load community library from server
   */
  loadCommunityLibrary() {
    try {
      const stored = game.settings.get('ragnars-mark', 'communityLibraryCache');
      if (stored) {
        this.communityLibrary = JSON.parse(stored);
      }
      // In production, would fetch from community server periodically
    } catch (e) {
      console.error('Failed to load community library:', e);
    }
  },

  /**
   * Save local library
   */
  saveLocalLibrary() {
    try {
      game.settings.set('ragnars-mark', 'userLibrary', JSON.stringify(this.userLibrary));
    } catch (e) {
      console.error('Failed to save user library:', e);
    }
  },

  /**
   * Load local library
   */
  loadLocalLibrary() {
    try {
      const stored = game.settings.get('ragnars-mark', 'userLibrary');
      if (stored) {
        this.userLibrary = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load user library:', e);
    }
  }
};
