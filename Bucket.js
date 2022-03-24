var { XORing,
    Hex2Bin, getSharedBits } = require('./tools')
var { getPacket } = require('./Packet')

const client = require('socket.io-client')

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

            const send = () => {
                return new Promise((resolve, reject) => {
                    let socket = client("ws:/" + new String(address).toString(), {
                        extraHeaders: {
                            remotePort: this.self.port
                        },
                        forceNew: true,
                        autoConnect: false
                    })
                    console.log(socket.connect())

                    socket.on('connect', (err) => {
                        console.log("connected")
                    })

                    socket.on('GotHello', () => {
                        console.log('done')
                        resolve()
                    })

                    socket.emit('hello', (packet))

                    console.log(socket.connected)
                })
            }

            await send()

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




module.exports = Bucket