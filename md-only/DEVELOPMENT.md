# Ragnar's Mark Development Notes

## Architecture

### Files Structure
- `module.json` - Module manifest and metadata
`scripts/ragnaroks-mark.js` - Main module logic
- `templates/condition-config.hbs` - Configuration UI template
`styles/ragnaroks-mark.css` - Styling for overlays
- `lang/en.json` - Localization strings

### Core Components

1. **Settings System**
   - `enabledConditions`: Object storing which conditions are enabled
   - `overlaySize`: Multiplier for overlay icon size
   - `overlayOpacity`: Transparency of overlays

2. **Hooks**
   - `init`: Register settings and configuration
   - `refreshToken`: Apply overlays when tokens update

3. **Overlay Logic**
   - `addStatusOverlays()`: Creates PIXI sprites for enabled conditions
   - `removeStatusOverlays()`: Cleans up existing overlays
   - Positions overlays centered on tokens
   - Handles multiple simultaneous conditions

4. **Configuration UI**
   - `ConditionConfigForm`: Custom FormApplication
   - Dynamically detects all conditions in the world
   - Checkbox interface for enabling/disabling conditions

## Testing Checklist

- [ ] Module loads without errors
- [ ] Settings appear in Module Settings
- [ ] Configuration menu opens and displays conditions
- [ ] Checking/unchecking conditions updates overlays
- [ ] Overlays appear on tokens with active effects
- [ ] Overlay size setting works
- [ ] Overlay opacity setting works
- [ ] Multiple conditions on one token display correctly
- [ ] Overlays update when effects are added/removed
- [ ] Custom conditions auto-populate in config menu

## Future Enhancement Ideas

- Animation options (pulse, glow, etc.)
- Custom icon upload for conditions
- Per-condition size/opacity overrides
- Priority system for multiple conditions
- Border/frame options around overlays
- Sound effects when conditions applied
- Condition duration display on overlay
