const distribution = globalThis.distribution;
const id = distribution.util.id;
const fs = require("fs");

const path = `store/${id.getNID(distribution.node.config)}/`
fs.mkdirSync(path, { recursive: true });
// @ts-check
/**
 * @typedef {import("../types.js").Callback} Callback
 *
 * @typedef {Object} StoreConfig
 * @property {?string} key
 * @property {?string} gid
 *
 * @typedef {StoreConfig | string | null} SimpleConfig
 */

/* Notes/Tips:

- Use absolute paths to make sure they are agnostic to where your code is running from!
  Use the `path` module for that.
*/



/**
 * @param {any} state
 * @param {SimpleConfig} configuration
 * @param {Callback} callback
 */
function put(state, configuration, callback) {
  if (!configuration) {
    configuration = {key: id.getID(state), gid: "local"};
  } else if (!configuration.gid) {
    configuration = {key: configuration, gid: "local"};
  }

  fs.mkdirSync(`${path}/${configuration.gid}`, {recursive: true});
  try {
    fs.writeFileSync(`${path}/${configuration.gid}/${configuration.key}`, distribution.util.serialize(state), "utf8");
    return callback(null, state)
  } catch (e) {
    return callback(e, null);
  }
}

/**
 * @param {SimpleConfig} configuration
 * @param {Callback} callback
 */
function get(configuration, callback) {
  if (!configuration || !configuration.gid) {
    configuration = {key: configuration, gid: "local"};
  }

  if (configuration.key === null) {
    if (!fs.existsSync(`${path}/${configuration.gid}/`)) {
      return callback(null, []);
    }
    const files = fs.readdirSync(`${path}/${configuration.gid}/`);
    const keys = files.map(f => f.split(".")[0]);
    return callback(null, keys);
  }

  try {
    const val = fs.readFileSync(`${path}/${configuration.gid}/${configuration.key}`, 'utf8');
    return callback(null, distribution.util.deserialize(val));
  } catch(e) {
    if (e.code == "ENOENT") {
      return callback(e, null);
    }
    return callback(e, null);
  }
}

/**
 * @param {SimpleConfig} configuration
 * @param {Callback} callback
 */
function del(configuration, callback) {
 if (!configuration.gid) {
   configuration = {key: configuration, gid: "local"};
 }
 try {
    const val = fs.readFileSync(`${path}/${configuration.gid}/${configuration.key}`, "utf8");
    fs.unlinkSync(`${path}/${configuration.gid}/${configuration.key}`);
    return callback(null, distribution.util.deserialize(val));
  } catch(e) {
    if (e.code == "ENOENT") {
      return callback(e, null);
    }
    return callback(e, null);
  }
}

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
      if (e.code == "ENOENT") {
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
}

module.exports = {put, get, del, append};
