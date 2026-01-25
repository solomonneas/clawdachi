import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { PATHS } from '../../shared/constants';

interface ClaudeSettings {
  hooks?: Record<string, string[]>;
  [key: string]: unknown;
}

const HOOK_EVENTS = [
  'SessionStart',
  'UserPromptSubmit',
  'PreToolUse',
  'PostToolUse',
  'Notification',
  'Stop',
  'SessionEnd',
] as const;

/**
 * Get the path to the appropriate hook script for the current platform
 */
function getHookScriptPath(): string {
  const homeDir = os.homedir();
  const isWindows = process.platform === 'win32';
  const scriptName = isWindows ? 'claude-status.ps1' : 'claude-status.sh';
  return path.join(homeDir, PATHS.HOOKS_DIR, scriptName);
}

/**
 * Get the hook command for the current platform
 */
function getHookCommand(event: string): string {
  const scriptPath = getHookScriptPath();
  const isWindows = process.platform === 'win32';

  if (isWindows) {
    return `powershell -ExecutionPolicy Bypass -File "${scriptPath}" ${event.toLowerCase()}`;
  }
  return `"${scriptPath}" ${event.toLowerCase()}`;
}

/**
 * Install Clawdachi hooks into Claude settings
 */
export async function installHooks(): Promise<{ success: boolean; error?: string }> {
  try {
    const homeDir = os.homedir();
    const claudeSettingsPath = path.join(homeDir, PATHS.CLAUDE_SETTINGS);
    const clawdachiDir = path.join(homeDir, PATHS.CLAWDACHI_DIR);
    const hooksDir = path.join(homeDir, PATHS.HOOKS_DIR);
    const sessionsDir = path.join(homeDir, PATHS.SESSIONS_DIR);

    // Create Clawdachi directories
    await fs.promises.mkdir(clawdachiDir, { recursive: true });
    await fs.promises.mkdir(hooksDir, { recursive: true });
    await fs.promises.mkdir(sessionsDir, { recursive: true });

    // Copy hook scripts from app resources
    await copyHookScripts(hooksDir);

    // Read or create Claude settings
    let claudeSettings: ClaudeSettings = {};
    try {
      const content = await fs.promises.readFile(claudeSettingsPath, 'utf-8');
      claudeSettings = JSON.parse(content);
    } catch {
      // Settings don't exist yet, create directory
      await fs.promises.mkdir(path.dirname(claudeSettingsPath), { recursive: true });
    }

    // Initialize hooks object if needed
    if (!claudeSettings.hooks) {
      claudeSettings.hooks = {};
    }

    // Add Clawdachi hooks for each event
    for (const event of HOOK_EVENTS) {
      const hookCommand = getHookCommand(event);
      const existingHooks: string[] = claudeSettings.hooks[event] || [];

      // Check if our hook is already installed
      const clawdachiHookIndex = existingHooks.findIndex((h: string) =>
        h.includes('clawdachi') || h.includes('claude-status')
      );

      if (clawdachiHookIndex === -1) {
        // Add our hook
        claudeSettings.hooks[event] = [...existingHooks, hookCommand];
      } else {
        // Update existing hook
        existingHooks[clawdachiHookIndex] = hookCommand;
        claudeSettings.hooks[event] = existingHooks;
      }
    }

    // Write updated settings
    await fs.promises.writeFile(
      claudeSettingsPath,
      JSON.stringify(claudeSettings, null, 2),
      'utf-8'
    );

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

/**
 * Copy hook scripts to the user's clawdachi hooks directory
 */
async function copyHookScripts(targetDir: string): Promise<void> {
  const isWindows = process.platform === 'win32';

  // In development, scripts are in the hooks/ directory
  // In production, they're in resources/hooks/
  const sourceDir = process.env.NODE_ENV === 'development'
    ? path.join(__dirname, '../../../hooks')
    : path.join(process.resourcesPath, 'hooks');

  const scriptName = isWindows ? 'claude-status.ps1' : 'claude-status.sh';
  const sourcePath = path.join(sourceDir, scriptName);
  const targetPath = path.join(targetDir, scriptName);

  try {
    await fs.promises.copyFile(sourcePath, targetPath);

    // Make executable on Unix
    if (!isWindows) {
      await fs.promises.chmod(targetPath, 0o755);
    }
  } catch (error) {
    // If source doesn't exist, create a basic script
    if (!isWindows) {
      await createBasicBashScript(targetPath);
    } else {
      await createBasicPowerShellScript(targetPath);
    }
  }
}

async function createBasicBashScript(targetPath: string): Promise<void> {
  const script = `#!/bin/bash
# Clawdachi status hook for Claude Code
EVENT="$1"
SESSION_DIR="$HOME/.clawdachi/sessions"
SESSION_FILE="$SESSION_DIR/current.json"

mkdir -p "$SESSION_DIR"

# Map event to status
case "$EVENT" in
  session-start)
    STATUS="idle"
    ;;
  prompt)
    STATUS="thinking"
    ;;
  tool-start)
    STATUS="using-tool"
    TOOL_NAME="$CLAUDE_TOOL_NAME"
    ;;
  tool-end)
    STATUS="thinking"
    ;;
  notify)
    STATUS="waiting"
    ;;
  stop)
    STATUS="completed"
    ;;
  session-end)
    STATUS="idle"
    ;;
  *)
    STATUS="idle"
    ;;
esac

# Write session file
cat > "$SESSION_FILE" << EOF
{
  "session_id": "$CLAUDE_SESSION_ID",
  "status": "$STATUS",
  "timestamp": $(date +%s),
  "cwd": "$PWD",
  "tty": "$(tty 2>/dev/null || echo unknown)",
  "tool_name": "$TOOL_NAME"
}
EOF
`;

  await fs.promises.writeFile(targetPath, script, 'utf-8');
  await fs.promises.chmod(targetPath, 0o755);
}

async function createBasicPowerShellScript(targetPath: string): Promise<void> {
  const script = `# Clawdachi status hook for Claude Code
param([string]$Event)

$SessionDir = "$env:USERPROFILE\\.clawdachi\\sessions"
$SessionFile = "$SessionDir\\current.json"

if (-not (Test-Path $SessionDir)) {
    New-Item -ItemType Directory -Path $SessionDir -Force | Out-Null
}

# Map event to status
$Status = switch ($Event) {
    "session-start" { "idle" }
    "prompt" { "thinking" }
    "tool-start" { "using-tool" }
    "tool-end" { "thinking" }
    "notify" { "waiting" }
    "stop" { "completed" }
    "session-end" { "idle" }
    default { "idle" }
}

$ToolName = $env:CLAUDE_TOOL_NAME

$Session = @{
    session_id = $env:CLAUDE_SESSION_ID
    status = $Status
    timestamp = [int][double]::Parse((Get-Date -UFormat %s))
    cwd = (Get-Location).Path
    tty = "windows"
    tool_name = $ToolName
} | ConvertTo-Json

$Session | Out-File -FilePath $SessionFile -Encoding UTF8
`;

  await fs.promises.writeFile(targetPath, script, 'utf-8');
}

/**
 * Check if hooks are installed and enabled
 */
export async function getHooksStatus(): Promise<{ installed: boolean; enabled: boolean }> {
  try {
    const homeDir = os.homedir();
    const claudeSettingsPath = path.join(homeDir, PATHS.CLAUDE_SETTINGS);
    const hookScriptPath = getHookScriptPath();

    // Check if hook script exists
    const scriptExists = fs.existsSync(hookScriptPath);

    // Check if hooks are in Claude settings
    let hooksConfigured = false;
    try {
      const content = await fs.promises.readFile(claudeSettingsPath, 'utf-8');
      const settings: ClaudeSettings = JSON.parse(content);

      if (settings.hooks) {
        hooksConfigured = Object.values(settings.hooks).some((hooks) =>
          hooks.some((h) => h.includes('clawdachi') || h.includes('claude-status'))
        );
      }
    } catch {
      // Settings don't exist
    }

    return {
      installed: scriptExists && hooksConfigured,
      enabled: scriptExists && hooksConfigured,
    };
  } catch {
    return { installed: false, enabled: false };
  }
}

/**
 * Remove Clawdachi hooks from Claude settings
 */
export async function uninstallHooks(): Promise<{ success: boolean; error?: string }> {
  try {
    const homeDir = os.homedir();
    const claudeSettingsPath = path.join(homeDir, PATHS.CLAUDE_SETTINGS);

    const content = await fs.promises.readFile(claudeSettingsPath, 'utf-8');
    const settings: ClaudeSettings = JSON.parse(content);

    if (settings.hooks) {
      for (const event of Object.keys(settings.hooks)) {
        settings.hooks[event] = settings.hooks[event].filter(
          (h) => !h.includes('clawdachi') && !h.includes('claude-status')
        );

        // Remove empty arrays
        if (settings.hooks[event].length === 0) {
          delete settings.hooks[event];
        }
      }

      // Remove empty hooks object
      if (Object.keys(settings.hooks).length === 0) {
        delete settings.hooks;
      }
    }

    await fs.promises.writeFile(
      claudeSettingsPath,
      JSON.stringify(settings, null, 2),
      'utf-8'
    );

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}
