import * as THREE from 'three'

export default class Connection {
  constructor(viz, url, timeout = 1000) {
    this.viz = viz
    this.url = url
    this.timeout = timeout
    this.connectWebsocket(url)
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
    }

    // Handle the command
    if (msg.type == "set_position") {
      console.log("Setting Position")
      const obj = this.viz.getObject(msg)
      this.setPosition(obj, msg.data)
    }
    if (msg.type == "set_quat") {
      console.log("Setting Quaternion")
      const obj = this.viz.getObject(msg)
      this.setQuaternion(obj, msg.data)
    }
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


}