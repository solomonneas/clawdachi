# Clawdachi

A pixel art desktop companion for Claude Code. Clawdachi sits on your desktop and reacts to Claude's activity: thinking when Claude is processing, celebrating when tasks complete, and responding to your interactions.

## Features

- **Claude Code Integration**: Reacts to Claude's activity via hooks
- **Transparent Desktop Companion**: Always-on-top, frameless window
- **Interactive Animations**: Click to wave, drag to move
- **Particle Effects**: Hearts, sparkles, confetti
- **System Tray**: Quick access to settings and controls

## Requirements

- Node.js 18+
- npm 9+

## Installation

```bash
npm install
```

## Development

```bash
# Build and run
npm run build
npm start

# Development mode with hot reload
npm run dev
```

## Building Installers

```bash
# Build for current platform
npm run package

# Build for specific platforms
npm run package:win    # Windows (NSIS installer)
npm run package:linux  # Linux (AppImage + .deb)
```

## Project Structure

```
clawdachi/
├── src/
│   ├── main/           # Electron main process
│   │   ├── main.ts     # App entry, window creation
│   │   ├── tray.ts     # System tray menu
│   │   ├── claude/     # Claude Code integration
│   │   │   ├── hooks.ts    # Hook installation
│   │   │   └── monitor.ts  # Session file watcher
│   │   └── ipc.ts      # IPC handlers
│   │
│   ├── renderer/       # PixiJS renderer
│   │   ├── sprite/     # Character sprites
│   │   ├── animation/  # Animation state machine
│   │   └── ui/         # Chat bubbles, eye tracking
│   │
│   ├── settings/       # Settings UI window
│   │
│   └── shared/         # Shared types and constants
│
├── hooks/              # Hook scripts for Claude
│   ├── claude-status.sh    # Linux/macOS
│   └── claude-status.ps1   # Windows
│
└── assets/             # Sprites, sounds, icons
```

## Claude Integration

Clawdachi installs hooks into `~/.claude/settings.json` that notify it of Claude's activity:

- **SessionStart**: Claude session begins
- **UserPromptSubmit**: User sends a message
- **PreToolUse/PostToolUse**: Tool execution
- **Notification**: Claude is waiting for input
- **Stop**: Task completed
- **SessionEnd**: Session ends

Session state is written to `~/.clawdachi/sessions/current.json` and watched by the main process.

## Character States

| State | Trigger | Visual |
|-------|---------|--------|
| Idle | Default | Gentle breathing, occasional blinks |
| Thinking | Claude processing | Focused face, floating symbols |
| Waiting | Awaiting input | Question mark bubble |
| Celebrating | Task complete | Excited face, confetti |
| Waving | User clicks | Wave animation, hearts |
| Nervous | Being dragged | Worried expression |

## Configuration

Settings are stored via electron-store:

- **Start with system**: Auto-launch on login
- **Always on top**: Keep above other windows
- **Scale**: Character size (0.5x - 2x)
- **Sound effects**: Enable/disable sounds
- **Hooks**: Enable Claude Code integration

## License

MIT
