var Type = require('../ontology');
var db = require('../db.js');

var people = new Type({
	name: 'Person',
	features: {
		Type: 'person'
	}
})

var men = people.addSubType({
	name: 'Male',
	features: {
	Gender: 'male'
	}
})

var women = people.addSubType({
	name: 'Female',
	features: {
	Gender: 'female'
	}
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

console.log(people.viewInstance('Eric'));

// people.find()
// .relatedTo('Eric')
// .hasType('Female')
// .sharesAttributes(['father','mother'], function(result){
// 	console.log(result);
// });		

// people.find().hasType('Female').hasAttributes({father: "Adam"}, function(result){
// 		console.log(result);
// });
