# SidekickAI

sidekick is an always-on-top desktop mascot for Windows that reacts to Claude while it works. It sits in a corner of the screen with a speech bubble and changes its animation and line when Claude starts working, needs your input, or finishes, so you can keep an eye on agents without switching windows.

sidekick is an unofficial tool. See [Disclaimer](#disclaimer).

## States

| State | Meaning | Animation |
| --- | --- | --- |
| `idle` | Nothing is happening | Slow float |
| `working` | Claude is processing | Fast bob with a blue glow |
| `waiting` | Claude needs your approval or input | Wiggle with a pulsing bubble |
| `done` | A turn or task finished | Hops, then returns to `idle` after `doneToIdleSeconds` |

The bubble shows the character's line for the state and, below it, which app or session sent the event.

## Requirements

- Windows 10 or 11
- Node.js 22 or later on `PATH` (the Claude Code hook runs with the system `node`)
- Python 3 with Pillow and NumPy, only if you use your own character image

## Install and run

```
git clone https://github.com/kohei-kawaguchi/SidekickAI.git
cd SidekickAI
npm install
cp config/character.example.json config/character.json
npm start
```

Drag the character to move it. The tray icon menu has Show, Hide and Quit.

Then set up the use cases you need below. The Claude desktop app use cases work without any setup; the Claude Code use cases need the hook in [Set up the Claude Code hook](#set-up-the-claude-code-hook).

## Use cases

### Claude Code CLI in a terminal

When you run `claude` in a terminal, the Claude Code hook reports each turn.

| Claude Code event | sidekick state |
| --- | --- |
| `UserPromptSubmit` (you send a prompt) | `working` |
| `PostToolUse` (a tool call finished) | `working` |
| `Notification` (permission request or idle prompt) | `waiting`, with the notification text |
| `Stop` (the turn ended) | `done` |

The bubble shows `Claude Code (<folder>)`, where `<folder>` is the session's working folder, so you can tell parallel sessions apart. When several sessions run at once, the bubble follows whichever sent the latest event.

Setup: [Set up the Claude Code hook](#set-up-the-claude-code-hook).

### Remote Control from Claude Projects

When a Claude project thread on claude.ai or in the Claude app dispatches work to this machine through Remote Control, the work runs as a local Claude Code session. The same user-level hooks fire, so sidekick reacts exactly as in the CLI case, labelled with the folder the session works in.

Setup: [Set up the Claude Code hook](#set-up-the-claude-code-hook). No per-project setup is needed.

### Claude desktop app: Code tab

sidekick reads the desktop app's log (`%LOCALAPPDATA%/Claude/logs/main.log`) and the Windows notifications the app shows.

| Signal | sidekick state |
| --- | --- |
| Log line `LocalSessions.sendMessage` (you sent a message) | `working` |
| Log line `[CCD CycleHealth] ... cycle` (the turn ended) | `done` |
| Notification tagged `idle-...` (a session waits for you) | `waiting`, with the notification text |

Setup: none.

### Claude desktop app: chat and Cowork

Chat and Cowork expose no hooks and write nothing useful to the log, so sidekick relies on the notifications the app shows. It reads them read-only from the Windows notification store.

| Notification | sidekick state |
| --- | --- |
| Tagged `channel-input-...` ("Claude needs your input to continue") | `waiting` |
| Tagged `channel-thread-...` (a reply from Claude) | `done`, with the reply preview |
| Tagged `channel-msg-...` (for example "Claude ran into a problem") | `done`, with the message |

Limits:

- There is no `working` state for chat and Cowork.
- sidekick only sees what the app actually shows as a Windows notification. If the Claude window is focused and the app skips the notification, sidekick does not react. Notifications for Claude must be allowed in Windows Settings > System > Notifications.

Setup: none.

### Other tools: the status API

Anything that can send HTTP can drive sidekick:

`POST http://127.0.0.1:47813/event` with JSON `{"source": "...", "state": "idle|working|waiting|done", "message": "..."}`. It returns `204`, or `400` for an unknown state.

```
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:47813/event -ContentType application/json -Body '{"source":"test","state":"waiting","message":"hello"}'
```

This is also the quickest way to preview each state.

## Set up the Claude Code hook

Add the hook to your user settings, `~/.claude/settings.json`. Replace `<repo>` with the absolute path of your clone, using forward slashes (for example `C:/Users/you/SidekickAI`). If you already have hooks for these events, append these entries to the existing arrays instead of replacing them.

```json
{
  "hooks": {
    "UserPromptSubmit": [
      { "matcher": "", "hooks": [{ "type": "command", "command": "node <repo>/adapters/claude-code/claude-code-hook.js" }] }
    ],
    "PostToolUse": [
      { "matcher": "", "hooks": [{ "type": "command", "command": "node <repo>/adapters/claude-code/claude-code-hook.js" }] }
    ],
    "Notification": [
      { "matcher": "", "hooks": [{ "type": "command", "command": "node <repo>/adapters/claude-code/claude-code-hook.js" }] }
    ],
    "Stop": [
      { "matcher": "", "hooks": [{ "type": "command", "command": "node <repo>/adapters/claude-code/claude-code-hook.js" }] }
    ]
  }
}
```

Back up the file before editing. Sessions that were already running may need a restart to pick up the new hooks.

When sidekick is not running, the hook exits with a connection error. Claude Code treats that as a non-blocking hook failure and carries on.

## Character

Character settings live in `config/character.json`, which is git-ignored like a `.env` file. Only `config/character.example.json` is committed.

| Field | Purpose |
| --- | --- |
| `name` | Tray tooltip |
| `image` | Image shown on screen |
| `source` | Original image that `scripts/remove_background.py` reads |
| `backgroundThreshold`, `featherRadius` | Background removal settings |
| `startupLine` | Line shown at launch |
| `lines` | One line per state: `idle`, `working`, `waiting`, `done` |

Restart the app after editing. The app stops with an error if the file is missing or a state has no line.

The example uses `examples/character.png`, an original mascot drawn in `examples/character.svg`. Re-render it with:

```
npx electron scripts/render_svg.js examples/character.svg examples/character.png 400 440
```

To use your own image, keep it in `assets/`, which is git-ignored because such images are usually copyrighted. Put the original at the `source` path, set `image` to a path under `assets/`, then remove a plain white background with:

```
python scripts/remove_background.py config/character.json
```

## Configuration

App constants live in `config/sidekick.json`: window size and margins, server host and port, the state list, `doneToIdleSeconds`, the Claude desktop poll interval, notification tag rules and log patterns, and the Claude Code event mapping.

## Troubleshooting

- Nothing happens for Claude Code: check that the hook commands point to your clone and that `node` is on `PATH`, and restart the Claude Code session.
- Nothing happens for the Claude desktop app: check that Claude notifications are allowed in Windows. The notification tags and log lines are undocumented and may change with app updates; update the rules in `config/sidekick.json` if they do.
- Port in use: change `server.port` in `config/sidekick.json`.

## License

MIT, see [LICENSE](LICENSE). The license covers the files in this repository, including the example mascot in `examples/`. It does not cover images or settings you add yourself, such as files in `assets/` or your `config/character.json`.

## Disclaimer

sidekick is an unofficial, community tool. It is not affiliated with, endorsed by, or supported by Anthropic. Claude and Claude Code are trademarks of Anthropic, used here only to describe what sidekick works with. The Claude desktop integration reads undocumented notification and log formats and may stop working after an app update.
