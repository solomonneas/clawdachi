import { Container, Sprite, Texture, Assets } from 'pixi.js';
import { SpriteLayer } from '../../shared/types';

/**
 * Layer configuration for sprite compositing
 */
interface LayerConfig {
  name: SpriteLayer;
  zIndex: number;
  visible: boolean;
}

const LAYER_ORDER: LayerConfig[] = [
  { name: 'body', zIndex: 0, visible: true },
  { name: 'outfit', zIndex: 1, visible: true },
  { name: 'face', zIndex: 2, visible: true },
  { name: 'accessory', zIndex: 3, visible: false },
  { name: 'effect', zIndex: 4, visible: true },
];

/**
 * Manages layered sprite composition
 */
export class LayerManager {
  private container: Container;
  private layers: Map<SpriteLayer, Container>;

  constructor(parent: Container) {
    this.container = new Container();
    this.container.sortableChildren = true;
    this.layers = new Map();

    // Create layer containers
    for (const config of LAYER_ORDER) {
      const layer = new Container();
      layer.zIndex = config.zIndex;
      layer.visible = config.visible;
      this.layers.set(config.name, layer);
      this.container.addChild(layer);
    }

    parent.addChild(this.container);
  }

  /**
   * Get a layer container by name
   */
  getLayer(name: SpriteLayer): Container | undefined {
    return this.layers.get(name);
  }

  /**
   * Add a sprite to a layer
   */
  addToLayer(name: SpriteLayer, sprite: Sprite | Container): void {
    const layer = this.layers.get(name);
    if (layer) {
      layer.addChild(sprite);
    }
  }

  /**
   * Clear all sprites from a layer
   */
  clearLayer(name: SpriteLayer): void {
    const layer = this.layers.get(name);
    if (layer) {
      layer.removeChildren();
    }
  }

  /**
   * Show or hide a layer
   */
  setLayerVisible(name: SpriteLayer, visible: boolean): void {
    const layer = this.layers.get(name);
    if (layer) {
      layer.visible = visible;
    }
  }

  /**
   * Load a texture and create a sprite on a layer
   */
  async loadSprite(layerName: SpriteLayer, texturePath: string): Promise<Sprite> {
    const texture = await Assets.load(texturePath);
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    this.addToLayer(layerName, sprite);
    return sprite;
  }

  /**
   * Swap the sprite on a layer with a new texture
   */
  async swapTexture(layerName: SpriteLayer, texturePath: string): Promise<void> {
    const layer = this.layers.get(layerName);
    if (!layer || layer.children.length === 0) return;

    const sprite = layer.children[0] as Sprite;
    if (sprite && sprite.texture) {
      const newTexture = await Assets.load(texturePath);
      sprite.texture = newTexture;
    }
  }

  /**
   * Get the main container
   */
  getContainer(): Container {
    return this.container;
  }
}

/**
 * Sprite sheet frame manager
 */
export class FrameManager {
  private textures: Map<string, Texture>;
  private currentFrame: Map<SpriteLayer, string>;

  constructor() {
    this.textures = new Map();
    this.currentFrame = new Map();
  }

  /**
   * Load a sprite sheet atlas
   */
  async loadAtlas(atlasPath: string): Promise<void> {
    const atlas = await Assets.load(atlasPath);

    // Atlas should be a spritesheet with named textures
    if (atlas.textures) {
      for (const [name, texture] of Object.entries(atlas.textures)) {
        this.textures.set(name, texture as Texture);
      }
    }
  }

  /**
   * Get a texture by frame name
   */
  getTexture(frameName: string): Texture | undefined {
    return this.textures.get(frameName);
  }

  /**
   * Set the current frame for a layer
   */
  setFrame(layer: SpriteLayer, frameName: string): Texture | undefined {
    this.currentFrame.set(layer, frameName);
    return this.textures.get(frameName);
  }

  /**
   * Get current frame name for a layer
   */
  getCurrentFrame(layer: SpriteLayer): string | undefined {
    return this.currentFrame.get(layer);
  }
}
