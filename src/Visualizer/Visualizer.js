import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import Stats from 'three/addons/libs/stats.module.js'
import Earth from './Earth'

export default class Visualizer {
    constructor(canvas=document.querySelector('canvas.webgl')) {
        this.canvas = canvas

        // Stats
        this.stats = new Stats()
        this.canvas.parentNode.appendChild(this.stats.dom)

        // Debug
        this.gui = new GUI()
        this.debugObject = {}

        // Options
        this.canvas = canvas
        this.sizes = {
            width: window.innerWidth,
            height: window.innerHeight
        }

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas
        })
        this.rendererInit(this.renderer)

        // Scene 
        this.scene = new THREE.Scene()

        // Camera
        const fov = 75
        const aspectRatio = this.sizes.width / this.sizes.height
        const near = 1
        const far = 2000
        this.camera = new THREE.PerspectiveCamera(fov, aspectRatio, near, far)
        this.cameraInit(this.camera)
        this.cameraDebug(this.camera)

        // Lights
        this.ambientLight = new THREE.AmbientLight('#ffffff', 0.0)
        this.directionalLight = new THREE.DirectionalLight('#ffffff', 30.0)
        this.lightsInit(this.ambientLight, this.directionalLight)
        this.lightsDebug(this.ambientLight, this.directionalLight)

        // Earth
        this.world = new THREE.Group()
        this.earthGroup = new THREE.Group()
        this.earthGroup.rotateX(Math.PI / 2)

        this.earth = new Earth(this.scene, this.gui)
        this.earth.addEarth(this.earthGroup)
        this.world.add(this.earthGroup)
        this.scene.add(this.world)

        // Controls
        this.controls = new OrbitControls(this.camera, this.canvas)
        this.controls.enableDamping = true

        // Listeners
        this.clock = new THREE.Clock()
        window.addEventListener('resize', () => {
            this.resize()
        })

        // Debug
        this.debugObject.earthRotation = 0.0
        this.addDebug()

        console.log('Here starts a great experience')
    }

    getActiveCamera() {
        return this.camera
    }

    resize() {
        // Update sizes
        this.sizes.width = window.innerWidth
        this.sizes.height = window.innerHeight

        // Update camera
        let camera = this.getActiveCamera()
        camera.aspect = this.sizes.width / this.sizes.height
        camera.updateProjectionMatrix()

        // Update renderer
        this.renderer.setSize(this.sizes.width, this.sizes.height)
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    }

    update() {
        const elapsedTime = this.clock.getElapsedTime()

        // Update controls
        this.controls.update()

        // Update atmosphere
        const camera = this.getActiveCamera()
        const uniforms = this.earth.uniforms
        const cameraHeight = camera.position.length()
        let earthPosition = new THREE.Vector3()
        this.earth.groundMesh.getWorldPosition(earthPosition)

        const lightDir = new THREE.Vector3().subVectors(
            this.directionalLight.position, earthPosition
        ).normalize()
        uniforms.v3LightPosition.value = lightDir 
        uniforms.fCameraHeight.value = cameraHeight 
        uniforms.fCameraHeight2.value = cameraHeight * cameraHeight

        // Render
        this.renderer.render(this.scene, this.camera)

        // Stats
        this.stats.update()

        window.requestAnimationFrame(() => { this.update() })
    }

    destroy() {

    }

    rendererInit(renderer) {
        renderer.setSize(this.sizes.width, this.sizes.height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) 
        renderer.outputColorSpace = THREE.SRGBColorSpace
    }

    cameraInit(camera) {
        camera.position.x = 180
        camera.position.y = 0
        camera.position.z = 0
        camera.lookAt(0,0,0)
        camera.up.set(0, 0, 1)
        this.scene.add(camera)
    }

    cameraDebug(camera) {
        const cameraDebug = this.gui.addFolder('Camera')
        cameraDebug.add(camera, 'fov').min(1).max(180).step(1).name('FOV').onFinishChange(() => {
            camera.updateProjectionMatrix()
        })
        cameraDebug.add(camera, 'near').min(1).max(2000).step(1).name('Near').onFinishChange(() => {
            camera.updateProjectionMatrix()
        })
        cameraDebug.add(camera, 'far').min(1).max(2000).step(1).name('Far').onFinishChange(() => {
            camera.updateProjectionMatrix()
        })
    }

    lightsInit(ambientLight, directionalLight) {
        directionalLight.position.set(100, 0, 0)
        this.scene.add(ambientLight)
        this.scene.add(directionalLight)
    }

    lightsDebug(ambientLight, directionalLight) {
        const lightsDebug = this.gui.addFolder('Lights')
        lightsDebug.add(ambientLight, 'intensity').min(0).max(1).step(0.01).name('Ambient Intensity')
        lightsDebug.add(directionalLight, 'intensity').min(0).max(1).step(0.01).name('Sun Intensity')
        lightsDebug.add(directionalLight.position, 'x').min(-1).max(1).step(0.01).name('Sun X')
        lightsDebug.add(directionalLight.position, 'y').min(-1).max(1).step(0.01).name('Sun Y')
        lightsDebug.add(directionalLight.position, 'z').min(-1).max(1).step(0.01).name('Sun Z')
    }

    addDebug() {
        const debug = this.gui.addFolder('Debug')
        debug.add(this.debugObject, 'earthRotation').min(-180).max(180).step(0.1).name('Earth Rotation').onChange(() => {
            this.world.rotation.z = THREE.MathUtils.degToRad(this.debugObject.earthRotation)
        })

        // axis helper
        this.axisHelper = new THREE.AxesHelper(this.earth.atmosphere.outerRadius * 1.2)
        this.world.add(this.axisHelper)
        debug.add(this.axisHelper, 'visible').name('Axis Helper')
    }

}