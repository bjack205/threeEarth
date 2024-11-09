abstract type Geometry end

struct Sphere <: Geometry
    radius::Float32
    widthSegments::Int
    heightSegments::Int
    function Sphere(;radius=1.0f0, widthSegments=20, heightSegments=20)
        new(radius, widthSegments, heightSegments)
    end
end

function lower(geom::Sphere)
    geom = Dict(
        "type" => "PlaneGeometry",
        "radius" => geom.radius,
        "widthSegments" => geom.widthSegments,
        "heightSegments" => geom.heightSegments,
    )
end

struct Plane <: Geometry
    width::Float32
    height::Float32
    widthSegments::Int
    heightSegments::Int
end

Base.@kwdef struct Cylinder <: Geometry
    radiusTop::Float32 = 1.0f0
    radiusBottom::Float32 = 1.0f0
    height::Float32 = 1.0f0
    radialSegments::Int = 32
    heightSegments::Int = 1
    openEnded::Bool = false
    thetaStart::Float32 = 0.0f0
    thetaLength::Float32 = 2pi
end
typestring(::Cylinder) = "CylinderGeometry"

function lower(geom::G) where {G <: Geometry}
    msg = Dict{String,Any}(
        "type" => typestring(geom),
    )
    for field in fieldnames(G)
        msg[string(field)] = getfield(geom, field)
    end
    return msg
end

abstract type Material end

struct MeshLambertMaterial <: Material
    props::Dict{String,Any}
    function MeshLambertMaterial(;color = 255)
        new(Dict("color" => 255))
    end
end
typestring(::MeshLambertMaterial) = "MeshLambertMaterial"

istransparent(mat::MeshLambertMaterial) = get(mat.props, "transparent", false)

function opacity(mat::Material)::Float32
    if ("opacity" in mat.props && istransparent(mat))
        return Float32(mat.props["opacity"])
    else
        return 1.0f0
    end
end

function setopacity!(mat::Material, value::Number)
    value = Float32(value)
    if (value >= 1)
        delete!(mat.props, "transparent")
        delete!(mat.props, "opacity")
    else
        mat.props["transparent"] = true
        mat.props["opacity"] = value
    end
    return
end

function lower(mat::Material)
    msg = copy(mat.props)
    msg["type"] = typestring(mat)
    return msg
end