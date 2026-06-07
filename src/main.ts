import { createScene, createLights } from './core/scene';
import { createCamera, createRenderer } from './core/camera';
import { PostProcessingManager } from './core/postprocessing';
import { createPyramid } from './domain/pyramid';
import { eventManager } from './domain/events';
import { applyEventToMesh } from './domain/applyEvent';
import { ChartPanel } from './domain/charts';
import { Layout } from './ui/Layout';
import { ControlPanel } from './ui/ControlPanel';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as THREE from 'three';

async function init() {
  // Layout
  var layout = new Layout();
  layout.mount();

  var scene = createScene();
  var camera = createCamera();
  var renderer = createRenderer(layout.getCanvasContainer());

  // Post-processing
  var post = new PostProcessingManager(renderer, scene, camera);

  // Size renderer to canvas container
  function resizeRenderer() {
    var container = layout.getCanvasContainer();
    var w = container.clientWidth;
    var h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    post.resize(w, h);
  }
  resizeRenderer();

  // OrbitControls
  var controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 2;
  controls.maxDistance = 20;

  // Lights
  var lights = createLights();
  for (var i = 0; i < lights.length; i++) scene.add(lights[i]);

  // Pyramid model
  var handles = await createPyramid();
  scene.add(handles.group);

  // Load event data
  await eventManager.load('/data/sample.json');

  // Apply initial event
  var initial = eventManager.getCurrentEvent();
  if (initial) applyEventToMesh(handles.mesh, initial);

  // UI: ControlPanel
  var panel = new ControlPanel(layout.getPanelContainer());
  panel.populate();

  // UI: ChartPanel
  var chartPanel = new ChartPanel(layout.getPanelContainer());
  chartPanel.init();

  // Sync scene on event change
  eventManager.onChange(function(event) {
    applyEventToMesh(handles.mesh, event);
    applyControls(panel.getControls());
  });

  // Sync scene on control change
  function applyControls(ctrl: { showModel: boolean; wireframe: boolean; skybox: boolean; acceptanceRange: number }) {
    handles.mesh.visible = ctrl.showModel;
    handles.ground.visible = ctrl.showModel;
    var mat = handles.mesh.material as THREE.MeshStandardMaterial;
    mat.wireframe = ctrl.wireframe;
    handles.skybox.visible = ctrl.skybox;
    if (ctrl.skybox) {
      scene.background = null;
    } else {
      scene.background = new THREE.Color(0x1a1a2e);
    }
    var evt = eventManager.getCurrentEvent();
    if (evt) {
      var maxEnergy = 1500;
      var threshold = (ctrl.acceptanceRange / 100) * maxEnergy;
      var inRange = evt.energy <= threshold;
      mat.opacity = inRange ? 1.0 : 0.15;
      mat.transparent = !inRange;
    }
  }

  panel.onChange(function(ctrl) { applyControls(ctrl); });
  applyControls(panel.getControls());

  // Sync post-processing from panel
  panel.onPostChange(function(state) {
    post.applyState(state);
  });

  // Reset handler: restore all defaults
  panel.onReset(function() {
    post.reset();
    applyControls(panel.getControls());
  });

  // Resize handler
  window.addEventListener('resize', resizeRenderer);
  var ro = new ResizeObserver(resizeRenderer);
  ro.observe(layout.getCanvasContainer());

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    post.render(scene, camera);
  }
  animate();
}

init().catch(function(err) { console.error('Init failed:', err); });