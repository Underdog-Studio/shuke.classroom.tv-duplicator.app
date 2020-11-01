const os=require("os");
const assert=require("assert");

const GetJigsaw=require("jigsaw.js");
const {TCPClient,TCPServer,getLocalAddress}=require("jigsaw-tcp");

const roomid = process.argv[2];
assert(roomid,"房间id必须提供");
const tvname = process.argv[3];
assert(tvname,"TV名 必须提供");

const Player=require("./player");
const util=require("util");
const sleep=util.promisify(setTimeout);
const EventEmitter=require("events").EventEmitter;
const net=require("net");

class PlayerClient extends EventEmitter{
	constructor(option){
		super();
		assert(option);
		assert(option.monitor);
		assert(option.domserver);
		assert(option.entry);

		this.option=option;
		this.monitor=this.option.monitor;
		this.state="close";
		this.life=10;
		this.header;
		this.start();
	}
	start(){
		if(this.state!="close")
			throw new Error("at this state,can not do start");

		this.player=new Player();
		this.name="client-"+(Math.random()+"").substr(-5,5);

	
		let {jigsaw}=GetJigsaw(this.option.entry,this.option.domserver);
		this.jg=new jigsaw(this.name);

	
		//this.jg.port("streamdata",this._handleStream.bind(this));

		this.jg.on("ready",()=>{

			this._startLoop();
		});

		this.player.on("close",()=>{
			console.log("播放器被关闭")
			this.close();
		});
	}
	_handleStream(rawdata){

		this.life=10;

		let data=Buffer.from(rawdata)
		console.log(data.length);
		this.player.feed(data);
		
	}
	async _connect(){
		for(let i=0;i<5;i++){
			if(this.state != "connecting")
				throw new Error("已经停止连接");

			try{
				console.log("获取头部中...")
				this.header=Buffer.from(await this.jg.send(`${this.monitor}:getheader`),"base64");
				console.log("获取到头部",this.header);


				return;
			}catch(err){
				console.log("重试",err,i)
			}

		}
		console.error("连接超时,重试中...");
		throw new Error("连接超时");

	}
	async _startLoop(){
		this.state="connecting";
		
		await this._connect();

		this.player.feed(this.header);

		this.conn=new TCPClient(this.jg,this.option.monitor);

		this.conn.on("ready",()=>{
			console.log("ready")

			let sock=this.conn.getSocket();
			sock.on("data",this._handleStream.bind(this));

			this.state="ready";
			this.emit("ready");

		})

	}
	async close(){
		if(this.state!="close"){
			this.state="closing";
			this.player.close();
			if(this.conn)
				this.conn.close();
			await this.jg.close();
			this.state="close";
		}
	}

}


/*let client=new PlayerClient({
	monitor:"shuke.classroom.monitor",
	domserver:"apis.shukeapp.net",
	entry:getLocalAddress()
});*/

/*client.on("close",()=>{
	console.log("重新打开客户端中...");
	client.start();
})*/

let {jigsaw} = GetJigsaw(getLocalAddress(),"10.255.32.132");

let jg = new jigsaw(`shuke.classroom.tv-duplicator.slave.${roomid}.${tvname}`);
let dupl_state = 0;

let dupl_player;

async function workLoop(){
	while(true){
		try{
			let dupl_info=await jg.send(`shuke.classroom.tv-duplicator.${roomid}:getDuplInfo`,{tvname});
			if(!dupl_info)
				throw new Error("无法获取到分发信息");
			//console.log(dupl_info,dupl_state);

			if(dupl_info.type == 1 && dupl_state == 0){
				dupl_player = new PlayerClient({
					monitor:`shuke.classroom.tv-duplicator.host.${roomid}.${dupl_info.host}`,
					domserver:"10.255.32.132",
					entry:getLocalAddress()
				});
				dupl_state = 1;
				console.log("播放器已打开");
			}else if(dupl_info.type == 0 && dupl_state == 1){
				console.log("播放器开始关闭");
				dupl_state = 0;
				await dupl_player.close();
				console.log("播放器已关闭");
			}
	
		}catch(err){
			//console.error(err.message);
		}

		await sleep(1000);
	}
}

workLoop();
