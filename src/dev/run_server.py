
import asyncio
import websockets


print("Hello World")



# %% Set the position
ws: websockets.legacy.server.WebSocketServerProtocol = connections[0]
msg = {
    "set_props": {
        "name": "sphere",
        "position": [0, 0, 0.5],
    }
}
await ws.send(json.dumps(msg))

# %% Set the color
ws: websockets.legacy.server.WebSocketServerProtocol = connections[0]
msg = {
    "set_props": {
        "name": "sphere",
        "color": [0, 0, 1.0],
    }
}
await ws.send(json.dumps(msg))

# %% Set cone quaternion and color
ws: websockets.legacy.server.WebSocketServerProtocol = connections[0]
msg = {
    "set_props": {
        "name": "cone",
        "quaternion": [0.70711, 0, 0, 0.70711],
        "color": [0, 1, 0],
        "transparent": True,
        "opacity": 0.2,
    }
}
await ws.send(json.dumps(msg))

# %%
cone = Cone()
cone.lower()

# %% Add Cone
ws: websockets.legacy.server.WebSocketServerProtocol = connections[0]
cone = Cone(name="cone_geom")
cone.lower()
msg = {
    "add_geometry": cone.lower(),
}
await ws.send(json.dumps(msg))

green_lambert = MeshLambertMaterial(color=0x00FF00, name="green_lambert")
msg = {
    "add_material": green_lambert.lower(),
}
await ws.send(json.dumps(msg))

msg = {
    "add_mesh": {
        "name": "green_cone",
        "geometry": "cone_geom",
        "material": "green_lambert",
        "parent": "scene",
    },
}
await ws.send(json.dumps(msg))

# %% Add to scene
ws: websockets.legacy.server.WebSocketServerProtocol = connections[0]
msg = {
    "add_child": {"parent": "scene", "child": "green_cone"},
}
await ws.send(json.dumps(msg))

# %% Add green cone


# %%
print("Num connections: ", len(connections))
connections[0].closed

# %%
if __name__ == "__main__":
    asyncio.run(main())
