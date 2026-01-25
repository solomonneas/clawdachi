import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Expression } from '../../shared/types';
import { ANIMATION } from '../../shared/constants';

/**
 * Main character sprite container
 * Manages body, face, outfit layers and effects
 */
export class Clawdachi {
  public container: Container;

  private body: Graphics;
  private face: Container;
  private eyes: { left: Graphics; right: Graphics };
  private mouth: Graphics;
  private thoughtBubble: Container | null = null;

  // Animation state
  private breathPhase = 0;
  private blinkTimer = 0;
  private nextBlinkTime = 0;
  private isBlinking = false;
  private bounceVelocity = 0;
  private expression: Expression = 'neutral';

  // Size constants
  private readonly BODY_WIDTH = 80;
  private readonly BODY_HEIGHT = 100;

  constructor() {
    this.container = new Container();
    this.body = new Graphics();
    this.face = new Container();
    this.eyes = { left: new Graphics(), right: new Graphics() };
    this.mouth = new Graphics();
  }

  async init(): Promise<void> {
    // Build the character from graphics primitives
    // (Will be replaced with sprite sheets later)
    this.createBody();
    this.createFace();

    // Add layers in order (back to front)
    this.container.addChild(this.body);
    this.container.addChild(this.face);

    // Set initial blink timer
    this.scheduleNextBlink();
  }

  private createBody(): void {
    const g = this.body;
    g.clear();

    // Main body (rounded rectangle, Claude purple-ish)
    g.roundRect(
      -this.BODY_WIDTH / 2,
      -this.BODY_HEIGHT / 2,
      this.BODY_WIDTH,
      this.BODY_HEIGHT,
      20
    );
    g.fill({ color: 0xd4a574 }); // Warm tan color

    // Belly highlight
    g.ellipse(0, 10, 25, 30);
    g.fill({ color: 0xf5deb3 }); // Lighter belly
  }

  private createFace(): void {
    this.face.y = -15; // Position face on upper body

    // Create eyes
    this.drawEyes();
    this.face.addChild(this.eyes.left);
    this.face.addChild(this.eyes.right);

    // Create mouth
    this.drawMouth();
    this.face.addChild(this.mouth);
  }

  private drawEyes(): void {
    const eyeSize = 8;
    const eyeSpacing = 20;
    const pupilSize = 4;

    // Left eye
    this.eyes.left.clear();
    this.eyes.left.x = -eyeSpacing / 2;

    // Eye white
    this.eyes.left.circle(0, 0, eyeSize);
    this.eyes.left.fill({ color: 0xffffff });
    this.eyes.left.stroke({ color: 0x333333, width: 1 });

    // Pupil
    this.eyes.left.circle(0, 0, pupilSize);
    this.eyes.left.fill({ color: 0x333333 });

    // Right eye
    this.eyes.right.clear();
    this.eyes.right.x = eyeSpacing / 2;

    this.eyes.right.circle(0, 0, eyeSize);
    this.eyes.right.fill({ color: 0xffffff });
    this.eyes.right.stroke({ color: 0x333333, width: 1 });

    this.eyes.right.circle(0, 0, pupilSize);
    this.eyes.right.fill({ color: 0x333333 });
  }

  private drawMouth(): void {
    this.mouth.clear();
    this.mouth.y = 15;

    // Simple smile
    this.mouth.moveTo(-10, 0);
    this.mouth.quadraticCurveTo(0, 8, 10, 0);
    this.mouth.stroke({ color: 0x333333, width: 2 });
  }

  /**
   * Update called every frame
   */
  update(deltaMs: number): void {
    this.updateBreathing(deltaMs);
    this.updateBlinking(deltaMs);
    this.updateBounce(deltaMs);
  }

  private updateBreathing(deltaMs: number): void {
    this.breathPhase += deltaMs / ANIMATION.BREATH_CYCLE * Math.PI * 2;
    if (this.breathPhase > Math.PI * 2) {
      this.breathPhase -= Math.PI * 2;
    }

    // Subtle scale animation
    const breathScale = 1 + Math.sin(this.breathPhase) * 0.02;
    this.body.scale.y = breathScale;
  }

  private updateBlinking(deltaMs: number): void {
    this.blinkTimer += deltaMs;

    if (this.isBlinking) {
      // Currently blinking, check if blink is done
      if (this.blinkTimer >= ANIMATION.BLINK_DURATION) {
        this.isBlinking = false;
        this.eyes.left.scale.y = 1;
        this.eyes.right.scale.y = 1;
        this.scheduleNextBlink();
      }
    } else {
      // Check if it's time to blink
      if (this.blinkTimer >= this.nextBlinkTime) {
        this.isBlinking = true;
        this.blinkTimer = 0;
        this.eyes.left.scale.y = 0.1;
        this.eyes.right.scale.y = 0.1;
      }
    }
  }

  private scheduleNextBlink(): void {
    this.blinkTimer = 0;
    this.nextBlinkTime =
      ANIMATION.BLINK_INTERVAL_MIN +
      Math.random() * (ANIMATION.BLINK_INTERVAL_MAX - ANIMATION.BLINK_INTERVAL_MIN);
  }

  private updateBounce(deltaMs: number): void {
    if (this.bounceVelocity !== 0) {
      // Apply velocity
      this.container.y += this.bounceVelocity * (deltaMs / 16);

      // Apply gravity
      this.bounceVelocity += 0.5 * (deltaMs / 16);

      // Check if landed
      if (this.container.y >= 125) { // Original position
        this.container.y = 125;
        this.bounceVelocity = 0;
      }
    }
  }

  /**
   * Play bounce animation (after being dropped)
   */
  playBounce(): void {
    this.bounceVelocity = -5;
  }

  /**
   * Play hearts particle effect
   */
  playHearts(): void {
    // Simple heart symbols floating up
    for (let i = 0; i < 5; i++) {
      setTimeout(() => this.spawnHeart(), i * 100);
    }
  }

  private spawnHeart(): void {
    const heart = new Text({
      text: '❤',
      style: new TextStyle({
        fontSize: 16,
        fill: 0xff6b6b,
      }),
    });

    heart.x = (Math.random() - 0.5) * 60;
    heart.y = -40;
    heart.alpha = 1;

    this.container.addChild(heart);

    // Animate upward and fade
    const startY = heart.y;
    const startTime = Date.now();
    const duration = 1000;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      heart.y = startY - progress * 50;
      heart.alpha = 1 - progress;
      heart.x += (Math.random() - 0.5) * 2;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.container.removeChild(heart);
        heart.destroy();
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Show a thought bubble with text
   */
  showThought(text: string): void {
    this.hideThought();

    const bubble = new Container();
    bubble.y = -80;

    // Bubble background
    const bg = new Graphics();
    bg.roundRect(-40, -15, 80, 30, 10);
    bg.fill({ color: 0xffffff });
    bg.stroke({ color: 0x333333, width: 1 });

    // Bubble tail
    bg.moveTo(-5, 15);
    bg.lineTo(0, 25);
    bg.lineTo(5, 15);
    bg.fill({ color: 0xffffff });

    bubble.addChild(bg);

    // Text
    const label = new Text({
      text: text.slice(0, 10), // Truncate long names
      style: new TextStyle({
        fontSize: 12,
        fill: 0x333333,
        fontFamily: 'Arial',
      }),
    });
    label.anchor.set(0.5);
    bubble.addChild(label);

    this.thoughtBubble = bubble;
    this.container.addChild(bubble);

    // Auto-hide after 3 seconds
    setTimeout(() => this.hideThought(), 3000);
  }

  hideThought(): void {
    if (this.thoughtBubble) {
      this.container.removeChild(this.thoughtBubble);
      this.thoughtBubble.destroy();
      this.thoughtBubble = null;
    }
  }

  /**
   * Set facial expression
   */
  setExpression(expression: Expression): void {
    this.expression = expression;
    this.updateFaceForExpression();
  }

  private updateFaceForExpression(): void {
    // Redraw mouth based on expression
    this.mouth.clear();
    this.mouth.y = 15;

    switch (this.expression) {
      case 'happy':
      case 'excited':
        // Big smile
        this.mouth.moveTo(-12, 0);
        this.mouth.quadraticCurveTo(0, 12, 12, 0);
        this.mouth.stroke({ color: 0x333333, width: 2 });
        break;

      case 'focused':
        // Straight line
        this.mouth.moveTo(-8, 2);
        this.mouth.lineTo(8, 2);
        this.mouth.stroke({ color: 0x333333, width: 2 });
        break;

      case 'confused':
        // Wavy line
        this.mouth.moveTo(-10, 0);
        this.mouth.quadraticCurveTo(-5, 5, 0, 0);
        this.mouth.quadraticCurveTo(5, -5, 10, 0);
        this.mouth.stroke({ color: 0x333333, width: 2 });
        break;

      case 'nervous':
        // Worried smile
        this.mouth.moveTo(-10, 5);
        this.mouth.quadraticCurveTo(0, -2, 10, 5);
        this.mouth.stroke({ color: 0x333333, width: 2 });
        break;

      case 'sleepy':
        // Small o
        this.mouth.circle(0, 2, 4);
        this.mouth.stroke({ color: 0x333333, width: 2 });
        break;

      default: // neutral
        this.mouth.moveTo(-10, 0);
        this.mouth.quadraticCurveTo(0, 8, 10, 0);
        this.mouth.stroke({ color: 0x333333, width: 2 });
    }
  }

  /**
   * Track cursor with eyes
   */
  lookAt(x: number, y: number): void {
    const maxOffset = 3;

    // Calculate direction to cursor
    const dx = x - this.container.x;
    const dy = y - this.container.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      const offsetX = (dx / dist) * maxOffset;
      const offsetY = (dy / dist) * maxOffset;

      // Move pupils (they're drawn centered, so we offset the whole eye graphic)
      // This is a simplified version; with sprites we'd move just the pupil layer
    }
  }
}
