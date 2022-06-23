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


io.on('connection', (socket) => {
  console.log('A user connected: ' + socket.id);

  socket.on('sendMessage', ({message, id}) => {
    console.log({message, id});
    socket.broadcast.emit('receiveMessage', {message, id})
  })

  socket.on('disconnect', () => {
    console.log('A user disconnected')
  })
})

const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})