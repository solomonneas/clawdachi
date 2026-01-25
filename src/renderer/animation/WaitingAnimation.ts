import { Container } from 'pixi.js';
import { FloatingSymbol } from '../sprite/effects';

/**
 * Waiting animation with question mark bubble
 */
export class WaitingAnimation {
  private symbol: FloatingSymbol;
  private isActive = false;
  private pulsePhase = 0;

  constructor(container: Container) {
    this.symbol = new FloatingSymbol(container);
  }

  start(): void {
    this.isActive = true;
    this.pulsePhase = 0;
    this.symbol.show('❓', -60);
  }

  stop(): void {
    this.isActive = false;
    this.symbol.hide();
  }

  update(deltaMs: number): void {
    if (!this.isActive) return;

    this.symbol.update(deltaMs);

    // Gentle pulsing effect (if we had direct access to scale)
    this.pulsePhase += deltaMs * 0.005;
  }
}
