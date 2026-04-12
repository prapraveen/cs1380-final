const id = distribution.util.id;
// @ts-check
/**
 * @typedef {import("../types.js").Callback} Callback
 * @typedef {import("../types.js").Config} Config
 * @typedef {import("../util/id.js").NID} NID
 */

/**
 * Map functions used for mapreduce
 * @callback Mapper
 * @param {string} key
 * @param {any} value
 * @returns {object[]}
 */

/**
 * Reduce functions used for mapreduce
 * @callback Reducer
 * @param {string} key
 * @param {any[]} value
 * @returns {object}
 */

/**
 * @typedef {Object} MRConfig
 * @property {Mapper} map
 * @property {Reducer} reduce
 * @property {string[]} keys
 *
 * @typedef {Object} Mr
 * @property {(configuration: MRConfig, callback: Callback) => void} exec
 */


/*
  Note: The only method explicitly exposed in the `mr` service is `exec`.
  Other methods, such as `map`, `shuffle`, and `reduce`, should be dynamically
  installed on the remote nodes and not necessarily exposed to the user.
*/

/**
 * @param {Config} config
 * @returns {Mr}
 */
function mr(config) {
  const context = {
    gid: config.gid || 'all',
  };

  /**
   * @param {MRConfig} configuration
   * @param {Callback} callback
   * @returns {void}
   */
  function exec(configuration, callback) {
    const mrID = id.getID(`${configuration}${Date.now()}`);
    const mrGid = `mr${mrID}`;

    /*
      MapReduce steps:
      1) Setup: register a service `mr-<id>` on all nodes in the group. The service implements the map, shuffle, and reduce methods.
      2) Map: make each node run map on its local data and store them locally, under a different gid, to be used in the shuffle step.
      3) Shuffle: group values by key using store.append.
      4) Reduce: make each node run reduce on its local grouped values.
      5) Cleanup: remove the `mr-<id>` service and return the final output.

      Note: Comments inside the stencil describe a possible implementation---you should feel free to make low- and mid-level adjustments as needed.
    */
    const mrService = {
      mapper: configuration.map,
      reducer: configuration.reduce,
      map: function(
          /** @type {string} */ mrGid,
          /** @type {string} */ mrID,
          /** @type {Callback} */ callback,
      ) {
        // Map should read the node's local keys under the mrGid gid and write to store under gid `${mrID}_map`.
        // Expected output: array of objects with a single key per object.
        // console.log("entered map");
        distribution.local.store.get({gid: mrGid, key: null}, (e, v) => {
          if (e) return callback(e, v);
          // console.log("all keys: ", v);
          let all_res = [];
          let mapStepCounter = 0;
          const totalSteps = v.length;
          if (totalSteps == 0) {
            return callback(null, []);
          }
          v.forEach((key) => {
            // console.log("KEY: ", key);
            distribution.local.store.get({gid: mrGid, key: key}, (e, value) => {
              // console.log(mrGid, ": ", value);
              if (value === null) {
                return callback(null, []);
              }
              // if (e) console.log(e);
              distribution.local.routes.get(mrID, (e, f) => {
                let map_res = f.mapper(key, value, (v) => {
                  if (v instanceof Array) {
                    for (const elt of v) {
                      all_res.push(elt)
                    }
                  } else {
                    all_res.push(v);
                  }

                  mapStepCounter++;
                  if (mapStepCounter == totalSteps) {
                    let storeStepCounter = 0;
                    const totalStoreSteps = all_res.length;
                    // console.log("total store steps:", totalStoreSteps);
                    if (storeStepCounter == totalStoreSteps) {
                      return callback(null, []);
                    }
                    all_res.forEach((kv) => {
                      const k = Object.keys(kv)[0];
                      const v = Object.values(kv)[0];
                      distribution.local.store.append(v, {gid: `${mrID}_map`, key: k}, (e, v) => {
                        storeStepCounter++;
                        // console.log("store step counter:", storeStepCounter);
                        if (storeStepCounter == totalStoreSteps) {
                          return callback(null, all_res);
                        }
                      });
                    })
                  }
                });

                // console.log(mrGid, ": ", map_res);

              })
            })
          })
        })
      },
      shuffle: function(
          /** @type {string} */ gid,
          /** @type {string} */ mrID,
          /** @type {Callback} */ callback,
      ) {
        // Fetch the mapped values from the local store
        // Shuffle groups values by key (via store.append).
        distribution.local.store.get({gid: `${mrID}_map`, key: null}, (e, v) => {
          if (e) return callback(e, null);
          const appendStep = (idx) => {
            if (idx == v.length) {
              return callback(null, true);
            }

            const key = v[idx];
            distribution.local.store.get({gid: `${mrID}_map`, key: key}, (e, val) => {
              distribution[gid].store.append(val, key, (e, v) => {
                appendStep(idx + 1);
              })
            })
          }
          appendStep(0);
        })
      },
      reduce: function(
          /** @type {string} */ gid,
          /** @type {string} */ mrID,
          /** @type {Callback} */ callback,
      ) {
        // Fetch grouped values from local store, apply reducer, and return final output.
        distribution.local.store.get({gid: gid, key: null}, (e, v) => {
          if (e) return callback(e, null);
          const res = [];
          const reduceStep = (idx) => {
            if (idx == v.length) {
              // console.log(res);
              return callback(null, res);
            }
            const key = v[idx];
            distribution.local.store.get({gid: gid, key: key}, (e, values) => {
              distribution.local.routes.get(mrID, (e, f) => {
                let kv = f.reducer(key, values);
                res.push(kv);
                reduceStep(idx + 1);
              })
            })
          }
          reduceStep(0);
        })
      },
      cleanup: function(
        gid,
        mrID,
        callback,
      ) {
        distribution.local.store.get({gid: gid, key: null}, (e, keys) => {
          if (e) return callback(e, null);
          for (const key of keys) {
            distribution.local.store.del({gid: gid, key: key}, () => {});
          }

          distribution.local.store.get({gid: `${mrID}_map`, key: null}, (e, keys) => {
            for (const key of keys) {
              distribution.local.store.del({gid: `${mrID}_map`, key: key}, () => {});
            }
          })
        })
        return callback(null, true);
      }
    };


    // Register the mr service on all nodes in the group and execute in sequence: map, shuffle, reduce.
    distribution[context.gid].routes.put(mrService, mrID, (e, v) => {
      // console.log(mrID);
        // console.log("step 1:");
      distribution[context.gid].comm.send([context.gid, mrID], {service: mrID, method: "map"}, (e, v) => {
        // console.log("step 2:", v);
        distribution.local.groups.get(context.gid, (e, v) => {
            // console.log("step 3:", v);
          distribution[context.gid].groups.put({gid: mrGid}, v, (e, v) => {
              // console.log("step 4:", v);
            distribution[context.gid].comm.send([mrGid, mrID], {service: mrID, method: "shuffle"}, (e, v) => {
                // console.log("step 5:", v);
              distribution[context.gid].comm.send([mrGid, mrID], {service: mrID, method: "reduce"}, (e, v) => {
                  // console.log("step 6:", v);
                // cleanup
                distribution[context.gid].comm.send([mrGid, mrID], {service: mrID, method: "cleanup"}, () => {
                  // distribution[context.gid].groups.del(mrGid, () => {
                  //   distribution[context.gid].routes.rem(mrID, () => {
                      const res = Object.values(v).reduce((a, b) => [...a, ...b], []);
                      callback(null, res);
                  //   });
                  // });
                });
              })
            })
          })
        })
      });
    })
  }

  return {exec};
}

module.exports = mr;
