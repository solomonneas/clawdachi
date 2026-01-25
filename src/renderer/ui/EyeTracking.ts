import { Container, Graphics } from 'pixi.js';

/**
 * Eye configuration for tracking
 */
interface EyeConfig {
  x: number;        // Eye center X offset from face
  y: number;        // Eye center Y offset from face
  radius: number;   // Eye socket radius
  pupilRadius: number;
  maxOffset: number; // Max pupil movement
}

/**
 * Eye tracking component that follows cursor position
 */
export class EyeTracking {
  private container: Container;
  private leftEye: { socket: Graphics; pupil: Graphics };
  private rightEye: { socket: Graphics; pupil: Graphics };
  private config: EyeConfig;

  // Smoothing for eye movement
  private targetPupilOffset = { x: 0, y: 0 };
  private currentPupilOffset = { x: 0, y: 0 };
  private smoothing = 0.15;

  // Blink state
  private isBlinking = false;

  constructor(parent: Container, config?: Partial<EyeConfig>) {
    this.config = {
      x: 10,          // Distance from center to each eye
      y: -15,         // Vertical position on face
      radius: 8,
      pupilRadius: 4,
      maxOffset: 3,
      ...config,
    };

    this.container = new Container();

    // Create eyes
    this.leftEye = this.createEye(-this.config.x, this.config.y);
    this.rightEye = this.createEye(this.config.x, this.config.y);

    parent.addChild(this.container);
  }

  private createEye(x: number, y: number): { socket: Graphics; pupil: Graphics } {
    const socket = new Graphics();
    socket.circle(0, 0, this.config.radius);
    socket.fill({ color: 0xffffff });
    socket.stroke({ color: 0x333333, width: 1 });
    socket.x = x;
    socket.y = y;

    const pupil = new Graphics();
    pupil.circle(0, 0, this.config.pupilRadius);
    pupil.fill({ color: 0x333333 });

    socket.addChild(pupil);
    this.container.addChild(socket);

    return { socket, pupil };
  }

  /**
   * Update eyes to look toward a point
   * @param targetX Global X position to look at
   * @param targetY Global Y position to look at
   * @param containerX Container's global X position
   * @param containerY Container's global Y position
   */
  lookAt(targetX: number, targetY: number, containerX: number, containerY: number): void {
    // Calculate direction from character to target
    const dx = targetX - containerX;
    const dy = targetY - containerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      // Normalize and scale to max offset
      const normalizedX = dx / distance;
      const normalizedY = dy / distance;

      // Closer targets = less offset (they're looking down at something close)
      const distanceFactor = Math.min(distance / 200, 1);

      this.targetPupilOffset.x = normalizedX * this.config.maxOffset * distanceFactor;
      this.targetPupilOffset.y = normalizedY * this.config.maxOffset * distanceFactor;
    } else {
      this.targetPupilOffset.x = 0;
      this.targetPupilOffset.y = 0;
    }
  }

  /**
   * Reset eyes to center position
   */
  resetLook(): void {
    this.targetPupilOffset.x = 0;
    this.targetPupilOffset.y = 0;
  }

  /**
   * Trigger a blink
   */
  blink(): void {
    if (this.isBlinking) return;

    this.isBlinking = true;

    // Close eyes
    this.leftEye.socket.scale.y = 0.1;
    this.rightEye.socket.scale.y = 0.1;

    // Open after short delay
    setTimeout(() => {
      this.leftEye.socket.scale.y = 1;
      this.rightEye.socket.scale.y = 1;
      this.isBlinking = false;
    }, 150);
  }

  /**
   * Update eye positions (smooth interpolation)
   */
  update(deltaMs: number): void {
    // Smooth interpolation toward target
    const factor = Math.min(this.smoothing * (deltaMs / 16), 1);

    this.currentPupilOffset.x += (this.targetPupilOffset.x - this.currentPupilOffset.x) * factor;
    this.currentPupilOffset.y += (this.targetPupilOffset.y - this.currentPupilOffset.y) * factor;

    // Apply to pupils
    this.leftEye.pupil.x = this.currentPupilOffset.x;
    this.leftEye.pupil.y = this.currentPupilOffset.y;
    this.rightEye.pupil.x = this.currentPupilOffset.x;
    this.rightEye.pupil.y = this.currentPupilOffset.y;
  }

  /**
   * Set wide-eyed expression (surprise/excitement)
   */
  setWideEyed(wide: boolean): void {
    const scale = wide ? 1.2 : 1;
    this.leftEye.socket.scale.set(scale);
    this.rightEye.socket.scale.set(scale);
  }

  /**
   * Set sleepy expression (droopy eyes)
   */
  setSleepy(sleepy: boolean): void {
    const scaleY = sleepy ? 0.6 : 1;
    this.leftEye.socket.scale.y = scaleY;
    this.rightEye.socket.scale.y = scaleY;
  }

  /**
   * Get container for positioning
   */
  getContainer(): Container {
    return this.container;
  }
}
