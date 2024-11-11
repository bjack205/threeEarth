from threepy.core import SceneElement
import enum


class Interpolation(enum.Enum):
    InterpolateDiscrete = 2300
    InterpolateLinear = 2301
    InterpolateSmooth = 2302


class KeyframeTrack:
    def __init__(
        self,
        name,
        times,
        values,
        interpolation: Interpolation = Interpolation.InterpolateLinear,
        value_type = "number",
    ):
        self.name = name
        self.times = times
        self.values = values
        self.interpolation = interpolation
        self._value_type = value_type

    def lower(self):
        track = {}
        track["name"] = self.name
        track["type"] = self._value_type
        track["times"] = self.times
        track["values"] = self.values
        track["interpolation"] = self.interpolation.value

        return track


class AnimationClip(SceneElement):
    def __init__(self, name, duration, tracks: list[KeyframeTrack] = []):
        super().__init__(name)
        self.duration = duration
        self.tracks = tracks

    def add_track(self, track: KeyframeTrack):
        self.tracks.append(track)

    def lower(self):
        clip = SceneElement.lower(self)
        clip["duration"] = self.duration
        clip["blendMode"] = 2500  # NormalAnimationBlendMode
        clip["tracks"] = [track.lower() for track in self.tracks]
        return clip
