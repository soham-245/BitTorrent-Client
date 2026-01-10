'use strict';

const dgram = require('dgram');
const Buffer = require('buffer').Buffer;
const { URL } = require('url');
const crypto = require('crypto');

module.exports.getPeers = (torrent, callback) => {
  const socket = dgram.createSocket('udp4');

  // tracker URL from torrent
  const trackerUrl = torrent.announce.toString('utf8');

  // 1. send connect request
  udpSend(socket, buildConnReq(), trackerUrl);

  socket.on('message', response => {
    if (respType(response) === 'connect') {
      // 2. receive and parse connect response
      const connResp = parseConnResp(response);

      // 3. send announce request
      const announceReq = buildAnnounceReq(connResp.connectionId);
      udpSend(socket, announceReq, trackerUrl);

    } else if (respType(response) === 'announce') {
      // 4. parse announce response
      const announceResp = parseAnnounceResp(response);

      // 5. pass peers to callback
      callback(announceResp.peers);
    }
  });

  socket.on('error', err => {
    console.error(err);
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

function respType(resp) {
  // inspect resp.readUInt32BE(0)
}

function buildConnReq() {
  const buf = Buffer.alloc(16); 
//[0-7:conn_id; 8-11:action; 12-15:trans_id;]
  buf.writeUInt32BE(0x417, 0);  //conn_id 1
  buf.writeUInt32BE(0x27101980, 4);//conn_id 2
  buf.writeUInt32BE(0, 8);  //denotes connect action(0)
  crypto.randomBytes(4).copy(buf, 12);  //random transaction id

  return buf;
}

function parseConnResp(resp) {
  return {
    action: resp.readUInt32BE(0),
    transactionId: resp.readUInt32BE(4),
    connectionId: resp.slice(8)
  }
}

function buildAnnounceReq(connId) {
  // return Buffer
}

function parseAnnounceResp(resp) {
  // return { peers }
}
