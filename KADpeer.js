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

//function for initializing the server and setting up its own port number
const init = async () => {
    port = await getPort()
    io = new Server()

    myId = {
        id: getID(host + port),
        peerNum: 0,
        address: host + ":" + port
    }

    io.on("connection", (socket) => {
        //get remote port from inbound headers
        var remotePort = socket.request.headers.remoteport
        console.log("Connection from peer 127.0.0.1:" + remotePort + "\n")

        socket.on('NewConnection', () => {
            //new connection established, send bucket but dont include the new connection
            let DHT = bucket.getBucket()

            let newPeer = {
                address: host + ":" + remotePort,
                id: getID(host + remotePort)
            }

            //send received and its DHT table
            socket.emit("recieved", getPacket(1, DHT.length, 'peer' + myId.peerNum, DHT))

            bucket.pushBucket(newPeer)

            console.log("New Connection Sending DHT Table" + "\n")

            //added the new connection and print the new table
            console.log("Updating Self:")
            bucket.printDHT()
        })

        socket.on('hello', (data) => {
            //received hello, add incoming packet to dht table
            try {
                let packet = disectPacket(data)

                if (packet.versionNo === 7) {
                    console.log("Recieved Hello from: " + packet.senderName + " , updating DHT...")
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
            //respond with got hello
            socket.emit('GotHello')
        })
    })

    io.listen(port)
}


const main = async () => {
    //pause for initializiation
    await init()

    bucket = new Bucket(myId)

    //if there are arguments, connect to existsing network
    if (argv.p !== undefined) {
        let inputConn = getIP(argv)

        //wait for response from other end then send hello
        console.log("connecting.....")

        //create a new socket io, connect to the given arguments, pass my own port
        let client = clientIo("ws://" + inputConn.address, {
            extraHeaders: {
                remotePort: port
            },
            forceNew: true
        })

        // pass the new connection to initinalization function, wait for network to accept myself
        await initialization(client).catch(()=> {
            throw new Error("Enter a proper port")
        })

        client.disconnect()

        //wait half a second for fun
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
    //if no arguments build a new network
    else {
        myId.peerNum = 1
        console.log(
            "This peer address is 127.0.0.1: " + port +
            " located at peer 1 " + myId.id + "\n"
        )
    }
}

let initialization = (client) => {
    //wait for system to resolve using promise
    return new Promise((resolve, reject) => {
        //wait 5 seconds, if nothing reject
        client.timeout(5000).emit("my-event", (err) => {
            reject()
        });

        //received listener, update DHT table with new content
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

        //tell connected we're new to the network and need a DHT table
        client.emit("NewConnection")
    })
}


main()