var path = require('path');
var expect = require('chai').expect;

var Type = require(path.join(__dirname, '..', './dist/Ontology.min.js')).Type;
var db = require(path.join(__dirname, '..', './db.js'));

describe('ontology()', function () {
  'use strict';
  var people;

  beforeEach(function(){
    people = new Type({
      name: 'People',
      features: {
        type: 'Human'
      }
    })
  })

  it('exists', function () {
    expect(Type).to.be.a('function');
    expect(people).to.be.a('object');
  });

  it('can add subtypes and instances', function () {
    var men = people.addSubType({
      name: 'Male',
      features: { gender: 'Male'}
    })
    men.addInstance({
      name: 'Dave',
      description: {
        attitude: 'Chill'
      }
    })
    expect(people.subTypeArray.length).to.equal(1);
    expect(people.subTypeMap['Male'].features.gender).to.equal('Male');
    expect(people.subTypeMap['Male'].subTypeArray.length).to.equal(1);
    expect(people.subTypeMap['Male'].subTypeMap['Dave'].description.attitude).to.equal('Chill');
  });

  it('performs queries on ontologies', function (done) {
    var men = people.addSubType({
      name: 'Male',
      features: { gender: 'Male'}
    })
    men.addInstance({
      name: 'Dave',
      description: {
        attitude: 'Chill'
      }
    })
    var women = people.addSubType({
      name: 'Female',
      features: { gender: 'Female'}
    })
    women.addInstance({
      name: 'Jen',
      description: {
        attitude: 'Chill'
      }
    })
    women.addInstance({
      name: 'Tina',
      description: {
        attitude: 'Uptight'
      }
    })
    people.find()
    .relatedTo('Dave')
    .hasType('Female')
    .sharesAttributes(['attitude'], function(result){
      expect(result.length).to.equal(1);
      expect(result[0].name).to.equal('Jen');
      done();
    })
  });

  // Add more assertions here
});
