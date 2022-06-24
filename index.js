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
  clientsdata.push(socket.id)
  console.log(`User ${socket.id} joined. A total of ${clientsdata.length} users are connected`);

  socket.emit('me', socket.id)

  socket.on('createRoom', (randomNum) => {
    socket.join(randomNum)
    activerooms.push({roomid: randomNum, connectedusers: [socket.id]})
    console.log(activerooms);
  })
  
  socket.on('getRooms', (roomCode) => {
    let isOld = false
    activerooms.map((e) => {
      if (e.connectedusers.includes(socket.id)) isOld = true
    })
    let auth = activerooms.find(e => e.roomid === roomCode)
    if (auth && !isOld) {
      (activerooms[activerooms.indexOf(auth)] = {roomid: auth.roomid, connectedusers: [...auth.connectedusers, socket.id]})
      socket.join(roomCode)
      socket.emit('joinStatus', {isJoined: 'Success'})
      console.log(activerooms);
    } else {
      socket.emit('joinStatus', {isJoined: 'Failure'})}
  })

  socket.on('sendMessage', ({message, id, roomid}) => {
    console.log({message, id, roomid});
    socket.to(roomid).emit('receiveMessage', {message, id})
  })

  socket.on('disconnect', () => {
    let newdata = clientsdata.filter(e => e !== socket.id)
    clientsdata = newdata
    activerooms.map(room => {
      room.connectedusers = room.connectedusers.filter(e => e !== socket.id)
    })
    activerooms = activerooms.filter(e => e.connectedusers.length !== 0)
    console.log(`A user disconnected. ${clientsdata.length} users are currently connected.`)
  })
})

const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})