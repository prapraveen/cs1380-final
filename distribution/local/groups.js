const distribution = globalThis.distribution;
const id = distribution.util.id;
// @ts-check
/**
 * @typedef {import("../types.js").Callback} Callback
 * @typedef {import("../types.js").Config} Config
 * @typedef {import("../types.js").Node} Node
 */

const groups_map = {};

/**
 * @param {string} name
 * @param {Callback} callback
 */
function get(name, callback) {
  if (!callback) {
    callback = () => {};
  }

  if (name == "all") {
    const all_nodes = {}
    for (const [_, value] of Object.entries(groups_map)) {
      for (const [sid, node] of Object.entries(value)) {
        all_nodes[sid] = node;
      }
    }
    all_nodes[id.getSID(distribution.node.config)] = distribution.node.config;
    return callback(null, all_nodes);
  }
  if (name in groups_map) {
    return callback(null, groups_map[name]);
  } else {
    return callback (new Error("Get: Group not found."), null);
  }
}

/**
 * @param {Config | string} config
 * @param {Object.<string, Node>} group
 * @param {Callback} callback
 */
function put(config, group, callback) {
  if (!callback) {
    callback = () => {};
  }

  if (typeof(config) == 'string') {
    config = {gid: config};
  }
  groups_map[config.gid] = group;
  distribution[config.gid] = {};
  const {setup} = require('../all/all.js');
  distribution[config.gid] = setup(config);
  return callback(null, group);
}

/**
 * @param {string} name
 * @param {Callback} callback
 */
function del(name, callback) {
  if (!callback) {
    callback = () => {};
  }

  if (!(name in groups_map)) {
    return callback(new Error("Del: Group not found."), null);
  }
  const ret = groups_map[name];
  delete groups_map[name];
  delete distribution[name];
  return callback(null, ret);
}

/**
 * @param {string} name
 * @param {Node} node
 * @param {Callback} callback
 */
function add(name, node, callback) {
  if (!callback) {
    callback = () => {};
  }

  if (!(name in groups_map)) {
    return callback(new Error("Add: Group not found."), null);
  }
  groups_map[name][id.getSID(node)] = node;
  return callback(null, groups_map[name]);
};

/**
 * @param {string} name
 * @param {string} node
 * @param {Callback} callback
 */
function rem(name, node, callback) {
  if (!(name in groups_map)) {
    return callback(new Error("Rem: Group not found."), null);
  }

  if (!(node in groups_map[name])) {
    return callback(new Error("Node not found."), null);
  }

  const ret = groups_map[name][node];
  delete groups_map[name][node];
  return callback(null, ret);
};

module.exports = {get, put, del, add, rem};
