#!/bin/bash
# Clawdachi REMOTE status hook for Claude Code
# This script sends state updates to a remote Clawdachi instance via HTTP
#
# Installation:
#   1. Copy this script to ~/.clawdachi/hooks/claude-status.sh on your remote machine
#   2. Set CLAWDACHI_HOST to your Windows machine's IP
#   3. Make executable: chmod +x ~/.clawdachi/hooks/claude-status.sh
#   4. Install hooks: add to ~/.claude/settings.json

set -e

EVENT="${1:-unknown}"

# =============================================================================
# CONFIGURATION - Set this to your Windows machine's IP address
# =============================================================================
CLAWDACHI_HOST="${CLAWDACHI_HOST:-192.168.1.100}"
CLAWDACHI_PORT="${CLAWDACHI_PORT:-9876}"
# =============================================================================

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

# Get session ID
SESSION_ID="${CLAUDE_SESSION_ID:-$$}"

# Get timestamp in seconds
TIMESTAMP="$(date +%s)"

# Build JSON payload
JSON_PAYLOAD=$(cat <<EOF
{
  "session_id": "$SESSION_ID",
  "status": "$STATUS",
  "timestamp": $TIMESTAMP,
  "cwd": "$PWD",
  "tty": "$(tty 2>/dev/null || echo 'ssh')",
  "tool_name": "$TOOL_NAME",
  "event": "$EVENT"
}
EOF
)

# Send to remote Clawdachi (fire and forget, don't block Claude)
curl -s -X POST "http://${CLAWDACHI_HOST}:${CLAWDACHI_PORT}/state" \
  -H "Content-Type: application/json" \
  -d "$JSON_PAYLOAD" \
  --connect-timeout 1 \
  --max-time 2 \
  >/dev/null 2>&1 &

exit 0
