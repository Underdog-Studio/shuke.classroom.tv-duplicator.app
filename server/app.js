function GetLANEntry(mac){
	let target=Object.entries(os.networkInterfaces()).find((x)=>{

		return(x[1][0].mac.split(":").join("")==mac)
	});
	return target[1][0].address;
}

const os=require("os");
const StreamHost = require("./streamhost");
const {TCPClient,TCPServer,getLocalAddress}=require("jigsaw-tcp");

const assert=require("assert");

const net=require("net");
const {jigsaw,domainserver,mapper}=require("jigsaw.js")(getLocalAddress(),"apis.shukeapp.net");

domainserver();
mapper();


let host = new StreamHost();

let jg=new jigsaw("shuke.classroom.monitor");
let server=new TCPServer(jg);


host.on("close",()=>{
	console.log("数据流的源已断开连接,重新启动中...");
	setTimeout(()=>host.start(),1000);
});

host.on("data",(data)=>{
	server.broadcast(data);
})


jg.port("getname",()=>{
	return jg.name;
});

jg.port("getheader",()=>{
	return host.getHeader().toString("base64");
})