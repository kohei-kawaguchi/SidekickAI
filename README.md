# SidekickAI

sidekick: an always-on-top desktop mascot that reacts to AI agent apps.

## Run

```
npm install
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

All constants live in `config/sidekick.json`.

## Character image

`assets/` is git-ignored because the image is copyrighted. Put the source image at `assets/character_source.jpg`, then run `python scripts/remove_background.py config/sidekick.json` to produce `assets/character.png`.
