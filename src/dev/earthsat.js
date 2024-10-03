
import { update } from 'three/examples/jsm/libs/tween.module.js'
import Visualizer from './Visualizer/Visualizer'
import Connection from './Connection'
import * as THREE from 'three'
import { v4 as uuidv4 } from 'uuid';

import { ObjectLoader, MaterialLoader, BufferGeometryLoader } from 'three';
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
let altitude = 0;
let addEarth = false;
if (addEarth) {
  // viz.addEarth({ color: 'basic' })
  viz.addEarth()
  viz.earth.setEarthColor('colorSmall')
  viz.earth.setStars('stars4k')

  // Add disk on the Earth
  const earthRadius = viz.earth.getEarthRadius()
  // const target = viz.tools.newTargetDisk(earthRadius, 100, 0, 0)
  // viz.world.add(target.mesh)
  // const targetGui = viz.gui.addFolder('Target')
  // viz.tools.addTargetDebug(targetGui, target)

  altitude = 6671

  // Ellipse
  console.log("ellipse at ", earthRadius + 300)
  const orbit = viz.tools.addOrbit(earthRadius + 300, 0, 0)
  viz.world.add(orbit.mesh)
  const ellipseGui = viz.gui.addFolder('Orbit')
  viz.tools.addEllipseDebug(ellipseGui, orbit)
}

// GLTF Model
let add_satellite = false;
if (add_satellite) {
  let satelliteGroup = new THREE.Group()
  const gltfLoader = new GLTFLoader()


  let satModel
  gltfLoader.load(
    'models/albedo-sat-simple.glb',
    // 'models/hubble.glb',
    (gltf) => {
      console.log("Loaded Albedo GLTF Model")
      console.log(gltf)
      satelliteGroup.add(gltf.scene)
      // satControls.fitToSphere(satModel)
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
  satelliteGroup.position.x = altitude
  viz.objects["satellite"] = satelliteGroup

  satelliteGroup.add(new THREE.AxesHelper(3))

  // Satellite Debug
  let satDebug = viz.gui.addFolder('Satellite')
  satDebug.add(satelliteGroup.rotation, 'x').min(-Math.PI).max(Math.PI).step(Math.PI / 180)

  // const fov = 75
  // const aspectRatio = viz.sizes.width / viz.sizes.height
  // const near = 50
  // const far = 40000
  // const satCamera = new THREE.PerspectiveCamera(fov, aspectRatio, near, far)
  // const satControls = new CameraControls(satCamera, viz.canvas)
  // satCamera.position.x = 10
  // satControls.setLookAt(0, 0, 0)
  // satelliteGroup.add(satCamera)
  // viz.camera = satCamera
  // viz.controls = satControls
}

// // Camera Cone
// const cone = viz.tools.newCone(300, 30)
// cone.mesh.position.x = 0
// satelliteGroup.add(cone.mesh)
// const coneGui = viz.gui.addFolder('Camera Cone')
// viz.tools.addConeDebug(coneGui, cone)
// console.log(cone)
// console.log("Get sat:", viz.getObject({ "key": "satellite" }))


const sphere_geom = new THREE.SphereGeometry(0.5)
const red_mat = new THREE.MeshPhongMaterial()
red_mat.color.setRGB(1, 0, 0)
const sphere = new THREE.Mesh(sphere_geom, red_mat)
console.log("Sphere Geometry: ", String(sphere_geom.toJSON()))
viz.scene.add(sphere)
viz.objects["sphere"] = sphere
viz.objects["scene"] = viz.scene

const sphere_json = sphere.toJSON()
console.log(sphere.toJSON())

const cone_geom = new THREE.ConeGeometry(0.5, 1.0, 10, 1, false, 0, 2 * Math.PI)
const blue_mat = new THREE.MeshLambertMaterial()
blue_mat.color.setHex(0x195dae)
viz.objects["cone"] = new THREE.Mesh(cone_geom, blue_mat)
viz.scene.add(viz.objects["cone"])
let cone = viz.objects["cone"]
console.log("cone: ", cone.toJSON())

const cylinder_geom = new THREE.CylinderGeometry(0.75, 0.5, 0.25)
console.log("cylinder geom: ", cylinder_geom.toJSON())
console.log("cone mesh ", viz.objects["cone"].toJSON())
console.log("blue Phong: ", blue_mat.toJSON())

// Connection
const connection = new Connection(viz, 'ws://localhost:8011')

const loader = new ObjectLoader();
const mat_loader = new MaterialLoader();
let lambert_json = {
  "color": 0x19ae91,
  "type": "MeshLambertMaterial",
  "wireframe": false,
  "transparent": false,
  "opacity": 1.0,
}
const lambert = mat_loader.parse(lambert_json)
console.log("parsed mat: ", lambert.toJSON())
console.log("Is Material? ", lambert.isMaterial)
viz.objects["cone"].material = lambert

// viz.camera.position.x = altitude + 1
// viz.controls.setLookAt(altitude + 10, 0, 0, altitude, 0, 0, true)
// viz.camera.position.set(1, 1, 0)
// viz.camera.lookAt(new THREE.Vector3())
// viz.getActiveCamera().camera.position.set(1, 1, 0)
viz.controls.setPosition(6, 6, 3)
console.log("Camera: ", viz.camera)
// viz.camera.lookAt(sphere.position)
// viz.controls.setPosition(5, 5, 0)
viz.update()