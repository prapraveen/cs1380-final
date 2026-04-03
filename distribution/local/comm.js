const distribution = globalThis.distribution;
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
    if (!callback) {
        callback = () => {};
    }
    if (!message) {
        callback(Error("Missing message."), null);
    }
    if (!remote) {
        callback(Error("Missing remote."), null);
        return;
    }
    if (!("service" in remote) || !("method" in remote) || !("node" in remote) || remote.service == '') {
        callback(Error("Remote must have node, service and method."), null);
        return;
    } else if (!remote.node.port || !remote.node.ip) {
        callback(Error("Remote node must have port and ip."));
        return;
    }

    const config = distribution.node.config;
    const gid = remote.gid || "local";

    const putData = distribution.util.serialize(message);
    // let url = `http://${remote.node.ip}:${remote.node.port}/${gid}/${remote.service}/${remote.method}`;

    const path = `/${gid}/${remote.service}/${remote.method}`;
    // console.log(path);

    const options = {
        hostname: remote.node.ip,
        port: remote.node.port,
        path: `/${gid}/${remote.service}/${remote.method}`,
        method: "PUT",
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(putData),
        }
    };
    
    console.log(options);
    const req = http.request(options, (res) => {
        if (res.statusCode != 200) {
            callback(Error(`HTTP Error: ${res.statusCode}`), null);
            return;
        }
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        res.on('end', () => {
            let response = distribution.util.deserialize(data);
            callback(response[0], response[1]);
        })
    });
    req.on('error', (e) => {
        callback(Error(`Error with HTTP PUT request: ${e}`), null);
        return;
    })

    req.write(putData);
    req.end();
}

module.exports = {send};
