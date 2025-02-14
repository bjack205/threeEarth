import * as THREE from 'three'
import { ObjectLoader, MaterialLoader, BufferGeometryLoader } from 'three';
import * as Geometries from 'three/src/geometries/Geometries.js';

export class SimpleConnection {
    constructor(url, timeout = 1000) {
        this.url = url
        this.timeout = timeout
        if (url) {
            this.connectWebsocket(url)
        }
    }

    connectWebsocket(url) {
        this.websocket = new WebSocket(url)
        this.websocket.onopen = () => {
            console.log("Connected to the server");
            let event = { type: "init", client: "visualizer" };
            this.websocket.send(JSON.stringify(event));
        }
        this.websocket.onmessage = (e) => {
            console.log("Got message: ", e.data);
            // this.handleMessage(e);
        }
        this.websocket.onclose = (e) => {
            console.log(`Socket is closed. Reconnect will be attempted in ${this.timeout} seconds. Reason:`, e.reason);
            setTimeout(() => {
                this.connectWebsocket(url);
            }, this.timeout);
        }
        this.websocket.onerror = (err) => {
            console.log("Socket encountered error. Closing Socket")
            this.websocket.close();
        }
    }
}

export default class Connection {
    constructor(viz, url, timeout = 1000) {
        this.viz = viz
        this.url = url
        this.timeout = timeout
        if (url) {
            this.connectWebsocket(url)
        }
        this.loaders = {
            "geometry": new THREE.BufferGeometryLoader(),
            "material": new THREE.MaterialLoader(),
        }
    }

    connectWebsocket(url) {
        this.websocket = new WebSocket(url)
        this.websocket.onopen = () => {
            console.log("Connected to the server");
            let event = { type: "init", client: "visualizer" };
            this.websocket.send(JSON.stringify(event));
        }
        this.websocket.onmessage = (e) => {
            console.log("Got message: ", e.data);
            this.handleMessage(e);
        }
        this.websocket.onclose = (e) => {
            console.log(`Socket is closed. Reconnect will be attempted in ${this.timeout} seconds. Reason:`, e.reason);
            setTimeout(() => {
                this.connectWebsocket(url);
            }, this.timeout);
        }
        this.websocket.onerror = (err) => {
            console.log("Socket encountered error. Closing Socket")
            this.websocket.close();
        }
    }

    handleMessage(event) {
        let msg;
        try {
            msg = JSON.parse(event.data)
        } catch (err) {
            console.log("Unable to parse JSON. Got error: ", err)
            return
        }

        // Handle the command
        if ("add_geometry" in msg) {
            this.addGeometry(msg.add_geometry);
        }
        if ("add_material" in msg) {
            this.addMaterial(msg.add_material);
        }
        if ("add_object" in msg) {
            let cmd = msg.add_object;
            let name = cmd.name;
            let object_type = cmd.object_type;
            let object;
            // TODO: Get a parser function for each object type
            if (object_type == "SimpleMeshRef") {
                console.log("Adding Simple Mesh (Ref) with name ", name);
                let geometry = this.viz.getObject(cmd.geometry_name);
                let material = this.viz.getObject(cmd.material_name);
                if (geometry && material) {
                    object = new THREE.Mesh(geometry, material);
                    object.name = name;
                    this.viz.addObject(name, object);
                }
            } else if (object_type == "SimpleMesh") {
                console.log("Adding Simple Mesh with name ", name);
                let geometry = this.addGeometry(cmd.geometry);
                let material = this.addMaterial(cmd.material);
                if (geometry && material) {
                    console.log("Successfully loaded geometry and material")
                    object = new THREE.Mesh(geometry, material);
                    object.name = name;
                    this.viz.addObject(name, object);
                }
            } else if (object_type == "GLTF") {
                console.log("Adding GLTF with name ", name);
                this.loadGLTF(cmd.path, name, cmd);
            } else if (object_type == "Camera") {
                console.log("Adding camera with name", name)
                const camera = new THREE.PerspectiveCamera();
                camera.name = name;
                if ("near" in cmd) {
                    camera.near = cmd.near
                }
                if ("far" in cmd) {
                    camera.far = cmd.far
                }
                if ("fov" in cmd) {
                    camera.fov = cmd.fov
                }
                if ("aspect" in cmd) {
                    camera.aspect = cmd.aspect
                }
                this.viz.addObject(name, camera);
            } else if (object_type == "Group") {
                console.log("Adding Group with name ", name)
                const group = new THREE.Group()
                this.viz.addObject(name, group)
            }
        }
        if ("camera_controls" in msg) {
            console.log("Got Camera Controls command")
            let cmd = msg.camera_controls;
            const controls_name = cmd.controls_name;
            const controls = this.viz.getObject(controls_name);
            const enable_transition = cmd.enable_transition;
            if (controls) {
                if ("setLookAt" in cmd) {
                    console.log("Setting LookAt")
                    controls.setLookAt(...cmd.setLookAt, enable_transition);
                }
            } else {
                console.log("Couldn't find controls with name ", cmd.control_name)
            }
        }
        if ("add_animation" in msg) {
            let cmd = msg.add_animation;
            console.log("Adding Animation Clip with name", cmd.name);
            const clip = THREE.AnimationClip.parse(cmd);
            this.viz.addObject(cmd.name, clip);
        }
        if ("load_animation" in msg) {
            let cmd = msg.load_animation;
            console.log("Loading Animation")
            let clip_name = cmd.clip_name;
            let root_name = cmd.root_name;
            let clip;
            let root;
            if (clip_name in this.viz.objects) {
                clip = this.viz.objects[clip_name];
            } else {
                console.log("Failed to find clip with name ", clip_name)
            }
            if (root_name in this.viz.objects) {
                root = this.viz.objects[root_name];
            } else {
                console.log("Failed to find object with name ", root_name)
            }
            if (clip && root) {
                this.viz.loadAnimation(clip, root);
            }
        }
        if ("add_mesh" in msg) {
            let cmd = msg.add_mesh;
            let name = cmd.name;
            if (cmd.geometry_name && cmd.material_name) {
                // This assumes that both the geometry and material are already loade
                console.log("Adding mesh (simple) with name ", name);

                // Check if the geometry and material are already loaded
                let geometry = this.viz.getObject(cmd.geometry_name);
                let material = this.viz.getObject(cmd.material_name);

                // Add mesh
                if (geometry && material) {
                    if (name in this.viz.objects) {
                        console.log(this.viz.objects[name]);
                        const prevObject = this.viz.objects[name];
                        // TODO: handle cleanup
                        prevObject.removeFromParent();
                    }
                    const object = new THREE.Mesh(geometry, material);

                    // Add parent
                    this.viz.addObject(name, object);
                    if ("parent_name" in cmd) {
                        const parent = this.viz.getObject(cmd.parent);
                        parent.add(object);
                        this.viz.setUpdate();
                    }
                } else {
                    console.log("Adding mesh failed! Failed to find or add the material or geometry")
                }
            }
        }
        if ("add_child" in msg) {
            let cmd = msg.add_child;
            console.log(`Adding ${cmd.child_name} to ${cmd.parent_name}`)
            const parent = this.viz.getObject(cmd.parent_name)
            const child = this.viz.getObject(cmd.child_name)
            parent.add(child)
            this.viz.setUpdate();
        }
        if ("set_props" in msg) {
            const object = this.viz.getObject(msg.set_props)
            const props = msg.set_props;
            if ("position" in props) {
                console.log("Setting Position of ", props.name)
                object.position.fromArray(props.position)
            }
            if ("quaternion" in props) {
                console.log("Setting Quaternion of ", props.name)
                object.quaternion.fromArray(props.quaternion)
            }
            if ("scale" in props) {
                object.scale.fromArray(props.scale)
            }
            if ("near" in props) {
                console.log("Setting near")
                object.near = props.near;
                object.updateProjectionMatrix();
            }
            this.viz.setUpdate();

            let material;
            if (object.isMesh) {
                material = object.material
            } else if (object.isMaterial) {
                material = object;
            }
            if ("color" in props && material) {
                material.color.fromArray(props.color)
                this.viz.setUpdate();
            }
            if ("transparent" in props && material) {
                console.log("Setting transparent")
                material.transparent = props.transparent;
                material.needsUpdate = true
                this.viz.setUpdate();
            }
            if ("opacity" in props && material) {
                console.log("Setting opacity")
                material.opacity = props.opacity;
                material.needsUpdate = true;
                this.viz.setUpdate();
            }
            if ("visible" in props) {
                console.log("Setting visibility")
                object.visible = props.visible;
                this.viz.setUpdate();
            }
        }
    }

    addGeometry(data) {
        let name = data.name;
        console.log(`Adding Geometry with name '${name}'`)
        const geometry = this.parseGeometry(data);
        geometry.name = name;
        this.viz.addObject(name, geometry);
        return geometry;
    }

    addMaterial(data) {
        let name = data.name;
        console.log(`Adding material '${name}'`)
        const loader = this.loaders["material"];
        const material = loader.parse(data);
        material.name = name;
        this.viz.addObject(name, material);
        return material;
    }

    parseGeometry(data) {
        let geometry = {};
        switch (data.type) {

            case 'BufferGeometry':
            case 'InstancedBufferGeometry':

                const bufferGeometryLoader = this.loaders["geometry"];
                geometry = bufferGeometryLoader.parse(data);
                break;

            default:

                if (data.type in Geometries) {

                    geometry = Geometries[data.type].fromJSON(data);

                } else {

                    console.warn(`THREE.ObjectLoader: Unsupported geometry type "${data.type}"`);

                }

        }
        return geometry;
    }

    setQuaternion(object, data) {
        if (object instanceof THREE.Object3D) {
            object.quaternion.fromArray(data)
            console.log(object)
        } else {
            console.log("Tried to set the quaternion of something that wasn't an Object3D. Got ", typeof (object))
        }
    }

    setPosition(object, data) {
        if (object instanceof THREE.Object3D) {
            object.position.fromArray(data)
        } else {
            console.log("Tried to set the position of something that wasn't an Object3D. Got ", typeof (object))
        }
    }

    loadGLTF(path, name, parent, callback = null) {
        const loader = this.viz.loaders.gltf;
        loader.load(
            path,
            (gltf) => {
                console.log(`Loaded GLTF Model with name '${name}'`)
                // console.log(gltf)
                // satelliteGroup.add(gltf.scene)
                // satControls.fitToSphere(satModel)
                const obj = gltf.scene;
                obj.name = name;
                this.viz.addObject(name, obj);
                if (parent && this.viz.objects[parent]) {
                    console.log(`Adding GLTF ${name} to ${parent}`)
                    this.viz.objects[parent].add(obj);
                }
                if (callback) {
                    callback(obj)
                }
                this.viz.setUpdate();
            },
            (progress) => {
                // console.log('GLTF progress')
            },
            (error) => {
                console.log('GLTF error')
                console.log(error)
            }
        )
    }

}