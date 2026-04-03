const distribution = globalThis.distribution;
const id = require("../util/id");
// @ts-check
/**
 * @typedef {import("../types.js").Callback} Callback
 * @typedef {import("../types.js").Node} Node
 */

/**
 * @param {string} configuration
 * @param {Callback} callback
 */
function get(configuration, callback) {
    if (!configuration) {
        configuration = "nid"; // make it return NID by default
    }
    if (!callback) {
        callback = () => {};
    }
    const config = distribution.node.config;
    let e = null;
    let v = null;
    if (configuration in config) {
        v = config[configuration];
    } else if (configuration == "counts") {
        if (!("counts" in distribution.node)) {
            distribution.node["counts"] = 0;
        }
        // distribution.node["counts"]++;
        v = distribution.node["counts"];
    } else if (configuration == "nid") {
        v = id.getNID(config);
    } else if (configuration == "sid") {
        v = id.getSID(config);
    } else if (configuration == "heapTotal") {
        v = process.memoryUsage().heapTotal;
    } else if (configuration == "heapUsed") {
        v = process.memoryUsage().heapUsed;
    } else if (configuration == "count") {
        v = 1; // come back to this
    } else {
        e = Error("Item not found.");
    }
    callback(e, v);
};


/**
 * @param {Node} configuration
 * @param {Callback} callback
 */
function spawn(configuration, callback) {
  callback(new Error('status.spawn not implemented'));
}

/**
 * @param {Callback} callback
 */
function stop(callback) {
  callback(new Error('status.stop not implemented'));
}

module.exports = {get, spawn, stop};
