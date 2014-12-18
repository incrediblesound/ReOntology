ReOntology
==========

ReOntology is a type system for JavaScript that conveniently saves to and loads from RethinkDB. To install, use npm:
```shell
npm install re-ontology --save
```
Requiring the module exposes the following object:
```javascript
var reontology = require('re-ontology');
console.log(reontology) //=> { Type: {...}, Instance: {...}, db: { getInstance: {...}, getSystem: {...} } }
```

The type system consists of a heirarchy of types that lies over a set of instances. There is a minor semantic distinction in the code which is that a type has "features", abstract qualities that pertain to all subtypes and instances of that type, and an instance has a "description" which is a set of key/value pairs that describe that actual properties of that instance.

To create an ontology you start with a base class. For now every class and instance must have a unique name, features are optional, and descriptions are necessary to perform search queries.
```javascript
// here is the root of our new class system //
var people = new Type({
	name: "Person",
	features: {
		Type: "Human"
	}
})
```
To extend a class with sub-classes use the addSubType method:
```javascript
var men = people.addSubType({
	name: 'Male',
	features: {
		Gender: 'Male'
	}
})
var women = people.addSubType({
	name: 'Female',
	features: {
		Gender: 'Female'
	}
})
```
To add instances to a type or a sub-type use the addInstance method:
```javascript
men.addInstance({
	name: 'Robert',
	description: {
		father: 'James',
		mother: 'Gladice',
		sons: ['Eric'],
		daughters: ['Susan', 'Carol', 'Annabelle']
	}
})

men.addInstance({
	name: 'Eric',
	description: {
		father: 'Robert',
		mother: 'Sylvia',
		sons: ['James', 'Wendell'],
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
	name: 'Samanthat',
	description: {
		father: 'Adam',
		mother: 'Beth',
		sons: null,
		daughters: null
	}
})
```
Now that we have a fleshed out ontology with a root class, two subclasses and four instances, we can save it to rethinkdb:
```javascript
// creates a table called "people" in our database and saves the entire heirarchy into that table
people.createTable('people').then(function(){
	people.save();
});
```
Now we can reconstruct the entire heirarchy from the database:
```javascript
var people;
// reconstructs a ReOntology tree starting from the root node found in the "people" table
db.getSystem('people', function(result){
	people = result;
})
```
Viewing Information
-------------------
For now, there are two principle ways of viewing information in your ontology. The first is with the viewInstance method. Calling viewInstance on the root with the name of an instance will return an object that contains the instance data as well as the data for every class that instance belongs to.
```javascript
people.viewInstance('Eric') //=> { name: "Eric", description: {...}, parent: { name: "Male"... } }
```
A much more interesting way to query the ontology is by using the search object. This object allows you to find instances with specific attributes or instances that share attributes with other instances. Examples of both kinds of queries follows below:

```javascript
people.search() // this method returns a search object
.hasType('Male') // we constrain our search to men
.hasAttributes({father: "James"}, function(result){
// hasAttributes is a terminating method so it takes a callback
	console.log(result) // logs the Robert Object
})
```
Finding Eric's sisters is easy:
```javascript
people.search()
.relatedTo('Eric') // this method enables use of the sharesAttributes method
.hasType('Female') // we want to find the women that share two attributes with Eric
.sharesAttributes(["father","mother"], function(result){
	console.log(result) // an array containing the Susan instance
})
```
