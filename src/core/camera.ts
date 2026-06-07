import * as THREE from 'three';

export function createCamera(): THREE.PerspectiveCamera {
  var camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(3, 2, 4);
  camera.lookAt(0, 0, 0);
  return camera;
}

export function createRenderer(container?: HTMLElement): THREE.WebGLRenderer {
  var renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  var target = container || document.body;
  target.appendChild(renderer.domElement);
  return renderer;
}