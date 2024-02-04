import * as THREE from 'three'
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js'
import { TIFFLoader } from 'three/addons/loaders/TIFFLoader.js';

export default class TextureManager {
    constructor(sources) {
        this.sources = sources
        this.items = {}                    // the loaded resources
        this.toLoad = this.sources.length  // the number of resources to load
        this.numLoaded = 0                 // the number of resources loaded

        this.loaders = {}
        this.setLoaders()
    }

    percentLoaded() {
        return this.numLoaded / this.toLoad
    }

    allLoaded() {
        return this.numLoaded === this.toLoad
    }

    setLoaders() {
        this.loaders.texture = new THREE.TextureLoader()
        this.loaders.exr = new EXRLoader()
    }

    startLoading() {
        // Load each source
        for (const source of this.sources) {
            loader = this.loaders[source.type]
            loader.load(
                source.path,
                (file) => {
                    this.#sourceLoaded(source, file)
                }
            )
        }
    }

    #sourceLoaded(source, file) {
        this.itmes[source.name] = file
        this.numLoaded++
        if (this.numLoaded === this.toLoad) {
            console.log('All resources loaded.')
        }
    }
}