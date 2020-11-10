const assert = require("assert");
const os=require("os");
const sleep=require("util").promisify(setTimeout);
const config=require("./config");

const roomid = process.argv[2];
assert(roomid,"房间id 必须提供");
const tvname = process.argv[3];
assert(tvname,"TV名 必须提供");


const StreamHost = require("./streamhost");
const {TCPClient,TCPServer,getLocalAddress}=require("jigsaw-tcp");


const {jigsaw}=require("jigsaw.js")(getLocalAddress(),config.domain_server);

let host = new StreamHost();
let dupl_state = false;

let jg=new jigsaw(`shuke.classroom.tv-duplicator.host.${roomid}.${tvname}`);
let server=new TCPServer(jg);

host.on("close",()=>{
	if(dupl_state){
		console.log("数据流的源已断开连接,重新启动中...");
		setTimeout(()=>host.start(),1000);
	}
});

host.on("data",(data)=>{
	server.broadcast(data);
});


jg.port("getname",()=>{
	return jg.name;
});

jg.port("getheader",()=>{
	return host.getHeader().toString("base64");
})





async function workLoop(){
	while(true){
		try{
			let dupl_info = await jg.send(`shuke.classroom.tv-duplicator.${roomid}:getDuplInfo`,{tvname});

			if(!dupl_info.dupling && dupl_state){
				dupl_state = false;
				host.close();
				console.log("host已关闭");
			}else if(dupl_info.dupling && !dupl_state){
				dupl_state = true;
				host.start();
				console.log("host已打开");
			}
		}catch(err){
			//console.error(err);
		}
		await sleep(1000);
	}

}

workLoop();
