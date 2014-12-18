var Tree = function(value){
	this.value = value;
	this.children = [];
};

Tree.prototype.insert = function(tree){
	this.children.push(tree);
};
