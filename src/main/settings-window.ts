import { BrowserWindow } from 'electron';
import * as path from 'path';

let settingsWindow: BrowserWindow | null = null;

export function createSettingsWindow(): void {
  // Don't create multiple settings windows
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 500,
    height: 600,
    resizable: false,
    minimizable: false,
    maximizable: false,
    title: 'Clawdachi Settings',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Load settings UI
  if (process.env.NODE_ENV === 'development') {
    settingsWindow.loadURL('http://localhost:5173/src/settings/index.html');
  } else {
    settingsWindow.loadFile(path.join(__dirname, '../../renderer/src/settings/index.html'));
  }

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

export function closeSettingsWindow(): void {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.close();
  }
}
