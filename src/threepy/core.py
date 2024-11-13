import uuid


class SceneElement:
    def __init__(self, name: str):
        self.name = name
        self._uuid = str(uuid.uuid4())

    def lower(self):
        return {"uuid": self.uuid, "name": self.name}

    @property
    def uuid(self):
        return self._uuid
