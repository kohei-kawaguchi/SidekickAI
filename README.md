# SidekickAI

sidekick: an always-on-top desktop mascot that reacts to AI agent apps.

## Run

```
npm install
cp config/character.example.json config/character.json
npm start
```

Drag the character to move it. Tray icon menu: Show / Hide / Quit.

## Status API

`POST http://127.0.0.1:47813/event` with JSON `{"source": "...", "state": "idle|working|waiting|done", "message": "..."}`.

```
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:47813/event -ContentType application/json -Body '{"source":"test","state":"waiting","message":"hello"}'
```

## Adapters

- Cursor: `adapters/cursor/cursor-hook.js`, registered in `~/.cursor/hooks.json` for `beforeSubmitPrompt`, `postToolUse`, `afterAgentThought`, `afterAgentResponse`, `stop`.
- Claude Code (CLI, Remote Control sessions, and the desktop Code tab): `adapters/claude-code/claude-code-hook.js`, registered in `~/.claude/settings.json` hooks for `UserPromptSubmit`, `PostToolUse`, `Notification`, `Stop`. The bubble shows the session's folder name.

Both hook scripts share `adapters/hook-client.js`.
- Claude desktop: `src/adapters/claudeDesktop.js` polls the Windows notification store (read-only) for Claude toasts and tails `%LOCALAPPDATA%/Claude/logs/main.log`. Both are undocumented and may change with app updates.

App constants live in `config/sidekick.json`.

## Character

Character settings live in `config/character.json`, which is git-ignored like a `.env` file. Only `config/character.example.json` is committed. Fields: `name` (tray tooltip), `source` and `image` (image paths), `backgroundThreshold` and `featherRadius` (background removal), `startupLine`, and `lines` (one bubble line per state: `idle`, `working`, `waiting`, `done`). Restart the app after editing.

The example uses `examples/character.png`, an original mascot drawn in `examples/character.svg`. Re-render it with `npx electron scripts/render_svg.js examples/character.svg examples/character.png 400 440`.

To use your own image, keep it in `assets/`, which is git-ignored because such images are usually copyrighted. Put the source image at the `source` path, set `image` to a path under `assets/`, then run `python scripts/remove_background.py config/character.json` to produce the `image` file.
