const id = distribution.util.id;
// @ts-check
/**
 * @typedef {import("../types.js").Callback} Callback
 * @typedef {import("../types.js").Config} Config
 * @typedef {import("../types.js").Node} Node
 */


/**
 * @typedef {Object} StoreConfig
 * @property {string | null} key
 * @property {string} gid
 *
 * @typedef {StoreConfig | string | null} SimpleConfig
 *
 * @typedef {Object} Mem
 * @property {(configuration: SimpleConfig, callback: Callback) => void} get
 * @property {(state: any, configuration: SimpleConfig, callback: Callback) => void} put
 * @property {(state: any, configuration: SimpleConfig, callback: Callback) => void} append
 * @property {(configuration: SimpleConfig, callback: Callback) => void} del
 * @property {(configuration: Object.<string, Node>, callback: Callback) => void} reconf
 */


/**
 * @param {Config} config
 * @returns {Mem}
 */
function mem(config) {
  const context = {};
  context.gid = config.gid || 'all';
  context.hash = config.hash || globalThis.distribution.util.id.naiveHash;

  /**
   * @param {SimpleConfig} configuration
   * @param {Callback} callback
   */
  function get(configuration, callback) {
    if (configuration === null) {
        distribution.groupA.comm.send([{gid: "groupA", key: null}], {service: "mem", method: "get"}, (e, v) => {
            return callback(null, Object.values(v).reduce((a, b) => [...a, ...b], []));
        })
        return;
    }
    distribution.local.groups.get(context.gid, (e, v) => {
      if (e) return callback(e);
      const nids = Object.values(v).map(id.getNID);
      const kid = id.getID(configuration);
      const nid = context.hash(kid, nids);
      const sid = nid.substring(0, 5);
      const node = v[sid]

      const message = [{key: configuration, gid: context.gid}];
      distribution.local.comm.send(message, {service: "mem", node: node, method: "get"}, callback);
    })
  }

  /**
   * @param {any} state
   * @param {SimpleConfig} configuration
   * @param {Callback} callback
   */
  function put(state, configuration, callback) {
    distribution.local.groups.get(context.gid, (e, v) => {
      if (e) return callback(e);
      const nids = Object.values(v).map(id.getNID);
      if (!configuration) {
        configuration = id.getID(state);
      }
      const kid = id.getID(configuration);
      const nid = context.hash(kid, nids);
      const sid = nid.substring(0, 5);
      const node = v[sid]

      const message = [state, {key: configuration, gid: context.gid}];
      distribution.local.comm.send(message, {service: "mem", node: node, method: "put"}, callback);
    })
  }

  /**
   * @param {any} state
   * @param {SimpleConfig} configuration
   * @param {Callback} callback
   */
  function append(state, configuration, callback) {
    distribution.local.groups.get(context.gid, (e, v) => {
      if (e) return callback(e);
      const nids = Object.values(v).map(id.getNID);
      if (!configuration) {
        configuration = id.getID(state);
      }
      const kid = id.getID(configuration);
      const nid = context.hash(kid, nids);
      const sid = nid.substring(0, 5);
      const node = v[sid]

      const message = [state, {key: configuration, gid: context.gid}];
      distribution.local.comm.send(message, {service: "mem", node: node, method: "append"}, callback);
    })
  }

  /**
   * @param {SimpleConfig} configuration
   * @param {Callback} callback
   */
  function del(configuration, callback) {
    distribution.local.groups.get(context.gid, (e, v) => {
      if (e) return callback(e);
      const nids = Object.values(v).map(id.getNID);
      const kid = id.getID(configuration);
      const nid = context.hash(kid, nids);
      const sid = nid.substring(0, 5);
      const node = v[sid]

      const message = [{key: configuration, gid: context.gid}];
      distribution.local.comm.send(message, {service: "mem", node: node, method: "del"}, callback);
    })
  }

  /**
   * @param {Object.<string, Node>} configuration
   * @param {Callback} callback
   */
  function reconf(configuration, callback) {
    return callback(new Error('mem.reconf not implemented'));
  }
  /* For the distributed mem service, the configuration will
          always be a string */
  return {
    get,
    put,
    append,
    del,
    reconf,
  };
}

module.exports = mem;
