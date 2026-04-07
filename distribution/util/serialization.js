// @ts-check

/**
 * @param {any} object
 * @returns {string}
 */
function serialize(object) {
    if (typeof object === 'number') {
        return JSON.stringify({
            type: 'number',
            value: String(object),
        });
    }

    if (typeof object === 'bigint') {
        return JSON.stringify({
            type: 'bigint',
            value: String(object),
        });
    }

    if (typeof object === 'string') {
        return JSON.stringify({
            type: 'string',
            value: String(object),
        });
    }

    if (typeof object === 'boolean') {
        return JSON.stringify({
            type: 'boolean',
            value: String(object),
        });
    }

    if (object === null) {
        return JSON.stringify({
            type: 'null',
            value: String(object),
        });
    }

    if (typeof object === 'undefined') {
        return JSON.stringify({
            type: 'undefined',
            value: String(object),
        });
    }

    if (typeof object === 'function') {
        return JSON.stringify({
            type: 'function',
            value: object.toString(),
        });
    }

    if (Array.isArray(object)) {
        return JSON.stringify({
            type: 'array',
            value: object.map((item) => JSON.parse(serialize(item))),
        });
    }

    if (object instanceof Date) {
        return JSON.stringify({
            type: 'date',
            value: object.getTime().toString(),
        });
    }

    if (object instanceof Error) {
        return JSON.stringify({
            type: 'error',
            value: {
                message: object.message,
                name: object.name,
                stack: object.stack,
            },
        });
    }
  
    if (typeof object === 'object') {
        const serializedObj = {};
        for (const key of Object.keys(object)) {
            serializedObj[key] = JSON.parse(serialize(object[key]));
        }
        return JSON.stringify({
            type: 'object',
            value: serializedObj,
        });
    }

    throw new Error(`Unsupported type: ${object.type}`);
}

/**
 * @param {string} string
 * @returns {any}
 */
function deserialize(string) {
    if (typeof string !== 'string') {
        throw new Error(`Invalid argument type: ${typeof string}.`);
    }
    const parsed = JSON.parse(string);

    if (parsed.type === 'number') {
        return Number(parsed.value);
    }

    if (parsed.type === 'bigint') {
        return BigInt(parsed.value);
    }

    if (parsed.type === 'string') {
        return String(parsed.value);
    }

    if (parsed.type === 'boolean') {
        return parsed.value === 'true';
    }

    if (parsed.type === 'null') {
        return null;
    }

    if (parsed.type === 'undefined') {
        return undefined;
    }

    if (parsed.type === 'function') {
        return new Function(`return ${parsed.value}`)();
    }

    if (parsed.type === 'array') {
        return parsed.value.map((item) => deserialize(JSON.stringify(item)));
    }

    if (parsed.type === 'date') {
        return new Date(Number(parsed.value));
    }

    if (parsed.type === 'error'){
        const err = new Error(parsed.value.message);
        err.name = parsed.value.name;
        err.stack = parsed.value.stack;
        return err;
    }

    if (parsed.type === 'object'){
        const obj = {};
        for (const key of Object.keys(parsed.value)){
            obj[key] = deserialize(JSON.stringify(parsed.value[key]));
        }
        return obj;
    }

    throw new Error(`Unsupported type: ${parsed.type}`);
}

module.exports = {
  serialize,
  deserialize,
};
