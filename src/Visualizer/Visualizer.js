import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { ObjectLoader } from 'three';
import { GLTFLoader } from 'three/examples/jsm/Addons.js'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import Stats from 'three/addons/libs/stats.module.js'
import CameraControls from 'camera-controls'
import Earth from './Earth'
import VizTools from './VizTools'

CameraControls.install({ THREE: THREE })

export default class Visualizer {
    constructor(canvas = document.querySelector('canvas.webgl'), shadows = false) {
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
        this.clock = new THREE.Clock()
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas
        })
        this.rendererInit(this.renderer, shadows)
        this._needs_update = true

        // Listeners
        window.addEventListener('resize', () => {
            this.resize()
        })

        // Scene 
        this.scene = new THREE.Scene()

        // Camera
        const fov = 60
        const aspectRatio = this.sizes.width / this.sizes.height
        const near = 0.10
        const far = 100 // 40000
        this.cameraGroup = new THREE.Group()
        this.camera = new THREE.PerspectiveCamera(fov, aspectRatio, near, far)
        this.cameraInit(this.camera)
        this.cameraDebug(this.camera)

        // Controls
        // this.controls = new OrbitControls(this.camera, this.canvas)
        this.controls = new CameraControls(this.camera, this.canvas)
        this.controls.enableDamping = true

        // Lights
        this.ambientLight = new THREE.AmbientLight('#ffffff', 0.0)
        this.directionalLight = new THREE.DirectionalLight('#ffffff', 3.0)
        this.lightsInit(this.ambientLight, this.directionalLight)
        this.lightsDebug(this.ambientLight, this.directionalLight)
        this.directionalLight.castShadow = shadows;

        // Animation
        this.mixer = new THREE.AnimationMixer(this.scene)
        this.active_action = null
        this.animation_debug = null
        this.time_controller = null

        // Object Cache
        this.objects = {
            "controls": this.controls,
            "earth": this.earthGroup,
            "camera": this.camera,
            "ambientLight": this.ambientLight,
            "directionalLight": this.directionalLight,
            "renderer": this.renderer,
            "scene": this.scene,
        }

        // Loaders
        this.loaders = {
            "json": new THREE.ObjectLoader(),
            "gltf": new GLTFLoader(),
        }

        return

        // Earth
        this.world = new THREE.Group()
        this.earthGroup = new THREE.Group()
        this.earthGroup.rotateX(Math.PI / 2)
        this.earth == null
        this.world.add(this.earthGroup)
        this.scene.add(this.world)

        // Debug
        this.debugObject.earthRotation = 0.0
        this.addDebug()

        // Tools
        this.tools = new VizTools()

        console.log('Here starts a great experience')
    }

    addEarth(earthTextures = {}) {
        this.earth = new Earth(this.scene, this.gui)
        this.earth.addEarth(this.earthGroup, earthTextures)
    }

    getActiveCamera() {
        return { camera: this.camera, controls: this.controls }
    }

    resize() {
        // Update sizes
        this.sizes.width = window.innerWidth;
        this.sizes.height = window.innerHeight;

        // Update camera
        let camera = this.getActiveCamera().camera;
        camera.aspect = this.sizes.width / this.sizes.height;
        camera.updateProjectionMatrix();

        // Update renderer
        this.renderer.setSize(this.sizes.width, this.sizes.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        this._needs_update = true;
    }


    destroy() {

    }

    rendererInit(renderer, shadows) {
        renderer.setSize(this.sizes.width, this.sizes.height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.outputColorSpace = THREE.SRGBColorSpace

        renderer.shadowMap.enabled = shadows;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap
    }

    cameraInit(camera) {
        camera.position.x = 12000
        camera.position.y = 0
        camera.position.z = 0
        camera.lookAt(0, 0, 0)
        camera.up.set(0, 0, 1)
        this.cameraGroup.add(camera)
    }

    cameraDebug(camera) {
        const cameraDebug = this.gui.addFolder('Camera')
        cameraDebug.add(camera, 'fov').min(1).max(180).step(1).name('FOV').onFinishChange(() => {
            camera.updateProjectionMatrix();
            this._needs_update = true;
        })
        cameraDebug.add(camera, 'near').min(1).max(2000).step(1).name('Near').onFinishChange(() => {
            camera.updateProjectionMatrix();
            this._needs_update = true;
        })
        cameraDebug.add(camera, 'far').min(1).max(50000).step(1).name('Far').onFinishChange(() => {
            camera.updateProjectionMatrix();
            this._needs_update = true;
        })
    }

    lightsInit(ambientLight, directionalLight) {
        directionalLight.position.set(0, 0, 30)
        this.scene.add(ambientLight)
        this.scene.add(directionalLight)
    }

    lightsDebug(ambientLight, directionalLight) {
        const lightsDebug = this.gui.addFolder('Lights')
        const update = () => { this.setUpdate(); }
        lightsDebug.add(ambientLight, 'intensity').min(0).max(1).step(0.01).name('Ambient Intensity').onChange(update)
        lightsDebug.add(directionalLight, 'intensity').min(0).max(10).step(0.01).name('Sun Intensity').onChange(update)
        lightsDebug.add(directionalLight.position, 'x').min(-100).max(100).step(0.1).name('Sun X').onChange(update)
        lightsDebug.add(directionalLight.position, 'y').min(-100).max(100).step(0.1).name('Sun Y').onChange(update)
        lightsDebug.add(directionalLight.position, 'z').min(-100).max(100).step(0.1).name('Sun Z').onChange(update)
    }

    animationDebug() {
        if (this.animation_debug) {
            this.animation_debug.destroy();
        }
        // Animation controls
        const animDebug = this.gui.addFolder('Animation')
        animDebug.add(this.active_action, 'play')
        animDebug.add(this.active_action, 'reset')
        animDebug.add(this.active_action, 'stop')
        animDebug.add(this.active_action, 'paused')
        animDebug.add(this.active_action, 'enabled')
        animDebug.add(this.active_action, 'timeScale').min(-2).max(5).step(0.1)
        this.animation_debug = animDebug
        this.time_controller = animDebug.add(this.active_action, 'time').min(0).max(this.active_action.getClip().duration).step(0.1)
    }

    addDebug() {
        const debug = this.gui.addFolder('Debug')
        debug.add(this.debugObject, 'earthRotation').min(-180).max(180).step(0.1).name('Earth Rotation').onChange(() => {
            this.world.rotation.z = THREE.MathUtils.degToRad(this.debugObject.earthRotation)
        })
        // axis helper
        let radius = 1;
        if (this.earth) {
            radius = this.earth.atmosphere.outerRadius * 1.2;
        }
        this.axisHelper = new THREE.AxesHelper(radius)
        this.world.add(this.axisHelper)
        debug.add(this.axisHelper, 'visible').name('Axis Helper')
    }

    getObject(query) {
        if (query in this.objects) {
            return this.objects[query]
        } else if (query["name"] && this.objects[query.name]) {
            return this.objects[query.name]
        } else if (query["json"]) {
            return this.loaders["json"].parse(query.json)
        } else if (query["name"]) {
            // TODO: search for object in tree by name
        }
        console.log("Unable to find object with query: ", query)
        return null
    }

    loadAnimation(clip, object = this.scene) {
        if (clip && object) {
            // Uncache previous action
            if (this.active_action) {
                this.active_action.stop();
                let active_clip = this.active_action.getClip();
                this.mixer.uncacheAction(this.active_action);
                this.mixer.uncacheClip(active_clip);
                this.mixer.uncacheRoot(this.mixer.getRoot());
            }
            this.active_action = this.mixer.clipAction(clip, object);
            this.active_action.play();
            this.animationDebug();
            return this.active_action
        }
        return null
    }

    setUpdate() { this._needs_update = true; }

    run() {
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
        this.update();
    }

    update() {
        const delta = this.clock.getDelta()
        const elapsedTime = this.clock.getElapsedTime()

        // Update controls
        const did_controls_update = this.controls.update(delta)

        // Update atmosphere
        if (this.earth) {
            const camera = this.getActiveCamera().camera
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
        }

        if (this.active_action && this.active_action.enabled) {
            this.mixer.update(delta)
            if (this.time_controller) {
                this.time_controller.updateDisplay()
            }
            this._needs_update = true;
        }

        // Render
        if (did_controls_update || this._needs_update) {
            this.renderer.render(this.scene, this.camera);
            console.log('rendered');
            this._needs_update = false;
        }

        // Stats
        this.stats.update()

        window.requestAnimationFrame(() => { this.update() })

    }
}