from threepy.core import SceneElement
from threepy.geometry import BufferGeometry
from threepy.materials import Material, MeshLambertMaterial


class Object3D(SceneElement):
    DEFAULT_UP = [0, 1, 0]

    def __init__(self, object_type: str, **kwargs):
        super().__init__(**kwargs)
        self._object_type = object_type

        # Optional
        self.cast_shadow = False
        self.receive_shadow = False
        self.children = []
        self.parent: Object3D = None
        self.position = [0, 0, 0]
        self.quaternion = [1, 0, 0, 0]
        self.scale = [1, 1, 1]
        self.up = Object3D.DEFAULT_UP
        self.visible = True

    def lower(self):
        return SceneElement.lower(self) | {"object_type": self._object_type}

    @property
    def uuid(self):
        return self._uuid


class SimpleMesh(Object3D):
    def __init__(self, geometry=None, material=MeshLambertMaterial(), **kwargs):
        super().__init__("SimpleMesh", **kwargs)
        if not isinstance(geometry, BufferGeometry):
            raise ValueError("geometry must be an instance of Geometry")
        if not isinstance(material, Material):
            raise ValueError("material must be an instance of Material")
        if not geometry.name:
            geometry.name = f"{self.name}_geometry"
        if not material.name:
            material.name = f"{self.name}_material"
        self.geometry: BufferGeometry = geometry
        self.material: Material = material

    def lower(self):
        object_data = Object3D.lower(self)
        object_data["geometry"] = self.geometry.lower()
        object_data["material"] = self.material.lower()
        return object_data

class SimpleMeshRef(Object3D):
    def __init__(self, geometry_name : str, material_name : str, **kwargs):
        super().__init__("SimpleMeshRef", **kwargs)
        if not isinstance(geometry_name, str):
            raise ValueError("geometry_name must be a string")
        if not isinstance(material_name, str):
            raise ValueError("material_name must be a string")
        self.geometry_name: str = geometry_name
        self.material_name: str = material_name

    def lower(self):
        object_data = Object3D.lower(self)
        object_data["geometry_name"] = self.geometry_name
        object_data["material_name"] = self.material_name
        return object_data

class GLTF(Object3D):
    def __init__(self, path: str, **kwargs):
        super().__init__("GLTF", **kwargs)
        self.path = path

    def lower(self):
        object_data = Object3D.lower(self)
        object_data["path"] = self.path
        return object_data
