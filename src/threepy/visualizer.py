from threepy.geometry import *
from threepy.materials import *
from threepy.objects import *
from threepy.animations import *
from threepy.server import WebsocketServer


class Visualizer:
    def __init__(self):
        self.server = WebsocketServer()
        self.server.start()

    async def add_geometry(self, geometry: BufferGeometry):
        await self._send_message("add_geometry", geometry.lower())

    async def add_material(self, material: Material):
        await self._send_message("add_material", material.lower())

    async def add_object(self, obj: Object3D, parent_name: str = None):
        await self._send_message("add_object", obj.lower())
        if parent_name:
            await self.add_child(parent_name, obj.name)

    async def add_animation(self, anim: AnimationClip):
        await self._send_message("add_animation", anim.lower())

    async def load_animation(self, clip_name : str, root_name = "scene"):
        await self._send_message("load_animation", {"clip_name": clip_name, "root_name": root_name})

    async def set_props(self, name: str, props: dict):
        await self._send_message("set_props", {"name": name} | props)

    async def add_child(self, parent_name: str, child_name: str):
        await self._send_message("add_child", {"parent_name": parent_name, "child_name": child_name})

    async def camera_controls(self, controls_name: str, position: list = None, target: list = None, enable_transition: bool = False):
        data = {"controls_name": controls_name, "enable_transition": enable_transition}
        if position is not None and target is not None:
            data["setLookAt"] = (position + target)  # [px, py, pz, tx, ty, tz]
        elif position is not None:
            data["setPosition"] = position
        elif target is not None:
            data["setTarget"] = target
        await self._send_message("camera_controls", data)

    async def _send_message(self, msg_name: str, data: dict):
        await self.server.send_message({msg_name: data})

