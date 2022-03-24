var { XORing,
    Hex2Bin, getSharedBits } = require('./tools')
var { getPacket } = require('./Packet')

const io = require('socket.io-client')

//dht = Array<{ bits: array, id: string, address: string}>()

class Bucket {
    constructor(peer) {
        this.DHT = new Array()
        this.self = peer
    }

    refreshBucket(newPeers) {
        if (newPeers.length !== 0) {
            newPeers.forEach((element) => {
                this.pushBucket(element)
            });
        }
    }

    pushBucket(newPeer) {
        let sharedBits = getSharedBits(Hex2Bin(this.self.id), Hex2Bin(newPeer.id))
        let index = this.DHT.findIndex((e) => e.bits === sharedBits);

        if (index !== -1) {
            let idBinary = Hex2Bin(this.DHT[index].id)

            let distanceToCurrent = XORing(Hex2Bin(this.self.id), idBinary)
            let distanceToNewPeer = XORing(Hex2Bin(this.self.id), Hex2Bin(newPeer.id))

            if (distanceToCurrent > distanceToNewPeer) {
                this.DHT[index] = {
                    bits: sharedBits,
                    id: newPeer.id,
                    address: newPeer.address
                }
            }
        }
        else {
            this.DHT.push({
                bits: sharedBits,
                id: newPeer.id,
                address: newPeer.address
            })
        }
    }

    async sendHello() {
        for (let i = 0; i < this.DHT.length; i++) {
            let element = this.DHT[i]
            let address = element.address
            let packet = getPacket(1, 0, this.self.address, null)

            console.log("sending hello too: " + "ws://" + address)

            await send(this.self, address, packet)

            client.disconnect()
        }

    }

    getBucket() {
        return this.DHT
    }

    printDHT() {
        this.DHT.forEach(element => {
            console.log(element.address + " " + "[" + element.id + "]")
        })
    }

}

const send = (self, address, packet) => {
    return new Promise(async (resolve, reject) => {
        console.log("ws://" + new String(address).toString())

        let socket = io.connect("http://" + new String(address).toString(), {
            extraHeaders: {
                remotePort: self.port
            },
            forceNew: true,
            timeout: 5000,
        })

        socket.timeout(5000).emit("no_connection", (err) => {
            if (err) {
                console.log(err)
            }
            else {
                console.log("connected")
                socket.emit('hello', (packet))
            }
        });

        socket.on('connect_failed', err => {
            console.log("Error" + err)
        })

        socket.on('GotHello', () => {
            console.log('done')
            resolve()
        })

        console.log(socket.connected)
    })
}



module.exports = Bucket