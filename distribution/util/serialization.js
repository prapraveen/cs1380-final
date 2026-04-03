// @ts-check

const to_json = (object) => {
    const num_to_json = (n) => {
        return {"type":"number","value":n.toString()};
    }

    const string_to_json = (s) => {
        return {"type":"string","value":s};
    }

    const boolean_to_json = (b) => {
        return {"type":"boolean","value":b.toString()};
    }

    const null_to_json = () => {
        return {"type":"null","value":""};
    }
    
    const undefined_to_json = () => {
        return {"type":"undefined","value":""};
    }

    const function_to_json = (f) =>  {
        return {"type":"function","value":f.toString()};
    }

    const array_to_json = (a) => {
        const res = {};
        for (let i = 0; i < a.length; i++) {
            res[i] = to_json(a[i]);
        }
        return {"type":"array","value":res};
    }

    const date_to_json = (d) => {
        return {"type":"date","value":d.toJSON()};
    }

    const error_to_json = (e) => {
        return {
            "type": "error",
            "value": {
                "type": "object",
                "value": {
                    "name": to_json(e.name),
                    "message": to_json(e.message),
                    "cause": to_json(e.cause)
                }
            }
        }
    }

    const object_to_json = (obj) => {
        const res = {};
        for (const [key, val] of Object.entries(obj)) {
            res[key] = to_json(val);
        }
        return {"type": "object", "value": res};
    }

    const bigint_to_json = (b) => {
        return {"type":"bigint","value":b.toString()};
    }

    switch (typeof(object)) {
        case "number":
            return num_to_json(object);
        case "bigint":
            return bigint_to_json(object);
        case "string":
            return string_to_json(object);
        case "boolean":
            return boolean_to_json(object);
        case "undefined":
            return undefined_to_json();
        case "function":
            return function_to_json(object);
        case "object":
            if (object === null) {
                return null_to_json();
            }
            if (object instanceof Array) {
                return array_to_json(object);
            }
            if (object instanceof Date) {
                return date_to_json(object);
            }
            if (object instanceof Error) {
                return error_to_json(object);
            }
            return object_to_json(object);
        default:
            throw new TypeError("Type is not supported by serialize function!");
    }
}

/**
 * @param {any} object
 * @returns {string}
 */
function serialize(object) {
    return JSON.stringify(to_json(object));
}

const json_to_value = (obj) => {
    const json_to_array = (a) => {
        const res = [];
        for (const [_, val] of Object.entries(a)) {
            res.push(json_to_value(val));
        }
        return res;
    }

    const json_to_object = (obj) => {
        const res = {};
        for (const [key, val] of Object.entries(obj)) {
            res[key] = json_to_value(val);
        }
        return res;
    }

    switch (obj.type) {
        case "number":
            return Number(obj.value);
        case "bigint":
            return BigInt(obj.value);
        case "string":
            return obj.value;
        case "boolean":
            return obj.value == "true" ? true : false;
        case "undefined":
            return undefined;
        case "null":
            return null;
        case "function":
            return new Function("return " + obj.value)();
        case "array":
            return json_to_array(obj.value);
        case "date":
            return new Date(obj.value);
        case "error":
            return new Error(json_to_value(obj.value.value.message), {"cause": json_to_value(obj.value.value.cause)});
        case "object":
            return json_to_object(obj.value);
        default:
            throw new SyntaxError("Invalid serialized object!");
    }
}

/**
 * @param {string} string
 * @returns {any}
 */
function deserialize(string) {
    if (typeof string !== 'string') {
        throw new Error(`Invalid argument type: ${typeof string}.`);
    }

    return json_to_value(JSON.parse(string));
}

module.exports = {
  serialize,
  deserialize,
};
