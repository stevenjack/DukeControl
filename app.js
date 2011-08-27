
/**
 * Module dependencies.
 */

var express = require('express'),
app = module.exports = express.createServer(),
io = require('socket.io').listen(app),
util = require('util'),
exec = require('child_process').exec;

//Custom DukeBox object.

var DukeBox = {
	state:{
		master:{ enabled: true,level:80},
		left:{ enabled:true, level:80},
		right:{ enabled:true, level:80},
		currentId:null
	},
	mixer: { left: 80, right: 80, type: 'PCM' },
	getLevel: function(type){
		return this.state[type].level;
	},
	setState: function(state) {
		this.state = state;
	},
	getState: function(){
		return this.state;
	},
	setVolume: function(state){
		this.setState(state);
		this.mixer.left = Math.round((this.getLevel('left') / 100) * this.getLevel('master'));
		this.mixer.right = Math.round((this.getLevel('right') / 100) * this.getLevel('master'));
		var duke = this;
		exec("amixer -c 0 -- sset '"+this.mixer.type+"' "+this.mixer.left+"%,"+this.mixer.right+"%",
				function (error, stdout, stderr) {
				io.sockets.emit('volume',duke.getState());
			}
		);
	},
	init: function(){
		var duke = this;
		io.sockets.on('connection', function (socket) {
			socket.emit('init',duke.getState());
			socket.on('volume',function(data){
				duke.setVolume(data);
			});
		});
	}
}

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(require('stylus').middleware({ src: __dirname + '/public' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', function(req, res){
	res.render('index',{title:'DukeControl ('+DukeBox.getLevel('master')+'%)',master:DukeBox.getLevel('master'),left:DukeBox.getLevel('left'),right:DukeBox.getLevel('right')});
});

//Enable server

app.listen(5555);

//Initialise DukeBox
DukeBox.init();

console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);