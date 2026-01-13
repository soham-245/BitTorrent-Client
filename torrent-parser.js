'use strict';

const fs = require('fs');
const bencode = require('bencode');

module.exports.open = (filepath) =>{
    return bencode.decode(fs.readFileSync(filepath));
};

module.exports.size = torrent=>{
    const size = torrent.info.files ?
        torrent.info.files.reduce((sum,file)=>sum+BigInt(files.length),0n)
        : BigInt(torrent.info.length);
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64BE(size,0);
    return buf;

};

module.exports.infoHash = torrent =>{
    const info = bencode.encode(torrent.info);
    return crypto.createHash('sha1').update(info).digest();
};