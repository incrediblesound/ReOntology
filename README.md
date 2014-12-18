This is a type system for JavaScript that conveniently saves to and reads from RethinkDB.

In lieu of docs, for the moment I will simply paste in the contents of the example file tea.js:

```javascript
var Type = require('./ontology');
var getInstance = require('./db.js');

// create a root class //
var tea = new Type({
	name: 'Tea',
	features: [
	{type: 'Substance', value: 'Plant'},
	{type: 'Function', value: 'Food:drink'},
	{type: 'Ingredient:active', value: 'Caffeine'}
	]
});

// add a set of subtypes to the class //
var oolong = tea.addSubType({
	name: 'Oolong',
	features: [
	{type: 'Oxidization', value: 'Medium'}
	]
});

var black = tea.addSubType({
	name: 'Black',
	features: [
	{type: 'Oxidization', value: 'Full'}
	]
});

var green = tea.addSubType({
	name: 'Green',
	features: [
	{type: 'Oxidization', value: 'Minimal'}
	]
});

/** 
 * add instances to the subtypes; instances are actual things whereas classes are
 * abstract classifications of things
 */

var longJing = green.addInstance({
	name: 'Long Jing',
	description: {
		taste: 'Hearty, full and nutty',
		origin: 'Northeast China',
		shape: 'Flattened'
	}
});

var tieGuanYin = oolong.addInstance({
	name: 'Tie Guan Yin',
	description: {
		taste: 'Light and floral',
		origin: 'Southeast China',
		shape: 'Rolled'
	}
});

// we can create a table and save the entire system to rethinkdb
tea.createTable('tea').then(function(){
	tea.save();
});

/**
 * After the data is saved to the database, we can call up all information about
 * an instance with the getInstance function:
 */ 
var longJing;
db.getInstance('tea', 'Long Jing', function(err, result){ 
	longJing = result;
})

/**
 * Or we can reconstruct the entire class heirarchy from the database
 */
var tea;
db.getSystem('tea', function(result){
	tea = result;
});

