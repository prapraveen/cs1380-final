/**
 * @typedef {import("../types").Callback} Callback
 * @typedef {string} ServiceName
 */

const services = {};

/**
 * @param {ServiceName | {service: ServiceName, gid?: string}} configuration
 * @param {Callback} callback
 * @returns {void}
 */
function get(configuration, callback) {
  if (typeof configuration === 'string') {
    if (services[configuration]) {
      return callback(null, services[configuration]);
    } else {
      return callback(new Error(`unknown service: ${configuration}`));
    }
  }

  const {service, gid} = configuration;

  if (!gid || gid === 'local') {
    if (services[service]) {
      return callback(null, services[service]);
    } else {
      return callback(new Error(`unknown service: ${service}`));
    }
  }

  const reqService = globalThis.distribution?.[gid]?.[service];
  if (reqService) {
    return callback(null, reqService);
  } else {
    return callback(new Error(`unknown service: ${service} in gid: ${gid}`));
  }
}

/**
 * @param {object} service
 * @param {string} configuration
 * @param {Callback} callback
 * @returns {void}
 */
function put(service, configuration, callback) {
  services[configuration] = service;
  return callback(null, service);
}

/**
 * @param {string} configuration
 * @param {Callback} callback
 */
function rem(configuration, callback) {
  if (services[configuration]) {
    const service = services[configuration];
    delete services[configuration];
    return callback(null, service);
  } else {
    return callback(new Error(`unknown service: ${configuration}`));
  }
}

module.exports = {get, put, rem};
