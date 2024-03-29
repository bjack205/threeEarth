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

import SkyFromSpaceVertex from './shaders/atmo/SkyFromSpace.vert'
import SkyFromSpaceFragment from './shaders/atmo/SkyFromSpace.frag'
import GroundFromSpaceVertex from './shaders/atmo/GroundFromSpace.vert'
import GroundFromSpaceFragment from './shaders/atmo/GroundFromSpace.frag'

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
* Stats
 */
const stats = new Stats()
canvas.parentNode.appendChild(stats.dom)

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
    // composer.setSize(sizes.width, sizes.height)
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

const world = new THREE.Group();

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 1, 2000)
camera.position.x = 180 
camera.position.y = 0 
camera.position.z = 0
camera.lookAt(0, 0, 0)
scene.add(camera)


/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.0)
const pointLight = new THREE.PointLight(0xffffff, 30.0)
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0)
directionalLight.position.set(100, 0, .0)
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
    // color: tiffLoader.load('/textures/earth/earth_color_10K.tif', (texture) => {
    //     texture.colorSpace = THREE.SRGBColorSpace
    //     console.log("Loaded earth color texture")
    // }),
    color: textureLoader.load('/textures/earth/earth_color_small.jpg', (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace
        console.log("Loaded earth color texture")
    }),
    // displacement: textureLoader.load('/textures/earth/topography_21k.png', (texture) => {
    //     console.log("Loaded earth displacement texture")
    // }),
    // landocean: textureLoader.load('/textures/earth/earth_landocean_4K.png', (texture) => {
    //     console.log("Loaded earth landocean texture")
    // }),
    // roughness: textureLoader.load('/textures/earth/earth_roughness.png', (texture) => {
    //     console.log("Loaded earth roughness texture")
    //     console.log(texture)
    // }),
    // nightlights: tiffLoader.load('/textures/earth/earth_nightlights_10K.tif', (texture) => {
    //     console.log("Loaded earth nightlights texture")
    // }),
    nightlights: textureLoader.load('/textures/earth/earth_nightlights_small.jpg', (texture) => {
        console.log("Loaded earth nightlights texture")
    }),
}
earthTexture.color.colorSpace = THREE.SRGBColorSpace


/**
 * Earth 
 */

const atmosphere = {
	Kr				: 0.0025,
	Km				: 0.0010,
	ESun			: 20.0,
	g				: -0.950,
	innerRadius 	: 100,
	outerRadius		: 102.5,
	wavelength		: [0.650, 0.570, 0.475],
	scaleDepth		: 0.25,
	mieScaleDepth	: 0.1,
}
const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
earthTexture.color.anisotropy = maxAnisotropy;
earthTexture.nightlights.anisotropy = maxAnisotropy;

const atmoFolder = gui.addFolder('Atmosphere')
atmoFolder.add(atmosphere, 'Kr').min(0).max(0.1).step(0.0001).onChange((Kr) => {
  uniforms.fKrESun.value = atmosphere.Kr * atmosphere.ESun; 
  uniforms.fKr4PI.value = atmosphere.Kr * 4 * Math.PI;
})
atmoFolder.add(atmosphere, 'Km').min(0).max(0.1).step(0.0001).onChange(() => {
  uniforms.fKmESun.value = atmosphere.Km * atmosphere.ESun;
  uniforms.fKm4PI.value = atmosphere.Km * 4 * Math.PI;
})
atmoFolder.add(atmosphere, 'ESun').min(0).max(100).step(0.1).onChange(() => {
  uniforms.fKmESun.value = atmosphere.Km * atmosphere.ESun;
  uniforms.fKrESun.value = atmosphere.Kr * atmosphere.ESun; 
})
atmoFolder.add(atmosphere, 'g').min(-1).max(1).step(0.001)
atmoFolder.add(atmosphere, 'innerRadius').min(0).max(1000).step(0.1).onChange((r) => {
  uniforms.fInnerRadius.value = r;
  uniforms.fInnerRadius2.value = r * r;
  uniforms.fScale.value = 1 / (atmosphere.outerRadius - atmosphere.innerRadius);
  uniforms.fScaleOverScaleDepth.value = uniforms.fScale.value / uniforms.fScaleDepth.value;
})
atmoFolder.add(atmosphere, 'outerRadius').min(0).max(1000).step(0.1).onChange((r) => {
  uniforms.fOuterRadius.value = r;
  uniforms.fOuterRadius2.value = r * r;
  uniforms.fScale.value = 1 / (atmosphere.outerRadius - atmosphere.innerRadius);
  uniforms.fScaleOverScaleDepth.value = uniforms.fScale.value / uniforms.fScaleDepth.value;
})
atmoFolder.add(atmosphere, 'scaleDepth').min(0).max(1).step(0.001)
atmoFolder.add(atmosphere, 'mieScaleDepth').min(0).max(1).step(0.001)

const uniforms = {
	v3LightPosition: { value: new THREE.Vector3(1e8, 0, 1e8).normalize() },
	v3InvWavelength: { value:	new THREE.Vector3(1 / Math.pow(atmosphere.wavelength[0], 4), 1 / Math.pow(atmosphere.wavelength[1], 4), 1 / Math.pow(atmosphere.wavelength[2], 4)), },
	fCameraHeight: { value:	0, },
	fCameraHeight2: { value:	0, },
	fInnerRadius: { value:	atmosphere.innerRadius, },
	fInnerRadius2: { value:	atmosphere.innerRadius * atmosphere.innerRadius, },
	fOuterRadius: { value:	atmosphere.outerRadius, },
	fOuterRadius2: { value:	atmosphere.outerRadius * atmosphere.outerRadius, },
	fKrESun: { value:	atmosphere.Kr * atmosphere.ESun, },
	fKmESun: { value:	atmosphere.Km * atmosphere.ESun, },
	fKr4PI: { value:	atmosphere.Kr * 4.0 * Math.PI, },
	fKm4PI: { value:	atmosphere.Km * 4.0 * Math.PI, },
	fScale: { value:	1 / (atmosphere.outerRadius - atmosphere.innerRadius), },
	fScaleDepth: { value:	atmosphere.scaleDepth, },
	fScaleOverScaleDepth: { value:	1 / (atmosphere.outerRadius - atmosphere.innerRadius) / atmosphere.scaleDepth, },
	g: { value:	atmosphere.g, },
	g2: { value:	atmosphere.g * atmosphere.g, },
	nSamples: { value:	3, },
	fSamples: { value:	3.0, },
	tDiffuse: { value:	earthTexture.color, },
	tDiffuseNight: { value:	earthTexture.nightlights, },
	tDisplacement: { value:	0, },
	tSkyboxDiffuse: { value:	0, },
	fNightScale: { value:	1, }
}

// Material
const earthMaterial = new THREE.MeshStandardMaterial()
earthMaterial.map = earthTexture.color
// earthMaterial.displacementMap = earthTexture.displacement
// earthMaterial.displacementScale = 0.01
earthMaterial.roughnessMap = earthTexture.roughness

// const earthFolder = gui.addFolder('Earth')
// earthFolder.add(earthMaterial, 'displacementScale').min(0).max(0.1).step(0.001)

// Geometry 
// earthMaterial.roughness = 1.0
// const earthMesh = new THREE.Mesh(
//     new THREE.SphereGeometry(atmosphere.innerRadius, 256, 256),
//     earthMaterial,
//     // new THREE.MeshStandardMaterial({ color: 0x00ff00 })
// )
// scene.add(earthMesh)
// earthMesh.visible = false
// gui.add(earthMesh, 'visible').name('Earth')

// Ground 
const groundMaterial = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: GroundFromSpaceVertex,
    fragmentShader: GroundFromSpaceFragment,
})
const groundMesh = new THREE.Mesh(
    new THREE.SphereGeometry(atmosphere.innerRadius, 32, 32),
    groundMaterial,
    // earthMaterial,
)
world.add(groundMesh)
world.rotateX(Math.PI / 2)
gui.add(groundMesh, 'visible').name('Ground')

// Atmosphere
const skyMaterial = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: SkyFromSpaceVertex,
    fragmentShader: SkyFromSpaceFragment,
    side: THREE.BackSide,
    vertexColors: true,
    transparent: true,
})

const skyMesh = new THREE.Mesh(
    new THREE.SphereGeometry(atmosphere.outerRadius, 256, 256),
    skyMaterial,
)
world.add(skyMesh)
gui.add(skyMesh, 'visible').name('Sky')

gui.add(world.scale, 'x').min(0).max(10).step(0.01).name('World Scale').onChange(() => {
    world.scale.y = world.scale.x
    world.scale.z = world.scale.x
})
scene.add(world)

// earthMesh.castShadow = true
// earthMesh.receiveShadow = true
// const earthFolder = gui.addFolder('Earth')
// earthFolder.add(earthMaterial, 'displacementScale').min(0).max(0.1).step(0.001)

// Axes Helper
const axesHelper = new THREE.AxesHelper(atmosphere.outerRadius * 1.5)
scene.add(axesHelper)
gui.add(axesHelper, 'visible').name('Axes Helper')


/**
 * Postprocessing
 */


/**
 * Controls
 */
camera.up.set(0, 0, 1)
camera.lookAt(0, 0, 0)
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
    // glow.material.uniforms.viewVector.value = new THREE.Vector3().subVectors(camera.position, glow.position)
    // glow.material.uniforms.uCameraPosition.value = camera.position

    // Update controls
    // const cameraDistance = camera.position.distanceTo(earthMesh.position)
    // console.log(cameraDistance)
    // updateOutline()
    controls.update()
    // outlinePass.edgeStrength = Math.max(10 - cameraDistance, 0.1)

    const cameraHeight = camera.position.length()
    let earthPosition = new THREE.Vector3()
    groundMesh.getWorldPosition(earthPosition)

    const lightDir = new THREE.Vector3().subVectors(
      directionalLight.position, earthPosition
    ).normalize()
    uniforms.v3LightPosition.value = lightDir 
    uniforms.fCameraHeight.value = cameraHeight 
    uniforms.fCameraHeight2.value = cameraHeight * cameraHeight

    // Render
    renderer.render(scene, camera)
    // composer.render()

    // Stats
    stats.update()

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()