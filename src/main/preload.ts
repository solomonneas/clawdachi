import { contextBridge, ipcRenderer } from 'electron';
import { ClaudeSession, AppSettings, IPC_CHANNELS } from '../shared/types';

/**
 * Exposed API for the renderer process
 * Uses contextBridge for secure IPC communication
 */
const api = {
  // Claude state changes
  onClaudeStateChange: (callback: (session: ClaudeSession) => void) => {
    ipcRenderer.on(IPC_CHANNELS.CLAUDE_STATE_CHANGE, (_event, session) => {
      callback(session);
    });
  },

  // Settings
  getSettings: (): Promise<AppSettings> => {
    return ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET);
  },

  setSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<void> => {
    return ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SET, key, value);
  },

  // Window dragging
  startDrag: () => {
    ipcRenderer.send(IPC_CHANNELS.WINDOW_DRAG_START);
  },

  moveWindow: (deltaX: number, deltaY: number) => {
    ipcRenderer.send(IPC_CHANNELS.WINDOW_MOVE, deltaX, deltaY);
  },

  // Hooks
  installHooks: (): Promise<{ success: boolean; error?: string }> => {
    return ipcRenderer.invoke(IPC_CHANNELS.HOOKS_INSTALL);
  },

  getHooksStatus: (): Promise<{ installed: boolean; enabled: boolean }> => {
    return ipcRenderer.invoke(IPC_CHANNELS.HOOKS_STATUS);
  },

  // App control
  quit: () => {
    ipcRenderer.send(IPC_CHANNELS.APP_QUIT);
  },
};

// Expose the API to the renderer
contextBridge.exposeInMainWorld('clawdachi', api);

// Type declaration for the exposed API
declare global {
  interface Window {
    clawdachi: typeof api;
  }
}
