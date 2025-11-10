/**
 * Visual effects system for Ragnar's Mark v3.0
 * Particle effects, 3D depth, animation sequences, custom themes
 */

export const VISUAL_EFFECTS = {
  particleEmitters: new Map(),
  activeThemes: {},
  animationSequences: {},

  /**
   * Create particle effect for condition
   */
  createParticleEffect(token, conditionName, effectType = 'default') {
    const particleTypes = {
      vulnerable: { type: 'sparkles', color: '#FF6B6B', count: 12 },
      poison: { type: 'mist', color: '#90EE90', count: 8 },
      fire: { type: 'flames', color: '#FF8C00', count: 15 },
      cold: { type: 'crystals', color: '#87CEEB', count: 10 },
      lightning: { type: 'electricity', color: '#FFD700', count: 12 },
      default: { type: 'generic', color: '#CCCCCC', count: 6 }
    };

    const config = particleTypes[conditionName] || particleTypes.default;
    const emitter = this.buildParticleEmitter(token, config);
    
    const emitterId = `${token.id}_${conditionName}_${Date.now()}`;
    this.particleEmitters.set(emitterId, emitter);

    return emitterId;
  },

  /**
   * Build particle emitter based on config
   */
  buildParticleEmitter(token, config) {
    const container = new PIXI.Container();
    const particles = [];

    for (let i = 0; i < config.count; i++) {
      const particle = new PIXI.Graphics();
      particle.beginFill(parseInt(config.color.replace('#', '0x')));
      particle.drawCircle(0, 0, 2 + Math.random() * 2);
      particle.endFill();

      particle.x = token.x + Math.random() * 20 - 10;
      particle.y = token.y + Math.random() * 20 - 10;
      particle.vx = (Math.random() - 0.5) * 2;
      particle.vy = -Math.random() * 2;
      particle.life = 1;

      container.addChild(particle);
      particles.push(particle);
    }

    container.particles = particles;
    return container;
  },

  /**
   * Update particle effects (call in animation loop)
   */
  updateParticles() {
    for (const [emitterId, emitter] of this.particleEmitters.entries()) {
      let activeParticles = 0;

      for (const particle of emitter.particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 0.02;
        particle.alpha = particle.life;
        particle.vy += 0.1; // gravity

        if (particle.life > 0) {
          activeParticles++;
        }
      }

      if (activeParticles === 0) {
        this.particleEmitters.delete(emitterId);
      }
    }
  },

  /**
   * Create 3D depth effect for overlays
   */
  apply3DDepthEffect(sprite, depthValue = 0) {
    // depthValue: -1 (behind token) to 1 (in front)
    const scale = 1 - (Math.abs(depthValue) * 0.1);
    sprite.scale.set(scale, scale);

    if (depthValue < 0) {
      sprite.zIndex = -1;
      sprite.alpha *= 0.7; // Behind token, slightly transparent
    } else if (depthValue > 0) {
      sprite.zIndex = 1;
      sprite.alpha *= 1.1; // In front, slightly brighter
    }
  },

  /**
   * Create animation sequence for condition
   */
  createAnimationSequence(conditionName, sequence) {
    this.animationSequences[conditionName] = {
      steps: sequence, // array of { animation, duration, intensity }
      currentStep: 0,
      elapsed: 0,
      active: true
    };
  },

  /**
   * Apply custom theme to overlays
   */
  applyTheme(themeName, themeConfig) {
    this.activeThemes[themeName] = {
      colorScheme: themeConfig.colorScheme,
      iconStyle: themeConfig.iconStyle || 'standard',
      glowIntensity: themeConfig.glowIntensity || 1,
      particleEffect: themeConfig.particleEffect || false,
      shadowEffect: themeConfig.shadowEffect || false,
      borderStyle: themeConfig.borderStyle || 'solid',
      animationStyle: themeConfig.animationStyle || 'smooth'
    };
  },

  /**
   * Predefined themes
   */
  THEMES: {
    darkFantasy: {
      colorScheme: { base: '#2a2a2a', accent: '#8B0000', glow: '#FF4500' },
      iconStyle: 'ornate',
      glowIntensity: 1.5,
      particleEffect: true,
      shadowEffect: true,
      borderStyle: 'ornate',
      animationStyle: 'mystical'
    },
    cyberpunk: {
      colorScheme: { base: '#0a0e27', accent: '#00FF41', glow: '#00FFFF' },
      iconStyle: 'tech',
      glowIntensity: 2,
      particleEffect: true,
      shadowEffect: false,
      borderStyle: 'digital',
      animationStyle: 'fast'
    },
    minimalist: {
      colorScheme: { base: '#FFFFFF', accent: '#000000', glow: '#808080' },
      iconStyle: 'minimal',
      glowIntensity: 0.5,
      particleEffect: false,
      shadowEffect: false,
      borderStyle: 'clean',
      animationStyle: 'smooth'
    },
    neonWave: {
      colorScheme: { base: '#1a001a', accent: '#FF00FF', glow: '#00FFFF' },
      iconStyle: 'geometric',
      glowIntensity: 1.8,
      particleEffect: true,
      shadowEffect: true,
      borderStyle: 'wave',
      animationStyle: 'pulse'
    },
    forestTheme: {
      colorScheme: { base: '#1a3a1a', accent: '#00AA00', glow: '#88DD88' },
      iconStyle: 'natural',
      glowIntensity: 1,
      particleEffect: true,
      shadowEffect: false,
      borderStyle: 'organic',
      animationStyle: 'flowing'
    }
  },

  /**
   * Get all available themes
   */
  getAvailableThemes() {
    return Object.keys(this.THEMES);
  },

  /**
   * Apply predefined theme
   */
  applyPredefinedTheme(themeName) {
    if (this.THEMES[themeName]) {
      this.applyTheme(themeName, this.THEMES[themeName]);
      return true;
    }
    return false;
  },

  /**
   * Create SVG-based overlay icon
   */
  createSVGOverlay(svgPath, options = {}) {
    return {
      type: 'svg',
      path: svgPath,
      scale: options.scale || 1,
      color: options.color || '#FFFFFF',
      filter: options.filter || 'none'
    };
  },

  /**
   * Create morphing animation between two states
   */
  createMorphingAnimation(fromState, toState, duration = 500) {
    return {
      type: 'morphing',
      from: fromState,
      to: toState,
      duration,
      easing: 'easeInOutQuad'
    };
  }
};
