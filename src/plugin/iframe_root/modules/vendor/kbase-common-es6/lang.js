define([
], function (
) {
    'use strict';
    /**
     * Determines, through a thorough and deep inspection, whether
     * two values are equal. Inspects all array items in order,
     * all object properties.
     *
     * @function isEqual
     *
     * @param {Any} v1 - a value to compare to a second
     * @param {Any} v2 - another value to compare to the first
     *
     * @returns {boolean} true if the two values are equal, false
     * otherwise.
     *
     * @static
     */
    function isEqual(v1, v2) {
        const path = [];
        function iseq(v1, v2) {
            const t1 = typeof v1;
            const t2 = typeof v2;
            if (t1 !== t2) {
                return false;
            }
            switch (t1) {
            case 'string':
            case 'number':
            case 'boolean':
                if (v1 !== v2) {
                    return false;
                }
                break;
            case 'undefined':
                if (t2 !== 'undefined') {
                    return false;
                }
                break;
            case 'object':
                if (v1 instanceof Array) {
                    if (v1.length !== v2.length) {
                        return false;
                    } else {
                        for (let i = 0; i < v1.length; i++) {
                            path.push(i);
                            if (!iseq(v1[i], v2[i])) {
                                return false;
                            }
                            path.pop();
                        }
                    }
                } else if (v1 === null) {
                    if (v2 !== null) {
                        return false;
                    }
                } else if (v2 === null) {
                    return false;
                } else {
                    const k1 = Object.keys(v1).sort();
                    const k2 = Object.keys(v2).sort();
                    if (k1.length !== k2.length) {
                        return false;
                    }
                    for (let i = 0; i < k1.length; i++) {
                        path.push(k1[i]);
                        if (!iseq(v1[k1[i]], v2[k1[i]])) {
                            return false;
                        }
                        path.pop();
                    }
                }
            }
            return true;
        }
        return iseq(v1, v2);
    }

    function objectToArray(obj, keyName, valueName) {
        const keys = Object.keys(obj);
        const arr = [];
        for (const i in keys) {
            const newObj = {};
            newObj[keyName] = keys[i];
            newObj[valueName] = obj[keys[i]];
            arr.push(newObj);
        }
        return arr;
    }

    class UIError extends Error {
        constructor({type, reason, message, blame, code, suggestion}) {
            super(message);
            this.type = type;
            this.reason = reason;
            this.blame = blame;
            this.code = code;
            this.suggestion = suggestion;
        }
    }

    return {isEqual, objectToArray, UIError};
});