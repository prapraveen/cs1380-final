/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

const distribution = require('../../distribution.js')();
require('../helpers/sync-guard');

const util = distribution.util;

test('(1 pts) student test', () => {
  // Fill out this test case...
    // undefined and null
    expect(util.serialize()).toEqual('{"type":"undefined","value":""}');
    expect(util.serialize(undefined)).toEqual('{"type":"undefined","value":""}');
    expect(util.serialize(null)).toEqual('{"type":"null","value":""}');
});


test('(1 pts) student test', () => {
  // Fill out this test case...
    // named functions vs lambda functions
    const anon = (a, b) => a + b;
    function named(a, b) {return a + b;};

    expect(util.deserialize(util.serialize(anon)).name).toEqual('');
    expect(util.deserialize(util.serialize(named)).name).toEqual('named');
});


test('(1 pts) student test', () => {
  // Fill out this test case...
    // nested data
    const obj = {
        nested: {
            hello: "world",
            cs: 1380,
            a_list: [
                {hi: "earth"},
                [1, 2, [3, [4, 5]]],
            ],
        },
        milestone: 1,
    }
    expect(util.deserialize(util.serialize(obj))).toEqual(obj);
});

test('(1 pts) student test', () => {
  // Fill out this test case...
    // string vs number
    expect(util.deserialize(util.serialize(5))).toEqual(5);
    expect(util.deserialize(util.serialize('5'))).toEqual('5');
});

test('(1 pts) student test', () => {
  // Fill out this test case...
    // type keyword
    const string = {
        "type": "string",
        "value": "hello",
    }
    const number = {
        "type": "number",
        "value": 5,
    }
    expect(util.deserialize(util.serialize(string))).toEqual(string);
    expect(util.deserialize(util.serialize(number))).toEqual(number);
});
