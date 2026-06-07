import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export interface PostProcessingState {
  bloomEnabled: boolean;
  bloomStrength: number;
  bloomRadius: number;
  bloomThreshold: number;
  toneMapping: THREE.ToneMapping;
  toneMappingExposure: number;
}

export const DEFAULT_POST_STATE: PostProcessingState = {
  bloomEnabled: false,
  bloomStrength: 0.6,
  bloomRadius: 0.4,
  bloomThreshold: 0.85,
  toneMapping: THREE.ACESFilmicToneMapping,
  toneMappingExposure: 1.0,
};

export class PostProcessingManager {
  private composer: EffectComposer;
  private bloomPass: UnrealBloomPass;
  private renderer: THREE.WebGLRenderer;
  private state: PostProcessingState;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    initialState?: Partial<PostProcessingState>
  ) {
    this.renderer = renderer;
    this.state = { ...DEFAULT_POST_STATE, ...initialState };

    var size = renderer.getSize(new THREE.Vector2());
    this.composer = new EffectComposer(renderer);

    var renderPass = new RenderPass(scene, camera);
    this.composer.addPass(renderPass);

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.x, size.y),
      this.state.bloomStrength,
      this.state.bloomRadius,
      this.state.bloomThreshold
    );
    this.bloomPass.enabled = this.state.bloomEnabled;
    this.composer.addPass(this.bloomPass);

    this.applyRendererState();
  }

  render(scene: THREE.Scene, camera: THREE.Camera): void {
    if (this.bloomPass.enabled) {
      this.composer.render();
    } else {
      this.renderer.render(scene, camera);
    }
  }

  resize(width: number, height: number): void {
    this.composer.setSize(width, height);
    this.renderer.setSize(width, height);
  }

  setBloomEnabled(enabled: boolean): void {
    this.state.bloomEnabled = enabled;
    this.bloomPass.enabled = enabled;
  }

  setBloomStrength(value: number): void {
    this.state.bloomStrength = value;
    this.bloomPass.strength = value;
  }

  setBloomRadius(value: number): void {
    this.state.bloomRadius = value;
    this.bloomPass.radius = value;
  }

  setBloomThreshold(value: number): void {
    this.state.bloomThreshold = value;
    this.bloomPass.threshold = value;
  }

  setToneMapping(mapping: THREE.ToneMapping): void {
    this.state.toneMapping = mapping;
    this.renderer.toneMapping = mapping;
  }

  setToneMappingExposure(value: number): void {
    this.state.toneMappingExposure = value;
    this.renderer.toneMappingExposure = value;
  }

  applyState(partial: Partial<PostProcessingState>): void {
    if (partial.bloomEnabled !== undefined) this.setBloomEnabled(partial.bloomEnabled);
    if (partial.bloomStrength !== undefined) this.setBloomStrength(partial.bloomStrength);
    if (partial.bloomRadius !== undefined) this.setBloomRadius(partial.bloomRadius);
    if (partial.bloomThreshold !== undefined) this.setBloomThreshold(partial.bloomThreshold);
    if (partial.toneMapping !== undefined) this.setToneMapping(partial.toneMapping);
    if (partial.toneMappingExposure !== undefined) this.setToneMappingExposure(partial.toneMappingExposure);
  }

  reset(): void {
    this.applyState(DEFAULT_POST_STATE);
  }

  getState(): PostProcessingState {
    return { ...this.state };
  }

  private applyRendererState(): void {
    this.renderer.toneMapping = this.state.toneMapping;
    this.renderer.toneMappingExposure = this.state.toneMappingExposure;
  }

  dispose(): void {
    this.composer.dispose();
  }
}