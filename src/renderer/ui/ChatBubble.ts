import { Container, Graphics, Text, TextStyle } from 'pixi.js';

/**
 * Speech/thought bubble component
 */
export class ChatBubble {
  private container: Container;
  private background: Graphics;
  private text: Text;
  private isVisible = false;
  private autoHideTimer: ReturnType<typeof setTimeout> | null = null;

  // Bubble configuration
  private readonly PADDING = 12;
  private readonly MAX_WIDTH = 150;
  private readonly TAIL_SIZE = 10;
  private readonly CORNER_RADIUS = 8;

  constructor(parent: Container) {
    this.container = new Container();
    this.container.visible = false;

    this.background = new Graphics();
    this.text = new Text({
      text: '',
      style: new TextStyle({
        fontSize: 12,
        fill: 0x333333,
        fontFamily: 'Arial, sans-serif',
        wordWrap: true,
        wordWrapWidth: this.MAX_WIDTH - this.PADDING * 2,
        align: 'center',
      }),
    });
    this.text.anchor.set(0.5, 0.5);

    this.container.addChild(this.background);
    this.container.addChild(this.text);

    parent.addChild(this.container);
  }

  /**
   * Show the bubble with text
   */
  show(message: string, duration: number = 3000): void {
    // Clear existing timer
    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer);
      this.autoHideTimer = null;
    }

    // Update text
    this.text.text = message;

    // Calculate bubble size
    const textBounds = this.text.getBounds();
    const bubbleWidth = Math.min(
      Math.max(textBounds.width + this.PADDING * 2, 60),
      this.MAX_WIDTH
    );
    const bubbleHeight = textBounds.height + this.PADDING * 2;

    // Draw bubble background
    this.drawBubble(bubbleWidth, bubbleHeight);

    // Position text in center
    this.text.x = 0;
    this.text.y = -bubbleHeight / 2 - this.TAIL_SIZE;

    // Position bubble above the character
    this.container.y = -80;
    this.container.visible = true;
    this.isVisible = true;

    // Fade in animation
    this.container.alpha = 0;
    this.fadeIn();

    // Auto-hide after duration
    if (duration > 0) {
      this.autoHideTimer = setTimeout(() => {
        this.hide();
      }, duration);
    }
  }

  /**
   * Hide the bubble
   */
  hide(): void {
    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer);
      this.autoHideTimer = null;
    }

    this.fadeOut();
  }

  private drawBubble(width: number, height: number): void {
    this.background.clear();

    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const y = -this.TAIL_SIZE;

    // Main bubble
    this.background.roundRect(
      -halfWidth,
      y - height,
      width,
      height,
      this.CORNER_RADIUS
    );
    this.background.fill({ color: 0xffffff });
    this.background.stroke({ color: 0xcccccc, width: 1 });

    // Speech tail (pointing down)
    this.background.moveTo(-5, y);
    this.background.lineTo(0, y + this.TAIL_SIZE);
    this.background.lineTo(5, y);
    this.background.fill({ color: 0xffffff });

    // Tail border (just the angled lines)
    this.background.moveTo(-5, y);
    this.background.lineTo(0, y + this.TAIL_SIZE);
    this.background.lineTo(5, y);
    this.background.stroke({ color: 0xcccccc, width: 1 });
  }

  private fadeIn(): void {
    const startTime = Date.now();
    const duration = 200;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      this.container.alpha = progress;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  private fadeOut(): void {
    const startTime = Date.now();
    const duration = 200;
    const startAlpha = this.container.alpha;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      this.container.alpha = startAlpha * (1 - progress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.container.visible = false;
        this.isVisible = false;
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Check if bubble is currently visible
   */
  getIsVisible(): boolean {
    return this.isVisible;
  }

  /**
   * Update (if animations needed)
   */
  update(_deltaMs: number): void {
    // Reserved for future animations
  }
}
