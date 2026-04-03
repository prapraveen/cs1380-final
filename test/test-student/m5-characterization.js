const fs = require("fs");
const distribution = require('../../distribution.js')({ip: '127.0.0.1', port: 1234});
require('../helpers/sync-guard');
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

let filenames = ["alice.txt", "greatgatsby.txt", "prideandprejudice.txt", "frankenstein.txt", "mobydick.txt"];
const files = filenames.map(f => fs.readFileSync(`../../text-files/${f}`, 'utf8'));
filenames = filenames.map(f => f.split(".")[0]);

distribution.local.groups.put({gid: "m5char", hash: id.naiveHash}, groupA, (e, v) => {
    if (e) console.log(e);
    if (v) console.log(v);

    const num_items = filenames.length;
    const insert_items = (count, callback) => {
        if (count == num_items) {
            return callback();
        }
        return distribution.m5char.store.put(files[count], filenames[count], () => insert_items(count + 1, callback));
    }
    insert_items(0, () => {
        const mapper = (key, value) => {
            const pattern = new RegExp("\\?")
            const res = [];

            for (const line of value.split("\n")) {
                if (pattern.test(line)) {
                    res.push({"a": line});
                }
            }
            return res;
        }

        const reducer = (key, values) => {
            const res = {};
            res["a"] = values;
            return res;
        }

        distribution.m5char.store.get(null, (e, v) => {
            console.log(v);
            const start = performance.now();
            distribution.m5char.mr.exec({keys: v, map: mapper, reduce: reducer}, (e, v) => {
                const total_time = performance.now() - start;
                console.log("v:", v);
                const values = Object.values(v[0])[0].map(a => a.trim());
                console.log(`Total time for ${values.length} matches: ${total_time}`);
            })
        })

    })
})
