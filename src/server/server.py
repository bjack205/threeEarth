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

connections = []


async def visualizer(websocket):
    print("New Connection to Visualizer")
    async for msg in websocket:
        print(msg)


async def connection(websocket):
    print("New Connection")
    async for msg in websocket:
        print(msg)


async def handler(websocket):
    # Initialization
    print("New Websocket added. Adding to list of connections")
    connections.append(websocket)

    # Wait for the init event
    async for msg in websocket:
        event = json.loads(msg)
        if event["type"] == "init":
            break
    if "client" in event and event["client"] == "visualizer":
        await visualizer(websocket)

    print("Socket handler finished")
    connections.pop()


async def run_server():
    async with websockets.serve(handler, "localhost", 8011):
        await asyncio.Future()  # run forever


# %% Scene Elements


class SceneElement:
    def __init__(self, name=None):
        self.uuid = str(uuid.uuid1())
        self.name = name or self.uuid

    def lower(self):
        return {"uuid": self.uuid, "name": self.name}


class Geometry(SceneElement):
    def __init__(self, name=None):
        super().__init__(name)

    def lower(self):
        return SceneElement.lower(self)


class Sphere(Geometry):
    def __init__(self, radius, name=None):
        super().__init__(name)
        self.radius = radius

    def lower(self):
        geom = Geometry.lower(self)
        geom |= {
            "type": "SphereGeometry",
            "radius": self.radius,
            "widthSegments": 20,
            "heightSegments": 20,
        }
        return geom


class Plane(Geometry):

    def __init__(self, width=1, height=1, widthSegments=1, heightSegments=1, name=None):
        super().__init__(name)
        self.width = width
        self.height = height
        self.widthSegments = widthSegments
        self.heightSegments = heightSegments

    def lower(self, object_data) -> dict:
        geom = Geometry.lower(self)
        geom |= {
            "uuid": self.uuid,
            "type": "PlaneGeometry",
            "width": self.width,
            "height": self.height,
            "widthSegments": self.widthSegments,
            "heightSegments": self.heightSegments,
        }
        return geom


"""
A cylinder of the given height and radius. By Three.js convention, the axis of
rotational symmetry is aligned with the y-axis.
"""


class Cylinder(Geometry):
    def __init__(
        self,
        radiusTop: float = 1.0,
        radiusBottom: float = 1.0,
        height: float = 1.0,
        radialSegments: int = 32,
        heightSegments: int = 1,
        openEnded: bool = False,
        thetaStart: float = 0,
        thetaLength: float = 2 * math.pi,
        name=None,
    ):
        super().__init__(name)
        self.radiusTop = radiusTop
        self.radiusBottom = radiusBottom
        self.height = height
        self.radialSegments = radialSegments
        self.heightSegments = heightSegments
        self.openEnded = openEnded
        self.thetaStart = thetaStart
        self.thetaLength = thetaLength

    def lower(self) -> dict:
        geom = Geometry.lower(self)
        geom |= {
            "uuid": self.uuid,
            "type": "CylinderGeometry",
            "radiusTop": self.radiusTop,
            "radiusBottom": self.radiusBottom,
            "height": self.height,
            "radialSegments": self.radialSegments,
            "heightSegments": self.heightSegments,
            "openEnded": self.openEnded,
            "thetaStart": self.thetaStart,
            "thetaLength": self.thetaLength,
        }
        return geom


class Cone(Cylinder):
    def __init__(
        self,
        radius: float = 1.0,
        height: float = 1.0,
        radialSegments: int = 32,
        heightSegments: int = 1,
        openEnded: bool = False,
        thetaStart: float = 0,
        thetaLength: float = 2 * math.pi,
        name=None,
    ):
        super().__init__(
            0,
            radius,
            height,
            radialSegments,
            heightSegments,
            openEnded,
            thetaStart,
            thetaLength,
            name=name,
        )

    def lower(self):
        cylinder_json = Cylinder.lower(self)
        cylinder_json["type"] = "ConeGeometry"
        cylinder_json["radius"] = self.radiusBottom
        cylinder_json.pop("radiusTop")
        return cylinder_json


class Material(SceneElement):
    def __init__(self, name=None):
        super().__init__(name)
        self._properties = {}

    def lower(self):
        mat_json = SceneElement.lower(self)
        mat_json |= self._properties
        return mat_json


class MeshLambertMaterial(Material):
    def __init__(self, color: int = 255, name=None) -> None:
        super().__init__(name)
        self._properties |= {"color": color, "type": "MeshLambertMaterial"}

    @property
    def opacity(self):
        if "opacity" in self._properties and self._properties["transparent"]:
            return self._properties["opacity"]
        else:
            return 1

    @opacity.setter
    def opacity(self, value):
        if value >= 1:
            self._properties.pop("transparent", None)
            self._properties.pop("opacity", None)
        else:
            self._properties["transparent"] = True
            self._properties["opacity"] = value


class Object(SceneElement):
    def __init__(self, name=None) -> None:
        super().__init__(name=name)
        self._type = "object"
        self.name: str = name or ""


class Mesh(Object):
    def __init__(self, geometry, material=MeshLambertMaterial(), **kwargs):
        super(Object, self).__init__(**kwargs)
        self.geometry: Geometry = geometry
        self.material: Material = material

    def lower(self):
        data = {
            "metadata": {
                "version": 4.5,
                "type": "Object",
            },
            "geometries": [],
            "materials": [],
            "object": {
                "uuid": self.uuid,
                "type": self._type,
                "geometry": self.geometry.uuid,
                "material": self.material.uuid,
                "matrix": list(self.geometry.intrinsic_transform().flatten()),
            },
        }
        self.geometry.lower_in_object(data)
        self.material.lower_in_object(data)
        return data


class Mesh(Object):
    _type = "Mesh"


# %%
import asyncio

event_loop = asyncio.get_event_loop()
event_loop.create_task(run_server())

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
