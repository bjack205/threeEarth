import { update } from 'three/examples/jsm/libs/tween.module.js'
import Visualizer from './Visualizer/Visualizer'
import Connection from './Connection'
import * as THREE from 'three'

import { MTLLoader } from 'three/addons/loaders/MTLLoader.js'
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { ColladaLoader } from 'three/addons/loaders/ColladaLoader.js'
import { GLTFLoader } from 'three/examples/jsm/Addons.js'
import CameraControls from 'camera-controls'
import { errorMonitor } from 'ws'

// Canvas
const canvas = document.querySelector('canvas.webgl')

// let scene, camera, renderer;

// camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 20);
// camera.position.z = 2.5;

// // scene
// scene = new THREE.Scene();

// const ambientLight = new THREE.AmbientLight(0xffffff);
// scene.add(ambientLight);

// const pointLight = new THREE.PointLight(0xffffff, 15);
// camera.add(pointLight);
// scene.add(camera);


//

// renderer = new THREE.WebGLRenderer({ antialias: true });
// renderer.setPixelRatio(window.devicePixelRatio);
// renderer.setSize(window.innerWidth, window.innerHeight);
// renderer.setAnimationLoop(animate);
// document.body.appendChild(renderer.domElement);

// // Controls
// const controls = new OrbitControls(camera, renderer.domElement);
// // controls.minDistance = 2;
// // controls.maxDistance = 5;


// // Axes Helper
// const axes = new THREE.AxesHelper();
// scene.add(axes);

// // Event Listeners
// window.addEventListener('resize', onWindowResize);


// function onWindowResize() {

//   camera.aspect = window.innerWidth / window.innerHeight;
//   camera.updateProjectionMatrix();

//   renderer.setSize(window.innerWidth, window.innerHeight);

// }

// //

// function animate() {

//   renderer.render(scene, camera);

// }

// Vizualizer
const viz = new Visualizer(canvas)
let addEarth = true;
if (addEarth) {
  viz.addEarth({ color: 'basic' })
  viz.earth.setEarthColor('colorSmall')
  viz.earth.setStars('stars4k')

  // Add disk on the Earth
  const earthRadius = viz.earth.getEarthRadius()
  // const target = viz.tools.newTargetDisk(earthRadius, 100, 0, 0)
  // viz.world.add(target.mesh)
  // const targetGui = viz.gui.addFolder('Target')
  // viz.tools.addTargetDebug(targetGui, target)

  // Ellipse
  console.log("ellipse at ", earthRadius + 300)
  const orbit = viz.tools.addOrbit(earthRadius + 300, 0, 0)
  viz.world.add(orbit.mesh)
  const ellipseGui = viz.gui.addFolder('Orbit')
  viz.tools.addEllipseDebug(ellipseGui, orbit)
}

// GLTF Model
let satelliteGroup = new THREE.Group()
const gltfLoader = new GLTFLoader()
let satModel
gltfLoader.load(
  // 'models/albedo-sat-simple.glb',
  'models/hubble.glb',
  (gltf) => {
    console.log("Loaded Albedo GLTF Model")
    console.log(gltf)
    satelliteGroup.add(gltf.scene)
  },
  (progress) => {
    console.log('progress')
    console.log(progress)
  },
  (error) => {
    console.log('error')
    console.log(error)
  }
)
viz.scene.add(satelliteGroup)
let altitude = 6671
satelliteGroup.position.x = altitude
const fov = 75
const aspectRatio = viz.sizes.width / viz.sizes.height
const near = 50
const far = 40000
const satCamera = new THREE.PerspectiveCamera(fov, aspectRatio, near, far)
satCamera.position.x = 10
viz.objects["satellite"] = satelliteGroup

const satControls = new CameraControls(satCamera, viz.canvas)
satControls.setLookAt(0, 0, 0)
// satControls.fitToSphere(satModel)
satelliteGroup.add(satCamera)
satelliteGroup.add(new THREE.AxesHelper(3))

// Camera Cone
const cone = viz.tools.newCone(300, 30)
cone.mesh.position.x = 0
satelliteGroup.add(cone.mesh)
const coneGui = viz.gui.addFolder('Camera Cone')
viz.tools.addConeDebug(coneGui, cone)
console.log(cone)
console.log("Get sat:", viz.getObject({ "key": "satellite" }))

// Satellite Debug
let satDebug = viz.gui.addFolder('Satellite')
satDebug.add(satelliteGroup.rotation, 'x').min(-Math.PI).max(Math.PI).step(Math.PI / 180)

// Connection
const connection = new Connection(viz, 'ws://localhost:8011')

// viz.camera = satCamera
// viz.controls = satControls
viz.camera.position.x = altitude + 1
console.log(satelliteGroup.position)
viz.controls.setLookAt(altitude + 10, 0, 0, altitude, 0, 0, true)
viz.update()