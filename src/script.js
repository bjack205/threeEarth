import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/Addons.js'
import CameraControls from 'camera-controls'
CameraControls.install({ THREE: THREE });

import Visualizer from './Visualizer/Visualizer'
import Connection from './Connection'

const canvas = document.querySelector('canvas.webgl')
const use_shadows = false;
const viz = new Visualizer(canvas, use_shadows);

// Connection
const connection = new Connection(viz, 'ws://localhost:8011');

// Set up scene
const scene = viz.scene; // new THREE.Scene();
viz.camera.position.set(0, 5, 0);
const cameraControls = viz.controls;

const mesh = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshLambertMaterial({ color: 0xff0000, wireframe: false })
);
scene.add(mesh);
mesh.castShadow = use_shadows;
mesh.position.z = 2;
cameraControls.setLookAt(2, 5, 3, 0, 0, 0);

scene.add(new THREE.AxesHelper())

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
connection.loadGLTF('models/albedo-sat-simple.glb', 'satellite', 'scene')

// Start rendering the visualizer
viz.run();

// make variable available to browser console
globalThis.THREE = THREE;
globalThis.camera = viz.camera;
globalThis.cameraControls = viz.controls;
globalThis.mesh = mesh;