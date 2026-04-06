// @ts-check
/**
 * @typedef {import("../types.js").Callback} Callback
 * @typedef {import("../types.js").Config} Config
 * @typedef {import("../types.js").Node} Node
 */

const id = require('../util/id.js');
// define group mapping storage
// format: {gid -> {sid -> node}}
const groups = {};

// initialize default groups for local node and all nodes
const initialGroups = () => {
  const localNode = globalThis.distribution.node.config;
  const localSid = id.getSID(localNode);

  if (!groups['all']) { // initialize all groups
    groups['all'] = {[localSid]: localNode}; 
  }

  if (!groups['local']) { // initialize local group with local node, sid
    groups['local'] = {[localSid]: localNode};
  }
};

// call init on module load
initialGroups();

/**
 * @param {string} name
 * @param {Callback} callback
 */
function get(name, callback) {
  if (!name || typeof name !== 'string') { // validate group name type
    return callback(new Error('group name is not a string'));
  }

  // check if group exists
  if (groups[name]) {
    return callback(null, groups[name]);
  }
  
  else { // handle case when group does not exist
    return callback(new Error(`group '${name}' not found`));
  }
}

/**
 * @param {Config | string} config
 * @param {Object.<string, Node>} group
 * @param {Callback} callback
 */
function put(config, group, callback) {
  let gid;
  if (typeof config === 'string') { // extract gid from config
    gid = config; // simple string name
  }
  
  else if (typeof config === 'object' && config.gid) {
    gid = config.gid; // object with gid property
  }
  
  else { // handle case when config is invalid and gid cannot be extracted
    return callback(new Error('no gid, invalid config'));
  }

  if (!group || typeof group !== 'object') { // validate group object
    return callback(new Error('group must be object'));
  }

  // store group, replacing any possible existing group with same gid
  groups[gid] = group;

  // dynamically create distribution[gid] object
  if (!globalThis.distribution[gid]) {
    // normalize config so it's always object with gid
    const serviceConfig = typeof config === 'object' ? config : {gid: config};

    // use the setup function from all.js to create services for this group
    const {setup} = require('../all/all.js');
    globalThis.distribution[gid] = setup(serviceConfig);
  }

  return callback(null, group); // return group not gid
}

/**
 * @param {string} name
 * @param {Callback} callback
 */

function del(name, callback) {
  if (!name || typeof name !== 'string') { // validate group name type
    return callback(new Error('group name must be string'));
  }

  if (groups[name]) { // remove group if it exists
    const deletedGroup = groups[name];
    delete groups[name];
    delete globalThis.distribution[name];
    // clean up distribution object
    return callback(null, deletedGroup); // return deleted group
  }

  else {
    return callback(new Error(`group '${name}' not found`));
  }
}

/**
 * @param {string} name
 * @param {Node} node
 * @param {Callback} callback
 */
function add(name, node, callback) {
  // handle group name and node validations
  if (!name || typeof name !== 'string') {
    return callback(new Error('group name must be string'));
  }

  if (!node || !node.ip || !node.port) {
    return callback(new Error('node must have ip and port'));
  }

  if (!groups[name]) {
    return callback(new Error(`group '${name}' not found`)); // error not noop
  }

  // success case to add node to group
  const sid = id.getSID(node);
  groups[name][sid] = node;

  // return updated group
  if (callback) {
    return callback(null, groups[name]);
  }
  return groups[name];
};

/**
 * @param {string} name
 * @param {string} nodeId
 * @param {Callback} callback
 */
function rem(name, nodeId, callback) {
  // handle group name and node validations
  if (!name || typeof name !== 'string') {
    return callback(new Error('group name must be string'));
  }

  if (!nodeId || typeof nodeId !== 'string') {
    return callback(new Error('node id must be string'));
  }

  if (!groups[name]) {
    return callback(new Error(`group '${name}' not found`)); // error not noop
  }

  // remove case: remove node from group
  if (groups[name][nodeId]) {
    delete groups[name][nodeId];
  }

  // return updated group
  return callback(null, groups[name]);
};

module.exports = {get, put, del, add, rem};
