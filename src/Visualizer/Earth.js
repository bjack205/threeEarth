import * as THREE from 'three'
import { TIFFLoader } from 'three/addons/loaders/TIFFLoader.js';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js'

// Custom shaders
import SkyFromSpaceVertex from '../shaders/atmo/SkyFromSpace.vert'
import SkyFromSpaceFragment from '../shaders/atmo/SkyFromSpace.frag'
import GroundFromSpaceVertex from '../shaders/atmo/GroundFromSpace.vert'
import GroundFromSpaceFragment from '../shaders/atmo/GroundFromSpace.frag'

export default class Earth {
    constructor(scene, gui) {
        this.scene = scene
        this.gui = gui

        this.loaders = {}
        this.setLoaders()

        // Textures
        this.textures = {
            stars: {
                starfield4k: {
                    type: 'exr',
                    path: './textures/stars/hiptyc_2020_4k.exr'
                },
                stars4k: {
                    type: 'exr',
                    path: './textures/stars/starmap_2020_4k.exr'
                },
                stars8k: {
                    type: 'exr',
                    path: './textures/stars/starmap_2020_8k.exr'
                },
                stars16k: {
                    type: 'exr',
                    path: './textures/stars/starmap_2020_16k.exr'
                },
            },
            color: {
                colorSmall: {
                    type: 'texture',
                    path: './textures/earth/earth_color_small.jpg',
                },
                color10k: {
                    type: 'tiff',
                    path: './textures/earth/earth_color_10k.tif'
                },
            },
            nightlights: {
                nightlightsSmall: {
                    type: 'texture',
                    path: './textures/earth/earth_nightlights_small.jpg'
                },
                nightlights1k: {
                    type: 'texture',
                    path: './textures/earth/earthlights1k.jpg'
                },
                nightlights2k: {
                    type: 'texture',
                    path: './textures/earth/earthlights2k.jpg'
                },
                nightlights4k: {
                    type: 'texture',
                    path: './textures/earth/earthlights4k.jpg'
                },
                nightlights10k: {
                    type: 'texture',
                    path: './textures/earth/earthlights10k.jpg'
                },
            },
            clouds: {
                clouds1k: {
                    type: 'texture',
                    path: './textures/earth/clouds_1k.jpg'
                },
                clouds2k: {
                    type: 'tiff',
                    path: './textures/earth/clouds_2k.tif'
                },
            }
        }

        this.stars = { name: '', texture: null }
        this.color = { name: '', texture: null }
        this.nightlights = { name: '', texture: null }
        this.clouds = { name: '', texture: null }
        this.setStars('stars4k')
        this.setEarthColor('colorSmall')
        this.setEarthNightlights('nightlightsSmall')
        this.setClouds('clouds1k')


        // Shader uniforms
        this.atmosphere = {
            Kr: 0.0025,
            Km: 0.0010,
            ESun: 20.0,
            g: -0.950,
            innerRadius: 6371,
            atmoScaling: 2.5, 
            outerRadius: 102.5,
            wavelength: [0.650, 0.570, 0.475],
            scaleDepth: 0.25,
            // mieScaleDepth: 0.1,
        }
        const atmosphere = this.atmosphere
        this.uniforms = {
            v3LightPosition: { value: new THREE.Vector3(1e8, 0, 1e8).normalize() },
            v3InvWavelength: { value: new THREE.Vector3(1 / Math.pow(atmosphere.wavelength[0], 4), 1 / Math.pow(atmosphere.wavelength[1], 4), 1 / Math.pow(atmosphere.wavelength[2], 4)), },
            fCameraHeight: { value: 0, },
            fCameraHeight2: { value: 0, },
            fInnerRadius: { value: atmosphere.innerRadius, },
            fInnerRadius2: { value: atmosphere.innerRadius * atmosphere.innerRadius, },
            fOuterRadius: { value: atmosphere.outerRadius, },
            fOuterRadius2: { value: atmosphere.outerRadius * atmosphere.outerRadius, },
            fKrESun: { value: atmosphere.Kr * atmosphere.ESun, },
            fKmESun: { value: atmosphere.Km * atmosphere.ESun, },
            fKr4PI: { value: atmosphere.Kr * 4.0 * Math.PI, },
            fKm4PI: { value: atmosphere.Km * 4.0 * Math.PI, },
            fScale: { value: 1 / (atmosphere.outerRadius - atmosphere.innerRadius), },
            fScaleDepth: { value: atmosphere.scaleDepth, },
            fScaleOverScaleDepth: { value: 1 / (atmosphere.outerRadius - atmosphere.innerRadius) / atmosphere.scaleDepth, },
            g: { value: atmosphere.g, },
            g2: { value: atmosphere.g * atmosphere.g, },
            nSamples: { value: 3, },
            fSamples: { value: 3.0, },
            tDiffuse: { value: this.color.texture, },
            tDiffuseNight: { value: this.nightlights.texture, },
            tDiffuseClouds: { value: this.clouds.texture, },
            tDisplacement: { value: 0, },
            tSkyboxDiffuse: { value: 0, },
            fNightScale: { value: 1, }
        }

        // Geometry
        this.groundSegments = 64
        this.groundGeometry = this.newGroundGeometry()

        this.skySegments = 256
        this.skyGeometry = this.newSkyGeometry()

        // Materials
        this.groundMaterial = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: GroundFromSpaceVertex,
            fragmentShader: GroundFromSpaceFragment,
        })

        this.skyMaterial = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: SkyFromSpaceVertex,
            fragmentShader: SkyFromSpaceFragment,
            side: THREE.BackSide,
            vertexColors: true,
            transparent: true,
        })

        // Meshes
        this.cloudScale = 0.2
        this.skyMesh = new THREE.Mesh(this.skyGeometry, this.skyMaterial)
        this.groundMesh = new THREE.Mesh(this.groundGeometry, this.groundMaterial)
        // this.cloudMesh.scale.setScalar(this.cloudScale / 100.0 + 1.0)

        // Update radius
        this.setRadius(this.atmosphere.innerRadius, this.atmosphere.atmoScaling)

        this.addDebug()
    }

    addEarth(scene) {
        scene.add(this.skyMesh)
        scene.add(this.groundMesh)
        // scene.add(this.cloudMesh)
    }

    setStars(stars) {
        if (this.stars.texture) this.stars.texture.dispose()
        this.stars = {
            name: stars,
            texture: this.#loadResource(this.textures.stars[stars], (texture, resource) => {
                console.log(`Stars loaded: ${stars}`)
                this.stars.texture.mapping = THREE.EquirectangularReflectionMapping
                this.scene.background = this.stars.texture
                this.scene.environment = this.stars.texture
            })
        }
    }

    setEarthColor(color) {
        if (this.color.texture) this.color.texture.dispose()
        this.color = {
            name: color,
            texture: this.#loadResource(this.textures.color[color], (texture, resource) => {
                console.log(`Color loaded: ${resource.path}`)
                texture.colorSpace = THREE.SRGBColorSpace
                this.uniforms.tDiffuse.value = texture
            })
        }
    }

    setEarthNightlights(nightlights) {
        if (this.nightlights.texture) this.nightlights.texture.dispose()
        this.nightlights = {
            name: nightlights,
            texture: this.#loadResource(this.textures.nightlights[nightlights], (texture, resource) => {
                console.log(`Nightlights loaded: ${nightlights}`)
                texture.colorSpace = THREE.SRGBColorSpace
                this.uniforms.tDiffuseNight.value = texture
            })
        }
        this.nightlights.colorSpace = THREE.SRGBColorSpace
    }

    setClouds(clouds) {
        if (this.clouds.texture) this.clouds.texture.dispose()
        this.clouds = {
            name: clouds,
            texture: this.#loadResource(this.textures.clouds[clouds], (texture, resource) => {
                console.log(`Clouds loaded: ${clouds}`)
                texture.colorSpace = THREE.SRGBColorSpace
                this.uniforms.tDiffuseClouds.value = texture
                // this.cloudMaterial.map = texture
                // this.cloudMaterial.alphaMap = texture
                // this.cloudMaterial.needsUpdate = true
            })
        }
    }

    #loadResource(resource, callback = () => { }) {
        return this.loaders[resource.type].load(
            resource.path,
            (texture) => {
                // this.sourceLoaded(resource, file)
                callback(texture, resource)
            }
        )
    }

    setLoaders() {
        this.loaders.texture = new THREE.TextureLoader()
        this.loaders.exr = new EXRLoader()
        this.loaders.tiff = new TIFFLoader()
    }

    setRadius(inner, scaling=this.atmosphere.atmoScaling) {
        this.atmosphere.innerRadius = inner
        this.atmosphere.atmoScaling = scaling
        this.atmosphere.outerRadius = inner * (scaling / 100.0 + 1.0)

        this.uniforms.fInnerRadius.value = this.atmosphere.innerRadius
        this.uniforms.fInnerRadius2.value = this.atmosphere.innerRadius * this.atmosphere.innerRadius
        this.uniforms.fOuterRadius.value = this.atmosphere.outerRadius
        this.uniforms.fOuterRadius2.value = this.atmosphere.outerRadius * this.atmosphere.outerRadius

        this.uniforms.fScale.value = 1 / (this.atmosphere.outerRadius - this.atmosphere.innerRadius)
        this.uniforms.fScaleOverScaleDepth.value = this.uniforms.fScale.value / this.uniforms.fScaleDepth.value;

        this.groundGeometry = this.newGroundGeometry()
        this.skyGeometry = this.newSkyGeometry()
        this.groundMesh.geometry = this.groundGeometry
        this.skyMesh.geometry = this.skyGeometry
    }

    addDebug() {
        const folder = this.gui.addFolder('Earth')
        folder.add(this.stars, 'name').options(Object.keys(this.textures.stars)).name('Stars').onFinishChange((value) => {
            this.setStars(value)
        })
        folder.add(this.color, 'name').options(Object.keys(this.textures.color)).name('Color').onFinishChange((value) => {
            this.setEarthColor(value)
        })
        folder.add(this.nightlights, 'name').options(Object.keys(this.textures.nightlights)).name('Nightlights').onFinishChange((value) => {
            this.setEarthNightlights(value)
        })
        folder.add(this.clouds, 'name').options(Object.keys(this.textures.clouds)).name('Clouds').onFinishChange((value) => {
            this.setClouds(value)
        })

        // folder.add(this, 'cloudScale').min(0).max(5).step(0.1).onChange((scale) => {
        //     const cloudScale = scale / 100.0 + 1.0
        //     this.cloudMesh.scale.setScalar(cloudScale)
        // })

        const atmoFolder = folder.addFolder('Atmosphere')
        const atmosphere = this.atmosphere
        const uniforms = this.uniforms
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
        atmoFolder.add(atmosphere, 'g').min(-1).max(1).step(0.001).onChange(() => {
            uniforms.g.value = atmosphere.g;
            uniforms.g2.value = atmosphere.g * atmosphere.g;
        })
        atmoFolder.add(atmosphere, 'innerRadius').min(0).max(1000).step(0.1).onChange((r) => {
            this.setRadius(r)
        })
        atmoFolder.add(atmosphere, 'atmoScaling').min(0).max(10).step(0.01).onChange((s) => {
            this.setRadius(this.atmosphere.innerRadius, s)
        })
        atmoFolder.add(atmosphere, 'scaleDepth').min(0).max(1).step(0.001).onChange(() => {
            uniforms.fScaleDepth.value = atmosphere.scaleDepth;
            uniforms.fScaleOverScaleDepth.value = 1 / (atmosphere.outerRadius - atmosphere.innerRadius) / atmosphere.scaleDepth; 

        })
        // atmoFolder.add(atmosphere, 'mieScaleDepth').min(0).max(1).step(0.001)
    }

    newGroundGeometry() {
        return new THREE.SphereGeometry(this.atmosphere.innerRadius, this.groundSegments, this.groundSegments)
    }

    newSkyGeometry() {
        return new THREE.SphereGeometry(this.atmosphere.outerRadius, this.skySegments, this.skySegments)
    }

    getEarthRadius() {
        return this.atmosphere.innerRadius
    }

}