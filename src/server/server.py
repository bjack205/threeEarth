#!/usr/bin/env python

# %%
import json
import math
import uuid
import asyncio
import datetime
import random
import numpy as np

import websockets.legacy
import websockets.legacy.server
import websockets

class ThreeServer:

    def __init__(self, port=8011):
        self.connections = []
        self.port = port

    async def visualizer(self, websocket):
        print("New Connection to Visualizer")
        async for msg in websocket:
            print(msg)


    async def connection(self, websocket):
        print("New Connection")
        async for msg in websocket:
            print(msg)


    async def handler(self, websocket):
        # Initialization
        print("New Websocket added. Adding to list of connections")
        self.connections.append(websocket)

        # Wait for the init event
        async for msg in websocket:
            event = json.loads(msg)
            if event["type"] == "init":
                break
        if "client" in event and event["client"] == "visualizer":
            await self.visualizer(websocket)

        print("Socket handler finished")
        self.connections.pop()


    async def run_server(self):
        async with websockets.serve(self.handler, "localhost", self.port):
            await asyncio.Future()  # run forever