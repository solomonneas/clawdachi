import { Container, Graphics, Text, TextStyle, ColorSource } from 'pixi.js';
import { PARTICLES } from '../../shared/constants';

/**
 * Particle configuration
 */
interface ParticleConfig {
  count: number;
  lifetime: number;
  color?: ColorSource;
  symbol?: string;
  gravity?: number;
  spread?: number;
  initialVelocity?: { x: number; y: number };
}

/**
 * Individual particle state
 */
interface Particle {
  element: Graphics | Text;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  rotation: number;
  rotationSpeed: number;
}

/**
 * Particle effect system
 */
export class ParticleSystem {
  private container: Container;
  private particles: Particle[] = [];
  private isActive = false;

  constructor(parent: Container) {
    this.container = new Container();
    parent.addChild(this.container);
  }

  /**
   * Emit a burst of particles
   */
  emit(config: ParticleConfig): void {
    const {
      count,
      lifetime,
      color = 0xff6b6b,
      symbol,
      gravity = 0.1,
      spread = 60,
      initialVelocity = { x: 0, y: -3 },
    } = config;

    for (let i = 0; i < count; i++) {
      const particle = this.createParticle(symbol, color);

      const angle = (Math.random() - 0.5) * spread * (Math.PI / 180);
      const speed = 1 + Math.random() * 2;

      const p: Particle = {
        element: particle,
        x: (Math.random() - 0.5) * 40,
        y: 0,
        vx: initialVelocity.x + Math.sin(angle) * speed,
        vy: initialVelocity.y + Math.cos(angle) * speed,
        life: lifetime,
        maxLife: lifetime,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
      };

      particle.x = p.x;
      particle.y = p.y;

      this.particles.push(p);
      this.container.addChild(particle);
    }

    this.isActive = true;
  }

  private createParticle(symbol?: string, color?: ColorSource): Graphics | Text {
    if (symbol) {
      const text = new Text({
        text: symbol,
        style: new TextStyle({
          fontSize: 16,
          fill: color || 0xffffff,
        }),
      });
      text.anchor.set(0.5);
      return text;
    }

    const g = new Graphics();
    g.circle(0, 0, 4);
    g.fill({ color: color || 0xff6b6b });
    return g;
  }

  /**
   * Update particles each frame
   */
  update(deltaMs: number): void {
    if (!this.isActive || this.particles.length === 0) return;

    const dt = deltaMs / 16; // Normalize to ~60fps
    const gravity = 0.1;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      // Update position
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += gravity * dt;

      // Update rotation
      p.rotation += p.rotationSpeed * dt;

      // Update life
      p.life -= deltaMs;

      // Update visual
      p.element.x = p.x;
      p.element.y = p.y;
      p.element.rotation = p.rotation;
      p.element.alpha = Math.max(0, p.life / p.maxLife);

      // Remove dead particles
      if (p.life <= 0) {
        this.container.removeChild(p.element);
        p.element.destroy();
        this.particles.splice(i, 1);
      }
    }

    if (this.particles.length === 0) {
      this.isActive = false;
    }
  }

  /**
   * Clear all particles
   */
  clear(): void {
    for (const p of this.particles) {
      this.container.removeChild(p.element);
      p.element.destroy();
    }
    this.particles = [];
    this.isActive = false;
  }

  /**
   * Predefined effects
   */
  hearts(): void {
    this.emit({
      count: PARTICLES.HEARTS.count,
      lifetime: PARTICLES.HEARTS.lifetime,
      symbol: '❤',
      color: 0xff6b6b,
      gravity: -0.05, // Float upward
      spread: 90,
      initialVelocity: { x: 0, y: -2 },
    });
  }

  sparkles(): void {
    this.emit({
      count: PARTICLES.SPARKLES.count,
      lifetime: PARTICLES.SPARKLES.lifetime,
      symbol: '✨',
      color: 0xffd700,
      gravity: 0,
      spread: 360,
      initialVelocity: { x: 0, y: 0 },
    });
  }

  confetti(): void {
    const colors = [0xff6b6b, 0x4ecdc4, 0xffe66d, 0x95e1d3, 0xf38181];

    for (let i = 0; i < PARTICLES.CONFETTI.count; i++) {
      setTimeout(() => {
        this.emit({
          count: 1,
          lifetime: PARTICLES.CONFETTI.lifetime,
          color: colors[Math.floor(Math.random() * colors.length)],
          gravity: 0.15,
          spread: 180,
          initialVelocity: { x: (Math.random() - 0.5) * 4, y: -5 - Math.random() * 3 },
        });
      }, i * 30);
    }
  }

  thinkingSymbols(): void {
    const symbols = ['💭', '🤔', '💡', '📝', '⚡'];
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];

    this.emit({
      count: 1,
      lifetime: 2000,
      symbol,
      gravity: -0.02,
      spread: 30,
      initialVelocity: { x: 0, y: -1 },
    });
  }

  questionMark(): void {
    this.emit({
      count: 1,
      lifetime: 2000,
      symbol: '❓',
      gravity: -0.01,
      spread: 0,
      initialVelocity: { x: 0, y: -0.5 },
    });
  }
}

/**
 * Floating symbol effect (for thinking, etc.)
 */
export class FloatingSymbol {
  private container: Container;
  private symbol: Text | null = null;
  private bobPhase = 0;
  private baseY = 0;

  constructor(parent: Container) {
    this.container = new Container();
    parent.addChild(this.container);
  }

  show(text: string, y: number = -50): void {
    this.hide();

    this.symbol = new Text({
      text,
      style: new TextStyle({
        fontSize: 24,
        fill: 0xffffff,
      }),
    });
    this.symbol.anchor.set(0.5);
    this.symbol.y = y;
    this.baseY = y;
    this.bobPhase = 0;

    this.container.addChild(this.symbol);
  }

  hide(): void {
    if (this.symbol) {
      this.container.removeChild(this.symbol);
      this.symbol.destroy();
      this.symbol = null;
    }
  }

  update(deltaMs: number): void {
    if (!this.symbol) return;

    // Gentle bobbing motion
    this.bobPhase += deltaMs * 0.003;
    this.symbol.y = this.baseY + Math.sin(this.bobPhase) * 5;
  }

  isVisible(): boolean {
    return this.symbol !== null;
  }
}
