var Instance = function(options){
	this.name = options.name;
	this.parent = undefined;
	this.description = options.description;
};

module.exports = Instance;