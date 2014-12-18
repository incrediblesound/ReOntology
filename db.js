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
