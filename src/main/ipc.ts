import { ipcMain, BrowserWindow, app } from 'electron';
import Store from 'electron-store';
import { AppSettings, IPC_CHANNELS } from '../shared/types';
import { installHooks, getHooksStatus } from './claude/hooks';

let dragStartPosition = { x: 0, y: 0 };

export function setupIPC(mainWindow: BrowserWindow, store: Store<AppSettings>): void {
  // Settings handlers
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, () => {
    return store.store;
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, (_event, key: keyof AppSettings, value: unknown) => {
    store.set(key, value as AppSettings[keyof AppSettings]);

    // Handle side effects
    if (key === 'alwaysOnTop') {
      mainWindow.setAlwaysOnTop(value as boolean);
    }
  });

  // Window dragging
  ipcMain.on(IPC_CHANNELS.WINDOW_DRAG_START, () => {
    const [x, y] = mainWindow.getPosition();
    dragStartPosition = { x, y };
  });

  ipcMain.on(IPC_CHANNELS.WINDOW_MOVE, (_event, deltaX: number, deltaY: number) => {
    const [currentX, currentY] = mainWindow.getPosition();
    mainWindow.setPosition(currentX + deltaX, currentY + deltaY);
  });

  // Hooks handlers
  ipcMain.handle(IPC_CHANNELS.HOOKS_INSTALL, async () => {
    return installHooks();
  });

  ipcMain.handle(IPC_CHANNELS.HOOKS_STATUS, async () => {
    return getHooksStatus();
  });

  // App control
  ipcMain.on(IPC_CHANNELS.APP_QUIT, () => {
    app.quit();
  });
}
