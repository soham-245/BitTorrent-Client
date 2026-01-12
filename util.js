'use strict';

const crypto = require('crypto');

let id=null;

module.exports.genId= ()=> {
    if(!id){
        id=crypto.randomBytes(20);
        Bufffer.from('-AT0001-').copy(id,0);
    }
    return id;
};

