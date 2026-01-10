'use strict';

const dgram = require('dgram');
const Buffer = require('buffer').Buffer;
const { URL } = require('url');

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
  // return Buffer
}

function parseConnResp(resp) {
  // return { connectionId }
}

function buildAnnounceReq(connId) {
  // return Buffer
}

function parseAnnounceResp(resp) {
  // return { peers }
}
