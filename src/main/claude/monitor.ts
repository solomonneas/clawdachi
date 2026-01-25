import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import chokidar, { FSWatcher } from 'chokidar';
import { ClaudeSession, ClaudeStatus } from '../../shared/types';
import { PATHS } from '../../shared/constants';

/**
 * Monitors Claude session files for state changes
 */
export class ClaudeMonitor extends EventEmitter {
  private watcher: FSWatcher | null = null;
  private sessionsDir: string;
  private currentSession: ClaudeSession | null = null;
  private debounceTimer: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.sessionsDir = path.join(os.homedir(), PATHS.SESSIONS_DIR);
  }

  /**
   * Start watching for session file changes
   */
  start(): void {
    // Ensure directory exists
    if (!fs.existsSync(this.sessionsDir)) {
      fs.mkdirSync(this.sessionsDir, { recursive: true });
    }

    const sessionFile = path.join(this.sessionsDir, 'current.json');

    this.watcher = chokidar.watch(sessionFile, {
      persistent: true,
      ignoreInitial: false,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50,
      },
    });

    this.watcher.on('add', (filePath) => this.handleFileChange(filePath));
    this.watcher.on('change', (filePath) => this.handleFileChange(filePath));

    // Read initial state if file exists
    if (fs.existsSync(sessionFile)) {
      this.handleFileChange(sessionFile);
    }

    console.log('[ClaudeMonitor] Started watching:', sessionFile);
  }

  /**
   * Stop watching for changes
   */
  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    console.log('[ClaudeMonitor] Stopped');
  }

  /**
   * Handle session file changes
   */
  private handleFileChange(filePath: string): void {
    // Debounce rapid changes
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.processSessionFile(filePath);
    }, 50);
  }

  /**
   * Parse and emit session state
   */
  private processSessionFile(filePath: string): void {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const session = JSON.parse(content) as ClaudeSession;

      // Validate required fields
      if (!session.status || !session.timestamp) {
        console.warn('[ClaudeMonitor] Invalid session file format');
        return;
      }

      // Validate status
      const validStatuses: ClaudeStatus[] = [
        'idle',
        'thinking',
        'using-tool',
        'waiting',
        'completed',
        'error',
      ];

      if (!validStatuses.includes(session.status)) {
        console.warn('[ClaudeMonitor] Unknown status:', session.status);
        session.status = 'idle';
      }

      // Check if state actually changed
      if (this.hasStateChanged(session)) {
        this.currentSession = session;
        this.emit('state-change', session);
        console.log('[ClaudeMonitor] State changed:', session.status);
      }
    } catch (error) {
      console.error('[ClaudeMonitor] Error parsing session file:', error);
    }
  }

  /**
   * Check if the session state has meaningfully changed
   */
  private hasStateChanged(newSession: ClaudeSession): boolean {
    if (!this.currentSession) {
      return true;
    }

    // Status change is always significant
    if (this.currentSession.status !== newSession.status) {
      return true;
    }

    // Tool name change during tool use is significant
    if (
      newSession.status === 'using-tool' &&
      this.currentSession.tool_name !== newSession.tool_name
    ) {
      return true;
    }

    // Session ID change indicates new session
    if (this.currentSession.session_id !== newSession.session_id) {
      return true;
    }

    return false;
  }

  /**
   * Get current session state
   */
  getCurrentSession(): ClaudeSession | null {
    return this.currentSession;
  }

  /**
   * Manually set status (for testing)
   */
  setStatus(status: ClaudeStatus): void {
    const session: ClaudeSession = {
      session_id: 'manual',
      status,
      timestamp: Date.now(),
      cwd: process.cwd(),
      tty: 'manual',
    };

    this.currentSession = session;
    this.emit('state-change', session);
  }
}
