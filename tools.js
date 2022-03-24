var crypto = require('crypto')
var fp = require("find-free-port")

const getID = (ip) => {
    var shasum = crypto.createHash('sha1')
    shasum.update(ip)
    return (shasum.digest('hex'))
}

const getIP = (argv) => {
    let args = argv.p.split(":")
    let ip = args[0].toString()
    let port = args[1].toString()

    return {
        address: argv.p,
        ip,
        port
    }
}

const Hex2Bin = function (hex) {
    var bin = ""
    hex.split("").forEach(str => {
        bin += parseInt(str, 16).toString(2).padStart(8, '0')
    })
    return bin
}

const XORing = function (a, b) {
    let ans = "";
    for (let i = 0; i < a.length; i++) {
        // If the Character matches
        if (a[i] == b[i])
            ans += "0";
        else
            ans += "1";
    }
    return ans;
}


const getSharedBits = (binarySelf, binaryNewPeer) => {
    let sharedBits = 0;
    for (let i = 0; i < 20; i++) {
        if (binarySelf[i] === binaryNewPeer[i]) {
            sharedBits++
        }
    }
    return sharedBits
}

const getPort = async () => {
    return new Promise((resolve, reject) => {
        fp(3000, "127.0.0.1", (err, port) => {
            if(err) throw err
            resolve(port)
        });
    })
}

module.exports = {
    getPort,
    getID,
    getIP,
    XORing,
    Hex2Bin,
    getSharedBits
}