var _ = require('lodash');
var r = require('rethinkdb');

var Type = function(options){
	this.name = options.name;
	this.parent = '';
	this.size = 0;
	this.subTypeMap = {};
	this.subTypeArray = [];
	this.features = options.features || undefined;
};

Type.prototype.addSubType = function(options){
	this.size++;
	var subType = new Type(options);
	subType.parent = this;
	this.subTypeMap[options.name] = subType;
	this.subTypeArray.push(options.name);
	return subType;
};

Type.prototype.addInstance = function(options){
	this.size++;
	var newInstance = new Instance(options);
	newInstance.parent = this;
	this.subTypeMap[options.name] = newInstance;
	this.subTypeArray.push(options.name);
};

Type.prototype.viewInstance = function(name){
	var path = [], found = false, result;
	path = traverse(this, path, name);

	var target = getItemFromPath(this, path);
	var current = target;
	while(path.length){
		path.pop();
		current.parent = getItemFromPath(this, path);
		current = current.parent;
	}
	return target;

	function getItemFromPath(root, path){
		var target = root;
		for(var i = 0; i < path.length; i++){
			target = target.subTypeMap[path[i]];
		}
		return target;
	};

	function traverse(current, path, name){
		var next;
		if(current.name === name){
			found = true;
			return;
		}
		else if(!current.subTypeArray || !current.subTypeArray.length){
			return;
		} else {
			_.each(current.subTypeArray, function(subtype){
				if(!found){
					next = current.subTypeMap[subtype];
					path.push(next.name);
					traverse(next, path, name, found);
					if(!found){
						path.pop();
					}
				}
			})
		}
		return path;
	}
};

Type.prototype.getItem = function(name, cb){
	var _this = this;
	if(this.name === name){
		cb(this);
	}
	else {
		_.each(this.subTypeArray, function(subType){
			_this.subTypeMap[subType].getItem(name, cb);
		})
	}
};


Type.prototype.typeTree = function(root){
	var root = root || new Tree(this.name);
	var self = this;
	var newTree;
	_.each(this.subTypeArray, function(subType){
		subType = self.subTypeMap[subType];
		newTree = new Tree(subType.name);
		if(subType instanceof Type){
			newTree = subType.typeTree(newTree);
		} 
		root.insert(newTree);
	});
	return root;
};

Type.prototype.createTable = function(name){
	this.table = name;
	return connect().then(function(conn){
		return r.tableCreate(name, {primaryKey: 'name'}).run(conn);
	})
};

Type.prototype.save = function(table){
var self = this, table;
if(this.table !== undefined){
	table = this.table;
};
connect().then(function(conn){
 	saveType(self, conn, table);
 	_.each(self.subTypeArray, function(subType){
 		subType = self.subTypeMap[subType];
 		if(subType instanceof Type){
 			subType.save(table);
 		} else {
 			saveType(subType, conn, table);
 		}
 	});
 });

 function saveType(type, conn, table){
 	var copy;
 	if(type instanceof Type){
 		copy = convertType(type);
 		console.log(copy);
 		r.table(table).insert(copy).run(conn);
 	} else {
 		copy = convertInstance(type);
 		r.table(table).insert(copy).run(conn);
 	}
 };
};

Type.prototype.getByAttributes = function(map, cb){
	var children = this.flatten();
	var results = [], match;
	var keys = Object.keys(map);
	_.each(children, function(child){
		match = true;
		_.each(keys, function(key){
			match = match && child.description[key] === map[key];
		})
		if(match){
			results.push(child);
		}
	})
	cb(results);
};

Type.prototype.flatten = function(){
	var results = [], child;
	var _this = this;
	_.each(this.subTypeArray, function(subType){
		child = _this.subTypeMap[subType];
		if(child.description !== undefined){
			results.push(child);
		} else {
			results = results.concat(child.flatten());
		}
	})
	return results;
}

Type.prototype.find = function(){
	return new Search({root: this});
}


// helper functions //

function connect(){
  return r.connect({ host: 'localhost',
    port: 28015,
    db: 'test'
  })
};

function convert(item){
	if(item.features !== undefined){
		return convertType(item);
	}
	else if(item.description !== undefined){
		return convertInstance(item);
	} else {
		return false;
	}
}

function convertType(type){
	return {
		name: type.name,
		size: type.size,
		parent: (typeof type.parent === 'string') ? '' : type.parent.name,
		subTypeArray: type.subTypeArray,
		features: type.features
	};
};

function convertInstance(type){
	return {
		name: type.name,
		parent: type.parent.name,
		description: type.description
	};
};
