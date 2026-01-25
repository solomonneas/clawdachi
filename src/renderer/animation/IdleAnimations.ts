import { Clawdachi } from '../sprite/Clawdachi';
import { ANIMATION } from '../../shared/constants';

/**
 * Idle animation controller
 * Handles breathing and random idle behaviors
 */
export class IdleAnimations {
  private sprite: Clawdachi;
  private idleTimer = 0;
  private nextIdleAction = 0;

  // Idle behaviors to randomly trigger
  private idleBehaviors = [
    'yawn',
    'stretch',
    'lookAround',
    'scratch',
  ];

  constructor(sprite: Clawdachi) {
    this.sprite = sprite;
    this.scheduleNextIdleAction();
  }

  update(deltaMs: number): void {
    this.idleTimer += deltaMs;

    if (this.idleTimer >= this.nextIdleAction) {
      this.triggerRandomIdleBehavior();
      this.scheduleNextIdleAction();
    }
  }

  private scheduleNextIdleAction(): void {
    // Random interval between 10-30 seconds
    this.idleTimer = 0;
    this.nextIdleAction = 10000 + Math.random() * 20000;
  }

  private triggerRandomIdleBehavior(): void {
    const behavior = this.idleBehaviors[
      Math.floor(Math.random() * this.idleBehaviors.length)
    ];

    switch (behavior) {
      case 'yawn':
        this.sprite.setExpression('sleepy');
        setTimeout(() => this.sprite.setExpression('neutral'), 2000);
        break;

      case 'stretch':
        // Could trigger a stretch animation here
        break;

      case 'lookAround':
        // Look left, then right, then center
        this.sprite.lookAt(-100, 0);
        setTimeout(() => this.sprite.lookAt(100, 0), 500);
        setTimeout(() => this.sprite.lookAt(0, 0), 1000);
        break;

      case 'scratch':
        // Could trigger a scratch animation here
        break;
    }
  }

  reset(): void {
    this.idleTimer = 0;
    this.scheduleNextIdleAction();
  }
}
