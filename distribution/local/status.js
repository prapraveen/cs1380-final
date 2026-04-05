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
  const config = globalThis.distribution.node.config;
  const id = globalThis.distribution.util.id;

  switch (configuration) {
    case 'nid':
      return callback(null, id.getNID(config));
    case 'sid':
      return callback(null, id.getSID(config));
    case 'ip':
      return callback(null, config.ip);
    case 'port':
      return callback(null, config.port);
    case 'counts':
      return callback(null, globalThis.distribution.node.counter || 0);
    case 'heapTotal':
      return callback(null, process.memoryUsage().heapTotal);
    case 'heapUsed':
      return callback(null, process.memoryUsage().heapUsed);
    default:
      return callback(new Error(`unknown configuration: ${configuration}`));
  }
}


/**
 * @param {Node} configuration
 * @param {Callback} callback
 */
function spawn(configuration, callback) {
  return callback(new Error('did not implement'), null);
}

/**
 * @param {Callback} callback
 */
function stop(callback) {
  return callback(new Error('did not implement'), null);
}

module.exports = {get, spawn, stop};

