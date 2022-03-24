var { getPacket,
    disectPacket } = require('./Packet')
var { getID, getIP } = require('./tools')

let packet = getPacket(1,2, "magnus", [{ address: "127.0.0.1:2722", id: getID("127.0.0.1:2722") }, { address: "127.0.0.1:2523", id: getID("127.0.0.1:2523") }])

console.log(packet)

console.log(disectPacket(packet))