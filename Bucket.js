var { XORing,
    Hex2Bin, getSharedBits } = require('./tools')

var { getPacket } = require('./Packet')

//dht = Array<{ bits: array, id: string, address: string}>()

class Bucket {
    constructor(peer) {
        this.DHT = new Array()
        this.self = peer
    }

    refreshBucket(newPeers) {
        if(newPeers.length !== 0){
            newPeers.forEach((element) => {
                this.pushBucket(element)
            });
        }
    }

    pushBucket(newPeer) {
        let sharedBits = getSharedBits(Hex2Bin(this.self.id), Hex2Bin(newPeer.id))
        let index = this.DHT.findIndex((e) => e.bits === sharedBits);
       
        if(index !== -1){
            let idBinary = Hex2Bin(this.DHT[index].id)

            let distanceToCurrent = XORing(Hex2Bin(this.self.id), idBinary)
            let distanceToNewPeer = XORing(Hex2Bin(this.self.id), Hex2Bin(newPeer.id))

            if(distanceToCurrent > distanceToNewPeer){
                this.DHT[index] = {
                    bits: sharedBits,
                    id: newPeer.id,
                    address: newPeer.address
                }
            }
        }
        else{
            this.DHT.push({
                bits: sharedBits,
                id: newPeer.id,
                address: newPeer.address
            })
        }
    }

    sendHello(net){
        this.DHT.forEach((element) => {
            let client = net.Socket()
            let address = element.address.split(":")

            client.connect(address[1], address[0], (err) => {
                console.log(err)
            })

            let packet = getPacket(1, this.DHT.length, new String(this.self.peerNum).toString(), this.DHT)

            client.write(packet)
            client.end()
        });
    }

    getBucket(){
        return this.DHT
    }

    printDHT(){
        this.DHT.forEach(element => {
            console.log(element.address + " " + "[" + element.id +"]")
        })
    }

}

module.exports = Bucket