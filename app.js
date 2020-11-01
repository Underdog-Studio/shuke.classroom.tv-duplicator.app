const {fork} = require("child_process");
const assert = require("assert");
const Path = require("path");
let roomid = process.argv[2];
let tvname = process.argv[3];
assert(roomid);
assert(tvname);

fork(Path.join(__dirname ,"/client/client.js"),[roomid,tvname]);
fork(Path.join(__dirname ,"/server/server.js"),[roomid,tvname]);
