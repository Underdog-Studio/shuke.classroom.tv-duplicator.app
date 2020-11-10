const {fork} = require("child_process");
const assert = require("assert");
const Path = require("path");
const meow = require("meow");
const cli = meow(`
	Usage
		$ npm start -- --roomid <roomid> --tvname <tvname>
`,{flags:{
    roomid:{
        type:"string",
        isRequired:true
    },
    tvname:{
        type:"string",
        isRequired:true
    }
}});

fork(Path.join(__dirname ,"/client/client.js"),[cli.flags.roomid,cli.flags.tvname]);
fork(Path.join(__dirname ,"/server/server.js"),[cli.flags.roomid,cli.flags.tvname]);
