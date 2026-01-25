/**
 * Claude session status as reported by hooks
 */
export type ClaudeStatus =
  | 'idle'
  | 'thinking'
  | 'using-tool'
  | 'waiting'
  | 'completed'
  | 'error';

/**
 * Session data written by hook scripts
 */
export interface ClaudeSession {
  session_id: string;
  status: ClaudeStatus;
  timestamp: number;
  cwd: string;
  tty: string;
  tool_name?: string;
  message?: string;
}

/**
 * Character animation states
 */
export type AnimationState =
  | 'idle'
  | 'breathing'
  | 'blinking'
  | 'thinking'
  | 'planning'
  | 'waiting'
  | 'celebrating'
  | 'waving'
  | 'nervous'
  | 'dancing';

/**
 * Facial expressions
 */
export type Expression =
  | 'neutral'
  | 'happy'
  | 'focused'
  | 'confused'
  | 'excited'
  | 'sleepy'
  | 'nervous';

/**
 * Sprite layer identifiers
 */
export type SpriteLayer = 'body' | 'face' | 'outfit' | 'accessory' | 'effect';

/**
 * State machine context
 */
export interface SpriteState {
  animation: AnimationState;
  expression: Expression;
  outfit: string;
  accessory?: string;
}

/**
 * IPC channel names
 */
export const IPC_CHANNELS = {
  CLAUDE_STATE_CHANGE: 'claude:state-change',
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  WINDOW_DRAG_START: 'window:drag-start',
  WINDOW_MOVE: 'window:move',
  APP_QUIT: 'app:quit',
  HOOKS_INSTALL: 'hooks:install',
  HOOKS_STATUS: 'hooks:status',
} as const;

/**
 * App settings stored via electron-store
 */
export interface AppSettings {
  startWithSystem: boolean;
  alwaysOnTop: boolean;
  position: { x: number; y: number };
  scale: number;
  soundEnabled: boolean;
  soundVolume: number;
  hooksEnabled: boolean;
  outfit: string;
  firstRun: boolean;
  // Remote monitoring settings
  remoteEnabled: boolean;
  remotePort: number;
}

/**
 * Default settings
 */
export const DEFAULT_SETTINGS: AppSettings = {
  startWithSystem: false,
  alwaysOnTop: true,
  position: { x: 100, y: 100 },
  scale: 1.0,
  soundEnabled: true,
  soundVolume: 0.5,
  hooksEnabled: true,
  outfit: 'default',
  firstRun: true,
  // Remote monitoring enabled by default
  remoteEnabled: true,
  remotePort: 9876,
};
