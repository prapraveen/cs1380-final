/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

const distribution = require('../../distribution.js')({ip: '127.0.0.2', port: 2010});
require('../helpers/sync-guard');

test('(1 pts) student test', (done) => {
  // Fill out this test case...
    distribution.local.status.get("nid", (e, v) => {
        distribution.local.status.get("sid", (e2, v2) => {
            expect(e).toBeFalsy();
            expect(e2).toBeFalsy();
            expect(v2).toEqual(v.substring(0,5));
        })
    })
    // no callback doesn't error
    distribution.local.status.get("ip");
    done();
});


test('(1 pts) student test', (done) => {
  // Fill out this test case...
    // don't override core services
    distribution.local.routes.put({"a": "b"}, "status");
    distribution.local.routes.get("status", (e, s) => {
        s.get("nid", (e2, v) => {
            expect(e2).toBeFalsy();
            expect(v).toBeTruthy();
        })
    })
    // update service twice
    distribution.local.routes.put({"a": "b"}, "test1");
    distribution.local.routes.put({"a": "c"}, "test1");
    distribution.local.routes.get("test1", (e, s) => {
        expect(s["a"]).toEqual("c");
    })
    done();
});


test('(1 pts) student test', (done) => {
  // Fill out this test case...
    distribution.local.routes.get("status", (e, s) => {
        expect(s).toEqual(distribution.local.status);
    })
    // works with no callback
    distribution.local.routes.get("status");
    done();
});

test('(1 pts) student test', (done) => {
  // Fill out this test case...
    // remove the same route twice
    distribution.local.routes.put({"a": "b"}, "test2");
    distribution.local.routes.rem("test2", (e, s) => {
        expect(e).toBeFalsy();
        expect(s).toEqual({"a": "b"});
    })
    distribution.local.routes.rem("test2", (e, s) => {
        expect(e).toBeFalsy();
        expect(s).toBeFalsy();
    })
    // cannot remove core service
    distribution.local.routes.rem("status");
    distribution.local.status.get("nid", (e, v) => {
        expect(e).toBeFalsy();
        expect(v).toBeTruthy();
    })
    done();
});

test('(1 pts) student test', (done) => {
  // Fill out this test case...
    distribution.node.start((e) => {
        const node = distribution.node.config;
        const remote = {node: node, service: "comm", method: "send"};
        const remote2 = {node: node, service: "status", method: "get"};
        const message = [["nid"], remote2, (e, v) => (e, v)];

        distribution.local.comm.send(message, remote, (e, v) => {
            expect(e).toBeFalsy();
            expect(v).toEqual(id.getNID(node));
        });

        // custom route
        distribution.local.routes.put({"a": "b"}, "test2");
        const remote3 = {node: node, service: "routes", method: "get"};
        const message2 = ["test2", (e, v) => (e, v)];

        distribution.local.comm.send(message2, remote3, (e, v) => {
            expect(e).toBeFalsy();
            expect(v["a"]).toEqual("b");
        })
        globalThis.distribution.node.server.close();
    });
    // chained messages

    done();

});

// test('Characterization', (done) => {
//     let node = distribution.node.config;
//     let remote = {node: node, service: "status", method: "get"};
//     let message = ["nid"];
//
//     let start = performance.now();
//
//     let num_iter = 1000
//     for (let i = 0; i < num_iter; i++) {
//         distribution.local.comm.send(message, remote, () => {});
//     }
//
//     let total_time = performance.now() - start;
//     console.log(`Time for ${num_iter} sends: ${total_time} ms`);
//     globalThis.distribution.node.server.close();
//     expect(true).toBeFalsy();
// })
//
beforeAll((done) => {
  distribution.node.start((e) => {
    if (e) {
      done(e);
      return;
    }
    done();
  });
});

afterAll((done) => {
  if (globalThis.distribution.node.server) {
    globalThis.distribution.node.server.close();
  }
  done();
});
