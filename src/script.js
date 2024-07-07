import { update } from 'three/examples/jsm/libs/tween.module.js'
import Visualizer from './Visualizer/Visualizer'
import * as THREE from 'three'

function deg2rad(deg) {
  return deg * Math.PI / 180
}
function rad2deg(rad) {
  return rad * 180 / Math.PI
}

// ConeGeometry along Z axis, centered at the tip of the cone with +Z point towards base
function ConeGeometryZ(height, radius, segments) {
  // ConeGeometry is oriented along Y axis
  const geometry = new THREE.ConeGeometry(radius, height, segments)
  geometry.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2))
  geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, height / 2))
  return geometry
}

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Vizualizer
const viz = new Visualizer(canvas)
viz.earth.setEarthColor('colorSmall')
viz.earth.setStars('stars4k')

// Add disk on the Earth
const target = {
  lat: 0,
  long: 0,
  radius: 100,  // km
}
const earthRadius = viz.earth.getEarthRadius()
const targetGeometry = new THREE.CircleGeometry(target.radius, 32)
const targetMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: false, side: THREE.FrontSide }) 
const targetMesh = new THREE.Mesh(targetGeometry, targetMaterial)
targetMesh.position.set(6371, 0, 0)
targetMesh.rotateY(Math.PI / 2)

const setTargetPosition = (lat, long) => {
  targetMesh.position.setFromSphericalCoords(
    earthRadius, deg2rad(90 - target.lat), deg2rad(target.long)
  ).applyEuler(new THREE.Euler(Math.PI / 2, 0, Math.PI / 2, 'ZYX'))
  targetMesh.lookAt(targetMesh.position.clone().multiplyScalar(2))
}
setTargetPosition(target.lat, target.long)

const targetGui = viz.gui.addFolder('Target')
targetGui.add(targetMesh, 'visible').name('Target')
targetGui.add(target, 'lat').step(1).max(90).min(-90).onChange((value) => {
  setTargetPosition(target.lat, target.long)
})
targetGui.add(target, 'long').step(1).max(180).min(-180).onChange((value) => {
  setTargetPosition(target.lat, target.long)
})

console.log(targetMesh.position)
viz.world.add(targetMesh)


// Camera Cone
viz.debugObject.cameraCone = {
  height: 300,
  angle: 30,
}
const coneGeometry = ConeGeometryZ(1.0, 1.0, 32)
const coneMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: false })
coneMaterial.transparent = true
coneMaterial.opacity = 0.5
coneMaterial.side = THREE.DoubleSide
const cone = new THREE.Mesh(coneGeometry, coneMaterial)
cone.position.x = 7000
viz.world.add(cone)

const updateCameraCone = () => {
  const angle = deg2rad(viz.debugObject.cameraCone.angle) / 2
  const height = viz.debugObject.cameraCone.height
  const radius = height * Math.tan(angle)
  cone.scale.set(radius, radius, height)
}
updateCameraCone()

const coneGui = viz.gui.addFolder('Camera Cone')
coneGui.add(cone, 'visible').name('Camera Cone')
coneGui.add(viz.debugObject.cameraCone, 'height').step(1).max(1000).min(100).onChange((value) => {
  updateCameraCone()
})
coneGui.add(viz.debugObject.cameraCone, 'angle').step(1).max(180).min(1).onChange((value) => {
  updateCameraCone()
})

// Ellipse
viz.debugObject.ellipse = {
  radius: 6671,
  azimuth: 0,
  elevation: 0
}
const curve = new THREE.EllipseCurve(
  0.0, 0.0, 
  viz.debugObject.ellipse.radius, viz.debugObject.ellipse.radius,
  0, 2 * Math.PI,
  false,
  0
)
const geom = new THREE.BufferGeometry().setFromPoints(curve.getPoints(50))
const mat = new THREE.LineBasicMaterial({ color: 0xff0000 })
const ellipse = new THREE.Line(geom, mat)
viz.world.add(ellipse)

const ellipseGui = viz.gui.addFolder('Ellipse')
ellipseGui.add(ellipse, 'visible').name('Ellipse')
ellipseGui.add(viz.debugObject.ellipse, 'radius').step(1).max(10000).min(1000).onChange((value) => {
  curve.xRadius = value
  curve.yRadius = value
  geom.setFromPoints(curve.getPoints(50))
})
ellipseGui.add(viz.debugObject.ellipse, 'azimuth').step(0.01).max(2 * Math.PI).min(0).onChange((value) => {
  ellipse.setRotationFromEuler(new THREE.Euler(0, viz.debugObject.ellipse.elevation, viz.debugObject.ellipse.azimuth, 'ZYX'))
})
ellipseGui.add(viz.debugObject.ellipse, 'elevation').step(0.01).max(2 * Math.PI).min(0).onChange((value) => {
  ellipse.setRotationFromEuler(new THREE.Euler(0, viz.debugObject.ellipse.elevation, viz.debugObject.ellipse.azimuth, 'ZYX'))
})

viz.update()
