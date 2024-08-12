using HTTP
using HTTP.WebSockets
using CoordinateTransformations, Rotations
using LinearAlgebra
using JSON
using StaticArrays

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

WebSockets.send(ws, "Hello from Julia!")


pos = [7000, 0, -1]
msg = Dict("type" => "set_position", "key" => "satellite", "data" => pos)
WebSockets.send(ws, json(msg))

getthreequat(q::QuatRotation) = SA[q.x, q.y, q.z, q.w]
q = getthreequat(QuatRotation(RotX(deg2rad(30))))
msg = Dict("type" => "set_quat", "key" => "satellite", "data" => q)
WebSockets.send(ws, json(msg))

q = QuatRotation(RotX(deg2rad(30)))

close(server)
empty!(connections)