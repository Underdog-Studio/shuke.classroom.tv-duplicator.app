const {spawn}=require("child_process");


const EventEmitter=require("events").EventEmitter;

class StreamPlayer extends EventEmitter{
	constructor(ffplay_path){
		super();

		this.ffplay_path = ffplay_path;
		this.state="close";
		this.start();
	}
	start(){
		if(this.state!="close")return;

		this.ff=spawn(this.ffplay_path,["-f","flv","-fflags","nobuffer","-analyzeduration","100","-flags","low_delay","-framedrop","-strict","experimental","-probesize","128","-sync","ext","-i","-"]);
		this.ff.stdin.on("error",()=>{});
		this.ff.stderr.pipe(process.stderr);

		this.ff.on("close",()=>{
			this._onFFExit();
		});
		//this.ff.stderr.pipe(process.stdout);
		this.ff.on("error",(err)=>{
			console.error(err);
		})
		this.state="ready";
	}
	close(){
		this.ff.kill();
	}
	feed(data){
		if(this.state=="ready"){
			this.ff.stdin.write(data);

		}
	}
	_onFFExit(){

		if(this.state=="close")return;

		this.state="close";
		this.emit("close");

	}
	_onFFStreamData(data){
		this.emit("data",data);
	}


}
module.exports=StreamPlayer;