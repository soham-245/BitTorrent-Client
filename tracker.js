'use strict';

const dgram = require('dgram');
const Buffer = require('buffer').Buffer;
const { URL } = require('url');
const crypto = require('crypto');
const util = require('./util');
const torrentParser = require('./torrent-parser');

let connTransactionId;
let announceTransactionId;

module.exports.getPeers = (torrent, callback) => {
  const socket = dgram.createSocket('udp4');
  const trackerUrl = 'udp://tracker.opentrackr.org:1337/announce';  //fixed since earlier wasnt working
  udpSend(socket, buildConnReq(), trackerUrl); //conn req
  socket.on('message', response => {
    const type = respType(response);

    if (type==='connect') {
        if (response.readUInt32BE(4) !== connTransactionId.readUInt32BE(0)) {
            return; // ignore invalid response
        }
        const connResp = parseConnResp(response);

        const announceReq = buildAnnounceReq(connResp.connectionId,torrent);
        udpSend(socket, announceReq, trackerUrl);
    } 
    else if (type==='announce') {
      if(response.readUInt32BE(4)!==announceTransactionId.readUInt32BE(0)) return;
      
      const announceResp = parseAnnounceResp(response);
      callback(announceResp.peers);

      socket.close();
    }
    else if(type==='error'){
      console.log('Tracker error: ',response.toString('utf8',8));
      socket.close();
    }
  });

  socket.on('error', err => {
    console.error(`Tracker error: ${err}`);
    socket.close();
  });
};

function udpSend(socket, message, rawUrl, callback = () => {}) {
  const url = new URL(rawUrl);
  socket.send(
    message,
    0,
    message.length,
    Number(url.port),
    url.hostname,
    callback
  );
}

// Protocol helpers
function respType(resp) {   //returns type of response
  const action = resp.readUInt32BE(0);
  if(action===0) return 'connect';
  if(action===1) return 'announce';
  if(action===3) return 'error';
}

function buildConnReq() {
  const buf = Buffer.alloc(16); 

  buf.writeUInt32BE(0x417, 0);  //conn_id 1
  buf.writeUInt32BE(0x27101980, 4);//conn_id 2
  buf.writeUInt32BE(0, 8);  //denotes connect action(0)
  connTransactionId = crypto.randomBytes(4);  //random transc id
  connTransactionId.copy(buf, 12);
  return buf;
}

function parseConnResp(resp) {
  return {
    action: resp.readUInt32BE(0),
    transactionId: resp.readUInt32BE(4),
    connectionId: resp.slice(8)
  }
}

function buildAnnounceReq(connId, torrent, port=6881) {
  const buf = Buffer.alloc(98);
  connId.copy(buf, 0);  // conn id
  buf.writeUInt32BE(1, 8);    // action
  announceTransactionId=crypto.randomBytes(4);  // transc id
  announceTransactionId.copy(buf,12);
  torrentParser.infoHash(torrent).copy(buf, 16);  // info hash
  util.genId().copy(buf, 36);   // peerId
  Buffer.alloc(8).copy(buf, 56);    // downloaded
  torrentParser.size(torrent).copy(buf, 64);    // left
  Buffer.alloc(8).copy(buf, 72);    // uploaded
  buf.writeUInt32BE(0, 80); // event
  buf.writeUInt32BE(0, 84); // ip address
  crypto.randomBytes(4).copy(buf, 88);  // key
  buf.writeInt32BE(50, 92); // num want
  buf.writeUInt16BE(port, 96);  // port
  return buf;
}

function parseAnnounceResp(resp) {
  function group(iterable, groupSize) {
    let groups = [];
    for (let i = 0; i < iterable.length; i += groupSize) {
      groups.push(iterable.slice(i, i + groupSize));
    }
    return groups;
  }

  return {
    action: resp.readUInt32BE(0),
    transactionId: resp.readUInt32BE(4),
    // interval: resp.readUInt32BE(8),
    // leechers: resp.readUInt32BE(12),
    leechers: resp.readUInt32BE(8),
    seeders: resp.readUInt32BE(12),
    peers: group(resp.slice(20), 6).map(address => {
      return {
        ip: address.slice(0, 4).join('.'),
        port: address.readUInt16BE(4)
      }
    })
  }
}
