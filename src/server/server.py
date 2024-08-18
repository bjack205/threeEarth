#!/usr/bin/env python

import json
import asyncio
import datetime
import random
import websockets

async def visualizer(websocket):
    print("New Connection to Visualizer")
    async for msg in websocket:
        print(msg)

async def connection(websocket):
    print("New Connection")
    async for msg in websocket:
        print(msg)

async def handler(websocket):
    # Wait for the init event
    async for msg in websocket:
        event = json.loads(msg)
        if event["type"] == "init":
            break
    if "client" in event and event["client"] == "visualizer":
        await visualizer(websocket)


async def main():
    async with websockets.serve(handler, "localhost", 8080):
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
    