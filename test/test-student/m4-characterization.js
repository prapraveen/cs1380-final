const distribution = require('../../distribution.js')();
require('../helpers/sync-guard');
const crypto = require('crypto');
const { performance } = require('node:perf_hooks');


const id = distribution.util.id;

const n1 = {ip: '127.0.0.1', port: 8000};
const n2 = {ip: '127.0.0.1', port: 8001};
const n3 = {ip: '127.0.0.1', port: 8002};
const allNodes = [n1, n2, n3];

const groupA = {};
groupA[id.getSID(n1)] = n1;
// Add nodes n2 and n3 to the group...
groupA[id.getSID(n2)] = n2;
groupA[id.getSID(n3)] = n3;

function randString() {
    return crypto.randomBytes(16).toString("hex");
}

const items = []
const num_items = 1000;
for (let i = 0; i < num_items; i++) {
    const key = randString();
    const val = randString();
    items.push([ key, val ]);
}

let start_time;

distribution.local.groups.put({gid: 'groupA', hash: id.consistentHash}, groupA, (e, v) => {
    if (e) console.log(e);
    if (v) console.log(v);
    const insert_items = (count, callback) => {
        if (count == num_items) {
            return callback();
        }
        return distribution.groupA.store.put(items[count][1], items[count][0], () => insert_items(count + 1, callback));
    }
    const get_items = (count, callback) => {
        if (count == num_items) {
            return callback();
        }
        return distribution.groupA.store.get(items[count][0], () => insert_items(count + 1, callback));
    }
    start_time = performance.now();
    cb = () => {
        console.log(`Time to insert ${num_items} items: ${performance.now() - start_time}`);
        start_time = performance.now();
        cb = () => {
            console.log(`Time to get ${num_items} items: ${performance.now() - start_time}`);
        }
        get_items(0, cb);
    }
    insert_items(0, cb);
})

