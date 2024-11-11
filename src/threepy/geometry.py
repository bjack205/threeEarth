import math
from threepy.core import SceneElement


class BufferGeometry(SceneElement):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def lower(self):
        return SceneElement.lower(self)


class SphereGeometry(BufferGeometry):
    def __init__(
        self,
        radius: float = 1,
        width_segments: int = 32,
        height_segments: int = 16,
        phi_start: float = 0.0,
        phi_length: float = 2 * math.pi,
        theta_start: float = 0.0,
        theta_length=math.pi,
        **kwargs
    ):
        super().__init__(**kwargs)
        self.radius = radius
        self.width_segments = width_segments
        self.height_segments = height_segments
        self.phi_start = phi_start
        self.phi_length = phi_length
        self.theta_start = theta_start
        self.theta_length = theta_length

    def lower(self):
        geom = BufferGeometry.lower(self)
        geom |= {
            "type": "SphereGeometry",
            "radius": self.radius,
            "widthSegments": 20,
            "heightSegments": 20,
        }
        return geom


class PlaneGeometry(BufferGeometry):

    def __init__(self, width=1, height=1, widthSegments=1, heightSegments=1, **kwargs):
        super().__init__(**kwargs)
        self.width = width
        self.height = height
        self.widthSegments = widthSegments
        self.heightSegments = heightSegments

    def lower(self, object_data) -> dict:
        geom = BufferGeometry.lower(self)
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


class CylinderGeometry(BufferGeometry):
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
        **kwargs
    ):
        super().__init__(**kwargs)
        self.radiusTop = radiusTop
        self.radiusBottom = radiusBottom
        self.height = height
        self.radialSegments = radialSegments
        self.heightSegments = heightSegments
        self.openEnded = openEnded
        self.thetaStart = thetaStart
        self.thetaLength = thetaLength

    def lower(self) -> dict:
        geom = BufferGeometry.lower(self)
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


class ConeGeometry(CylinderGeometry):
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
        cylinder_json = CylinderGeometry.lower(self)
        cylinder_json["type"] = "ConeGeometry"
        cylinder_json["radius"] = self.radiusBottom
        cylinder_json.pop("radiusTop")
        return cylinder_json




# class Mesh(Object):
#     _type = "Mesh"
