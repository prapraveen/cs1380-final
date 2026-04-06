const services = {};

function get(configuration, callback) {
  if (!configuration) {
    return callback(new Error('Service configuration required'));
  }

  let service;
  let gid = 'local';

  if (typeof configuration === 'string') {
    service = configuration;
  } 
  
  else if (typeof configuration === 'object' && configuration.service) {
    service = configuration.service;
    gid = configuration.gid || 'local';
  } 
  
  else {
    return callback(new Error('Invalid service configuration'));
  }
  
  // local services check first explicitly on local routes
  if (gid === 'local') {
    if (services[service]) {
      return callback(null, services[service]);
    }

    // check globalThis.toLocal for RPC callbacks registered by wire.createRPC
    if (globalThis.toLocal && globalThis.toLocal.has(service)) {
      return callback(null, {call: globalThis.toLocal.get(service)});
    }

    return callback(new Error(`Service '${service}' not found`));
  }

  // distributed services check explicitly on distribution for specified gid
  // check if globalThis.distribution exists
  if (!globalThis.distribution) {
    return callback(new Error('Distribution not initialized'));
  }

   
  const group = globalThis.distribution[gid]; // group exists on distribution
  if (!group) {
    return callback(new Error(`Group '${gid}' not found`));
  }

  
  const serviceObj = group[service]; // service exists on that group
  if (!serviceObj) {
    return callback(new Error(`Service '${service}' not found in group '${gid}'`));
  }

  return callback(null, serviceObj); // if service found, return it
}

function put(serviceObj, serviceName, callback) {
  if (!serviceObj) {
    return callback(new Error('Service object required'));
  }

  if (!serviceName || typeof serviceName !== 'string') {
    return callback(new Error('Service name must be string'));
  }

  services[serviceName] = serviceObj;
  return callback(null, serviceName);
}

function rem(serviceName, callback) {
  if (!services[serviceName]) {
    return callback(new Error(`Service '${serviceName}' not found`));
  }

  const removed = services[serviceName];
  delete services[serviceName];
  return callback(null, removed);
}

module.exports = { get, put, rem };
