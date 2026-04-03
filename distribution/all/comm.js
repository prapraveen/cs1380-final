const distribution = globalThis.distribution;
const id = distribution.util.id;
// @ts-check
/**
 * @typedef {import("../types.js").Callback} Callback
 * @typedef {import("../types.js").Config} Config
 */

/**
 * NOTE: This Target is slightly different from local.all.Target
 * @typedef {Object} Target
 * @property {string} service
 * @property {string} method
 * @property {string} [gid]
 *
 * @typedef {Object} Comm
 * @property {(message: any[], configuration: Target, callback: Callback) => void} send
 */

/**
 * @param {Config} config
 * @returns {Comm}
 */
function comm(config) {
  const context = {};
  context.gid = config.gid || 'all';

  /**
   * @param {any[]} message
   * @param {Target} configuration
   * @param {Callback} callback
   */
  function send(message, configuration, callback) {
    const nodes = distribution.local.groups.get(context.gid, (e, v) => {
      if (e) {
        return callback(e, null);
      } else if (Object.entries(v).length == 0) {
        return callback(new Error("Cannot send on empty group."), null);
      }
      const entries = Object.entries(v);
      const total_count = entries.length;
      const errors = {};
      const values = {};
      let counter = 0;
      entries.forEach(entry => {
        const [sid, node] = entry;
        configuration["node"] = node;
        distribution.local.comm.send(message, configuration, (e, v) => {
          if (e) {
            errors[sid] = e;
          } else {
            values[sid] = v;
          }
          counter += 1;
          if (counter == total_count) {
            callback(errors, values);
          }
        })
      // function sendStep(i, errors, values) {
      //   if (i >= total_count) {
      //     return callback(errors, values);
      //   }
      //   const [sid, node] = entries[i];
      //   configuration["node"] = node;
      //   distribution.local.comm.send(message, configuration, (e, v) => {
      //     if (e) {
      //       errors[sid] = e;
      //     } else {
      //       values[sid] = v;
      //     }
      //     sendStep(i + 1, errors, values);
      //   })
      // }
      // sendStep(0, {}, {});
      })

    });
  }

  return {send};
}

module.exports = comm;
