import { app, BrowserWindow, screen } from 'electron';
import * as path from 'path';
import Store from 'electron-store';
import { setupTray } from './tray';
import { setupIPC } from './ipc';
import { ClaudeMonitor } from './claude/monitor';
import { AppSettings, DEFAULT_SETTINGS } from '../shared/types';
import { WINDOW } from '../shared/constants';

// Electron store for persistent settings
const store = new Store<AppSettings>({
  defaults: DEFAULT_SETTINGS,
});

let mainWindow: BrowserWindow | null = null;
let claudeMonitor: ClaudeMonitor | null = null;

function createWindow(): void {
  const settings = store.store;
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

  // Validate saved position is within screen bounds
  let x = settings.position.x;
  let y = settings.position.y;
  if (x < 0 || x > screenWidth - WINDOW.WIDTH) x = screenWidth - WINDOW.WIDTH - 50;
  if (y < 0 || y > screenHeight - WINDOW.HEIGHT) y = screenHeight - WINDOW.HEIGHT - 50;

  mainWindow = new BrowserWindow({
    width: WINDOW.WIDTH,
    height: WINDOW.HEIGHT,
    x,
    y,
    transparent: true,
    frame: false,
    resizable: false,
    hasShadow: false,
    alwaysOnTop: settings.alwaysOnTop,
    skipTaskbar: true,
    focusable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Enable mouse events to pass through transparent areas
  mainWindow.setIgnoreMouseEvents(false);

  // Load the renderer
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173/src/renderer/index.html');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../renderer/src/renderer/index.html'));
  }

  // Save position on move
  mainWindow.on('moved', () => {
    if (mainWindow) {
      const [x, y] = mainWindow.getPosition();
      store.set('position', { x, y });
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startClaudeMonitor(): void {
  claudeMonitor = new ClaudeMonitor();
  claudeMonitor.on('state-change', (session) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('claude:state-change', session);
    }
  });
  claudeMonitor.start();
}

app.whenReady().then(() => {
  createWindow();
  setupTray(mainWindow!, store);
  setupIPC(mainWindow!, store);
  startClaudeMonitor();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (claudeMonitor) {
    claudeMonitor.stop();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Export for testing
export { mainWindow, store };
