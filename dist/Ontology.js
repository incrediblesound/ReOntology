/*! re-ontology - v0.0.3 - */
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

var Tree = function(value){
	this.value = value;
	this.children = [];
};

Tree.prototype.insert = function(tree){
	this.children.push(tree);
};

var Search = function(options){
	this.root = options.root;
	this.related = options.related || null;
	this.subType = options.subType || null;
};

Search.prototype.relatedTo = function(item){
	return new Search({root: this.root, related: item});
};

Search.prototype.hasType = function(item){
	return new Search({root: this.root, subType: item, related: this.related || null });
};

Search.prototype.hasAttributes = function(map, cb){
	this.resolve(function(_this){
		_this.root.getByAttributes(map, cb);
	})
}

Search.prototype.resolve = function(callback){
	var _this = this;
	if(this.related !== null && typeof this.related === 'string'){
		this.root.getItem(this.related, function(result){
			_this.related = result;
			return _this.resolve(callback);
		})	
	} else {
		if(this.subType !== null){
			this.root.getItem(this.subType, function(result){
				_this.subType = null;
				_this.root = result;
				return callback(_this);
			})
		} else {
			callback(this);
		}
	}
}

Search.prototype.sharesAttributes = function(attributes, cb){
	this.resolve(function(_this){
		if(!_this.related){
			throw new Error('The method sharesAttributes must follow a relatedTo method');
		}
		var map = {};
		_.each(attributes, function(key){
			map[key] = _this.related.description[key];
		})
		_this.root.getByAttributes(map, cb);
	})
};

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

var r = require('rethinkdb');
/**
 * getInstance calls instance data from the database
 * Exmple: getInstance('tea', 'Long Jing', function(err, result){ console.log(result) })
 * Each class object is stored in the parent property of its child
 * 
 * getSystem reconstructs the class tree from the database, giving each element of the
 * tree its proper methods via prototype.
 */

function getSystem(table, cb){
	getRoot(table, function(root, conn){
		root = root[0];
		root.subTypeMap = {};
		root = makeType(root);
		getSubTypes(table, root, conn, {size: root.size, done: 0}, function(result){
			cb(result);
		}, root);
	})
};

function getSubTypes(table, type, conn, tracking, cb, master){
	type = identityCheck(type);
	type.subTypeMap = {};
	_.each(type.subTypeArray, function(subType){
		getItem(table, subType, conn, function(err, subTypeItem){
			subTypeItem = identityCheck(subTypeItem);
			type.subTypeMap[subType] = subTypeItem;
			tracking.done++;
			if(subTypeItem.size){
				tracking.size += subTypeItem.size;
			}
			if(tracking.size === tracking.done){
				cb(master);
			}
			else if(subTypeItem.subTypeArray && subTypeItem.subTypeArray.length){
				getSubTypes(table, subTypeItem, conn, tracking, cb, master);
			}
		})
	})
}



function getInstance(table, name, cb){
	var result;
	connect()
	.then(function(conn){
		r.table(table)
		.get(name)
		.run(conn, function(err, response){
			if(err){
				cb(err);
				return;
			}
			getParent(table, response, conn, function(err){
				if(err){
					cb(err);
					return;
				}
				cb(null, response);
			});
		});
	});
};

function getRoot(table, cb){
	connect().then(function(conn){
		r
		.table(table)
		.filter({parent: ''})
		.run(conn)
		.then(function(response){
			return response.toArray();
		})
		.then(function(response){
			cb(response, conn);
		})
	});
}

function getItem(table, name, conn, cb){
	r.table(table).get(name).run(conn, function(err, result){
		if(err){ return cb(err); } 

		else {
			return cb(null, result);
		}
	});
};

function getParent(table, item, conn, cb){
	if(!item.parent.length){
		cb();
	} else {
		getItem(table, item.parent, conn, function(err, response){
			if(err){
				cb(err);
				return;
			}
			item.parent = response;
			getParent(table, item.parent, conn, cb);
		});
	}
};

function identityCheck(item){
	if(item.description !== undefined && !(item instanceof Instance)){
		return makeInstance(item);
	}
	else if(item.description === undefined && !(item instanceof Type)){
		return makeType(item);
	} 
	else {
		return item;
	}
}

function makeInstance(item){
	var obj = new createInstance();
	return merge(obj, item);
};


function makeType(item){
	var obj = new createType();
	return merge(obj, item);
};

function createInstance(){};
createInstance.prototype = Object.create(Instance.prototype);
createInstance.prototype.constructor = Instance;

function createType(){};
createType.prototype = Object.create(Type.prototype);
createType.prototype.constructor = Type;

function connect(){
  return r.connect({ host: 'localhost',
    port: 28015,
    db: 'test'
  })
};

function merge(inst, obj){
	var props = Object.keys(obj);
	_.each(props, function(prop){
		inst[prop] = obj[prop];
	})
	return inst;
}

module.exports = {
	Type: Type,
	Instance: Instance,
	db:{
		getInstance: getInstance,
		getSystem: getSystem
	}
};
