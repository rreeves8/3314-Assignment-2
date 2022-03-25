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

    //add new peers to DHT table
    refreshBucket(newPeers) {
        if (newPeers.length !== 0) {
            newPeers.forEach((element) => {
                this.pushBucket(element)
            });
        }
    }

    //push single peer to DHT
    pushBucket(newPeer) {
        //get the shared bits between myself and new peer
        let sharedBits = getSharedBits(Hex2Bin(this.self.id), Hex2Bin(newPeer.id))

        //see if it already exists in table, index = -1 if it doesnt
        let index = this.DHT.findIndex((e) => e.bits === sharedBits);

        if (index !== -1) {
            //if shared bits already exists

            let idBinary = Hex2Bin(this.DHT[index].id)
            //get the id in binary of the already existsing one

            //find the distancse between 
            let distanceToCurrent = XORing(Hex2Bin(this.self.id), idBinary)
            let distanceToNewPeer = XORing(Hex2Bin(this.self.id), Hex2Bin(newPeer.id))

            //if the disance to the current is greater ignore the new peer
            if (distanceToCurrent > distanceToNewPeer) {
                this.DHT[index] = {
                    bits: sharedBits,
                    id: newPeer.id,
                    address: newPeer.address
                }
            }
        }
        else {
            //if doesnt already exist push it to table
            this.DHT.push({
                bits: sharedBits,
                id: newPeer.id,
                address: newPeer.address
            })
        }
    }

    async sendHello() {
        let promiseArr = []
        try {
            for (let i = 0; i < this.DHT.length; i++) {
                let element = this.DHT[i]
                let address = element.address
                let packet = getPacket(1, 0, this.self.address, null)

                promiseArr.push(send(this.self, address, packet))
            }

            await Promise.all(promiseArr)
        }
        catch(e){
            console.log("connection too: "+ e + " failed")
        }
    }

    getBucket() {
        return this.DHT
    }

    printDHT() {
        console.log("DHT TABLE: ")
        this.DHT.forEach(element => {
            console.log(element.address + " " + "[" + element.id + "]")
        })
        console.log("")
    }

}

const send = (self, address, packet) => {
    return new Promise(async (resolve, reject) => {
        console.log("sending hello too: " + "ws://" + address)
        let socket = io.connect("ws://" + new String(address).toString(), {
            extraHeaders: {
                remotePort: self.address.split(":")[1]
            },
            forceNew: true,
        })

        socket.timeout(5000).emit("my-event", (err) => {
            reject(address)
        });

        socket.on('connect', () => [
            socket.emit('hello', packet)
        ])

        socket.on('connect_failed', err => {
            console.log("Error" + err)
        })

        socket.on('GotHello', () => {
            socket.disconnect()
            resolve()
        })
    })
}

module.exports = Bucket