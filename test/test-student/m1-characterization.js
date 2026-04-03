const { performance } = require('node:perf_hooks');

const distribution = require('../../distribution.js')();
require('../helpers/sync-guard');

const util = distribution.util;
const ser = util.serialize;
const des = util.deserialize;

// primitives
const str = 'a'.repeat(100);
const num = 1000000000;
const bool = true;

let primitive_bytes = [str, num, bool, null].map((obj) => JSON.stringify(obj).length).reduce((a, b) => a + b, 0);

let num_iters = 100;
let ser_str;
let ser_num;
let ser_bool;
let ser_null;
let start = performance.now();
for (let i = 0; i < num_iters; i++) {
    ser_str = ser(str);
    ser_num = ser(num);
    ser_bool = ser(bool);
    ser_null = ser(null);
}

let total_time = performance.now() - start;
console.log(`Primitive serialization total time: ${total_time}`);
console.log(`${primitive_bytes/total_time * num_iters} bytes per second`);

start = performance.now();
for (let i = 0; i < num_iters; i++) {
    des(ser_str);
    des(ser_num);
    des(ser_bool);
    des(ser_null);
}

total_time = performance.now() - start;
console.log(`Primitive deserialization total time: ${total_time}`);
console.log(`${primitive_bytes/total_time * num_iters} bytes per second`);


// functions
const fun = (a, b) => a + b;
let function_bytes = fun.toString().length;

let ser_fun;
start = performance.now();
for (let i = 0; i < num_iters; i++) {
    ser_fun = ser(fun);
}

total_time = performance.now() - start;
console.log(`Function serialization total time: ${total_time}`);
console.log(`${function_bytes/total_time * num_iters} bytes per second`);

start = performance.now();
for (let i = 0; i < num_iters; i++) {
    des(ser_fun);
}

total_time = performance.now() - start;
console.log(`Function deserialization total time: ${total_time}`);
console.log(`${function_bytes/total_time * num_iters} bytes per second`);

// objects
let obj = {
    hello: "world",
    array: [
        7,
        {
            distributed: "systems",
            a: [1, 2, 3],
            b: {
                c: "d",
                e: "f",
            }
        }
    ],
}

let object_bytes = JSON.stringify(obj).length + Error().toString().length + new Date().toString().length;
obj['g'] = {
    dat: new Date(),
    err: new Error(),
}
let ser_obj;
start = performance.now();
for (let i = 0; i < num_iters; i++) {
    ser_obj = ser(obj);
}

total_time = performance.now() - start;
console.log(`Object serialization total time: ${total_time}`);
console.log(`${object_bytes/total_time * num_iters} bytes per second`);

start = performance.now();
for (let i = 0; i < num_iters; i++) {
    des(ser_obj);
}

total_time = performance.now() - start;
console.log(`Object deserialization total time: ${total_time}`);
console.log(`${object_bytes/total_time * num_iters} bytes per second`);
