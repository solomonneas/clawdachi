import { Clawdachi } from '../sprite/Clawdachi';
import { AnimationState, Expression } from '../../shared/types';
import { ANIMATION } from '../../shared/constants';

interface StateConfig {
  expression: Expression;
  onEnter?: () => void;
  onUpdate?: (deltaMs: number) => void;
  onExit?: () => void;
  duration?: number; // Auto-transition to idle after this duration
}

/**
 * Controls animation state transitions and effects
 */
export class StateMachine {
  private sprite: Clawdachi;
  private currentState: AnimationState = 'idle';
  private stateTimer = 0;
  private effectTimer = 0;
  private isRunning = false;

  private states: Map<AnimationState, StateConfig>;

  constructor(sprite: Clawdachi) {
    this.sprite = sprite;
    this.states = this.defineStates();
  }

  private defineStates(): Map<AnimationState, StateConfig> {
    return new Map([
      ['idle', {
        expression: 'neutral',
        onEnter: () => {
          this.sprite.setExpression('neutral');
        },
      }],

      ['breathing', {
        expression: 'neutral',
        // Breathing is handled by Clawdachi.update()
      }],

      ['blinking', {
        expression: 'neutral',
        // Blinking is handled by Clawdachi.update()
      }],

      ['thinking', {
        expression: 'focused',
        onEnter: () => {
          this.sprite.setExpression('focused');
          this.effectTimer = 0;
        },
        onUpdate: (deltaMs) => {
          this.effectTimer += deltaMs;
          // Could add floating symbols here
        },
      }],

      ['planning', {
        expression: 'focused',
        onEnter: () => {
          this.sprite.setExpression('focused');
        },
      }],

      ['waiting', {
        expression: 'confused',
        onEnter: () => {
          this.sprite.setExpression('confused');
        },
      }],

      ['celebrating', {
        expression: 'excited',
        duration: ANIMATION.CELEBRATION_DURATION,
        onEnter: () => {
          this.sprite.setExpression('excited');
          this.playCelebrationEffects();
        },
      }],

      ['waving', {
        expression: 'happy',
        duration: ANIMATION.WAVE_DURATION,
        onEnter: () => {
          this.sprite.setExpression('happy');
        },
      }],

      ['nervous', {
        expression: 'nervous',
        onEnter: () => {
          this.sprite.setExpression('nervous');
        },
      }],

      ['dancing', {
        expression: 'happy',
        onEnter: () => {
          this.sprite.setExpression('happy');
        },
      }],
    ]);
  }

  /**
   * Start the state machine
   */
  start(): void {
    this.isRunning = true;
    this.setState('idle');
  }

  /**
   * Stop the state machine
   */
  stop(): void {
    this.isRunning = false;
  }

  /**
   * Update called every frame
   */
  update(deltaMs: number): void {
    if (!this.isRunning) return;

    this.stateTimer += deltaMs;

    const state = this.states.get(this.currentState);
    if (state) {
      // Call state update
      if (state.onUpdate) {
        state.onUpdate(deltaMs);
      }

      // Check for auto-transition
      if (state.duration && this.stateTimer >= state.duration) {
        this.setState('idle');
      }
    }
  }

  /**
   * Transition to a new state
   */
  setState(newState: AnimationState): void {
    if (newState === this.currentState) return;

    // Exit current state
    const currentConfig = this.states.get(this.currentState);
    if (currentConfig?.onExit) {
      currentConfig.onExit();
    }

    // Enter new state
    const newConfig = this.states.get(newState);
    if (newConfig) {
      this.currentState = newState;
      this.stateTimer = 0;

      if (newConfig.onEnter) {
        newConfig.onEnter();
      }

      console.log(`[StateMachine] State: ${newState}`);
    }
  }

  /**
   * Get current state
   */
  getState(): AnimationState {
    return this.currentState;
  }

  /**
   * Play celebration particle effects
   */
  private playCelebrationEffects(): void {
    // Spawn confetti
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        this.spawnConfetti();
      }, i * 50);
    }
  }

  private spawnConfetti(): void {
    // This would create confetti particles
    // For now, we'll use the heart effect as a placeholder
    this.sprite.playHearts();
  }
}
