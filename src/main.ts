import { createScene, createLights } from './core/scene';
import { createCamera, createRenderer } from './core/camera';
import { PostProcessingManager } from './core/postprocessing';
import { createPyramid } from './domain/pyramid';
import { eventManager } from './domain/events';
import { applyEventToMesh } from './domain/applyEvent';
import { ChartPanel } from './domain/charts';
import { Visualization2D } from './domain/visualization2D';
import { MuonVectorVisualizer } from './domain/muonVector';
import { MuonDataLoader } from './domain/dataLoader';
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

  // Muon vector visualizer
  var muonVisualizer = new MuonVectorVisualizer(handles.group, 50);

  // Load real muon detector data
  var dataLoader = new MuonDataLoader();
  try {
    var { pedestal, geometry, adcMap } = await dataLoader.loadAll('/data/config');
    console.log('Loaded detector data:', { detector: geometry.detectorName, planes: geometry.planes.length });
    
    // Create real events from geometry data
    var realEvents = geometry.planes.map((plane, index) => ({
      id: index + 1,
      name: plane.name,
      energy: 100 + Math.random() * 1400, // Simulated energy
      intensity: 0.3 + Math.random() * 0.7,
      color: [
        plane.direction === 'X' ? 0.2 : 1.0,
        plane.direction === 'Y' ? 0.5 : 0.2,
        1.0
      ] as [number, number, number],
      emissive: [0.05, 0.1, 0.3] as [number, number, number],
      roughness: 0.5,
      metalness: 0.2,
      scale: 1.0,
      description: `Detector plane: ${plane.name} (${plane.startTriangle}), Z=${plane.zPosition}cm`
    }));

    // Load events into event manager
    await eventManager.loadFromData({
      title: `Muon Detector: ${geometry.detectorName}`,
      events: realEvents
    });

    // Create sample muon trajectories
    for (var i = 0; i < 5; i++) {
      var hits = [];
      for (var j = 0; j < geometry.planes.length; j++) {
        var plane = geometry.planes[j];
        hits.push({
          x: (Math.random() - 0.5) * 40,
          y: (Math.random() - 0.5) * 40,
          layer: j
        });
      }
      muonVisualizer.createTrajectory(hits);
    }
  } catch (error) {
    console.warn('Failed to load real data, falling back to sample:', error);
    await eventManager.load('/data/sample.json');
  }

  // Apply initial event
  var initial = eventManager.getCurrentEvent();
  if (initial) applyEventToMesh(handles.mesh, initial);

  // UI: ControlPanel
  var panel = new ControlPanel(layout.getPanelContainer());
  panel.populate();

  // UI: ChartPanel
  var chartPanel = new ChartPanel(layout.getPanelContainer());
  chartPanel.init();

  // UI: 2D Visualization
  var visualization2D = new Visualization2D(layout.get2DContainer());

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
