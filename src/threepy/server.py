import websockets
import asyncio
import json
from websockets.asyncio.server import serve
import logging

class WebsocketServer:
    def __init__(self):
        self.connections = []
        self._task = None

    async def handler(self, websocket):
        logging.info("New Websocket added. Adding to list of connections")
        self.connections.append(websocket)

        async for message in websocket:
            logging.info("Received message: %s", message)

        logging.info("Connection Closed. Popping from list of connections")
        self.connections.remove(websocket)

    async def main(self):
        async with serve(self.handler, "", 8001):
            await asyncio.get_running_loop().create_future()  # run forever
        logging.warning("Server Stopped")

    def start(self):
        loop = asyncio.get_event_loop()
        self._task = loop.create_task(self.main())
        return self._task

    def broadcast(self, message):
        loop = asyncio.get_event_loop()
        for connection in self.connections:
            loop.create_task(connection.send(json.dumps(message)))

    async def send_message(self, message):
        for connection in self.connections:
            await connection.send(json.dumps(message))

    @property
    def num_connections(self) -> int:
        return len(self.connections)

    @property
    def is_running(self) -> bool:
        return self._task is not None and not self.task.done()

    @property
    def task(self):
        return self._task

    def stop(self):
        self.task.cancel()

    def get_connection(self):
        return self.connections[0] if self.connections else None
