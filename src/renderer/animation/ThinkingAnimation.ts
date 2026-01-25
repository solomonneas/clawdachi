import { Container } from 'pixi.js';
import { ParticleSystem, FloatingSymbol } from '../sprite/effects';

/**
 * Thinking animation with floating symbols
 */
export class ThinkingAnimation {
  private particles: ParticleSystem;
  private symbol: FloatingSymbol;
  private isActive = false;
  private symbolTimer = 0;
  private nextSymbolTime = 0;

  // Thinking symbols to cycle through
  private symbols = ['💭', '🤔', '💡', '📝', '⚡', '🔍', '📊'];
  private currentSymbolIndex = 0;

  constructor(container: Container) {
    this.particles = new ParticleSystem(container);
    this.symbol = new FloatingSymbol(container);
  }

  start(): void {
    this.isActive = true;
    this.symbolTimer = 0;
    this.scheduleNextSymbol();
    this.showNextSymbol();
  }

  stop(): void {
    this.isActive = false;
    this.symbol.hide();
    this.particles.clear();
  }

  update(deltaMs: number): void {
    if (!this.isActive) return;

    this.symbol.update(deltaMs);
    this.particles.update(deltaMs);

    // Cycle through symbols
    this.symbolTimer += deltaMs;
    if (this.symbolTimer >= this.nextSymbolTime) {
      this.showNextSymbol();
      this.scheduleNextSymbol();
    }
  }

  private scheduleNextSymbol(): void {
    this.symbolTimer = 0;
    this.nextSymbolTime = 2000 + Math.random() * 1000;
  }

  private showNextSymbol(): void {
    this.currentSymbolIndex = (this.currentSymbolIndex + 1) % this.symbols.length;
    this.symbol.show(this.symbols[this.currentSymbolIndex], -60);

    // Occasional sparkle
    if (Math.random() > 0.7) {
      this.particles.sparkles();
    }
  }
}
