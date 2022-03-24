const fsPromises = require('fs').promises;
const { DESTRUCTION } = require('dns');
const { io } = require('socket.io-client')

const move = async () => {
    await send({ port: 3002 }, "127.0.0.1:3001", null)
    await send({ port: 3002 }, "127.0.0.1:3001", null)
}

const send = (self, address, packet) => {
    return new Promise((resolve, reject) => {
        let socket = io("ws://127.0.0.1:3001", {
            extraHeaders: {
                remotePort: self.port
            },
            forceNew: true,
            reconnection: true
        })

        socket.on('connect', (err) => {
            console.log("connected")
        })

        socket.on('GotHello', () => {
            console.log('done')
            socket.disconnect()
            resolve()
        })

        socket.emit('hello', (packet))
    })
}

move()