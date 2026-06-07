import * as THREE from 'three';
import { loadSTL, loadTexture } from '../core/loaders';

export interface PyramidHandles {
  group: THREE.Group;
  mesh: THREE.Mesh;
  ground: THREE.Mesh;
  skybox: THREE.Mesh;
}

function createSkyboxMesh(): THREE.Mesh {
  var geo = new THREE.SphereGeometry(80, 32, 16);
  // Flip normals inward so we see the inside
  geo.scale(-1, 1, 1);
  var mat = new THREE.MeshBasicMaterial({
    color: 0x0a0a1a,
    side: THREE.BackSide,
    transparent: true,
    opacity: 1.0,
  });
  var mesh = new THREE.Mesh(geo, mat);
  mesh.visible = false;
  mesh.name = 'skybox';
  return mesh;
}

export async function createPyramid(): Promise<PyramidHandles> {
  var group = new THREE.Group();

  var geometry = await loadSTL('/assets/models/pyramid.stl');
  var texture = await loadTexture('/assets/images/pyramid.jpeg');

  geometry.computeVertexNormals();

  // Center the geometry
  geometry.computeBoundingBox();
  var box = geometry.boundingBox!;
  var center = new THREE.Vector3();
  box.getCenter(center);
  geometry.translate(-center.x, -center.y, -center.z);

  var material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.5,
    metalness: 0.2,
  });

  var mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  // Ground plane
  var planeGeo = new THREE.PlaneGeometry(10, 10);
  var planeMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a3e,
    roughness: 0.8,
  });
  var ground = new THREE.Mesh(planeGeo, planeMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -box.getSize(new THREE.Vector3()).y / 2;
  ground.receiveShadow = true;
  group.add(ground);

  // Skybox
  var skybox = createSkyboxMesh();
  group.add(skybox);

  return { group, mesh, ground, skybox };
}