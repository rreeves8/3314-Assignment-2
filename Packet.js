//return a buffer containing the information from the mthod signature
const getPacket = (messageType, numberOfPeers, senderName, peerData) => {
    //get a buffer from the sendername string
    var nameBuffer = Buffer.from(senderName, 'utf16le')

    //encode the constant data too another bnuffer
    let messageData = Buffer.alloc(31)

    messageData.writeInt32BE(7, 0, 3)
    messageData.writeInt32BE(messageType, 4, 11)
    messageData.writeInt32BE(numberOfPeers, 12, 19)
    messageData.writeInt32BE(nameBuffer.byteLength, 20, 31)

    //set up an empty peer buffer
    let peerBuffer = Buffer.alloc(0)

    if(peerData !== null){
        //if peerdata contains anything, get the buffer from the array
        peerBuffer = getPeerBuffer(peerData)
    }

    return Buffer.concat([messageData, nameBuffer, peerBuffer])
}

//dissect the incomning packet and return an object containing the data
const disectPacket = (packetBuffer) => {
    let nameLength = packetBuffer.readInt32BE(20, 31)

    return {
        versionNo: packetBuffer.readInt32BE(0, 3),
        messageType: packetBuffer.readInt32BE(4, 11),
        numberOfPeers: packetBuffer.readInt32BE(12, 19),
        nameLength: nameLength,
        senderName: packetBuffer.slice(31, 31 + nameLength).toString('utf16le'),
        peerData: disectPeerBuffer(packetBuffer.slice(nameLength + 31), packetBuffer.readInt32BE(12, 19)),
    }
}

//diect each element of the peerdata array and convert it to a buffer, 
const getPeerBuffer = (peerData) => {
    let buff = []

    peerData.forEach((element, i) => {
        const getAddress = (splitable) => {
            let addr = splitable.split(":")
            let address = addr[0].split(".")

            let addressNo = "";

            address.forEach(element => {
                addressNo += element
            })

            return addressNo += addr[1]
        }
        let encode = getAddress(element.address) + "," + element.id 

        buff.push(Buffer.from(encode, 'utf16le'))
    });

    return Buffer.concat(buff)
}

//disect the peerbuffer and return a peerarray
const disectPeerBuffer = (peerBuffer, numberOfPeers) => {
    let peers = []

    let beginning = 0
    let end = 102

    for (let i = 0; i < numberOfPeers; i++) {
        let decode = peerBuffer.toString('utf16le', beginning, end)
        let parts = decode.split(",")

        let thirds = parts[0].match(/.{1,3}/g)
        let singles = thirds[1].match(/.{1,1}/g)

        let addr = thirds[0] + "." +
            singles[0] + "." +
            singles[1] + "." +
            singles[2] + ":" +
            thirds[2] + thirds[3]

        peers.push({
            address: addr,
            id: parts[1]
        })

        beginning += 102
        end += 102
    }
    return peers
}

module.exports = {
    getPacket,
    disectPacket
}