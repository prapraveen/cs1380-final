const id = distribution.util.id;
// @ts-check
/**
 * @typedef {import("../types.js").Callback} Callback
 * @typedef {import("../types.js").Config} Config
 * @typedef {import("../types.js").Hasher} Hasher
 * @typedef {import("../types.js").Node} Node
 */


/**
 * @typedef {Object} StoreConfig
 * @property {string | null} key
 * @property {string} gid
 *
 * @typedef {StoreConfig | string | null} SimpleConfig
 */


/**
 * @param {Config} config
 */
function store(config) {
  const context = {
    gid: config.gid || 'all',
    hash: config.hash || globalThis.distribution.util.id.naiveHash,
    subset: config.subset,
  };

  /**
   * @param {SimpleConfig} configuration
   * @param {Callback} callback
   */
  function get(configuration, callback) {
    if (configuration === null) {
        distribution[context.gid].comm.send([{gid: context.gid, key: null}], {service: "store", method: "get"}, (e, v) => {
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
      distribution.local.comm.send(message, {service: "store", node: node, method: "get"}, callback);
    });
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
      distribution.local.comm.send(message, {service: "store", node: node, method: "put"}, callback);
    });
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
      distribution.local.comm.send(message, {service: "store", node: node, method: "append"}, callback);
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
      distribution.local.comm.send(message, {service: "store", node: node, method: "del"}, callback);
    });
  }

  /**
   * @param {Object.<string, Node>} configuration
   * @param {Callback} callback
   */
  function reconf(configuration, callback) {
    return callback(new Error('store.reconf not implemented'));
  }

  /* For the distributed store service, the configuration will
          always be a string */
  return {get, put, append, del, reconf};
}

module.exports = store;
