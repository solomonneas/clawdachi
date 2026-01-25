import { ClaudeSession, ClaudeStatus, AnimationState, Expression } from '../../shared/types';

/**
 * Maps Claude session status to animation state
 */
export function statusToAnimation(status: ClaudeStatus): AnimationState {
  switch (status) {
    case 'thinking':
      return 'thinking';
    case 'using-tool':
      return 'thinking'; // Same visual as thinking
    case 'waiting':
      return 'waiting';
    case 'completed':
      return 'celebrating';
    case 'error':
      return 'nervous';
    case 'idle':
    default:
      return 'idle';
  }
}

/**
 * Maps Claude session status to facial expression
 */
export function statusToExpression(status: ClaudeStatus): Expression {
  switch (status) {
    case 'thinking':
      return 'focused';
    case 'using-tool':
      return 'focused';
    case 'waiting':
      return 'confused';
    case 'completed':
      return 'excited';
    case 'error':
      return 'nervous';
    case 'idle':
    default:
      return 'neutral';
  }
}

/**
 * Determine if a session is stale (no updates for a while)
 */
export function isSessionStale(session: ClaudeSession, maxAgeMs: number = 60000): boolean {
  const now = Date.now();
  const sessionTime = session.timestamp * 1000; // Convert seconds to ms if needed
  return now - sessionTime > maxAgeMs;
}

/**
 * Parse tool name to friendly display
 */
export function formatToolName(toolName?: string): string {
  if (!toolName) return '';

  // Common tool name mappings
  const toolDisplayNames: Record<string, string> = {
    Read: 'Reading file',
    Write: 'Writing file',
    Edit: 'Editing file',
    Bash: 'Running command',
    Glob: 'Searching files',
    Grep: 'Searching content',
    Task: 'Running task',
    WebFetch: 'Fetching web page',
    WebSearch: 'Searching web',
  };

  return toolDisplayNames[toolName] || toolName;
}
