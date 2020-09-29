const os=require("os");
const assert=require("assert");

const GetJigsaw=require("jigsaw.js");
const {TCPClient,TCPServer,getLocalAddress}=require("jigsaw-tcp");

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
			try{
				console.log("获取头部中...")
				this.header=Buffer.from(await this.jg.send(`${this.monitor}:getheader`),"base64");
				console.log("获取到头部",this.header);


				return true;
			}catch(err){
				console.log("重试",err,i)
			}

		}
		console.error("连接超时,重试中...");
		return false;
	}
	async _startLoop(){
		this.state="connecting";
		
		if(!(await this._connect())){
			this.close();
			return;
		}


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
			this.player.close();
			this.conn.close();
			await this.jg.close();
			this.state="close";
		}
	}

}


let client=new PlayerClient({
	monitor:"shuke.classroom.monitor",
	domserver:"apis.shukeapp.net",
	entry:getLocalAddress()
});

/*client.on("close",()=>{
	console.log("重新打开客户端中...");
	client.start();
})*/
