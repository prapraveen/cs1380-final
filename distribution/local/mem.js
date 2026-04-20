const { config } = require("yargs");

const distribution = globalThis.distribution;
const id = distribution.util.id;
// @ts-check
/**
 * @typedef {import("../types.js").Callback} Callback
 *
 * @typedef {Object} StoreConfig
 * @property {string | null} key
 * @property {string | null} gid
 *
 * @typedef {StoreConfig | string | null} SimpleConfig
 */

const memory = Object.create(null);


/**
 * @param {any} state
 * @param {SimpleConfig} configuration
 * @param {Callback} callback
 */
function put(state, configuration, callback) {
  if (!configuration) {
    configuration = {key: id.getID(state), gid: "local"};
  } else if (!configuration.gid) { // if its just a string
    configuration = {key: configuration, gid: "local"};
  } else if (!configuration.key) { // sent from all.comm, but with no key
    configuration.key = id.getID(state);
  }

  if (!Object.prototype.hasOwnProperty.call(memory, configuration.gid)) {
    memory[configuration.gid] = Object.create(null);
  }
  memory[configuration.gid][configuration.key] = state;
  return callback(null, state);
};

/**
 * @param {any} state
 * @param {SimpleConfig} configuration
 * @param {Callback} callback
 */
function append(state, configuration, callback) {
  if (!configuration) {
    configuration = {key: id.getID(state), gid: "local"};
  } else if (!configuration.gid) {
    configuration = {key: configuration, gid: "local"};
  }
  get(configuration, (e, v) => {
    if (e) {
      if (e.code == "NOT FOUND") {
        v = [];
      } else {
        return callback(e);
      }
    }

    if (!(v instanceof Array)) {
      v = [v];
    }  
    if (!(state instanceof Array)) {
      state = [state];
    }

    v = [...v, ...state];

    put(v, configuration, (e, _) => {
      return callback(e, v);
    })
  })

};

/**
 * @param {SimpleConfig} configuration
 * @param {Callback} callback
 */
function get(configuration, callback) {
  if (!configuration || !configuration.gid) { // if its just a string
    configuration = {key: configuration, gid: "local"};
  }

  if (!Object.prototype.hasOwnProperty.call(memory, configuration.gid)) {
    if (configuration.key == null) {
      return callback(null, []);
    }
    const e = new Error("Key not found in GID.");
    e.code = "NOT FOUND";
    return callback(e, null);
  }

  if (configuration.key === null) {
    return callback(null, Object.keys(memory[configuration.gid]));
  }

  if (!Object.prototype.hasOwnProperty.call(
      memory[configuration.gid],
      configuration.key,
  )) {
    const e = new Error("Key not found in GID.");
    e.code = "NOT FOUND";
    return callback(e, null);
  }
  const ret = memory[configuration.gid][configuration.key];
  return callback(null, ret);
}

/**
 * @param {SimpleConfig} configuration
 * @param {Callback} callback
 */
function del(configuration, callback) {
  if (!configuration.gid) { // if its just a string
    configuration = {key: configuration, gid: "local"};
  }

  if (!Object.prototype.hasOwnProperty.call(memory, configuration.gid)) {
    return callback(new Error("GID not in local memory."), null);
  }

  if (!Object.prototype.hasOwnProperty.call(
      memory[configuration.gid],
      configuration.key,
  )) {
    return callback(new Error("Key not found in GID."), null);
  }
  const ret = memory[configuration.gid][configuration.key];
  delete memory[configuration.gid][configuration.key];
  return callback(null, ret);
};

module.exports = {put, get, del, append};
