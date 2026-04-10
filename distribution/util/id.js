// @ts-check
/**
 * @typedef {import("../types.js").Node} Node
 * @typedef {import("../types.js").ID} ID
 * @typedef {import("../types.js").NID} NID
 * @typedef {import("../types.js").SID} SID
 * @typedef {import("../types.js").Hasher} Hasher
 */

const assert = require('assert');
const crypto = require('crypto');

/**
 * @param {any} obj
 * @returns {ID}
 */
function getID(obj) {
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(obj));
  return hash.digest('hex');
}

/**
 * The NID is the SHA256 hash of the JSON representation of the node
 * @param {Node} node
 * @returns {NID}
 */
function getNID(node) {
  node = {ip: node.ip, port: node.port};
  return getID(node);
}

/**
 * The SID is the first 5 characters of the NID
 * @param {Node} node
 * @returns {SID}
 */
function getSID(node) {
  return getNID(node).substring(0, 5);
}

/**
 * @param {any} message
 * @returns {string}
 */
function getMID(message) {
  const msg = {};
  msg.date = new Date().getTime();
  msg.mss = message;
  return getID(msg);
}

/**
 * @param {string} id
 * @returns {bigint}
 */
function idToNum(id) {
  assert(typeof id === 'string', 'idToNum: id is not in KID form!');
  const trimmed = id.startsWith('0x') ? id.slice(2) : id;
  if (/^[0-9a-fA-F]+$/.test(trimmed)) {
    return BigInt(`0x${trimmed}`);
  }
  return BigInt(id);
}

/** @type { Hasher } */
const naiveHash = (kid, nids) => {
  const sortedNids = [...nids].sort();

  let id_num;
  const trimmed = kid.startsWith('0x') ? kid.slice(2) : kid;
  if (/^[0-9a-fA-F]+$/.test(trimmed)) {
    id_num = BigInt(`0x${trimmed}`);
  } else {
    id_num = BigInt(kid);
  }


  const index = Number(id_num % BigInt(sortedNids.length));
  return sortedNids[index];
};

/** @type { Hasher } */
const consistentHash = (kid, nids) => {
    // 1 3 5 7
    let node_num;
    const kid_num = idToNum(kid);
    const nids_nums = nids.map(idToNum).sort((a, b) => {
        if (a < b) return -1;
        else if (a > b) return 1;
        else return 0;
    });
    for (let i = 0; i < nids_nums.length; i++) {
        if (kid_num < nids_nums[i]) {
            node_num = nids_nums[i];
            break;
        }
    }
    if (!node_num) {
        node_num = nids_nums[0];
    }
    for (let i = 0; i < nids.length; i++) {
        if (idToNum(nids[i]) == node_num) {
            return nids[i];
        }
    }
};

/** @type { Hasher } */
const rendezvousHash = (kid, nids) => {
    const concats = nids.map((nid) => idToNum(getID(kid + nid)));
    let max_idx = 0;
    let max_val = concats[0];
    for (let i = 0; i < nids.length; i++) {
        if (concats[i] > max_val) {
            max_val = concats[i];
            max_idx = i
        }
    }
    return nids[max_idx];

};

module.exports = {
  getID,
  getNID,
  getSID,
  getMID,
  naiveHash,
  consistentHash,
  rendezvousHash,
};
