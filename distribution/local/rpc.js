function run(funcId, args, callback) {
  const func = globalThis.distribution.toLocal[funcId];

  if (!func) {
    return callback(new Error(`RPC function not found: ${funcId}`), null);
  }

  try {
    func(...args, callback);
  } catch (error) {
    return callback(error, null);
  }
}

module.exports = {run};