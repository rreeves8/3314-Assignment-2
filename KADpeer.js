var argv = require('optimist').argv;
var Bucket = require('./Bucket')

const { Server } = require("socket.io");
const clientIo = require("socket.io-client")

var { getID, getIP, getPort } = require('./tools')
var { getPacket, disectPacket } = require('./Packet')

let host = "127.0.0.1"
let port;
let bucket;
var io;
let myId;

const init = async () => {
    port = await getPort()
    io = new Server()

    myId = {
        id: getID(host + port),
        peerNum: 0,
        address: host + ":" + port
    }

    io.on("connection", (socket) => {
        var remotePort = socket.request.headers.remoteport
        console.log("Connection from peer 127.0.0.1:" + remotePort + "\n")

        socket.on('NewConnection', () => {
            let DHT = bucket.getBucket()

            let newPeer = {
                address: host + ":" + remotePort,
                id: getID(host + remotePort)
            }

            socket.emit("recieved", getPacket(1, DHT.length, 'peer' + myId.peerNum, DHT))

            bucket.pushBucket(newPeer)

            console.log("New Connection Sending DHT Table" + "\n")

            console.log("Updating Self:")
            bucket.printDHT()
        })

        socket.on('hello', (data) => {
            try {
                let packet = disectPacket(data)

                if (packet.versionNo === 7) {
                    console.log("Recieved Hello from: " + packet.senderName + " , updating DHT..." )
                    bucket.pushBucket({
                        address: packet.senderName,
                        id: getID(packet.senderName)
                    })

                    bucket.printDHT()
                }
            }
            catch {
                console.log("bad packet")
            }

            socket.emit('GotHello')
        })
    })

    io.listen(port)
}


const main = async () => {
    await init()

    bucket = new Bucket(myId)

    if (argv.p !== undefined) {
        let inputConn = getIP(argv)

        //wait for response from other end then send hello
        console.log("connecting.....")

        let client = clientIo("ws://" + inputConn.address, {
            extraHeaders: {
                remotePort: port
            },
            forceNew: true
        })

        await initialization(client)

        client.disconnect()

        await new Promise(resolve => setTimeout(resolve, 500));

        //send hello to others not including the inputted
        await bucket.sendHello()

        //push the connected one
        bucket.pushBucket({
            id: getID(inputConn.address),
            address: inputConn.address
        })

        console.log("connected to the system with DHT table: ")
        bucket.printDHT()
    }
    else {
        myId.peerNum = 1
        console.log(
            "This peer address is 127.0.0.1: " + port +
            " located at peer 1 " + myId.id + "\n"
        )
    }
}

let initialization = (client) => {
    return new Promise((resolve, reject) => {
        client.on("recieved", (data) => {
            let packet = disectPacket(data)

            myId.peerNum = packet.numberOfPeers + 1

            console.log(
                "Connected to " + packet.senderName + "\n" +
                "This peer address is 127.0.0.1:" + port + " located at " + +" " + myId.id + "\n"
            )

            bucket.refreshBucket(packet.peerData)

            resolve()
        })

        client.emit("NewConnection")
    })
}



main()