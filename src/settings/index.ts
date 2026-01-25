import { AppSettings } from '../shared/types';

// UI Elements
const elements = {
  startWithSystem: document.getElementById('startWithSystem') as HTMLInputElement,
  alwaysOnTop: document.getElementById('alwaysOnTop') as HTMLInputElement,
  scale: document.getElementById('scale') as HTMLInputElement,
  scaleValue: document.getElementById('scaleValue') as HTMLSpanElement,
  soundEnabled: document.getElementById('soundEnabled') as HTMLInputElement,
  soundVolume: document.getElementById('soundVolume') as HTMLInputElement,
  volumeValue: document.getElementById('volumeValue') as HTMLSpanElement,
  hooksEnabled: document.getElementById('hooksEnabled') as HTMLInputElement,
  hookStatusText: document.getElementById('hookStatusText') as HTMLSpanElement,
  hookStatusDot: document.getElementById('hookStatusDot') as HTMLSpanElement,
  installHooksBtn: document.getElementById('installHooksBtn') as HTMLButtonElement,
};

/**
 * Load settings and update UI
 */
async function loadSettings(): Promise<void> {
  const settings = await window.clawdachi.getSettings();

  elements.startWithSystem.checked = settings.startWithSystem;
  elements.alwaysOnTop.checked = settings.alwaysOnTop;
  elements.scale.value = String(settings.scale);
  elements.scaleValue.textContent = `${Math.round(settings.scale * 100)}%`;
  elements.soundEnabled.checked = settings.soundEnabled;
  elements.soundVolume.value = String(settings.soundVolume);
  elements.volumeValue.textContent = `${Math.round(settings.soundVolume * 100)}%`;
  elements.hooksEnabled.checked = settings.hooksEnabled;

  await updateHooksStatus();
}

/**
 * Update hooks status display
 */
async function updateHooksStatus(): Promise<void> {
  const status = await window.clawdachi.getHooksStatus();

  if (status.installed) {
    elements.hookStatusText.textContent = 'Installed and active';
    elements.hookStatusDot.classList.add('active');
    elements.hookStatusDot.classList.remove('error');
    elements.installHooksBtn.textContent = 'Reinstall';
  } else {
    elements.hookStatusText.textContent = 'Not installed';
    elements.hookStatusDot.classList.remove('active');
    elements.hookStatusDot.classList.add('error');
    elements.installHooksBtn.textContent = 'Install';
  }
}

/**
 * Set up event listeners
 */
function setupListeners(): void {
  // Toggle settings
  elements.startWithSystem.addEventListener('change', () => {
    window.clawdachi.setSetting('startWithSystem', elements.startWithSystem.checked);
  });

  elements.alwaysOnTop.addEventListener('change', () => {
    window.clawdachi.setSetting('alwaysOnTop', elements.alwaysOnTop.checked);
  });

  elements.soundEnabled.addEventListener('change', () => {
    window.clawdachi.setSetting('soundEnabled', elements.soundEnabled.checked);
  });

  elements.hooksEnabled.addEventListener('change', () => {
    window.clawdachi.setSetting('hooksEnabled', elements.hooksEnabled.checked);
  });

  // Slider settings
  elements.scale.addEventListener('input', () => {
    const value = parseFloat(elements.scale.value);
    elements.scaleValue.textContent = `${Math.round(value * 100)}%`;
  });

  elements.scale.addEventListener('change', () => {
    const value = parseFloat(elements.scale.value);
    window.clawdachi.setSetting('scale', value);
  });

  elements.soundVolume.addEventListener('input', () => {
    const value = parseFloat(elements.soundVolume.value);
    elements.volumeValue.textContent = `${Math.round(value * 100)}%`;
  });

  elements.soundVolume.addEventListener('change', () => {
    const value = parseFloat(elements.soundVolume.value);
    window.clawdachi.setSetting('soundVolume', value);
  });

  // Install hooks button
  elements.installHooksBtn.addEventListener('click', async () => {
    elements.installHooksBtn.disabled = true;
    elements.installHooksBtn.textContent = 'Installing...';

    const result = await window.clawdachi.installHooks();

    if (result.success) {
      await updateHooksStatus();
    } else {
      elements.hookStatusText.textContent = `Error: ${result.error}`;
      elements.hookStatusDot.classList.add('error');
    }

    elements.installHooksBtn.disabled = false;
  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  setupListeners();
});
