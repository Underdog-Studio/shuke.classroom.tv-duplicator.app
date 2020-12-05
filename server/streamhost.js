const {spawn}=require("child_process");
const EventEmitter=require("events").EventEmitter;
const {FlvStreamParser}=require("node-flv");
const fs=require("fs");
const Path=require("path");

function getFlvHeader(firstchunk){
	let headerlen=firstchunk.readUInt32BE(5);
	return firstchunk.slice(0,headerlen);
}

class StreamHost extends EventEmitter{
	constructor(){
		super();

		this.header=Buffer.from("464c5601010000000900000000120000a40000000000000002000a6f6e4d65746144617461080000000700086475726174696f6e0000000000000000000005776964746800409e0000000000000006686569676874004090e00000000000000d766964656f64617461726174650040c312d000000000000c766964656f636f646563696400401c0000000000000007656e636f64657202000d4c61766635382e35382e313030000866696c6573697a65000000000000000000000009000000af0900002e0000000000000017000000000142c028ffe1001a6742c02895a01e0089f9610000030001000003003c0da08846a001000468ce3c8000000039","hex");
		this.state="close";

		//this.start();
	}
	start(){
		if(this.state!="close")return;
		this._meter_sum=0;
		this._meter=setInterval(()=>{
			console.log((this._meter_sum/1024).toFixed(2),"KB/s");
			this._meter_sum=0;
		},1000);
		
		let flv=new FlvStreamParser();


		flv.on("flv-header",(data)=>{
			//console.log("header",data.build());
			//this.header=data.build();
		});
		flv.on("flv-packet",(data)=>{
			this._onFFStreamData(data.build());
		});


//		this.header=null;

		//this.ff=spawn("ffmpeg",["-rtbufsize","100MB","-f","dshow","-framerate","30","-i","video=screen-capture-dxgi-qq35744025","-b","10M","-preset","ultrafast","-crf","0","-f","flv","-"]);
		this.ff=spawn(Path.join(__dirname,"DesktopStream"),[],{
			windowsHide:true
		});
		this.ff.on("close",()=>{
			console.log("exit");
			this._onFFExit();
		});
		this.ff.on("error",(err)=>{
			console.error(err);
		})
		this.ff.stderr.pipe(process.stdout);

		this.ff.stdout.pipe(flv);

		this.state="ready";
	}
	getHeader(){
		if(!this.header)
			throw new Error("No header");
		return this.header.toString("base64");
	}
	close(){
		this.ff.kill();
	}
	_onFFExit(){
		if(this.state=="close")return;

		clearInterval(this._meter);
		this.state="close";
		this.emit("close");
	}
	_onFFStreamData(data){
//		data[0]=this.id++;
		
		console.log("packet",data.length);
		this.emit("data",data);
		this._meter_sum+=data.length;

	}


}
module.exports=StreamHost;