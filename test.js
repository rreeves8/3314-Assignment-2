const fsPromises = require('fs').promises;
const client = require('socket.io-client')

const move = async () => {
    let socket = client("ws://127.0.0.1:3001")
    socket.emit('hello')
}

move()