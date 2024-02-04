import * as THREE from 'three'
import { TIFFLoader } from 'three/addons/loaders/TIFFLoader.js';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js'

export default class Earth {
    constructor(scene, gui) {
        this.scene = scene

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
                nightlights10k: {
                    type: 'tiff',
                    path: './textures/earth/earth_nightlights_10k.tif'
                }
            }
        }

        this.stars = { name: '', texture: null }
        this.color = { name: '', texture: null }
        this.nightlights = { name: '', texture: null }
        this.setStars('stars4k')
        this.setEarthColor('colorSmall')
        this.setEarthNightlights('nightlightsSmall')
    }

    setStars(stars) {
        this.stars = {
            name: stars,
            texture: this.loadResource(this.textures.stars[stars], (texture, resource) => {
                console.log(`Stars loaded: ${stars}`)
                this.stars.texture.mapping = THREE.EquirectangularReflectionMapping
                this.scene.background = this.stars.texture
                this.scene.environment = this.stars.texture
            }) 
        }
    }

    setEarthColor(color) {
        this.color = {
            name: color,
            texture: this.loadResource(this.textures.color[color], (texture, resource) => {
                console.log(`Color loaded: ${resource.path}`)
                texture.colorSpace = THREE.SRGBColorSpace
            })
        }
        // this.color.colorSpace = THREE.SRGBColorSpace
    }

    setEarthNightlights(nightlights) {
        this.nightlights = {
            name: nightlights,
            texture: this.loadResource(this.textures.nightlights[nightlights], (texture, resource) => {
                console.log(`Nightlights loaded: ${nightlights}`)
                texture.colorSpace = THREE.SRGBColorSpace
            })
        }
        this.nightlights.colorSpace = THREE.SRGBColorSpace
    }

    loadResource(resource, callback=()=>{}) {
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
}