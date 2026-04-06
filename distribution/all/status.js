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
  const remote = { service: 'status', method: 'get' };
  const msg = [configuration];

  globalThis.distribution[context.gid].comm.send(msg, remote, (errors, values) => {
    if (errors && Object.keys(errors).length > 0) {
      return callback(errors, values);
    }


    if (configuration === 'heapTotal') { // heapTotal to sum
      let total = 0;
      for (const sid in values) {
        total += values[sid];
      }

      return callback(errors, total);
    }

    // heapUsed object keyed by sid
    if (configuration === 'heapUsed') {
      return callback(errors, values);
    }

    // everything else as array
    return callback(errors, Object.values(values));
  });
}



  /**
   * @param {Node} configuration
   * @param {Callback} callback
   */
  function spawn(configuration, callback) {
    callback(new Error('status.spawn not implemented')); // If you won't implement this, check the skip.sh script.
  }

  /**
   * @param {Callback} callback
   */
  function stop(callback) {
    callback(new Error('status.stop not implemented')); // If you won't implement this, check the skip.sh script.
  }

  return {get, stop, spawn};
}

module.exports = status;
