/**
 * Application constants
 */

export const APP_NAME = 'Clawdachi';

/**
 * Window dimensions for the transparent sprite window
 */
export const WINDOW = {
  WIDTH: 200,
  HEIGHT: 250,
  MIN_WIDTH: 100,
  MIN_HEIGHT: 125,
};

/**
 * Paths relative to home directory
 */
export const PATHS = {
  CLAWDACHI_DIR: '.clawdachi',
  SESSIONS_DIR: '.clawdachi/sessions',
  HOOKS_DIR: '.clawdachi/hooks',
  CLAUDE_SETTINGS: '.claude/settings.json',
};

/**
 * Animation timing (milliseconds)
 */
export const ANIMATION = {
  BREATH_CYCLE: 3000,
  BLINK_INTERVAL_MIN: 2000,
  BLINK_INTERVAL_MAX: 6000,
  BLINK_DURATION: 150,
  WAVE_DURATION: 800,
  CELEBRATION_DURATION: 2000,
  IDLE_TIMEOUT: 30000,
};

/**
 * Particle effect configurations
 */
export const PARTICLES = {
  HEARTS: {
    count: 5,
    lifetime: 1000,
  },
  SPARKLES: {
    count: 8,
    lifetime: 800,
  },
  CONFETTI: {
    count: 20,
    lifetime: 2000,
  },
};

/**
 * Sprite sheet frame names
 */
export const FRAMES = {
  BODY: {
    NORMAL: 'body-normal',
    BREATHE_1: 'body-breathe-1',
    BREATHE_2: 'body-breathe-2',
  },
  FACE: {
    NEUTRAL: 'face-neutral',
    HAPPY: 'face-happy',
    FOCUSED: 'face-focused',
    CONFUSED: 'face-confused',
    EXCITED: 'face-excited',
    SLEEPY: 'face-sleepy',
    NERVOUS: 'face-nervous',
    BLINK: 'face-blink',
  },
};
