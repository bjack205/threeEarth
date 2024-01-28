import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import Stats from 'three/addons/libs/stats.module.js'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js'
import { TIFFLoader } from 'three/addons/loaders/TIFFLoader.js';

// Post Processing
import { WebGLRenderer } from "three";
import { HalfFloatType } from 'three'
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutlinePass } from "three/addons/postprocessing/OutlinePass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
// import { BloomPass } from "three/examples/jsm/postprocessing/BloomPass.js";
// import * as POST from "postprocessing";

// Custom Shaders
import vertexShader from './shaders/vertex.glsl'
import fragmentShader from './shaders/fragments.glsl'
import vertexGlowShader from './shaders/glow/vertex.glsl'
import fragmentGlowShader from './shaders/glow/fragments.glsl'

/**
 * Debug
 */
const gui = new GUI()
const debugObject = {}

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    composer.setSize(sizes.width, sizes.height)
})

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputColorSpace = THREE.SRGBColorSpace

const BLOOM_SCENE = 1;
const bloomLayer = new THREE.Layers();
bloomLayer.set( BLOOM_SCENE );

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 1
camera.position.y = 1
camera.position.z = 2
scene.add(camera)



/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.0)
const pointLight = new THREE.PointLight(0xffffff, 30.0)
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0)
directionalLight.position.set(1, 0, 1)
directionalLight.castShadow = true
pointLight.position.set(2, 3, 4)
scene.add(ambientLight)
scene.add(directionalLight)
// scene.add(pointLight)
gui.add(ambientLight, 'intensity').min(0).max(1).step(0.01)
gui.add(directionalLight, 'intensity').name('Sun Intensity').min(0).max(10).step(0.01)
gui.add(directionalLight, 'castShadow').name('Sun Shadow')

/**
 * Environment Map
 */
// const envMapData = {
//     path: "./textures/stars/starmap_2020_4k_gal.exr",
// }
// new EXRLoader().load(envMapData.path, ( texture ) => {

//     texture.mapping = THREE.EquirectangularReflectionMapping;

//     // exrCubeRenderTarget = pmremGenerator.fromEquirectangular( texture );
//     // exrBackground = texture;
//     envMapData.background = texture;
//     envMapData.cubeRender = pmremGenerator.fromEquirectangular( texture );;
// })

const exrLoader = new EXRLoader()
exrLoader.load("./textures/stars/hiptyc_2020_4k.exr", (envMap) => {
    envMap.mapping = THREE.EquirectangularReflectionMapping
    scene.background = envMap
    scene.environment = envMap
})

// const rgbeLoader = new RGBELoader()
// rgbeLoader.load("./textures/environmentMap/2k.hdr", (envMap) => {
//     envMap.mapping = THREE.EquirectangularReflectionMapping
//     scene.background = envMap
//     scene.environment = envMap
// })


/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()

const tiffLoader = new TIFFLoader()
const earthTexture = {
    color: tiffLoader.load('/textures/earth/earth_color_10K.tif', (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace
        console.log("Loaded earth color texture")
    }),
    displacement: textureLoader.load('/textures/earth/topography_21k.png', (texture) => {
        console.log("Loaded earth displacement texture")
    }),
    landocean: textureLoader.load('/textures/earth/earth_landocean_4K.png', (texture) => {
        console.log("Loaded earth landocean texture")
    }),
    roughness: textureLoader.load('/textures/earth/earth_roughness.png', (texture) => {
        console.log("Loaded earth roughness texture")
        console.log(texture)
    }),
}
earthTexture.color.colorSpace = THREE.SRGBColorSpace

/**
 * Glow
 */
var customMaterial = new THREE.ShaderMaterial({
    uniforms:
    {
        "c": { type: "f", value: 1.0 },
        "p": { type: "f", value: 1.4 },
        "s": { type: "f", value: 1.0 },
        scale: { type: "f", value: 1.0 },
        glowColor: { type: "c", value: new THREE.Color(0x99c1f1) },
        viewVector: { type: "v3", value: camera.position },
        uCameraPosition: {value: camera.position },
    },
    vertexShader: vertexGlowShader,
    fragmentShader: fragmentGlowShader, 
    side: THREE.FrontSide,
    blending: THREE.AdditiveBlending,
    transparent: true
});
const glow = new THREE.Mesh(new THREE.SphereGeometry(1.0, 30, 30), customMaterial);
glow.scale.multiplyScalar(1.02);
// scene.add(glow);

const glowFolder = gui.addFolder('Glow')
glowFolder.addColor(customMaterial.uniforms.glowColor, 'value').name('Glow Color')
glowFolder.add(customMaterial.uniforms.c, 'value').name('Glow C').min(0).max(10).step(0.01)
glowFolder.add(customMaterial.uniforms.p, 'value').name('Glow P').min(0).max(30).step(0.01)
glowFolder.add(customMaterial.uniforms.s, 'value').name('Glow Shift').min(-30).max(30).step(0.01)
glowFolder.add(customMaterial.uniforms.scale, 'value').name('Glow Scale').min(0).max(30).step(0.01)
glowFolder.add(glow, 'visible').name('Atmo Visible')
glowFolder.add(glow.scale, 'x').name('Atmo Scale').min(1).max(1.2).step(0.01).onChange(() => {
    glow.scale.y = glow.scale.x
    glow.scale.z = glow.scale.x
})


/**
 * Earth 
 */

// Material
const earthMaterial = new THREE.MeshStandardMaterial()
earthMaterial.map = earthTexture.color
earthMaterial.displacementMap = earthTexture.displacement
earthMaterial.displacementScale = 0.01
earthMaterial.roughnessMap = earthTexture.roughness

const earthFolder = gui.addFolder('Earth')
earthFolder.add(earthMaterial, 'displacementScale').min(0).max(0.1).step(0.001)

// Geometry 
earthMaterial.roughness = 1.0
const earthMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1.0, 256, 256),
    // earthMaterial,
    new THREE.MeshStandardMaterial({ color: 0x00ff00 })
)
scene.add(earthMesh)

gui.add(earthMesh, 'visible').name('Earth')
// earthMesh.castShadow = true
// earthMesh.receiveShadow = true
// const earthFolder = gui.addFolder('Earth')
// earthFolder.add(earthMaterial, 'displacementScale').min(0).max(0.1).step(0.001)

// Axes Helper
const axesHelper = new THREE.AxesHelper(2)
scene.add(axesHelper)
gui.add(axesHelper, 'visible').name('Axes Helper')


/**
 * Postprocessing
 */
const params = {
    outlineColor: '0x000000',
    outlineMaxDistance: 10.0,
    outlineMinDistance: 0.5,
    outlineMax: 1.2,
    outlineMin: 0.3,
    outlineGlow: 5.0,
    outlineThickness: 5.0,
    outlineDecay: 1.0,

    bloomThreshold: 0.5,
    bloomStrength: 1.5,
    bloomRadius: 0.4,
}

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const outlinePass = new OutlinePass(new THREE.Vector2(sizes.width, sizes.height), scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(sizes.width, sizes.height), 
    params.bloomStrength, params.bloomRadius, params.bloomThreshold);
composer.addPass(outlinePass);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());
// composer.addPass(new EffectPass(camera, new BloomEffect()));

// Outline 
function updateOutline() {
    const strength = Math.max(params.outlineMax - camera.position.distanceTo(earthMesh.position) * params.outlineDecay, params.outlineMin)
    const dmax = params.outlineMaxDistance
    const dmin = params.outlineMinDistance
    const d = camera.position.distanceTo(earthMesh.position)
    let theta = (d - dmin) / (dmax - dmin)
    theta = Math.max(Math.min(theta, 1.0), 0.0)

    const smax = params.outlineMax
    const smin = params.outlineMin
    const s = smax - (smax - smin) * theta
    console.log("Strength: ", s, " Theta: ", theta)
    outlinePass.edgeStrength = s 
    outlinePass.edgeGlow = params.outlineGlow
    outlinePass.edgeThickness = params.outlineThickness
}
outlinePass.selectedObjects = [earthMesh];
const outlineFolder = gui.addFolder('Outline')
outlineFolder.add(outlinePass, 'enabled').name('Outline Enabled')
outlineFolder.add(params, 'outlineMaxDistance').name('Outline Max Distance').min(0).max(10).step(0.01).onChange(updateOutline)
outlineFolder.add(params, 'outlineMinDistance').name('Outline Min Distance').min(0).max(10).step(0.01).onChange(updateOutline)
outlineFolder.add(params, 'outlineMax').name('Outline Max').min(0).max(10).step(0.01).onChange(updateOutline)
outlineFolder.add(params, 'outlineMin').name('Outline Min').min(0).max(10).step(0.01).onChange(updateOutline)
outlineFolder.add(params, 'outlineDecay').name('Outline Decay').min(0).max(5).step(0.01).onChange(updateOutline)
outlineFolder.add(params, 'outlineGlow').name('Outline Glow').min(0).max(10).step(0.01).onChange(updateOutline)
outlineFolder.add(params, 'outlineThickness').name('Outline Thickness').min(0).max(10).step(0.01).onChange(updateOutline)
outlineFolder.addColor(params, 'outlineColor').name('Outline Color').onChange(() => {
    outlinePass.visibleEdgeColor.set(params.outlineColor)
})

// Bloom
function updateBloom() {
    bloomPass.strength = params.bloomStrength
    bloomPass.radius = params.bloomRadius
    bloomPass.threshold = params.bloomThreshold
}
const bloomFolder = gui.addFolder('Bloom')
bloomFolder.add(bloomPass, 'enabled').name('Bloom Enabled')
bloomFolder.add(params, 'bloomStrength').name('Bloom Strength').min(0).max(10).step(0.01).onChange(updateBloom)
bloomFolder.add(params, 'bloomRadius').name('Bloom Radius').min(0).max(10).step(0.01).onChange(updateBloom)
bloomFolder.add(params, 'bloomThreshold').name('Bloom Threshold').min(0).max(10).step(0.01).onChange(updateBloom)


/**
 * Controls
 */
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () => {
    const elapsedTime = clock.getElapsedTime()

    // Update Objects
    // sphereMesh.rotation.y = 0.1 * elapsedTime
    // planeMesh.rotation.y = 0.1 * elapsedTime
    // torusMesh.rotation.y = 0.1 * elapsedTime

    // const xRate = -0.15
    // sphereMesh.rotation.x = xRate * elapsedTime
    // planeMesh.rotation.x = xRate * elapsedTime
    // torusMesh.rotation.x = xRate * elapsedTime

    // shaderMaterial.uniforms.uViewVector.value = new THREE.Vector3().subVectors(camera.position, earthMesh.position)
    // console.log(camera.position)
    glow.material.uniforms.viewVector.value = new THREE.Vector3().subVectors(camera.position, glow.position)
    glow.material.uniforms.uCameraPosition.value = camera.position

    // Update controls
    const cameraDistance = camera.position.distanceTo(earthMesh.position)
    console.log(cameraDistance)
    updateOutline()
    controls.update()
    // outlinePass.edgeStrength = Math.max(10 - cameraDistance, 0.1)

    // Render
    // renderer.render(scene, camera)
    composer.render()

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()