var socket = null;
var DukeBox = {
	state:{
		master:{ enabled: true, level:50 },
		left:{ enabled:true, level:80 },
		right:{ enabled:true, level:90 },
		currentId:null
	},
	buttonStates:{ enabled:'In call', disabled: 'Call finished'},
	setHold: function(element) {
		type = element.parent().data('type');
		this.state[type].enabled = this.state[type].enabled ? false : true;
		this.setVolume(true).emit();
		return this;
	},
	volumeEvent: function(state) {
		this.setState(state);
		if(this.state.currentId != socket.socket.sessionid){
			this.setVolume(false);
		}
		return this;
	},
	clickStateChange: function(element,direction){
		var type = element.parent().data("type"),
		testValue = element.parent().find(".range").val(),
		newLevel = testValue;
		this.state.currentId = socket.socket.sessionid;
		
		switch(direction){
			case 'down':
				var newVol = testValue - 1;
				if(newVol >= 0) newLevel = newVol;
			break;
		
			case 'up':
				var newVol = parseInt(testValue) + 1;
				if(newVol <= 100) newLevel = newVol;
			break;
		}
		
		this.setLevel(type,newLevel).setVolume(false).emit();
		return this;
	},
	stateChange: function(element) {
		type = element.parent().data('type');
		this.state.currentId = socket.socket.sessionid;
		this.setLevel(type,element.val()).setVolume(true).emit();
		return this;
	},
	emit: function(){
		socket.emit('volume',this.getState());
		return this;
	},
	getLevel: function(type){
		return this.state[type].level;
	},
	setLevel: function(type,level){
		this.state[type].level = level;
		return this;
	},
	setState: function(state) {
		this.state = state;
		return this;
	},
	getState: function(){
		return this.state;
	},
	setVolume: function(local){
		for(key in this.state){
			if(key != 'currentId'){
				var holder = $("#"+key+"-holder");
				if(!local) holder.find(".range").val(this.state[key].level);
				holder.find("h1 span").html(this.state[key].level+"%");
				if(this.state[key].enabled){
					holder.find(".call-status").val(this.buttonStates.enabled);
					holder.find("input.can-disable").removeAttr("disabled");
				}else{
					holder.find(".call-status").val(this.buttonStates.disabled);
					holder.find("input.can-disable").attr("disabled",true);						
				}
			}
		}
		document.title = "DukeControl ("+this.getLevel('master')+"%)";
		return this;
	},
	init: function(data){
		this.setState(data).setVolume(false);
		var duke = this;
		socket.on('volume',function(data){
			duke.volumeEvent(data);
		});
	}
};

$(document).ready(function(){
	socket = io.connect('http://192.168.10.170');
	socket.on('init',function(data){
		DukeBox.init(data);
	});
	
	$(".range").bind("change",function(){
		var item = $(this);
		DukeBox.stateChange(item);
	});
	
	$("input.call-status").bind("click",function(){
		var item = $(this);
		DukeBox.setHold(item);
	});
	
	$("input.up,input.down").bind("click",function(){
		var item = $(this);
		var direction = $(this).hasClass("up") ? "up" : "down";
		DukeBox.clickStateChange(item,direction);
	});
});