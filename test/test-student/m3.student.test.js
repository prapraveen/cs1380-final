/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

const distribution = require('../../distribution.js')();
require('../helpers/sync-guard');
const id = distribution.util.id;

const n1 = {ip: '127.0.0.1', port: 8000};
const n2 = {ip: '127.0.0.1', port: 8001};
const n3 = {ip: '127.0.0.1', port: 8002};
const n4 = {ip: '127.0.0.1', port: 7999};
const allNodes = [n1, n2, n3, n4];

test('(1 pts) student test', (done) => {
  // Fill out this test case...
  // add and remove group twice
  
  const groupA = {};
  groupA[id.getSID(n1)] = n1;
  distribution.local.groups.put('groupA', groupA, (e, v) => {
    expect(e).toBeFalsy();
  })

  distribution.local.groups.put('groupA', groupA, (e, v) => {
    expect(e).toBeFalsy();
  })

  distribution.local.groups.get('groupA', (e, v) => {
    expect(v).toEqual(groupA);
  })

  distribution.local.groups.del('groupA', (e, v) => {
    expect(e).toBeFalsy();
  })

  distribution.local.groups.del('groupA', (e, v) => {
    expect(e).toBeDefined()
  })
  done();
});


test('(1 pts) student test', (done) => {
  // Fill out this test case...
  const groupA = {};

  groupA[id.getSID(n1)] = n1;
  distribution.local.groups.put('groupA', groupA, (e, v) => {
    expect(e).toBeFalsy();
  })

  groupA[id.getSID(n2)] = n2;

  distribution.local.groups.put('groupA', groupA, (e, v) => {
    expect(e).toBeFalsy();
  })

  distribution.local.groups.get('groupA', (e, v) => {
    expect(v).toEqual(groupA);
  })

  done();

});


test('(1 pts) student test', (done) => {
  // Fill out this test case...
  // local comm works for nonlocal services
  const groupA = {};
  groupA[id.getSID(n1)] = n1;
  groupA[id.getSID(n2)] = n2;
  groupA[id.getSID(n3)] = n3;
  distribution.local.groups.put('groupA', groupA, () => {
    distribution.local.comm.send(['heapTotal'], {node: distribution.node.config, service: "status", gid: "groupA", method: "get"}, (e, v) => {
      expect(v).toBeDefined();
      done();
    })
  })
});

test('(1 pts) student test', (done) => {
  // Fill out this test case...
  // get with missing node

  const groupA = {};
  groupA[id.getSID(n1)] = n1;
  groupA[id.getSID(n2)] = n2;
  groupA[id.getSID(n3)] = n3;
  const n5 = {ip: '127.0.0.1', port: 7997};
  groupA[id.getSID(n5)] = n5;

  distribution.local.groups.put('groupA', groupA, () => {
    distribution.groupA.comm.send(['heapTotal'], {service: "status", method: "get"}, (e, v) => {
      expect(Object.values(e).length).toBeGreaterThan(0);
      expect(Object.values(v).length).toBeGreaterThan(0);
      done();
    })
  })
});

test('(1 pts) student test', (done) => {
  // Fill out this test case...
  // heapTotal offline nodes
  const groupA = {};
  groupA[id.getSID(n1)] = n1;
  groupA[id.getSID(n2)] = n2;
  groupA[id.getSID(n3)] = n3;

  const test = {
    hello: () => ("world")
  };
  distribution.local.groups.put('groupA', groupA, () => {

    distribution.groupA.routes.put(test, 'test', (e, v) => {
      distribution.groupA.comm.send(['test'], {service: "routes", method: "get"}, (e, v) => {
        expect(Object.values(e).length).toEqual(0);
        expect(Object.values(v).length).toBeGreaterThan(0);
        expect(Object.values(v)[0]["hello"]()).toEqual("world");
        done();
      })
    })
  })
});

function startAllNodes(callback) {
  distribution.node.start(() => {
    function startStep(step) {
      if (step >= allNodes.length) {
        callback();
        return;
      }
      distribution.local.status.spawn(allNodes[step], (e, v) => { // something going wrong here
        if (e) {
          return callback(e);
        }
        startStep(step + 1);
      });
    }
    startStep(0);
  });
}


function stopAllNodes(callback) {
  const remote = {method: 'stop', service: 'status'};

  function stopStep(step) {
    if (step == allNodes.length) {
      callback();
      return;
    }

    if (step < allNodes.length) {
      remote.node = allNodes[step];
      distribution.local.comm.send([], remote, (e, v) => {
        stopStep(step + 1);
      });
    }
  }

  if (globalThis.distribution.node.server) {
    globalThis.distribution.node.server.close();
  }
  stopStep(0);
}

beforeAll((done) => {
  // Stop any leftover nodes
  stopAllNodes(() => {
    startAllNodes(done);
  });
});

afterAll((done) => {
  stopAllNodes(done);
});
