const express = require("express")
const path = require('path')
const http = require("http")
const socketio = require("socket.io")
const Filter = require("bad-words")
const {generateMessage, generateLocation} = require("./utils/messages")
const {addUser, removeUser, getUser, getUsersInRoom} = require("./utils/users")

const port = process.env.PORT || 3000
const app = express()
const server = http.createServer(app)
const io = socketio(server)

app.use(express.json())

const publicDir = path.join(__dirname, '../public')

app.use(express.static(publicDir))


io.on("connection", (socket)=>{
    console.log("New WebSocket connection")

    socket.on("join", ({username, room}, callback)=>{
        const { error, user} = addUser({id: socket.id, username, room})
        if(error){
            return callback(error)
        }
        socket.join(user.room)

        socket.emit("message", generateMessage("System", "Welcome to the app!"))
        socket.broadcast.to(user.room).emit("message", generateMessage("System",`${user.username} has joined the room!`))
        io.to(user.room).emit("roomData", {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()

    })

    socket.on("sendMessage", (msg, callback)=>{
        const user = getUser(socket.id)
        
        const filter = new Filter()
        if(filter.isProfane(msg)){
            return callback("Profanity is not allowed fucker!")
        }
        io.to(user.room).emit("message", generateMessage(user.username,msg))
        callback()
    })

    socket.on("sendLocation", (location, callback)=>{
        const user = getUser(socket.id)
        const msg = `https://google.com/maps?q=${location.latitude},${location.longitude}`
        io.to(user.room).emit("locationMessage", generateLocation(user.username,msg))
        callback("Location Shared!")
    })

    socket.on("disconnect", ()=>{
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit("message", generateMessage("System",`${user.username} has left the room!`))
            io.to(user.room).emit("roomData", {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })

})

server.listen(port, ()=>{
    console.log("Server is up on port " + port)
})