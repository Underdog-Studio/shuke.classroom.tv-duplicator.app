const {fork} = require("child_process");
const assert = require("assert");
const Path = require("path");
const meow = require("meow");
const pm2 = require("pm2");
const util = require("util");

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

pm2.connect(async (err)=>{
    await new Promise((resolve)=>pm2.start({
        name:"shuke.classroom.tv_duplicator.app.client",
        script:Path.join(__dirname ,"/client/client.js"),
        args:[cli.flags.roomid,cli.flags.tvname]
    },resolve));
    await new Promise((resolve)=>pm2.start({
        name:"shuke.classroom.tv_duplicator.app.server",
        script:Path.join(__dirname ,"/server/server.js"),
        args:[cli.flags.roomid,cli.flags.tvname]
    },resolve));

    await new Promise((resolve)=>pm2.disconnect(resolve));
    console.log("done");
})
