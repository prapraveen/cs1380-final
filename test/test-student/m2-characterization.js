const { performance } = require('node:perf_hooks');

const distribution = require('../../distribution.js')({ip: '127.0.0.1', port: 1234});


distribution.node.start((e) => {
    let node = distribution.node.config;
    let remote = {node: node, service: "status", method: "get"};
    let message = ["nid"];

    let start = performance.now();

    let num_iter = 1000
    for (let i = 0; i < num_iter; i++) {
        distribution.local.comm.send(message, remote, () => {});
    }

    let total_time = performance.now() - start;
    console.log(`Time for ${num_iter} sends: ${total_time} ms`);
    globalThis.distribution.node.server.close();
});

// await new Promise(resolve => setTimeout(resolve, 1000));
// (async () => {
//     await new Promise(resolve => setTimeout(resolve, 1000));
// })();


