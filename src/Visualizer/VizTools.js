import * as THREE from 'three'

// ConeGeometry along Z axis, centered at the tip of the cone with +Z point towards base
function ConeGeometryZ(height, radius, segments) {
  // ConeGeometry is oriented along Y axis
  const geometry = new THREE.ConeGeometry(radius, height, segments)
  geometry.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2))
  geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, height / 2))
  return geometry
}



function deg2rad(deg) {
  return deg * Math.PI / 180
}
function rad2deg(rad) {
  return rad * 180 / Math.PI
}

export default class VizTools {
    constructor(canvas=document.querySelector('canvas.webgl')) {
        this.canvas = canvas
    }

    newTargetDisk(earthRadius, targetRadius, lat, long) {
        const targetGeometry = new THREE.CircleGeometry(1, 32)
        const targetMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: false, side: THREE.FrontSide }) 
        const targetMesh = new THREE.Mesh(targetGeometry, targetMaterial)
        const targetData = { earthRadius, lat, long, radius: targetRadius }
        const target = {mesh: targetMesh, data: targetData}
        this.#setTargetPosition(target)
        return target 
    }

    #setTargetPosition(target) {
        target.mesh.position.setFromSphericalCoords(
            target.data.earthRadius, deg2rad(90 - target.data.lat), deg2rad(target.data.long)
        ).applyEuler(new THREE.Euler(Math.PI / 2, 0, Math.PI / 2, 'ZYX'))
        target.mesh.scale.set(target.data.radius, target.data.radius, 1)
        target.mesh.lookAt(target.mesh.position.clone().multiplyScalar(2))
    }

    addTargetDebug(gui, target) {
        gui.add(target.mesh, 'visible').name('Visible')
        gui.add(target.data, 'lat').step(0.1).max(90).min(-90).onChange((value) => {
            this.#setTargetPosition(target)
        })
        gui.add(target.data, 'long').step(0.1).max(180).min(-180).onChange((value) => {
            this.#setTargetPosition(target)
        })
        gui.add(target.data, 'radius').step(1).min(0.1).max(500).onChange((value) => {
            this.#setTargetPosition(target)
        })
    }

    newCone(height, angle) {
        const geometry = ConeGeometryZ(1, 1, 32)
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: false })
        material.transparent = true
        material.opacity = 0.5
        material.side = THREE.DoubleSide
        const coneMesh = new THREE.Mesh(geometry, material)
        const coneData = { height, angle }
        const cone = {mesh: coneMesh, data: coneData}
        this.#updateCone(cone)
        return cone
    }

    #updateCone(cone) {
        const angle = deg2rad(cone.data.angle) / 2
        const height = cone.data.height
        const radius = height * Math.tan(angle)
        cone.mesh.scale.set(radius, radius, height)
    }

    addConeDebug(gui, cone) {
        gui.add(cone.mesh, 'visible').name('Camera Cone')
        gui.add(cone.data, 'height').step(1).max(1000).min(100).onChange((value) => {
            this.#updateCone()
        })
        gui.add(cone.data, 'angle').step(1).max(180).min(1).onChange((value) => {
            this.#updateCone()
        })
    }

    addOrbit(radius, azimuth, elevation) {
        const curve = new THREE.EllipseCurve(
            0.0, 0.0, 
            radius, radius,
            0, 2 * Math.PI,
            false,
            0
        )
        const geom = new THREE.BufferGeometry().setFromPoints(curve.getPoints(50))
        const mat = new THREE.LineBasicMaterial({ color: 0xff0000 })
        const ellipseMesh = new THREE.Line(geom, mat)
        const ellipseData = { radius, azimuth, elevation }
        const ellipse = {mesh: ellipseMesh, data: ellipseData, curve: curve}
        this.#updateOrbit(ellipse)
        return ellipse
    }

    #updateOrbit(ellipse) {
        ellipse.curve.xRadius = ellipse.data.radius
        ellipse.curve.yRadius = ellipse.data.radius
        ellipse.mesh.geometry.dispose()
        ellipse.mesh.geometry.setFromPoints(ellipse.curve.getPoints(50))
        ellipse.mesh.setRotationFromEuler(new THREE.Euler(0, ellipse.data.elevation, ellipse.data.azimuth, 'ZYX'))
    }

    addEllipseDebug(gui, orbit) {
        gui.add(orbit.mesh, 'visible').name('Orbit')
        gui.add(orbit.data, 'radius').step(1).max(10000).min(1000).onChange((value) => {
            this.#updateOrbit(orbit)
        })
        gui.add(orbit.data, 'azimuth').step(0.01).max(2 * Math.PI).min(0).onChange((value) => {
            this.#updateOrbit(orbit)
        })
        gui.add(orbit.data, 'elevation').step(0.01).max(Math.PI / 2).min(0).onChange((value) => {
            this.#updateOrbit(orbit)
        })
    }



}