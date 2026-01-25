import { Container } from 'pixi.js';
import { ParticleSystem, FloatingSymbol } from '../sprite/effects';
import { ANIMATION } from '../../shared/constants';

/**
 * Celebration animation with confetti and party effects
 */
export class CelebrationAnimation {
  private particles: ParticleSystem;
  private symbol: FloatingSymbol;
  private isActive = false;
  private timer = 0;
  private duration = ANIMATION.CELEBRATION_DURATION;

  constructor(container: Container) {
    this.particles = new ParticleSystem(container);
    this.symbol = new FloatingSymbol(container);
  }

  start(): void {
    this.isActive = true;
    this.timer = 0;

    // Show celebration symbol
    this.symbol.show('🎉', -60);

    // Burst of confetti
    this.particles.confetti();

    // Additional sparkles
    setTimeout(() => {
      if (this.isActive) {
        this.particles.sparkles();
      }
    }, 500);
  }

  stop(): void {
    this.isActive = false;
    this.symbol.hide();
    this.particles.clear();
  }

  update(deltaMs: number): void {
    if (!this.isActive) return;

    this.timer += deltaMs;
    this.symbol.update(deltaMs);
    this.particles.update(deltaMs);

    // Auto-stop after duration
    if (this.timer >= this.duration) {
      this.stop();
    }
  }

  isRunning(): boolean {
    return this.isActive;
  }
}
