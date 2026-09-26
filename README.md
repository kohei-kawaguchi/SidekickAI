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
- Claude desktop: `src/adapters/claudeDesktop.js` polls the Windows notification store (read-only) for Claude toasts and tails `%LOCALAPPDATA%/Claude/logs/main.log`. Both are undocumented and may change with app updates.

App constants live in `config/sidekick.json`.

## Character

Character settings live in `config/character.json`, which is git-ignored like a `.env` file. Only `config/character.example.json` is committed. Fields: `name` (tray tooltip), `source` and `image` (image paths), `backgroundThreshold` and `featherRadius` (background removal), `startupLine`, and `lines` (one bubble line per state: `idle`, `working`, `waiting`, `done`). Restart the app after editing.

`assets/` is git-ignored because the image is copyrighted. Put the source image at the `source` path, then run `python scripts/remove_background.py config/character.json` to produce the `image` file.
