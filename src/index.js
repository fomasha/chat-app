const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')

const { generateMessage, generateLocationMessage } = require('./utils/messages')
const {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom,
} = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server) 

const port = process.env.PORT || 3001
const public = path.join(__dirname, '../public')

app.use(express.static(public))

io.on('connection', (socket) => {
    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room })

        if (error) {
            return callback(error)
        }

        socket.join(user.room)
        socket.emit('message', generateMessage('Admin', 'Welcome'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined`))
        io.to(user.room).emit('roomData', { users: getUsersInRoom(user.room), room: user.room })

        callback()
    })
    
    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)

        if (!user) {
            return callback('Unable to send message')
        }

        const filter = new Filter()

        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed')
        }

        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback()
    })

    socket.on('sendLocation', ({ latitude, longitude }, callback) => {
        const user = getUser(socket.id)

        if (!user) {
            return callback('Unable to send message')
        }

        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps/?q=${latitude},${longitude}`))
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has leaved`))
            io.to(user.room).emit('roomData', { users: getUsersInRoom(user.room), room: user.room })
        }
    })
})

server.listen(port, () => {
    console.log(`Chat app is listening on port ${port}`)
})