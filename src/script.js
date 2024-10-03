import * as THREE from 'three';
import CameraControls from 'camera-controls'
CameraControls.install( { THREE: THREE } );
import Visualizer from './Visualizer/Visualizer'

const canvas = document.querySelector('canvas.webgl')
const viz = new Visualizer(canvas)

// Set up scene
const scene = viz.scene; // new THREE.Scene();
viz.camera.position.set( 0, 5, 0 );
const cameraControls = viz.controls;

const mesh = new THREE.Mesh(
	new THREE.BoxGeometry( 1, 1, 1 ),
	new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: true } )
);
scene.add( mesh );
cameraControls.setLookAt(0, 5, 0, 0, 0, 0);

const gridHelper = new THREE.GridHelper( 50, 50 );
gridHelper.position.y = - 1;
scene.add( gridHelper );

// Start rendering the visualizer
viz.run();

// make variable available to browser console
globalThis.THREE = THREE;
globalThis.camera = viz.camera;
globalThis.cameraControls = viz.controls;
globalThis.mesh = mesh;