/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

const distribution = require('../../distribution.js')();
const id = distribution.util.id;
require('../helpers/sync-guard');

const nodes = []
for (let i = 0; i < 10; i++) {
    nodes.push({ip: '127.0.0.1', port: 9000 + i});
}
const nids = nodes.map(id.getNID);

test('(1 pts) student test', (done) => {
  // Fill out this test case...
    // idempotency in mem
    const data = {"a": "alice"};
   distribution.local.mem.put("value", "key", (e, v) => {
        distribution.local.mem.put("value", "key", (e2, v2) => {
            try {
                expect(e).toBeFalsy();
                expect(e2).toBeFalsy();
                expect(v).toEqual(v2);
                distribution.local.mem.get("key", (e3, v3) => {
                    distribution.local.mem.get("key", (e4, v4) => {
                        try {
                            expect(e3).toBeFalsy();
                            expect(e4).toBeFalsy();
                            expect(v4).toEqual(v3);
                            done();
                        } catch (error) {
                            done(error);
                            return;
                        }
                    })
                })
            } catch (error) {
                done(error);
                return;
            }
        })
    })
});


test('(1 pts) student test', (done) => {
  // Fill out this test case...
    // idempotency in store
    distribution.local.store.put("value", "key", (e, v) => {
        distribution.local.store.put("value", "key", (e2, v2) => {
            try {
                expect(e).toBeFalsy();
                expect(e2).toBeFalsy();
                expect(v).toEqual(v2);
                distribution.local.store.get("key", (e3, v3) => {
                    distribution.local.store.get("key", (e4, v4) => {
                        try {
                            expect(e3).toBeFalsy();
                            expect(e4).toBeFalsy();
                            expect(v4).toEqual(v3);
                            done();
                        } catch (error) {
                            done(error);
                            return;
                        }
                    })
                })
            } catch (error) {
                done(error);
                return;
            }
        })
    })
});


test('(1 pts) student test', (done) => {
  // Fill out this test case...
// rendezvous hash is uniform
    const counts = {};
    const num_keys = 1000000;
    for (let i = 0; i < num_keys; i++) {
        let nid = id.rendezvousHash(id.getID(i), nids);
        if (!counts[nid]) {
            counts[nid] = 0;
        }
        counts[nid]++;
    }
    for (const count of Object.values(counts)) {
        // console.log(count);
        expect(count).toBeLessThan(num_keys / nids.length * 4);
    }
    done();
    // const newNode = {ip: '127.0.0.1', port: 6767};
    // console.log("hello");
    // distribution.local.status.spawn(newNode, (e, v) => {
    //     if (e) done(e);
    //     console.log("reached1");
    //     expect(e).toBeFalsy();
    //     distribution.local.comm.send(["value", "key"], {node: newNode, service: "store", method: "put"}, (e, v) => {
    //         if (e) done(e);
    //         console.log("reached");
    //         expect(e).toBeFalsy();
    //         expect(v).toEqual("value");
    //         distribution.local.comm.send([], {node: newNode, service: "status", method: "stop"}, (e, v) => {
    //             if (e) done(e);
    //             console.log("2");
    //             expect(e).toBeFalsy();
    //             done();
    //         })
    //     })
    // })
});

test('(1 pts) student test', (done) => {
  // Fill out this test case...
    // different groups are seperate
    distribution.local.mem.put("value", "key", (e, v) => {
        distribution.local.mem.get({gid: "a", key: "key"}, (e, v) => {
            expect(e).toBeTruthy();
            distribution.local.mem.put("value2", {gid: "a", key: "key"}, (e, v) => {
                distribution.local.mem.get("key", (e, v) => {
                    expect(v).toEqual("value");
                    distribution.local.mem.del({gid: "a", key: "key"}, (e, v) => {
                        expect(v).toEqual("value2");
                        distribution.local.mem.get("key", (e, v) => {
                            expect(v).toEqual("value");
                            done();
                        })
                    })
                })
            })
        })
    });

});

test('(1 pts) student test', (done) => {
  // Fill out this test case...
    // consistent hashing is uniform
    const counts = {};
    const num_keys = 1000000;
    for (let i = 0; i < num_keys; i++) {
        let nid = id.consistentHash(id.getID(i), nids);
        if (!counts[nid]) {
            counts[nid] = 0;
        }
        counts[nid]++;
    }
    for (const count of Object.values(counts)) {
        // console.log(count);
        expect(count).toBeLessThan(num_keys / nids.length * 4);
    }
    done();

});
