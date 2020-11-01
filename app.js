const {fork} = require("child_process");
const assert = require("assert");
let roomid = process.argv[2];
let tvname = process.argv[3];
assert(roomid);
assert(tvname);

fork("./client/client.js",[roomid,tvname]);
fork("./server/server.js",[roomid,tvname]);
