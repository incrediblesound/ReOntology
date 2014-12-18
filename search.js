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
