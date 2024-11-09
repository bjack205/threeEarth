using HTTP
using HTTP.WebSockets
# using CoordinateTransformations, Rotations
using LinearAlgebra
using JSON
using StaticArrays

include("three.jl")

connections = Set{HTTP.WebSocket}()
host = "0.0.0.0"
port = 8011
server = WebSockets.listen!(host, port) do websocket
    println("Adding new socket")
    # iterate incoming websocket messages
    push!(connections, websocket)
    for msg in websocket
        # send message back to client or do other logic here
        # send(ws, msg)
    end
    println("Socket closed!")
    empty!(connections)
    println("Closed")
    # iteration ends when the websocket connection is closed by client or error
end
length(connections)
ws = first(connections)
WebSockets.isclosed(ws)

# Set satellite position
pos = [0, 0, 4]
msg = Dict("set_props" => Dict("name" => "satellite", "position" => pos))
WebSockets.send(ws, json(msg))

# Set light position
msg = Dict("set_props" => Dict("name" => "directionalLight", "position" => [40, 40, 10]))
WebSockets.send(ws, json(msg))

# Add material
mat = MeshLambertMaterial(color=255)
setopacity!(mat, 0.5)
msg = Dict("add_material" => push!(lower(mat), "name"=>"mat1"))
WebSockets.send(ws, json(msg))

# Add Geometry
geom = Cylinder()
msg = Dict("add_geometry" => push!(lower(geom), "name"=>"cylinder1"))
WebSockets.send(ws, json(msg))

# Add Mesh 
mesh = Dict("name" => "cylinderMesh", "material" => "mat1", "geometry" => "cylinder1")
msg = Dict("add_mesh" => mesh)
WebSockets.send(ws, json(msg))

# Add mesh to scene
msg = Dict("add_child" => Dict("parent" => "scene", "child" => "cylinderMesh"))
WebSockets.send(ws, json(msg))


getthreequat(q::QuatRotation) = SA[q.x, q.y, q.z, q.w]
q = getthreequat(QuatRotation(RotX(deg2rad(30))))
msg = Dict("type" => "set_quat", "key" => "satellite", "data" => q)
WebSockets.send(ws, json(msg))

q = QuatRotation(RotX(deg2rad(30)))

close(server)
empty!(connections)