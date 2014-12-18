var Type = require('../ontology');
var db = require('../db.js');

var people = new Type({
	name: 'Person',
	features: [
	{type: 'biological', value: 'human'},
	]
})

var men = people.addSubType({
	name: 'Male',
	features: [
	{type: 'gender', value: 'male'}
	]
})

var women = people.addSubType({
	name: 'Female',
	features: [
	{type: 'gender', value: 'female'}
	]
})

men.addInstance({
	name: 'Robert',
	description: {
		father: 'James',
		mother: 'Gladice',
		sons: ['Eric'],
		daughters: ['Susan', 'Carol','Annabelle']
	}
})

men.addInstance({
	name: 'Eric',
	description: {
		father: 'Robert',
		mother: 'Sylvia',
		sons: ['James'],
		daughters: ['Emily']
	}
})

women.addInstance({
	name: 'Susan',
	description: {
		father: 'Robert',
		mother: 'Sylvia',
		sons: null,
		daughters: null
	}
})

women.addInstance({
	name: 'Sam',
	description: {
		father: 'Adam',
		mother: 'Beth',
		sons: null,
		daughters: null
	}
})

people.find()
.relatedTo('Eric')
.hasType('Female')
.sharesAttributes(['father','mother'], function(result){
	console.log(result);
});		

// people.find().hasType('Female').hasAttributes({father: "Adam"}, function(result){
// 		console.log(result);
// });
