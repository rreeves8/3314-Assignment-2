var argv = require('optimist').argv;
var Bucket = require('./Bucket')
var net = require("net")
var { getID, getIP } = require('./tools')
var { getPacket, disectPacket } = require('./Packet')

let host = "127.0.0.1"

const peer = net.createServer();
peer.listen();

let bucket;

let myId = {
    id: getID(host + peer.address().port),
    peerNum: 0,
    address: host + ":" + peer.address().port
}

const main = async () => {
    bucket = new Bucket(myId)

    if (argv.p !== undefined) {
        let inputConn = getIP(argv)

        await initialization(net.Socket().connect(inputConn.port, inputConn.ip, () => {
            console.log("connecting....")
        }), inputConn)

        bucket.sendHello(net)

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
            "This peer address is 127.0.0.1: " + peer.address().port +
            " located at peer 1 " + myId.id
        )
    }
}

let initialization = (client, inputConn) => {
    return new Promise((resolve, reject) => {
        client.on("data", (data) => {
            let packet = disectPacket(data)

            myId.peerNum = packet.numberOfPeers + 1

            console.log(
                "Connected to " + packet.senderName + "\n" +
                "This peer address is 127.0.0.1:" + peer.address().port + " located at " + +" " + myId.id
            )

            bucket.refreshBucket(packet.peerData)
            
            client.destroy()
            
            resolve()
        })
    })
}


peer.on("connection", (socket) => {
    let DHT = bucket.getBucket()
    
    let connPort = new Number(socket.remotePort).toPrecision() - 1
    let connPortStr = new String(connPort).toString()

    let newPeer = {
        address: host + ":" + connPortStr,
        id: getID(host + connPortStr)
    }
    
    socket.write(getPacket(1, DHT.length, 'peer' + myId.peerNum, DHT))

    bucket.pushBucket(newPeer)

    console.log("connection from peer 127.0.0.1:" + connPortStr)

    bucket.printDHT()
})

peer.on("data", (data) => {
    let packet = disectPacket(data)

    if(packet.versionNo === 7){
        bucket.refreshBucket(packet.peerData)
        bucket.printDHT()
    }
})

main()