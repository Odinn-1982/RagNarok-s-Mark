RagNarok's Mark — Notes & Recent Cleanup

Overview
--------
RagNarok's Mark provides status-effect overlays and a small GM hub for managing presets, conditions and settings.

Recent cleanup (Nov 2025)
-------------------------
- Standardized module runtime name to `ragnaroks-mark` in code where appropriate.
- Removed the small floating launcher button that appeared near the dice tray (it conflicted with other UI elements).
  - The launcher DOM injection and its CSS rules were removed. The hub remains available via the application API or the sidebar button.
- Restored missing helper functions and fixed timing/race issues for sidebar button placement.
- Added a diagnostic script to `crimson-combat/tools/foundry-fix-invalid-ids.js` (in Crimson Blood package) to scan for invalid document IDs that can block initialization.

How to open the Mark Hub
------------------------
- Sidebar button: If enabled/installed, the Mark sidebar button will appear next to other module sidebar controls.
- Programmatically (console):

```js
// Open the Mark hub window
game.ragnaroks?.markHubApp?.render(true);
```

Notes & Migration
-----------------
- If you previously had settings stored under an older module id (`ragnars-mark`), the module includes a migration helper that will copy known setting keys into the canonical id on first run. No user action is required for the typical case.
- If you use compendia or world backups, keep one before running any scripts that change document IDs.

If you'd like further cleanup (remove backup files like `ragnars-mark.js.bak`, delete the legacy `ragnars-mark.css`, or add an opt-in setting to restore the floating launcher), tell me which of those you'd like and I will make the change.