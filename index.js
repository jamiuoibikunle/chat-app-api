const app = require('express')()
const http = require('http')
const { Server } = require('socket.io')
const server = http.createServer(app)
const cors = require('cors')

app.use(cors())

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

let clientsdata = []
let activerooms = []

io.on('connection', (socket) => {
  // Gets the number of connections
  clientsdata.push(socket.id)
  console.log(`User ${socket.id} joined. A total of ${clientsdata.length} users are connected`);

  // Emit socket ID upon connection
  socket.emit('me', socket.id)

  // Logic for creating rooms
  socket.on('createRoom', (randomNum) => {

    // Leave all rooms and join new one
    let userrooms = activerooms.filter(e => e.connectedusers.includes(socket.id))
    userrooms.map((eachroom) => {
      socket.leave(eachroom.roomid)
    })
    
    // Joins the new room and pushes it to the activerooms
    socket.join(randomNum)
    activerooms.push({roomid: randomNum, connectedusers: [socket.id]})
    console.log(io.sockets.adapter.rooms);
  })
  
  socket.on('getRooms', (roomCode) => {
    
    // Check if user is connected to a room
    let isOld = false
    activerooms.map((e) => {
        if (e.connectedusers.includes(socket.id)) isOld = true
    })
    
    // Remove user from previous rooms
    if (!isOld) {
      let checkrooms = activerooms.filter(e => e.connectedusers.includes(socket.id))
      checkrooms.map((eachroom) => {
      socket.leave(eachroom.roomid)
    })}
    
    // If room exists and user is in no other room
    let auth = activerooms.find(e => e.roomid === roomCode)
    if (auth && !isOld) {
      // Add user to new room
      (activerooms[activerooms.indexOf(auth)] = {roomid: auth.roomid, connectedusers: [...auth.connectedusers, socket.id]})
      socket.join(roomCode)
      socket.emit('joinStatus', {isJoined: 'Success'})
      socket.broadcast.to(roomCode).emit('newJoin', {newJoin: 'True'})
      console.log(activerooms);
      console.log(io.sockets.adapter.rooms);
    } else if (isOld) {
      socket.emit('joinStatus', {isJoined: 'Duplicate'})
    } else {
      socket.emit('joinStatus', {isJoined: 'Failure'})}
    })
    
  socket.on('sendMessage', ({message, id, roomid, sender, created}) => {
    console.log({message, id, roomid, sender, created});
    socket.to(roomid).emit('receiveMessage', {message, id, sender, created})
  })

  socket.on('disconnect', () => {

    // Remove user from clientsdata
    let newdata = clientsdata.filter(e => e !== socket.id)
    clientsdata = newdata

    // Remove user from the activerooms
    activerooms.map(room => {
      room.connectedusers = room.connectedusers.filter(e => e !== socket.id)
    })

    // Delete room from activerooms when participants is zero
    activerooms = activerooms.filter(e => e.connectedusers.length !== 0)
    console.log(`A user disconnected. ${clientsdata.length} users are currently connected.`)
  })
})

const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})