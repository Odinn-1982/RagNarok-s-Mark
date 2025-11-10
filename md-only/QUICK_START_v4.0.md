# RagNarok's Mark v4.0 - Quick Start Guide

**Get up and running with RagNarok's Mark v4.0 in 5 minutes or less!**

---

## ⚡ Super Quick Start (2 minutes)

### For First-Time Users

1. **Install the module**
   - Download from Foundry's Module Library
   - Or manually place in `Data/modules/ragnars-mark/`

2. **Enable it**
   - Open your Foundry world
   - Go to **Module Management**
   - Find "RagNarok's Mark" and enable it
   - Reload the world (F5)

3. **Run the setup**
   - Go to **Game Settings → Module Settings → RagNarok's Mark**
   - Click **"Quick Setup Wizard"**
   - Choose your game system (Daggerheart, D&D 5e, Pathfinder 2e)
   - Click **"Apply & Close"**
   - **Done!** You're ready to play

---

## 🎯 What You Just Got

With one click, RagNarok's Mark now:
- ✅ Shows large condition icons on tokens
- ✅ Displays colored borders on affected tokens
- ✅ Shows condition count badges
- ✅ Animates conditions with pulse effects
- ✅ Tracks how long conditions last
- ✅ Automatically handles 20+ conditions

---

## 📖 First Game Session Tips

### Adding Conditions to Tokens

**Method 1: Through Game Effects (Automatic)**
- Apply a condition as an active effect on an actor
- The condition overlay appears automatically on all their tokens

**Method 2: Quick Hotbar Buttons**
- Create a macro: `RagnarsMarkAPI.toggleCondition(token.id, 'vulnerable')`
- Drag to hotbar
- Click to toggle condition on selected token

**Method 3: Canvas Right-Click**
- Right-click token on game board
- Select "RagNarok's Mark" menu
- Choose condition to toggle

### Quick Reference: Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Ctrl + Alt + O** | Toggle all overlays on/off |
| **Ctrl + Alt + C** | Open configuration menu |
| **Ctrl + Q** | Open quick-add panel |
| **Ctrl + Z** | Undo last change |
| **Ctrl + Y** | Redo last change |

---

## 🎨 Customizing Your Setup (5 minutes)

### Change How Conditions Look

1. Go to **Game Settings → Module Settings → RagNarok's Mark**
2. Click **"Configure Conditions"**
3. For each condition, customize:
   - ☐ **Enable/Disable**: Uncheck to hide a condition
   - 🎨 **Color**: Click to change the tint color
   - ✨ **Glow**: Drag slider for glow intensity
   - 🎬 **Animation**: Choose Pulse, Glow, Bounce, or Fade

4. Click **"Save Changes"**

### Adjust Global Settings

In the same **Module Settings** menu:

| Setting | What It Does |
|---------|------------|
| **Overlay Size** | Make icons bigger or smaller (0.5 to 2.0) |
| **Overlay Opacity** | Make icons see-through or solid (0.1 to 1.0) |
| **Overlay Position** | Center or corners of token |
| **Stacking Mode** | How multiple conditions arrange (Circular, Stacked, Overlapping) |
| **Maximum Overlays** | Max icons per token (1-10) |
| **Animation Speed** | Fast or slow animations |
| **Show Duration** | Display remaining time on icons |

---

## 🚀 Using v4.0 New Features

### 1. AI Suggestions (Automatic)

When you're applying conditions, AI suggests related conditions:

```
You apply "Vulnerable" to Barbarian
↓
AI suggests: "Targeted", "Bleeding", "Weakened"
↓
One click to apply all suggested conditions
```

### 2. Quick Add Panel

Press **Ctrl + Q** to open the floating panel showing:
- ⭐ Your favorite conditions (star icon to add)
- 📝 Recently used conditions
- 🔍 Search bar

### 3. Undo/Redo

```
Press Ctrl + Z → Undoes last condition change
Press Ctrl + Y → Redoes last change
Full 100-action history maintained
```

### 4. Favorites System

Star any condition to access instantly:
1. Open **Configure Conditions**
2. Click star icon on any condition
3. Access from Quick Add Panel (Ctrl + Q)

### 5. Combat Analytics

See which conditions you use most:
1. Go to **Module Settings**
2. Click **"Analytics Dashboard"**
3. View:
   - Most applied conditions
   - Which tokens get conditions most
   - Recent activity log
   - Export data as JSON

---

## 🎲 Game System Guides

### Daggerheart

**Pre-configured conditions:**
- Vulnerable, Hidden, Restrained, Unconscious, Defeated, Dead

**Pro tips:**
- Use Token Borders to see vulnerable targets at a glance
- Set Maximum Overlays to 3 for clean UI
- Enable Shake Effect for defeated tokens

### D&D 5e

**Pre-configured conditions (15+):**
- All official D&D 5e conditions with optimized colors

**Pro tips:**
- Use Priority System to always show critical conditions first
- Create condition aliases for homebrew variants
- Enable Condition Chains to auto-apply related effects

### Pathfinder 2e

**Pre-configured conditions (20+):**
- Pathfinder 2e conditions with proper priorities

**Pro tips:**
- Set stacking mode to "Stacked" for organized display
- Use particle effects on persistent conditions
- Create profiles for different encounter types

### Custom System?

1. Click **"Create Custom Preset"**
2. Check your game system's conditions
3. Add them to the list with colors
4. Save as preset
5. Can apply anytime from **"Apply System Preset"** button

---

## 📊 Understanding the Dashboard

### Analytics Dashboard Overview

```
┌─ Most Applied Conditions ─────────────┐
│ 1. Vulnerable (47 times)              │
│ 2. Hidden (31 times)                  │
│ 3. Damaged (28 times)                 │
└───────────────────────────────────────┘

┌─ Most Affected Tokens ────────────────┐
│ 1. Goblin #1 (12 conditions)          │
│ 2. Dragon #2 (8 conditions)           │
│ 3. Player Name (6 conditions)         │
└───────────────────────────────────────┘

┌─ Recent Activity ──────────────────────┐
│ 09:45 - Vulnerable applied to token 3  │
│ 09:42 - Hidden removed from token 5    │
│ 09:38 - Batch: 5 tokens marked         │
└───────────────────────────────────────┘
```

---

## 💡 Common Tasks

### How do I apply a condition?

**Option 1 (Easiest):**
```javascript
// Create a macro and click it
RagnarsMarkAPI.addCondition(token.id, 'vulnerable')
```

**Option 2:**
- Apply as active effect through normal character sheet
- It appears automatically

**Option 3:**
- Right-click token → RagNarok's Mark → Choose condition

### How do I apply a condition to multiple tokens?

```javascript
// Macro: Select multiple tokens, then run:
for (let token of canvas.tokens.controlled) {
  RagnarsMarkAPI.addCondition(token.id, 'vulnerable', 60000)
}

// Or batch apply:
RagnarsMarkAPI.batchApply(
  [token1.id, token2.id, token3.id],
  ['vulnerable', 'marked'],
  60000  // 60 seconds
)
```

### How do I remove all conditions from a token?

```javascript
// Get all conditions and remove them
const conditions = RagnarsMarkAPI.getConditions(token.id)
for (let cond of conditions) {
  RagnarsMarkAPI.removeCondition(token.id, cond)
}
```

### How do I create condition aliases?

1. Go to **Module Settings**
2. Click **"Configure Aliases"**
3. Example: `frightened, scared, terrified → feared`
4. Now any of those effect names shows as "feared"

### How do I use different themes?

1. Go to **Module Settings**
2. Find **"Visual Theme"** setting
3. Choose from:
   - Dark Fantasy (ornate mystical)
   - Cyberpunk (neon glow)
   - Minimalist (clean simple)
   - Neon Wave (digital effects)
   - Forest (natural organic)

---

## ⚙️ Accessibility Options

If you have visibility issues:

**Option 1: High Contrast Mode**
1. Go to **Module Settings**
2. Set **"Accessibility Mode"** to "High Contrast"
3. More vibrant colors for better visibility

**Option 2: Colorblind Mode**
1. Set **"Accessibility Mode"** to "Colorblind Friendly"
2. Special color palette for color blindness types

**Option 3: Text Labels**
1. Set **"Accessibility Mode"** to "Text Labels"
2. Condition names display instead of just colors

**Option 4: Screen Reader**
1. Enable "Screen Reader Support"
2. Overlays announced to assistive technology

---

## 🐛 Troubleshooting

### Overlays not showing up?

**Check 1:** Are effects applied to the *actor*, not just the token?
- ✓ Correct: Open character sheet → apply effect
- ✗ Wrong: Right-click token → apply effect

**Check 2:** Is the condition enabled?
- Open **Configure Conditions**
- Check the condition is checked (enabled)

**Check 3:** Does the condition name match?
- If using **Exact Matching** mode, spelling must be perfect
- Try switching to **Partial Matching** mode

**Check 4:** Are effects actually active?
- Open character sheet
- Go to **Active Effects** tab
- Verify the effect is listed and active (not greyed out)

### Overlays too large or too small?

Go to **Module Settings**, adjust **"Overlay Size"** slider.

### Animations stuttering?

1. Try reducing **Animation Speed**
2. Or disable animations (set to "None")
3. Reduce number of active conditions

### Performance issues?

1. Reduce **Maximum Overlays** (3-4 instead of 10)
2. Disable unused animations
3. Turn off Shake Effect if many tokens active

---

## 🚀 Next Steps

### Ready to explore more features?

1. **Condition Chains**
   - Read: PLUGIN_DEVELOPMENT_GUIDE.md → Condition Chains section
   - Create automatic condition relationships

2. **Developer API**
   - Read: v4.0.0_COMPLETE_FEATURES.md → API Reference
   - Build macros and integrations

3. **Plugins**
   - Read: PLUGIN_DEVELOPMENT_GUIDE.md
   - Create custom plugins extending RagNarok's Mark

4. **Advanced Analytics**
   - Run reports from Analytics Dashboard
   - Export data for session summaries

---

## 📚 Full Documentation

| Document | Purpose |
|----------|---------|
| **README.md** | Complete feature list and setup |
| **v4.0.0_COMPLETE_FEATURES.md** | Comprehensive feature docs & API |
| **PLUGIN_DEVELOPMENT_GUIDE.md** | Build plugins and integrations |
| **CHANGELOG_v4.0.0.md** | What's new in v4.0 |
| **v4.0.0_IMPLEMENTATION_SUMMARY.md** | Technical implementation details |

---

## ⚡ Power User Tips

### Create a "Crowd Control" Profile

Save your favorite combat conditions as a profile:

```javascript
// Macro: Create and load profile
const profile = {
  name: 'Combat Crowd Control',
  conditions: ['stunned', 'frightened', 'paralyzed', 'restrained'],
  overlaySize: 1.2,
  maxOverlays: 8,
  animationSpeed: 'Fast'
}

// Save it
RagnarsMarkAPI.saveProfile('cc-profile', profile)

// Later: Load with one command
RagnarsMarkAPI.applyProfile('cc-profile')
```

### Auto-Apply Conditions at Combat Start

```javascript
// Add to world scripts (if using automation module)
Hooks.on('combatStart', (combat) => {
  for (let combatant of combat.combatants) {
    if (combatant.isDefeated) {
      RagnarsMarkAPI.addCondition(combatant.tokenId, 'defeated')
    }
  }
})
```

### Generate Session Reports

```javascript
// End-of-session macro
const report = RagnarsMarkAPI.generateCombatReport()
const stats = RagnarsMarkAPI.getAllStats()

console.log(`
  Session Summary
  Most used: ${Object.entries(stats)
    .sort((a,b) => b[1].timesApplied - a[1].timesApplied)
    .slice(0, 3)
    .map(([c, d]) => `${c} (${d.timesApplied}x)`)
    .join(', ')}
`)
```

---

## ❓ FAQ

**Q: Is this free?**
A: Yes! RagNarok's Mark is MIT licensed.

**Q: Does it work on mobile?**
A: Yes! v4.0 includes full mobile support with touch gestures.

**Q: Can I share my condition presets?**
A: Yes! Use the Community Library to publish and download presets.

**Q: Will it slow down my game?**
A: No! Heavy optimization ensures <500ms load time.

**Q: Can I use it with other modules?**
A: Yes! Fully compatible with all Foundry modules.

**Q: What if I find a bug?**
A: Report on Foundry Forums or GitHub Issues.

---

## 🎉 You're All Set!

You now have everything you need to use RagNarok's Mark. Start applying conditions and enjoy beautiful condition overlays!

**Need help?** Check the full README.md or ask on the Foundry Forums.

**Want to build plugins?** Read the PLUGIN_DEVELOPMENT_GUIDE.md.

**Ready to dive deep?** See v4.0.0_COMPLETE_FEATURES.md for comprehensive documentation.

---

**Happy adventuring! 🎲**
