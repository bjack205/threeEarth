import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

window.addEventListener("DOMContentLoaded", () => {
  // Initialize the UI.
  const canvas = document.querySelector('canvas.webgl')
  const viz = setupScene(canvas);

  // Open the WebSocket connection and register event handlers.
  // const websocket = new WebSocket("ws://localhost:8011/");
  // initGame(websocket);
  // receiveMoves(board, websocket);
  // sendMoves(board, websocket);
  // const websocket = addWebSocket();

  const websocket = connect();
  renderLoop(viz, websocket);
});

function connect() {
  var websocket = new WebSocket('ws://localhost:8080');
  websocket.onopen = function() {
    console.log("Connected to the server.");
    let event = { type: "init", client: "visualizer" };
    websocket.send(JSON.stringify(event));
  };

  websocket.onmessage = function(e) {
    console.log('Message:', e.data);
  };

  websocket.onclose = function(e) {
    console.log('Socket is closed. Reconnect will be attempted in 1 second.', e.reason);
    setTimeout(function() {
      connect();
    }, 1000);
  };

  websocket.onerror = function(err) {
    // console.error('Socket encountered error: ', err.message, 'Closing socket');
    websocket.close();
  };
  return websocket;
}


function initGame(websocket) {
  websocket.addEventListener("open", () => {
    // Send an "init" event for the first player
    const params = new URLSearchParams(window.location.search);
    let event = { type: "init" };
    if (params.has("join")) {
      // Join an existing game
      event.join = params.get("join");
    } else {
      // Start the game
    }
    websocket.send(JSON.stringify(event));
  });
}

function sendMoves(board, websocket) {
  // When clicking a column, send a "play" event for a move in that column.
  board.addEventListener("click", ({ target }) => {
    const column = target.dataset.column;
    // Ignore clicks outside a column.
    if (column === undefined) {
      return;
    }
    const event = {
      type: "play",
      column: parseInt(column, 10),
    };
    websocket.send(JSON.stringify(event));
  });
}

function showMessage(message) {
  window.setTimeout(() => window.alert(message), 50);
}

function receiveMoves(board, websocket) {
  websocket.addEventListener("message", ({ data }) => {
    const event = JSON.parse(data);
    switch (event.type) {
      case "init":
        // Create link for inviting the second player
        document.querySelector(".join").href = "?join=" + event.join
      case "play":
        // Update the UI with the move.
        // playMove(board, event.player, event.column, event.row);
        break;
      case "win":
        showMessage(`Player ${event.player} wins!`);
        // No further messages are expected; close the WebSocket connection.
        websocket.close(1000);
        break;
      case "error":
        showMessage(event.message);
        break;
      default:
        throw new Error(`Unsupported event type: ${event.type}.`);
    }
  });
}

function setupScene(canvas) {
  const scene = new THREE.Scene();
  const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
  }

  // Add the floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshStandardMaterial({
      color: '#444444',
      metalness: 0,
      roughness: 0.5
    })
  )
  floor.receiveShadow = true
  floor.rotation.x = - Math.PI * 0.5
  scene.add(floor);

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 2.4)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.set(1024, 1024)
  directionalLight.shadow.camera.far = 15
  directionalLight.shadow.camera.left = - 7
  directionalLight.shadow.camera.top = 7
  directionalLight.shadow.camera.right = 7
  directionalLight.shadow.camera.bottom = - 7
  directionalLight.position.set(- 5, 5, 0)
  scene.add(directionalLight)

  // Base camera
  const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
  camera.position.set(2, 2, 2)
  scene.add(camera)

  // Controls
  const controls = new OrbitControls(camera, canvas)
  controls.target.set(0, 0.75, 0)
  controls.enableDamping = true

  // Renderer
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas
  })
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  // Resize event
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
  })
  return { scene, camera, controls, renderer };
}

function renderLoop(viz, websocket) {
  const clock = new THREE.Clock()
  const tick = () => {
    const elapsedTime = clock.getElapsedTime()

    // Update controls
    viz.controls.update()

    // Render
    viz.renderer.render(viz.scene, viz.camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
  }
  tick()
}