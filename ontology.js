var _ = require('lodash');
var Tree = require('./tree.js');
var Instance = require('./instance.js');
var r = require('rethinkdb');

var Type = function(options){
	this.name = options.name;
	this.parent = '';
	this.subTypeMap = {};
	this.subTypeArray = [];
	this.instancePaths = {};
	this.features = {};
	if(options.features){
		var self = this;
		_.each(options.features, function(feature){
			self.features[feature.type] = feature.value;
		})
	}
};

Type.prototype.addSubType = function(options){
	var subType = new Type(options);
	subType.parent = this;
	this.subTypeMap[options.name] = subType;
	this.subTypeArray.push(options.name);
	return subType;
};

Type.prototype.addInstance = function(options){
	var start = [options.name];
	var parent = this;
	buildList(start, parent);

	var newInstance = new Instance(options);
	newInstance.parent = this;
	this.subTypeMap[options.name] = newInstance;
	this.subTypeArray.push(options.name);

	function buildList(list, parent){
		if(parent.parent !== ''){
			list.push(parent.name);
			return buildList(list, parent.parent);
		} else {
			parent.instancePaths[list.shift()] = list;
		}
	};
};

Type.prototype.viewInstance = function(name){
	var result = { name: this.name }, parent;
	result = _.merge(result, this.features);
	var location = this.instancePaths[name];
	var level = result;
	for(var i = location.length-1; i >= 0; i--){
		parent = this.subTypeMap[location[i]];
		level.subType = _.merge({ name: parent.name }, parent.features);
		level = level.subType;
	}
	var instance = parent.subTypeMap[name];
	level.instance = _.merge({ item: name }, instance.description);
	return result;
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
 		r.table(table).insert(copy).run(conn);
 	} else {
 		copy = convertInstance(type);
 		r.table(table).insert(copy).run(conn);
 	}
 };
};

module.exports = Type;

// helper functions //

function connect(){
  return r.connect({ host: 'localhost',
    port: 28015,
    db: 'test'
  })
};

function convertType(type){
	return {
		name: type.name,
		parent: (typeof type.parent === 'string') ? null : type.parent.name,
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