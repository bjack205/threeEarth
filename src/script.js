import { update } from 'three/examples/jsm/libs/tween.module.js'
import Visualizer from './Visualizer/Visualizer'
import * as THREE from 'three'

function deg2rad(deg) {
  return deg * Math.PI / 180
}
function rad2deg(rad) {
  return rad * 180 / Math.PI
}

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Vizualizer
const viz = new Visualizer(canvas)
viz.earth.setEarthColor('colorSmall')
viz.earth.setStars('stars4k')

// Add disk on the Earth
const earthRadius = viz.earth.getEarthRadius()
const target = viz.tools.newTargetDisk(earthRadius, 100, 0, 0)
viz.world.add(target.mesh)
const targetGui = viz.gui.addFolder('Target')
viz.tools.addTargetDebug(targetGui, target)

// Camera Cone
const cone = viz.tools.newCone(300, 30)
cone.mesh.position.x = 7000
viz.world.add(cone.mesh)
const coneGui = viz.gui.addFolder('Camera Cone')
viz.tools.addConeDebug(coneGui, cone)

// Ellipse
const orbit = viz.tools.addOrbit(earthRadius + 300, 0, 0)
viz.world.add(orbit.mesh)
const ellipseGui = viz.gui.addFolder('Orbit')
viz.tools.addEllipseDebug(ellipseGui, orbit)


viz.update()
