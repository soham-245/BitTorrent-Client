'use strict';

const fs = require('fs');
const bencode = require('bencode');
const tracker = require('./src/tracker');
const torrentParser = require('./src/torrent-parser');
const download = require('./src/download.js');

const torrent = torrentParser.open(process.argv[2]);

// tracker.getPeers(torrent, peesrs => {
//   console.log('list of peers: ', peers);
// });


setTimeout(() => {}, 10000);