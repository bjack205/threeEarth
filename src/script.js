import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/Addons.js'
import CameraControls from 'camera-controls'
CameraControls.install({ THREE: THREE });

import Visualizer from './Visualizer/Visualizer'
import Connection from './Connection'

// Visualizer
const canvas = document.querySelector('canvas.webgl')
const use_shadows = true;
const viz = new Visualizer(canvas, use_shadows);
const cameraControls = viz.controls;

// Connection
const connection = new Connection(viz, 'ws://localhost:8001');

// Earth
const radius = viz.earth.getEarthRadius();
console.log("Earth radius: ", radius);
cameraControls.setLookAt(15000, 0, 0, 7000, 0, 0);

// Set up scene
const test_scene = false;
if (test_scene) {
  const scene = viz.scene; // new THREE.Scene();
  // viz.camera.position.set(5000, 10000, 7000);

  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshLambertMaterial({ color: 0xff0000, wireframe: false })
  );
  mesh.name = "box";
  viz.objects['box'] = mesh;
  scene.add(mesh);
  mesh.castShadow = use_shadows;
  mesh.position.z = 2;

  const axes = new THREE.AxesHelper();
  viz.objects['axes'] = axes;
  scene.add(axes)

  if (use_shadows) {
    viz.directionalLight.shadow.camera.left = -10
    viz.directionalLight.shadow.camera.right = +10
    viz.directionalLight.shadow.camera.top = -10
    viz.directionalLight.shadow.camera.bottom = +10
    viz.directionalLight.shadow.camera.updateProjectionMatrix()
    scene.add(new THREE.CameraHelper(viz.directionalLight.shadow.camera));
  }

  // Floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshLambertMaterial({ color: 0x333333, wireframe: false })
  );
  floor.receiveShadow = use_shadows;
  scene.add(floor);

  // GLTF Model
  connection.loadGLTF('albedo-sat-simple.glb', 'satellite', 'scene');
}

// // Animation system
// THREE.InterpolateSmooth
// console.log("Let's try some animation stuff")
// const number_kf = new THREE.NumberKeyframeTrack("box.position[z]", [0, 3, 6], [10, 5, 4], THREE.InterpolateSmooth);

// const clip = new THREE.AnimationClip("test", -1, [number_kf]);
// console.log("Clip duration: ", clip.duration)

// viz.mixer = new THREE.AnimationMixer(scene);
// viz.update_mixer = true;
// let action = viz.loadAnimation(clip);
// let action = viz.setClip(clip);
// console.log("Action loop: ", action.loop);
// action.play();

// let gui = viz.gui;
// let gui_anim = gui.addFolder('Animation')
// gui_anim.add(action, 'play')
// gui_anim.add(action, 'reset')
// gui_anim.add(action, 'stop')
// gui_anim.add(action, 'paused')
// gui_anim.add(action, 'enabled')
// gui_anim.add(action, 'timeScale').min(-2).max(5).step(0.1)
// gui.add(action, 'time').min(0).max(clip.duration).step(0.1)
// console.log(clip.toJSON())

// Start rendering the visualizer
viz.run();


// make variable available to browser console
globalThis.THREE = THREE;
globalThis.camera = viz.camera;
globalThis.cameraControls = viz.controls;
globalThis.viz = viz;