# Clawdachi status hook for Claude Code (Windows)
# This script is called by Claude Code hooks to update Clawdachi's state

param(
    [Parameter(Position=0)]
    [string]$Event = "unknown"
)

$ErrorActionPreference = "Stop"

$SessionDir = "$env:USERPROFILE\.clawdachi\sessions"
$SessionFile = "$SessionDir\current.json"

# Ensure session directory exists
if (-not (Test-Path $SessionDir)) {
    New-Item -ItemType Directory -Path $SessionDir -Force | Out-Null
}

# Map hook event to status
$Status = switch -Regex ($Event.ToLower()) {
    "session-start|sessionstart" { "idle" }
    "prompt|userpromptsubmit" { "thinking" }
    "tool-start|pretooluse" { "using-tool" }
    "tool-end|posttooluse" { "thinking" }
    "notify|notification" { "waiting" }
    "stop" { "completed" }
    "session-end|sessionend" { "idle" }
    default { "idle" }
}

# Get tool name from environment
$ToolName = $env:CLAUDE_TOOL_NAME
if (-not $ToolName) { $ToolName = "" }

# Get session ID
$SessionId = $env:CLAUDE_SESSION_ID
if (-not $SessionId) { $SessionId = $PID.ToString() }

# Get timestamp (Unix epoch seconds)
$Timestamp = [int][double]::Parse((Get-Date -UFormat %s))

# Get current directory
$Cwd = (Get-Location).Path

# Build session object
$Session = @{
    session_id = $SessionId
    status = $Status
    timestamp = $Timestamp
    cwd = $Cwd
    tty = "windows"
    tool_name = $ToolName
    event = $Event
}

# Write session file as JSON
$Session | ConvertTo-Json -Compress | Out-File -FilePath $SessionFile -Encoding UTF8 -NoNewline

exit 0
