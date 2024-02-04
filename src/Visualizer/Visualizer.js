import * as THREE from 'three'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import Earth from './Earth'

export default class Visualizer {
    constructor(canvas=document.querySelector('canvas.webgl')) {
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
        this.earth = new Earth(this.scene, this.gui)

        // Listeners
        window.addEventListener('resize', () => {
            this.resize()
        })

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
        camera = this.getActiveCamera()
        camera.aspect = this.sizes.width / this.sizes.height
        camera.updateProjectionMatrix()

        // Update renderer
        this.renderer.setSize(this.sizes.width, this.sizes.height)
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    }

    update() {

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

}