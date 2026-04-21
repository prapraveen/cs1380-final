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

  function getError(error) {
    if (!error) {
      return null;
    }

    if (error instanceof Error) {
      return error;
    }

    const errors = Object.values(error).filter(Boolean);
    return errors.length > 0 ? errors[0] : null;
  }

  function partitionKeys(keys, group) {
    const entries = Object.entries(group);
    const partitions = {};
    const nids = entries.map(([, node]) => {
      return globalThis.distribution.util.id.getNID(node);
    });

    entries.forEach(([sid]) => {
      partitions[sid] = [];
    });

    keys.forEach((key) => {
      const kid = globalThis.distribution.util.id.getID(key);
      const targetNid = globalThis.distribution.util.id.naiveHash(kid, nids);
      const targetEntry = entries.find(([, node]) => {
        return globalThis.distribution.util.id.getNID(node) === targetNid;
      });

      if (targetEntry) {
        partitions[targetEntry[0]].push(key);
      }
    });

    return partitions;
  }

  function flattenResults(values) {
    return Object.values(values).reduce((results, value) => {
      if (Array.isArray(value)) {
        return results.concat(value);
      }

      if (value === null || value === undefined) {
        return results;
      }

      results.push(value);
      return results;
    }, ([]));
  }

  /**
   * @param {MRConfig} configuration
   * @param {Callback} callback
   * @returns {void}
   */
  function exec(configuration, callback) {
    const mrID = globalThis.distribution.util.id.getID(`${configuration}${Date.now()}`);
    const mrServiceName = `mr${mrID}`;

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
      map: function (
          /** @type {string[]} */ keys,
          /** @type {string} */ gid,
          /** @type {string} */ mrID,
          /** @type {Callback} */ callback,
      ) {
        if (keys.length === 0) {
          return callback(null, []);
        }

        return globalThis.distribution.local.groups.get(gid, (groupError, group) => {
          if (groupError || !group) {
            return callback(groupError || new Error(`unknown group ${gid}`), null);
          }

          const entries = Object.entries(group);
          const nids = entries.map(([, node]) => globalThis.distribution.util.id.getNID(node));

          const MAP_CONCURRENCY = 5;
          const PAIR_CONCURRENCY = 200;
          let docIndex = 0;
          let docInFlight = 0;
          let docsCompleted = 0;
          let pairsInFlight = 0;
          const pairsQueue = [];
          let finished = false;
          const total = keys.length;

          const finish = (err) => {
            if (finished) return;
            finished = true;
            callback(err || null, err ? null : []);
          };

          const flushPairs = () => {
            while (pairsInFlight < PAIR_CONCURRENCY && pairsQueue.length > 0) {
              const { key, value, onSent } = pairsQueue.shift();
              pairsInFlight++;

              const kid = globalThis.distribution.util.id.getID(key);
              const targetNid = globalThis.distribution.util.id.naiveHash(kid, nids);
              const targetNode = entries.find(([, node]) => {
                return globalThis.distribution.util.id.getNID(node) === targetNid;
              });

              if (!targetNode) {
                pairsInFlight--;
                return finish(new Error('unknown target node'));
              }

              globalThis.distribution.local.comm.send(
                [value, { key, gid: mrID }],
                { node: targetNode[1], service: 'mem', method: 'append' },
                (sendError) => {
                  pairsInFlight--;
                  onSent(sendError);
                  if (!finished) flushPairs();
                },
              );
            }
          };

          const mapNext = () => {
            while (!finished && docIndex < total && docInFlight < MAP_CONCURRENCY) {
              const key = keys[docIndex++];
              docInFlight++;
              const localConfig = { key, gid };

              globalThis.distribution.local.store.get(localConfig, (localError, localValue) => {
                const onValue = (error, value) => {
                  if (finished) return;
                  if (error) return finish(error);

                  const mapped = this.mapper(key, value);
                  docInFlight--;
                  mapNext();

                  const pairs = [];
                  if (Array.isArray(mapped)) {
                    for (const obj of mapped) {
                      if (obj && typeof obj === 'object') {
                        for (const [k, v] of Object.entries(obj)) pairs.push([k, v]);
                      }
                    }
                  } else if (mapped && typeof mapped === 'object') {
                    for (const [k, v] of Object.entries(mapped)) pairs.push([k, v]);
                  }

                  if (pairs.length === 0) {
                    docsCompleted++;
                    if (docsCompleted === total) finish(null);
                    return;
                  }

                  let pairsLeft = pairs.length;
                  for (const [k, v] of pairs) {
                    pairsQueue.push({
                      key: k,
                      value: v,
                      onSent: (sendError) => {
                        if (finished) return;
                        if (sendError) return finish(sendError);
                        pairsLeft--;
                        if (pairsLeft === 0) {
                          docsCompleted++;
                          if (docsCompleted === total) finish(null);
                        }
                      },
                    });
                  }
                  flushPairs();
                };

                if (!localError) return onValue(null, localValue);
                return globalThis.distribution[gid].store.get(key, onValue);
              });
            }
          };

          mapNext();
        });
      },
      shuffle: function (
          /** @type {string} */ gid,
          /** @type {string} */ mrID,
          /** @type {Callback} */ callback,
      ) {
        callback(null, []);
      },
      reduce: function (
          /** @type {string} */ gid,
          /** @type {string} */ mrID,
          /** @type {Callback} */ callback,
      ) {
        // Fetch grouped values from local store, apply reducer, and return final output.
        return globalThis.distribution.local.mem.get({ key: null, gid: mrID }, (error, keys) => {
          if (error) {
            return callback(error, null);
          }

          if (keys.length === 0) {
            return callback(null, null);
          }

          const reducedValues = [];
          const REDUCE_CONCURRENCY = 20;
          let reduceIndex = 0;
          let reduceInFlight = 0;
          let reduceDone = 0;
          let finished = false;

          const reduceDispatch = () => {
            while (!finished && reduceInFlight < REDUCE_CONCURRENCY && reduceIndex < keys.length) {
              const key = keys[reduceIndex++];
              reduceInFlight++;

              globalThis.distribution.local.mem.get({ key, gid: mrID }, (getError, values) => {
                if (finished) return;
                if (getError) {
                  finished = true;
                  return callback(getError, null);
                }

                const reduced = this.reducer(key, values);
                if (Array.isArray(reduced)) {
                  reducedValues.push(...reduced);
                } else if (reduced !== null && reduced !== undefined) {
                  reducedValues.push(reduced);
                }

                globalThis.distribution.local.mem.del({ key, gid: mrID }, () => {
                  reduceInFlight--;
                  reduceDone++;
                  if (reduceDone === keys.length) return callback(null, reducedValues);
                  setImmediate(reduceDispatch);
                });
              });
            }
          };

          reduceDispatch();
        });
      },
    };


    // Register the mr service on all nodes in the group and execute in sequence: map, shuffle, reduce.
    return globalThis.distribution.local.groups.get(context.gid, (e, group) => {
      if (e || !group) {
        return callback(e || new Error(`unknown group ${context.gid}`), null);
      }

      const sids = Object.keys(group);
      if (sids.length === 0) {
        return callback(new Error(`group '${context.gid}' is empty`), null);
      }
      const keyPartitions = partitionKeys(configuration.keys, group);

      const finish = (error, result) => {
        const phaseError = getError(error);
        globalThis.distribution[context.gid].routes.rem(mrServiceName, () => {
          if (phaseError) {
            return callback(phaseError, null);
          }

          callback(null, result);
        });
      };

      return globalThis.distribution[context.gid].routes.put(
        mrService,
        mrServiceName,
        (putError) => {
          const registerError = getError(putError);
          if (registerError) {
            return finish(registerError, null);
          }

          let pending = sids.length;
          let finished = false;

          sids.forEach((sid) => {
            const remote = {
              node: group[sid],
              service: mrServiceName,
              method: 'map',
            };
            const message = [keyPartitions[sid] || [], context.gid, mrID];

            globalThis.distribution.local.comm.send(message, remote, (mapError) => {
              if (finished) {
                return;
              }

              if (mapError) {
                finished = true;
                return finish(mapError, null);
              }

              pending--;
              if (pending > 0) {
                return;
              }

              const shuffleRemote = { service: mrServiceName, method: 'shuffle' };
              return globalThis.distribution[context.gid].comm.send(
                [context.gid, mrID],
                shuffleRemote,
                (shuffleErrors) => {
                  const shuffleError = getError(shuffleErrors);
                  if (shuffleError) {
                    return finish(shuffleError, null);
                  }

                  const reduceRemote = { service: mrServiceName, method: 'reduce' };
                  return globalThis.distribution[context.gid].comm.send(
                    [context.gid, mrID],
                    reduceRemote,
                    (reduceErrors, reduceValues) => {
                      const reduceError = getError(reduceErrors);
                      if (reduceError) {
                        return finish(reduceError, null);
                      }

                      return finish(null, flattenResults(reduceValues));
                    },
                  );
                },
              );
            });
          });
        },
      );
    });
  }

  return { exec };
}

module.exports = mr;
