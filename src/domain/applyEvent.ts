import * as THREE from 'three';
import type { EventData } from './events';

const _color = new THREE.Color();

export function applyEventToMesh(mesh: THREE.Mesh, event: EventData): void {
  const mat = mesh.material as THREE.MeshStandardMaterial;

  _color.setRGB(...event.color);
  mat.color.copy(_color);

  _color.setRGB(...event.emissive);
  mat.emissive.copy(_color);

  mat.roughness = event.roughness;
  mat.metalness = event.metalness;
  mat.needsUpdate = true;

  const s = event.scale;
  mesh.scale.set(s, s, s);
}