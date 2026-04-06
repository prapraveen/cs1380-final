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

const id = require('../util/id.js');
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
    // overall send message from a node to all nodes in a group 
    // that provide the specified service and method

    // get nodes in group
    globalThis.distribution.local.groups.get(context.gid, (err, nodes) => {
      if (err) {
        return callback(err);
      }
      
      // get node ids, sids, of nodes in group
      const sids = Object.keys(nodes);
      
      // map sid -> error, sid -> value
      const errors = {}; 
      const values = {};
      let left = sids.length; // number of nodes left to respond

      // return error if group is empty
      if (left === 0) {
        return callback(new Error('group is empty'), null);
      }

      // send message to each node iteratively and collect responses
      sids.forEach((sid) => {
        const node = nodes[sid];
        const remote = {
          node: node,
          service: configuration.service,
          method: configuration.method,
          gid: 'local', 
          // Always use 'local' - we're calling local services on remote nodes
        };

        globalThis.distribution.local.comm.send(message, remote, (e, v) => {
          if (e) {
            errors[sid] = e; // collect error
          } 
          
          else {
            values[sid] = v; // collect value
          }

          left-=1;

          // call callback when all responses collected
          if (left === 0) {
            // return errors map if any errors, otherwise empty object
            const errorMappings = Object.keys(errors).length > 0 ? errors : {};
            callback(errorMappings, values);
          }
        });
      });
    });
  }

  return {send};
}

module.exports = comm;
