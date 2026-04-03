const { performance } = require('node:perf_hooks');

const config = {
    ip: '127.0.0.1',
    port: 8080,
    onStart: (s) => {
      console.log("hello");
    }
};
let num_iters = 100;
const distribution = require('../../distribution.js')(config);

let start = performance.now();
for (let i = 8100; i < 8100 + num_iters; i++) {
  distribution.local.status.spawn({ip: '127.0.0.1', port: i}, () => {});
}

let total = performance.now() - start;
distribution.node.start(console.log);
console.log(`time: ${total}`);
