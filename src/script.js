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
// viz.earth.setClouds('clouds2k');
// viz.earth.setEarthNightlights('nightlights4k');
// viz.earth.setEarthColor('colorLarge');
// viz.earth.setStars('stars8k');
console.log("Earth radius: ", radius);
cameraControls.setLookAt(15000, 0, 0, 0, 0, 0);
viz.scene.add(new THREE.AxesHelper(radius * 1.5));
viz.directionalLight.position.set(1000, 1000, 0);

// Satellite
const params = {
  scale: 100,
  alt: 400,
  camera_dist: 10,
}
const scale = 100;
const satellite_ECI = new THREE.Group();  // control the ECI position, but maintain ECI axes
const satellite = new THREE.Group();      // set the oriention wrt ECI frame, position should remain 0, 0, 0 wrt satellite_ECI frame
let model;
viz.scene.add(satellite_ECI);
satellite_ECI.add(satellite);
satellite_ECI.position.set(radius + params.alt, 0, 0);
viz.addObject('satellite_ECI', satellite_ECI)
viz.addObject('satellite', satellite);
connection.loadGLTF('albedo-sat-simple.glb', 'satellite_model', 'satellite', (obj) => {
  console.log("Satellite model loaded!")
  model = obj;
  // viz.controls.fitToSphere(obj);
});
viz.addObject('sat_frame', new THREE.AxesHelper(2.0));
satellite.add(viz.getObject('sat_frame'));
viz.controls.setLookAt(radius + params.alt + params.camera_dist * params.scale, 800, 200, ...satellite.position);
satellite.scale.set(100, 100, 100);

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

}

// Add Camera controls
// viz.controls.fitToBox(model);
const controlButtons = {
  fitToSatellite: function () {
    const satellite_box = new THREE.Box3().setFromObject(viz.objects.satellite_model);
    viz.controls.fitToBox(satellite_box, 1);
  },
  fitToWorld: function () {

    viz.controls.fitToSphere(viz.earth.groundGeometry.boundingSphere, 1);
  },
}
viz.gui.add(controlButtons, 'fitToSatellite');
viz.gui.add(controlButtons, 'fitToWorld');


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
globalThis.satellite = satellite;