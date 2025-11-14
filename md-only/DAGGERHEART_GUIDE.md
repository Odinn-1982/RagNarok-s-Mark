# RagNarok's Mark - Daggerheart Integration Guide

## Overview

RagNarok's Mark v4.0 includes special integration for **Daggerheart** (FoundryBorne system) that handles the unique "Defeated" vs "Dead" mechanics.

---

## How It Works

### Automatic "Defeated" Status

When **any** character (PC, Adversary, or NPC) reaches **0 HP**, the module automatically:

1. ✅ Applies the **"Defeated"** condition
2. 🔔 Notifies everyone in chat
3. 💡 Reminds you that "Defeated" can be changed to "Dead" if appropriate

**This happens automatically - no manual intervention needed.**

---

## The Defeated → Dead Choice

### Why Two Conditions?

In Daggerheart:
- **Defeated** = Out of the fight, but not necessarily dead
- **Dead** = Narratively dead (player/GM choice)

### For PCs (Player Characters)

When a PC reaches 0 HP:
- They're automatically marked **"Defeated"**
- Players choose their recovery action:
  - **Spend Hope/Stress** to pop back up with HP
  - **Take a Last Stand** 
  - **Accept Death** (mark as "Dead")

### For Adversaries/NPCs

When an Adversary reaches 0 HP:
- They're automatically marked **"Defeated"**
- GM decides narratively:
  - Knocked unconscious? → Leave as "Defeated"
  - Actually dead? → Manually mark as "Dead"

---

## How to Mark as Dead

### Method 1: Token HUD Button (Recommended)

1. **Select the defeated token**
2. **Look for the Token HUD** (buttons around the token)
3. **Click "☠️ Mark as Dead"** button
4. Token is now marked as "Dead"

### Method 2: Right-Click Menu

1. **Right-click the token**
2. **Look for "Mark as Dead"** option
3. Click it

### Method 3: Manual Condition

1. Open the token's conditions
2. Remove "Defeated"
3. Add "Dead"

---

## Resurrection & Revival

### Healing from Defeated

**If a PC has "Defeated" only (not "Dead"):**
- When they receive healing or use recovery abilities
- HP goes above 0
- **"Defeated" is automatically removed**
- They're back in the fight!

### Bringing Back the Dead

**If marked as "Dead":**
- Healing **does NOT** automatically remove "Dead"
- You must **manually revive** them:

**Option 1: Quick Revival Buttons**
- Select the dead token
- Click **"💚 Revive (Defeated)"** - Brings them back to Defeated status (still need healing)
- Click **"✨ Fully Revive"** - Removes all death conditions (then add HP manually)

**Option 2: Manual Process**
1. Remove "Dead" condition
2. Add "Defeated" condition (if they still have 0 HP)
3. Heal them to remove "Defeated"

---

## Example Scenarios

### Scenario 1: PC Gets Knocked Out

1. **PC drops to 0 HP** (hit by a big attack)
2. ✅ Module automatically applies "Defeated"
3. **Player chooses:** Spend 2 Hope to return with 5 HP
4. **Player gains HP** → Module automatically removes "Defeated"
5. **PC is back in the fight!**

### Scenario 2: Adversary Defeated

1. **Adversary drops to 0 HP**
2. ✅ Module automatically applies "Defeated"
3. **GM decides:** "The goblin is unconscious, not dead"
4. **GM leaves as "Defeated"** (no change needed)
5. Later, players stabilize the goblin for interrogation

### Scenario 3: Adversary Killed

1. **Adversary drops to 0 HP**
2. ✅ Module automatically applies "Defeated"
3. **GM decides:** "The dragon dies dramatically"
4. **GM clicks "☠️ Mark as Dead"** button
5. Module removes "Defeated" and adds "Dead"
6. Chat message confirms the death

### Scenario 4: Resurrection Spell

1. **Dead PC** (has "Dead" condition, 0 HP)
2. **Cleric casts resurrection**
3. **GM clicks "✨ Fully Revive"** button
4. Module removes "Dead" condition
5. **GM adds HP manually** (or cleric spell does it)
6. **PC is alive again!**

---

## Visual Indicators

### Defeated Token
- **Brown/tan glowing overlay** (default)
- **Pulsing animation**
- **"Defeated" badge** on token
- Token is dimmed but visible

### Dead Token
- **Black/dark overlay** (default)
- **Fading animation**
- **"Dead" badge** on token
- Token is very dimmed (nearly invisible)

---

## Customization

### Change Colors

1. Open **RagNarok's Mark Configuration**
2. Find **"defeated"** condition
3. Change color (default: `#8B4513` brown)
4. Find **"dead"** condition
5. Change color (default: `#000000` black)

### Disable Auto-Detection

If you don't want automatic "Defeated" marking:

1. Open `scripts/daggerheart-integration.js`
2. Find `init()` function
3. Comment out or remove the `registerHooks()` call
4. Reload Foundry

---

## Troubleshooting

### Problem: "Defeated" isn't applied when HP reaches 0

**Check:**
- ✅ Are you using FoundryBorne system? (Check game.system.id)
- ✅ Is the module enabled?
- ✅ Check browser console for errors (F12)

**Fix:**
- The HP path might be different in your version
- Edit `daggerheart-integration.js` lines 50-60
- Adjust the HP property paths to match your actor data

### Problem: Can't find "Mark as Dead" button

**Check:**
- ✅ Is the token actually "Defeated"?
- ✅ Is Token HUD visible?

**Fix:**
- Use the right-click menu instead
- Or manually remove "Defeated" and add "Dead"

### Problem: "Defeated" won't remove when healed

**Check:**
- ✅ Is HP actually above 0?
- ✅ Is there also a "Dead" condition?

**Fix:**
- If marked "Dead", you must manually revive first
- Then healing will work

---

## Technical Details

### HP Monitoring

The integration monitors two Foundry hooks:
- `updateActor` - For linked tokens
- `updateToken` - For unlinked tokens

It checks these HP paths (in order):
1. `system.resources.hp.value`
2. `system.hp.value`
3. `data.resources.hp.value`
4. `data.hp.value`

### Condition Application

Conditions are stored as Active Effects:
- **Name:** "Defeated" or "Dead"
- **Flag:** `ragnaroks-mark.conditionKey`
- **Transfer:** false (stays on token)

---

## FAQ

**Q: Does this work with D&D 5e?**
A: No, this is Daggerheart-specific. D&D uses the standard death saves system.

**Q: Can I change "Defeated" to something else?**
A: Yes, edit the condition name in the module settings.

**Q: What if I want "Dead" automatically?**
A: You can modify `handleZeroHP()` in `daggerheart-integration.js` to apply "Dead" instead of "Defeated".

**Q: Does this work with NPCs?**
A: Yes! Works with PCs, Adversaries, and NPCs.

**Q: Can players mark enemies as dead?**
A: By default, yes. Use Foundry permissions if you want only GMs to do this.

---

## Summary

**Automatic:**
- 0 HP → "Defeated" applied instantly
- Healed above 0 HP (if only Defeated) → "Defeated" removed

**Manual (GM/Player Choice):**
- "Defeated" → "Dead" (narrative choice)
- "Dead" → "Defeated" (resurrection prep)
- "Dead/Defeated" → Fully Revived (resurrection complete)

**This respects Daggerheart's philosophy:** Defeated ≠ Dead, and death is a narrative choice, not an automatic result.
