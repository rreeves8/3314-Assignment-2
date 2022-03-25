const fsPromises = require('fs').promises;
const { io } = require('socket.io-client')
const Bucket = require('./Bucket')

const move = async () => {

    await send({ address: "127.0.0.1:3001", id: "werwadfsxcg3456", port: 4234 }, "127.0.0.1:3029", null)
}

const send = (self, address, packet) => {
    console.log("ws://" + new String(address).toString())

    let socket = io.connect("ws://" + new String(address).toString(), {
        extraHeaders: {
            remotePort: self.address.split(':')[1]
        },
        forceNew: true,
        timeout: 5000,
    })

    socket.on('connect_failed', err => {
        console.log("Error" + err)
    })

    socket.on('GotHello', () => {
        console.log('done')
    })

    console.log(socket.connected)

}

move()