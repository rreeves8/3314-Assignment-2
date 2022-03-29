var crypto = require('crypto')
var fp = require("find-free-port")
var net = require('net');

const getID = (ip) => {
    //return the id or hash of the ip
    var shasum = crypto.createHash('sha1')
    shasum.update(ip)
    return (shasum.digest('hex'))
}

const getIP = (argv) => {
    //dissect the arguments and return an object contaning the values
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
    //match the binary arrays and return the number of similars
    let sharedBits = 0;
    for (let i = 0; i < 20; i++) {
        if (binarySelf[i] === binaryNewPeer[i]) {
            sharedBits++
        }
    }
    return sharedBits
}

const checkPort = (port) => {
    //confirm the random port is actually avaibale by opening a server and then closing it if it works
    return new Promise((resolve, reject) => {
        var server = net.createServer();
        server.once('error', function (err) {
            if (err.code === 'EADDRINUSE') {
                resolve(false)
            }
        });

        server.once('listening', function () {
            // close the server if listening doesn't fail
            server.close();
            resolve(true)
        });

        server.listen(port);
    })
}

const getPort = () => {
    //get a random port
    return new Promise((resolve, reject) => {
        fp(3000, "127.0.0.1", async (err, port) => {
            //find a random non active port

            let check = true
            while (check) {
                //increase it by some magnitude to ensure randomness
                port += Math.floor((Math.random() * 10000))
                //confirm it is available
                if(await checkPort(port)){
                    check = false
                }
            }

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