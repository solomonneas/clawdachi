import { Application } from 'pixi.js';
import { Clawdachi } from './sprite/Clawdachi';
import { StateMachine } from './animation/StateMachine';
import { ClaudeSession, AnimationState } from '../shared/types';
import { WINDOW } from '../shared/constants';

// Global references
let app: Application;
let clawdachi: Clawdachi;
let stateMachine: StateMachine;

// Dragging state
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

async function init(): Promise<void> {
  // Create PixiJS application with transparent background
  app = new Application();

  await app.init({
    width: WINDOW.WIDTH,
    height: WINDOW.HEIGHT,
    backgroundAlpha: 0,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });

  // Add canvas to DOM
  const appElement = document.getElementById('app');
  if (appElement) {
    appElement.appendChild(app.canvas);
  }

  // Create the main character sprite
  clawdachi = new Clawdachi();
  await clawdachi.init();

  // Center the character
  clawdachi.container.x = WINDOW.WIDTH / 2;
  clawdachi.container.y = WINDOW.HEIGHT / 2;

  app.stage.addChild(clawdachi.container);

  // Create state machine for animations
  stateMachine = new StateMachine(clawdachi);
  stateMachine.start();

  // Set up event listeners
  setupDragHandlers();
  setupClickHandlers();
  setupClaudeListener();

  // Start the update loop
  app.ticker.add((ticker) => {
    stateMachine.update(ticker.deltaMS);
    clawdachi.update(ticker.deltaMS);
  });

  console.log('[Clawdachi] Initialized');
}

function setupDragHandlers(): void {
  const container = clawdachi.container;
  container.eventMode = 'static';
  container.cursor = 'grab';

  container.on('pointerdown', (event) => {
    isDragging = true;
    dragStartX = event.global.x;
    dragStartY = event.global.y;
    container.cursor = 'grabbing';

    // Notify main process
    window.clawdachi.startDrag();

    // Show nervous expression while dragging
    stateMachine.setState('nervous');
  });

  container.on('globalpointermove', (event) => {
    if (!isDragging) return;

    const deltaX = event.global.x - dragStartX;
    const deltaY = event.global.y - dragStartY;

    // Move the window
    window.clawdachi.moveWindow(deltaX, deltaY);

    // Reset drag start for continuous movement
    dragStartX = event.global.x;
    dragStartY = event.global.y;
  });

  container.on('pointerup', () => {
    if (isDragging) {
      isDragging = false;
      container.cursor = 'grab';

      // Return to idle and play bounce
      stateMachine.setState('idle');
      clawdachi.playBounce();
    }
  });

  container.on('pointerupoutside', () => {
    if (isDragging) {
      isDragging = false;
      container.cursor = 'grab';
      stateMachine.setState('idle');
    }
  });
}

function setupClickHandlers(): void {
  const container = clawdachi.container;

  container.on('click', () => {
    if (!isDragging) {
      // Wave animation and hearts
      stateMachine.setState('waving');
      clawdachi.playHearts();
    }
  });
}

function setupClaudeListener(): void {
  // Listen for Claude state changes from main process
  window.clawdachi.onClaudeStateChange((session: ClaudeSession) => {
    console.log('[Clawdachi] Claude state:', session.status);

    // Map Claude status to animation state
    const animationMap: Record<string, AnimationState> = {
      'idle': 'idle',
      'thinking': 'thinking',
      'using-tool': 'thinking',
      'waiting': 'waiting',
      'completed': 'celebrating',
      'error': 'nervous',
    };

    const animState = animationMap[session.status] || 'idle';
    stateMachine.setState(animState);

    // Show tool info for tool use
    if (session.status === 'using-tool' && session.tool_name) {
      clawdachi.showThought(session.tool_name);
    }
  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// Export for debugging
(window as unknown as { app: Application }).app = app;
