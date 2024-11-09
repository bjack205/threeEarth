import * as THREE from 'three'
import { ObjectLoader, MaterialLoader, BufferGeometryLoader } from 'three';
import * as Geometries from 'three/src/geometries/Geometries.js';

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
      setTimeout(() => { this.connectWebsocket(url); }, this.timeout);
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
      let name = msg.add_geometry.name;
      console.log(`Adding Geometry with name '${name}'`)
      this.viz.objects[name] = this.parseGeometry(msg.add_geometry);
    }
    if ("add_material" in msg) {
      let name = msg.add_material.name;
      console.log(`Adding material '${name}'`)
      const loader = this.loaders["material"];
      this.viz.objects[name] = loader.parse(msg.add_material);
    }
    if ("add_mesh" in msg) {
      let cmd = msg.add_mesh;
      let name = cmd.name;
      if (cmd.geometry && cmd.material) {
        console.log("Adding mesh (simple) with name ", name);
        const geometry = this.viz.getObject(cmd.geometry);
        const material = this.viz.getObject(cmd.material);
        if (geometry && material) {
          if (name in this.viz.objects) {
            console.log(this.viz.objects[name]);
            const prevObject = this.viz.objects[name];
            // TODO: handle cleanup
            prevObject.removeFromParent();
          }
          const object = new THREE.Mesh(geometry, material);

          // Add parent
          this.viz.objects[name] = object;
          if ("parent" in cmd) {
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
      console.log(`Adding ${cmd.child} to ${cmd.parent}`)
      const parent = this.viz.getObject(cmd.parent)
      const child = this.viz.getObject(cmd.child)
      console.log("parent: ", parent)
      console.log("child: ", child)
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
        material.needsUpdate = true
        this.viz.setUpdate();
      }
    }
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

  loadGLTF(path, name, parent) {
    const loader = this.viz.loaders.gltf;
    loader.load(
      path,
      (gltf) => {
        console.log(`Loaded GLTF Model with name '${name}'`)
        // console.log(gltf)
        // satelliteGroup.add(gltf.scene)
        // satControls.fitToSphere(satModel)
        const obj = gltf.scene;
        this.viz.objects[name] = obj;
        this.viz.objects[parent].add(obj);
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