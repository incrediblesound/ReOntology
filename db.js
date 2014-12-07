var r = require('rethinkdb');

/**
 * Gets instance data from the database
 * Exmple: getInstance('tea', 'Long Jing', function(err, result){ console.log(result) })
 * Each class object is stored in the parent property of its child
 */

module.exports = getInstance = function(table, name, cb){
	var result;
	connect()
	.then(function(conn){
		r
		.table(table)
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

function getItem(table, name, conn, cb){
	r.table(table).get(name).run(conn, cb);
}

function getParent(table, item, conn, cb){
	if(item.parent === null){
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
}

function connect(){
  return r.connect({ host: 'localhost',
    port: 28015,
    db: 'test'
  })
};

