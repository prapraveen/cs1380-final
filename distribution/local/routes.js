const { config } = require("yargs");

const distribution = globalThis.distribution;
/**
 * @typedef {import("../types").Callback} Callback
 * @typedef {string} ServiceName
 */

const serviceMappings = {};


/**
 * @param {ServiceName | {service: ServiceName, gid?: string}} configuration
 * @param {Callback} callback
 * @returns {void}
 */
function get(configuration, callback) {
    if (!callback) {
        callback = () => {};
    }
    let e = null;
    let s = null;
    let gid = configuration["gid"] || "local";
    let service_name = (typeof(configuration) == 'string') ? configuration : configuration["service"];
    if (service_name in distribution[gid]) {
        s = distribution[gid][service_name];
    } else if (service_name in serviceMappings) {
        s = serviceMappings[service_name];
    } else {
        e = Error("Service not found.");
    }
    callback(e, s);
}

/**
 * @param {object} service
 * @param {string} configuration
 * @param {Callback} callback
 * @returns {void}
 */
function put(service, configuration, callback) {
    if (!callback) {
        callback = () => {};
    }
    if (!service) {
        callback(Error("Missing service argument."), null);
        return;
    }
    if (!configuration) {
        callback(Error("Missing configuration."), null);
    }

    serviceMappings[configuration] = service;
    callback(null, configuration);
}

/**
 * @param {string} configuration
 * @param {Callback} callback
 */
function rem(configuration, callback) {
    if (!callback) {
        callback = () => {};
    }
    let e = null;
    let s = null;
    if (!configuration) {
        s = undefined;
    } else if (configuration in distribution.local) {
        e = Error("Cannot remove core service!");
    } else if (configuration in serviceMappings) {
        s = serviceMappings[configuration];
        delete serviceMappings[configuration];
    } else {
        e = Error("Service not found.");
    }
    callback(e, s);
}

module.exports = {get, put, rem};
