#!/bin/bash
# Clawdachi status hook for Claude Code
# This script is called by Claude Code hooks to update Clawdachi's state

set -e

EVENT="${1:-unknown}"
SESSION_DIR="$HOME/.clawdachi/sessions"
SESSION_FILE="$SESSION_DIR/current.json"

# Ensure session directory exists
mkdir -p "$SESSION_DIR"

# Map hook event to status
case "$EVENT" in
  session-start|sessionstart)
    STATUS="idle"
    ;;
  prompt|userpromptsubmit)
    STATUS="thinking"
    ;;
  tool-start|pretooluse)
    STATUS="using-tool"
    ;;
  tool-end|posttooluse)
    STATUS="thinking"
    ;;
  notify|notification)
    STATUS="waiting"
    ;;
  stop)
    STATUS="completed"
    ;;
  session-end|sessionend)
    STATUS="idle"
    ;;
  *)
    STATUS="idle"
    ;;
esac

# Get tool name from environment (set by Claude Code)
TOOL_NAME="${CLAUDE_TOOL_NAME:-}"

# Get session ID (fall back to process ID if not set)
SESSION_ID="${CLAUDE_SESSION_ID:-$$}"

# Get current TTY
CURRENT_TTY="$(tty 2>/dev/null || echo 'unknown')"

# Get timestamp in seconds
TIMESTAMP="$(date +%s)"

# Write session file as JSON
cat > "$SESSION_FILE" << EOF
{
  "session_id": "$SESSION_ID",
  "status": "$STATUS",
  "timestamp": $TIMESTAMP,
  "cwd": "$PWD",
  "tty": "$CURRENT_TTY",
  "tool_name": "$TOOL_NAME",
  "event": "$EVENT"
}
EOF

exit 0
