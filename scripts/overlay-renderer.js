/**
 * RagNarok's Mark - Expanded Overlay System
 * Supports scaling with token size, sidebar rendering, and comprehensive customization
 */

const EXPANDED_CONDITIONS = {
  // Combat conditions
  vulnerable: { color: '#FF6B6B', scale: 1.2, glow: 1.0, animation: 'pulse' },
  wounded: { color: '#FF8C42', scale: 1.1, glow: 0.8, animation: 'fade' },
  dying: { color: '#8B0000', scale: 1.3, glow: 1.2, animation: 'pulse' },
  unconscious: { color: '#808080', scale: 0.9, glow: 0.7, animation: 'fade' },
  dead: { color: '#000000', scale: 0.8, glow: 0.5, animation: 'none' },
  defeated: { color: '#8B4513', scale: 1.0, glow: 1.0, animation: 'pulse' },
  
  // Status conditions
  blessed: { color: '#FFD700', scale: 1.1, glow: 0.9, animation: 'glow' },
  cursed: { color: '#663366', scale: 1.1, glow: 1.1, animation: 'pulse' },
  poisoned: { color: '#00AA00', scale: 1.0, glow: 0.8, animation: 'fade' },
  diseased: { color: '#776644', scale: 1.0, glow: 0.7, animation: 'fade' },
  petrified: { color: '#808080', scale: 1.0, glow: 0.5, animation: 'none' },
  
  // Control conditions
  charmed: { color: '#FF1493', scale: 1.1, glow: 1.0, animation: 'pulse' },
  confused: { color: '#9966CC', scale: 1.0, glow: 0.9, animation: 'pulse' },
  frightened: { color: '#FF4500', scale: 1.0, glow: 0.8, animation: 'fade' },
  restrained: { color: '#FFD700', scale: 1.0, glow: 0.9, animation: 'none' },
  prone: { color: '#A9A9A9', scale: 0.8, glow: 0.6, animation: 'fade' },
  
  // Invisibility/Perception
  hidden: { color: '#4A90E2', scale: 0.9, glow: 0.8, animation: 'fade' },
  invisible: { color: '#E0E0E0', scale: 0.8, glow: 0.6, animation: 'fade' },
  blinded: { color: '#333333', scale: 1.0, glow: 0.7, animation: 'pulse' },
  deafened: { color: '#696969', scale: 0.9, glow: 0.6, animation: 'none' },
  
  // Buff/Beneficial conditions
  hasted: { color: '#00FF00', scale: 1.2, glow: 1.0, animation: 'glow' },
  shielded: { color: '#87CEEB', scale: 1.0, glow: 0.9, animation: 'glow' },
  regenerating: { color: '#90EE90', scale: 1.1, glow: 0.8, animation: 'pulse' },
  protected: { color: '#6495ED', scale: 1.0, glow: 0.8, animation: 'glow' },
  
  // Magic conditions
  silenced: { color: '#696969', scale: 1.0, glow: 0.7, animation: 'fade' },
  muted: { color: '#A9A9A9', scale: 0.9, glow: 0.6, animation: 'fade' },
  dispelled: { color: '#FFB6C1', scale: 1.0, glow: 0.8, animation: 'pulse' },
  identified: { color: '#32CD32', scale: 1.0, glow: 0.7, animation: 'glow' }
};

const NORMALIZE = (value) => {
  if (typeof value !== 'string') return '';
  return value.toLowerCase().trim();
};

const sanitizeName = (value) => NORMALIZE(value).replace(/[^a-z0-9]+/g, '-');

const flattenStatusEffects = () => {
  const source = CONFIG?.statusEffects;
  if (!source) return [];
  if (Array.isArray(source) && typeof source.flat === 'function') {
    return source.flat(Infinity);
  }
  return Array.isArray(source) ? source : [];
};

/**
 * OverlayRenderer - Handles rendering overlays on tokens and sidebar
 */
class OverlayRenderer {
  static hasSetting(key) {
    try {
      return Boolean(game?.settings?.settings?.has(`ragnaroks-mark.${key}`));
    } catch (err) {
      return false;
    }
  }

  static safeGetSetting(key, fallback) {
    if (!this.hasSetting(key)) return fallback;
    try {
      const value = game.settings.get('ragnaroks-mark', key);
      if (value && typeof value === 'object') {
        if (foundry?.utils?.deepClone) return foundry.utils.deepClone(value);
        try { return structuredClone(value); } catch (err) { /* ignore */ }
        return JSON.parse(JSON.stringify(value));
      }
      return value;
    } catch (err) {
      return fallback;
    }
  }

  static loadConditionSettings() {
    const enabledConditions = this.safeGetSetting('enabledConditions', {});
    const conditionSettings = this.safeGetSetting('conditionSettings', {});
    return { enabledConditions, conditionSettings };
  }

  static gatherActiveConditions(actor, token) {
    const conditions = new Set();

    if (actor) {
      actor.effects?.forEach(effect => {
        const baseName = (effect.name || effect.label || '').toLowerCase().trim();
        if (baseName) conditions.add(baseName);

        if (effect.statuses instanceof Set) {
          effect.statuses.forEach(status => {
            if (typeof status === 'string' && status.trim()) {
              conditions.add(status.toLowerCase().trim());
            }
          });
        }

        const statusId = effect.flags?.core?.statusId;
        if (typeof statusId === 'string' && statusId.trim()) {
          conditions.add(statusId.toLowerCase().trim());
        }
      });

      if (actor.statuses instanceof Set) {
        actor.statuses.forEach(status => {
          if (typeof status === 'string' && status.trim()) {
            conditions.add(status.toLowerCase().trim());
          }
        });
      }
    }

    const collectTokenStatuses = (tokenInstance) => {
      const statuses = tokenInstance?.document?.statuses;
      if (statuses instanceof Set) {
        statuses.forEach(status => {
          if (typeof status === 'string' && status.trim()) {
            conditions.add(status.toLowerCase().trim());
          }
        });
      }
    };

    if (token) {
      collectTokenStatuses(token);
    } else if (actor?.getActiveTokens) {
      actor.getActiveTokens(true).forEach(t => collectTokenStatuses(t));
    }

    return Array.from(conditions);
  }

  static findMatchingCondition(conditionName, enabledConditions, matchingMode = 'exact') {
    if (!conditionName || !enabledConditions) return null;
    const normalizedName = NORMALIZE(conditionName);

    if (enabledConditions[normalizedName]) return normalizedName;
    if (enabledConditions[conditionName]) return conditionName;

    if (matchingMode !== 'exact') {
      for (const [key, value] of Object.entries(enabledConditions)) {
        if (!value) continue;
        const normalizedKey = NORMALIZE(key);
        if (!normalizedKey) continue;
        if (matchingMode === 'partial') {
          if (normalizedName.includes(normalizedKey) || normalizedKey.includes(normalizedName)) {
            return key;
          }
        }
      }
    }

    return null;
  }

  static findConditionIcon(conditionName, actor, matchingMode = 'partial') {
    const normalizedName = NORMALIZE(conditionName);
    if (!normalizedName) return null;

    const effects = actor?.effects ? Array.from(actor.effects) : [];
    for (const effect of effects) {
      const effectNames = new Set();
      effectNames.add(NORMALIZE(effect.name || effect.label));
      if (effect.statuses instanceof Set) {
        effect.statuses.forEach(status => effectNames.add(NORMALIZE(status)));
      }
      effectNames.add(NORMALIZE(effect.flags?.core?.statusId));

      if ([...effectNames].some(key => key && (key === normalizedName || (matchingMode === 'partial' && (key.includes(normalizedName) || normalizedName.includes(key)))))) {
        if (effect.icon) return effect.icon;
      }
    }

    const statusEffects = flattenStatusEffects();
    for (const status of statusEffects) {
      if (!status) continue;
      const candidates = [status.id, status.statusId, status.label, status.name, status?.flags?.core?.statusId]
        .map(NORMALIZE)
        .filter(Boolean);
      if (!candidates.length) continue;
      const matches = candidates.some(key => key === normalizedName || (matchingMode === 'partial' && (key.includes(normalizedName) || normalizedName.includes(key))));
      if (matches && typeof status.icon === 'string') {
        return status.icon;
      }
    }

    return null;
  }

  static refreshAllTokenOverlays() {
    if (!canvas?.tokens?.placeables) return;
    canvas.tokens.placeables.forEach(token => {
      if (token) {
        this.renderTokenOverlays(token);
      }
    });
    this.renderSidebarOverlays();
  }

  static resolveConditionSettings(conditionName, conditionSettings = {}) {
    const defaults = EXPANDED_CONDITIONS[conditionName] || {};
    const user = conditionSettings[conditionName] || {};

    const scale = user.scale ?? defaults.scale ?? 1.0;
    const glow = user.glow ?? defaults.glow ?? 1.0;

    return {
      color: user.color ?? defaults.color ?? '#FF0000',
      scale: typeof scale === 'string' ? parseFloat(scale) || 1.0 : scale,
      glow: typeof glow === 'string' ? parseFloat(glow) || 1.0 : glow,
      animation: user.animation ?? defaults.animation ?? 'none'
    };
  }

  static ensureOverlayContainer(token) {
    if (token.overlayContainer && !token.overlayContainer.destroyed) {
      if (token.overlayContainer.parent !== token) {
        try {
          token.overlayContainer.parent?.removeChild(token.overlayContainer);
        } catch (err) { /* ignore */ }
        token.addChild(token.overlayContainer);
        token.overlayContainer.zIndex = 5000;
        token.overlayContainer.x = 0;
        token.overlayContainer.y = 0;
      }
      return token.overlayContainer;
    }

    const container = new PIXI.Container();
    container.name = 'ragnaroks-mark-overlay-renderer';
    container.sortableChildren = true;
    container.x = 0;
    container.y = 0;
    container.zIndex = 5000;

    if (typeof token.sortableChildren === 'boolean') {
      token.sortableChildren = true;
    }

    token.addChild(container);

    token.overlayContainer = container;
    return container;
  }

  static hideDefaultEffects(token) {
    if (!token?.effects) return;
    if (typeof token._rmStoredEffectsVisible === 'undefined') {
      token._rmStoredEffectsVisible = token.effects.visible;
    }
    token.effects.visible = false;
  }

  static restoreDefaultEffects(token) {
    if (!token?.effects) return;
    if (typeof token._rmStoredEffectsVisible !== 'undefined') {
      token.effects.visible = token._rmStoredEffectsVisible;
      delete token._rmStoredEffectsVisible;
    } else {
      token.effects.visible = true;
    }
  }

  /**
   * Initialize overlay rendering
   */
  static init() {
    // Hook into token rendering
    Hooks.on('drawToken', (token) => this.renderTokenOverlays(token));
    Hooks.on('updateToken', (token) => this.updateTokenOverlays(token));
    
    // Hook into sidebar rendering
    Hooks.on('renderActorDirectory', () => this.renderSidebarOverlays());
    Hooks.on('renderActorSheet', () => this.renderSidebarOverlays());
  }

  /**
   * Render overlays on token
   */
  static renderTokenOverlays(token) {
    if (!token) return;

    // If a TokenDocument was passed, try to resolve the canvas Token object
    if (token?.document && typeof token.addChild !== 'function') {
      token = canvas.tokens.get(token.document.id) || token;
    }
    if (!token || typeof token.addChild !== 'function') return;

    const actor = token.actor;
    if (!actor) return;

    // Clear existing overlays
    this.clearTokenOverlays(token);

    const { enabledConditions, conditionSettings } = this.loadConditionSettings();
    const activeConditions = this.gatherActiveConditions(actor, token);

    const matchingMode = this.safeGetSetting('matchingMode', 'exact') || 'exact';

    activeConditions.forEach(conditionName => {
      const matchedKey = this.findMatchingCondition(conditionName, enabledConditions, matchingMode);
      if (!matchedKey || !enabledConditions[matchedKey]) return;

      const settings = this.resolveConditionSettings(matchedKey, conditionSettings);
      const icon = this.findConditionIcon(conditionName, actor, matchingMode);
      this.addOverlay(token, matchedKey, settings, { icon, originalName: conditionName });
    });
  }

  /**
   * Add an overlay to a token
   */
  static addOverlay(token, conditionName, settings, { icon = null, originalName = null } = {}) {
    if (!token.document || !token.document.texture) return;

    // Calculate overlay size based on token size
  // Prefer PIXI token pixel dimensions (w/h) when available; fall back to grid tiles * canvas.grid.size
  const gridSize = canvas?.grid?.size || 100;
  const tokenWidth = (typeof token.w === 'number' && token.w > 0)
    ? token.w
    : ((token.document?.width || 1) * gridSize);
  const tokenHeight = (typeof token.h === 'number' && token.h > 0)
    ? token.h
    : ((token.document?.height || 1) * gridSize);
    
    // Scale overlay relative to token size
  const scale = settings.scale || 1.0;
  const overlayWidth = Math.max(10, tokenWidth * scale);
  const overlayHeight = Math.max(10, tokenHeight * scale);

  const container = this.ensureOverlayContainer(token);
  container.visible = true;

  const sanitizedKey = sanitizeName(conditionName || originalName || '');
  const overlayId = sanitizedKey ? `overlay-${sanitizedKey}` : `overlay-${Math.random().toString(36).slice(2)}`;
    const existing = container.getChildByName(overlayId);
    if (existing) {
      try { container.removeChild(existing).destroy({ children: true }); } catch (err) { /* ignore */ }
    }

    const effectContainer = new PIXI.Container();
    effectContainer.name = overlayId;
    effectContainer.sortableChildren = true;
    effectContainer.zIndex = 50;

    // Position overlay: center relative to the token's pixel dims
    effectContainer.x = (tokenWidth - overlayWidth) / 2;
    effectContainer.y = (tokenHeight - overlayHeight) / 2;

    const overlayColor = (() => {
      try { return PIXI.utils.string2hex(settings.color); } catch (err) { return 0xFF0000; }
    })();
    const glowIntensity = settings.glow || 1.0;
    const borderAlpha = Math.min(1, 0.65 + glowIntensity * 0.2);
    const fillAlpha = Math.min(0.8, 0.35 + glowIntensity * 0.25);
    const borderWidth = Math.max(4, Math.round(Math.min(tokenWidth, tokenHeight) * 0.1 * glowIntensity));
    const maxRadius = Math.min(overlayWidth, overlayHeight) / 2 - 1;
    const cornerRadius = Math.max(8, Math.min(maxRadius, Math.min(overlayWidth, overlayHeight) * 0.2));

    const background = new PIXI.Graphics();
    background.zIndex = 5;
    background.alpha = fillAlpha;
    background.beginFill(overlayColor, 1);
    background.drawRoundedRect(0, 0, overlayWidth, overlayHeight, cornerRadius);
    background.endFill();
    effectContainer.addChild(background);

    if (icon) {
      try {
        const texture = PIXI.Texture.from(icon);
        const sprite = new PIXI.Sprite(texture);
        sprite.zIndex = 10;
        sprite.alpha = Math.min(1, 0.85 + glowIntensity * 0.05);
        const applySizing = () => {
          sprite.width = overlayWidth;
          sprite.height = overlayHeight;
          sprite.x = 0;
          sprite.y = 0;
        };
        if (!texture.baseTexture.valid) {
          texture.baseTexture.once('loaded', applySizing);
        } else {
          applySizing();
        }
        effectContainer.addChild(sprite);
      } catch (err) {
        // Fallback to background-only overlay when texture loading fails
      }
    }

    const border = new PIXI.Graphics();
    border.zIndex = 20;
    border.lineStyle(borderWidth, overlayColor, borderAlpha, 0.5, true);
    border.drawRoundedRect(0, 0, overlayWidth, overlayHeight, cornerRadius);
    effectContainer.addChild(border);

    if (settings.animation && settings.animation !== 'none') {
      this.applyOverlayAnimation(effectContainer, settings.animation, glowIntensity);
    }

    const debugMode = this.safeGetSetting('debugMode', false);
    if (debugMode) {
      try {
        console.log(`OverlayRenderer | Token ${token.id} (${token.name}): overlay:${originalName || conditionName} -> ${conditionName}`);
      } catch (err) { /* swallow */ }
    }

    container.addChild(effectContainer);
    this.hideDefaultEffects(token);
  }

  /**
   * Apply animation to overlay
   */
  static applyOverlayAnimation(overlay, animationType, intensity) {
    switch (animationType) {
      case 'pulse':
        this.animatePulse(overlay, intensity);
        break;
      case 'fade':
        this.animateFade(overlay, intensity);
        break;
      case 'glow':
        this.animateGlow(overlay, intensity);
        break;
    }
  }

  /**
   * Pulse animation
   */
  static animatePulse(overlay, intensity) {
    const originalAlpha = overlay.alpha;
    const tick = () => {
      const time = Date.now() % 1000 / 1000;
      const wave = Math.sin(time * Math.PI * 2);
      overlay.alpha = originalAlpha + (wave * 0.3 * intensity);
      requestAnimationFrame(tick);
    };
    tick();
  }

  /**
   * Fade animation
   */
  static animateFade(overlay, intensity) {
    const originalAlpha = overlay.alpha;
    const tick = () => {
      const time = Date.now() % 2000 / 2000;
      const wave = Math.sin(time * Math.PI) * 0.5;
      overlay.alpha = originalAlpha * (0.5 + wave * intensity);
      requestAnimationFrame(tick);
    };
    tick();
  }

  /**
   * Glow animation
   */
  static animateGlow(overlay, intensity) {
    const baseAlpha = overlay.alpha || 1;
    const tick = () => {
      const time = (Date.now() % 1500) / 1500;
      const wave = Math.sin(time * Math.PI * 2);
      overlay.alpha = baseAlpha + wave * 0.2 * intensity;
      requestAnimationFrame(tick);
    };
    tick();
  }

  /**
   * Clear overlays from token
   */
  static clearTokenOverlays(token) {
    const container = token.overlayContainer;
    if (!container) return;

    const removed = container.removeChildren();
    removed.forEach(child => {
      try { child.destroy({ children: true }); } catch (err) { /* ignore */ }
    });
    container.visible = false;
    this.restoreDefaultEffects(token);
  }

  /**
   * Update token overlays when token changes
   */
  static updateTokenOverlays(token) {
    this.renderTokenOverlays(token);
  }

  /**
   * Render overlays in sidebar
   */
  static renderSidebarOverlays() {
    const actorsList = document.querySelector('#actors-list');
    if (!actorsList) return;

    actorsList.querySelectorAll('.actor-item').forEach(item => {
      const actorId = item.dataset.actorId;
      const actor = game.actors.get(actorId);

      if (!actor) return;

      const { enabledConditions, conditionSettings } = this.loadConditionSettings();
      const matchingMode = this.safeGetSetting('matchingMode', 'exact') || 'exact';
      const activeConditions = this.gatherActiveConditions(actor);

      let conditionBadges = '';
      activeConditions.forEach(conditionName => {
        const matchedKey = this.findMatchingCondition(conditionName, enabledConditions, matchingMode);
        if (!matchedKey || !enabledConditions[matchedKey]) return;
        const settings = this.resolveConditionSettings(matchedKey, conditionSettings);
        const badgeColor = settings.color;
        conditionBadges += `<span class="condition-badge" style="background-color: ${badgeColor}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.7em; margin-right: 3px; display: inline-block;" title="${conditionName}">${conditionName.substring(0, 3).toUpperCase()}</span>`;
      });

      if (conditionBadges) {
        const badgeContainer = item.querySelector('.condition-badges') || document.createElement('div');
        badgeContainer.className = 'condition-badges';
        badgeContainer.innerHTML = conditionBadges;
        if (!item.querySelector('.condition-badges')) {
          item.appendChild(badgeContainer);
        }
      }
    });
  }
}

export { OverlayRenderer, EXPANDED_CONDITIONS };
