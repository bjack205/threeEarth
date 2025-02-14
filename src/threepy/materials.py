from threepy.core import SceneElement
import enum


class Material(SceneElement):
    def __init__(self, name=None):
        super().__init__(name)
        self._properties = {}

    def lower(self):
        mat_json = SceneElement.lower(self)
        mat_json |= self._properties
        return mat_json

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


class MeshLambertMaterial(Material):
    def __init__(self, color: int = 255, name=None, **kwargs) -> None:
        super().__init__(name=name)
        self._properties |= {"color": color, "type": "MeshLambertMaterial", **kwargs}


class MatSide(enum.Enum):
    FrontSide = 0
    BackSide = 1
    DoubleSide = 2
