import * as THREE from 'three';

export function createScene(): THREE.Scene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);
  return scene;
}

export function createLights(): THREE.Light[] {
  const ambient = new THREE.AmbientLight(0xffffff, 0.4);

  const directional = new THREE.DirectionalLight(0xffffff, 1.0);
  directional.position.set(5, 10, 7);
  directional.castShadow = true;

  const point = new THREE.PointLight(0xffd700, 0.6, 50);
  point.position.set(-3, 5, -3);

  return [ambient, directional, point];
}
