import { SimpleConnection } from '../Connection';

console.log("Hello World!");

let num_clicks = 0;

window.addEventListener("DOMContentLoaded", () => {
  // Initialize the UI.
  // Open the WebSocket connection and register event handlers.
  const connection = new SimpleConnection("ws://localhost:8001/");

  document.addEventListener('click', function(event) {
    // Code to execute when the page is clicked
    console.log('Page clicked!');
    num_clicks += 1;

    let msg = { type: "click", data:  `Page clicked ${num_clicks} times`};
    connection.websocket.send(JSON.stringify(msg));
  });
});

