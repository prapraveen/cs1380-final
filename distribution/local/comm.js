// @ts-check
/**
 * @typedef {import("../types.js").Callback} Callback
 * @typedef {import("../types.js").Node} Node
 */

const http = require('node:http');

/**
 * @typedef {Object} Target
 * @property {string} service
 * @property {string} method
 * @property {Node} node
 * @property {string} [gid]
 */

/**
 * @param {Array<any>} message
 * @param {Target} remote
 * @param {(error: Error, value?: any) => void} callback
 * @returns {void}
 */
function send(message, remote, callback) {
  const gid = remote.gid || 'local';
  const path = `/${gid}/${remote.service}/${remote.method}`;

  const options = {
    hostname: remote.node.ip,
    port: remote.node.port,
    path: path,
    method: 'PUT',
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      const [error, value] = globalThis.distribution.util.deserialize(data);
      callback(error, value);
    });
  });

  req.on('error', (e) => {
    callback(new Error(e.message));
  });

  req.write(globalThis.distribution.util.serialize(message));
  req.end();
}

module.exports = {send};
