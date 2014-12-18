var Instance = function(options){
	this.name = options.name;
	this.parent = undefined;
	this.description = options.description;
};

Instance.prototype.getItem = function(name, cb){
	if(this.name === name){
		cb(this);
	}
}
