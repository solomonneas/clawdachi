import { Tray, Menu, app, nativeImage, BrowserWindow } from 'electron';
import * as path from 'path';
import Store from 'electron-store';
import { AppSettings } from '../shared/types';
import { createSettingsWindow } from './settings-window';

let tray: Tray | null = null;

export function setupTray(mainWindow: BrowserWindow, store: Store<AppSettings>): void {
  // Create a simple placeholder icon (16x16 transparent)
  // In production, load from assets/icon.png
  const iconPath = path.join(__dirname, '../../assets/tray-icon.png');
  let trayIcon: Electron.NativeImage;

  try {
    trayIcon = nativeImage.createFromPath(iconPath);
  } catch {
    // Fallback: create a simple colored square
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon.isEmpty() ? createPlaceholderIcon() : trayIcon);
  tray.setToolTip('Clawdachi');

  const updateMenu = () => {
    const settings = store.store;

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show Clawdachi',
        click: () => {
          mainWindow.show();
          mainWindow.focus();
        },
      },
      { type: 'separator' },
      {
        label: 'Always on Top',
        type: 'checkbox',
        checked: settings.alwaysOnTop,
        click: (menuItem) => {
          store.set('alwaysOnTop', menuItem.checked);
          mainWindow.setAlwaysOnTop(menuItem.checked);
        },
      },
      {
        label: 'Sound Effects',
        type: 'checkbox',
        checked: settings.soundEnabled,
        click: (menuItem) => {
          store.set('soundEnabled', menuItem.checked);
          mainWindow.webContents.send('settings:changed', { soundEnabled: menuItem.checked });
        },
      },
      { type: 'separator' },
      {
        label: 'Settings...',
        click: () => {
          createSettingsWindow();
        },
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.quit();
        },
      },
    ]);

    tray!.setContextMenu(contextMenu);
  };

  updateMenu();

  // Update menu when settings change
  store.onDidChange('alwaysOnTop', updateMenu);
  store.onDidChange('soundEnabled', updateMenu);

  tray.on('click', () => {
    mainWindow.show();
    mainWindow.focus();
  });
}

function createPlaceholderIcon(): Electron.NativeImage {
  // Create a 16x16 icon with a simple pattern
  const size = 16;
  const buffer = Buffer.alloc(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      // Create a simple rounded square pattern
      const dx = Math.abs(x - size / 2);
      const dy = Math.abs(y - size / 2);
      const inCircle = dx * dx + dy * dy < (size / 2 - 2) * (size / 2 - 2);

      if (inCircle) {
        buffer[i] = 147;     // R (Claude purple-ish)
        buffer[i + 1] = 112; // G
        buffer[i + 2] = 219; // B
        buffer[i + 3] = 255; // A
      } else {
        buffer[i + 3] = 0;   // Transparent
      }
    }
  }

  return nativeImage.createFromBuffer(buffer, { width: size, height: size });
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}
