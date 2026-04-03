const distribution = globalThis.distribution;
const id = distribution.util.id;
// @ts-check
/**
 * @typedef {import("../types.js").Callback} Callback
 * @typedef {import("../types.js").Config} Config
 * @typedef {import("../util/id.js").Node} Node
 *
 * @typedef {Object} Status
 * @property {(configuration: string, callback: Callback) => void} get
 * @property {(configuration: Node, callback: Callback) => void} spawn
 * @property {(callback: Callback) => void} stop
 */

/**
 * @param {Config} config
 * @returns {Status}
 */
function status(config) {
  const context = {};
  context.gid = config.gid || 'all';

  /**
   * @param {string} configuration
   * @param {Callback} callback
   */
  function get(configuration, callback) {
    if (configuration != "heapTotal" && configuration != "heapUsed") {
      distribution[context.gid].comm.send([configuration], {service: "status", method: "get"}, callback);
      return;
    }
    distribution[context.gid].comm.send([configuration], {service: "status", method: "get"}, (e, v) => { 
      if (!v) {
        return callback(new Error(e), null);
      }
      let total = 0;
      for (const [key, val] of Object.entries(v)) {
        total += val;
      }
      return callback(null, total);
    })
  }

  /**
   * @param {Node} configuration
   * @param {Callback} callback
   */
  function spawn(configuration, callback) {
    distribution.local.status.spawn(configuration, (e, v) => {
      if (e) {
        return callback(e, v);
      }
      const message = [context.gid, configuration];
      distribution[context.gid].comm.send(message, {service: "groups", method: "add"}, (e, v) => {
        return callback(e, v)
      })
    });

  }

  /**
   * @param {Callback} callback
   */
  function stop(callback) {
    const configuration = {service: "status", method: "stop"};
    const nodes = distribution.local.groups.get(context.gid, (e, v) => {
      if (e) {
        return callback(e, null);
      }
      const entries = Object.entries(v);
      const total_count = entries.length;
      function sendStep(i, errors, values) {
        if (i >= total_count) {
          if (Object.entries(errors).length == 0) {
            errors = null;
          }
          if (Object.entries(values).length == 0) {
            values = null;
          }
          return callback(errors, values);
        }
        const [sid, node] = entries[i];
        if (sid == id.getSID(distribution.node.config)) {
          return sendStep(i + 1, errors, values);
        }
        configuration["node"] = node;
        distribution.local.comm.send([], configuration, (e, v) => {
          if (e) {
            errors[sid] = e;
          } else {
            values[sid] = v;
          }
          sendStep(i + 1, errors, values);
        })
      }
      sendStep(0, {}, {});
    })
  }

  return {get, stop, spawn};
}

module.exports = status;
