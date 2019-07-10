define([], function () {
    'use strict';

    function getProp(obj, propPath, defaultValue) {
        if (typeof propPath === 'string') {
            propPath = propPath.split('.');
        } else if (!(propPath instanceof Array)) {
            throw new TypeError('Invalid type for key: ' + (typeof propPath));
        }
        for (let i = 0; i < propPath.length; i += 1) {
            if ((obj === undefined) ||
                (typeof obj !== 'object') ||
                (obj === null)) {
                return defaultValue;
            }
            obj = obj[propPath[i]];
        }
        if (obj === undefined) {
            return defaultValue;
        }
        return obj;
    }


    function hasProp(obj, propPath) {
        if (typeof propPath === 'string') {
            propPath = propPath.split('.');
        } else if (!(propPath instanceof Array)) {
            throw new TypeError('Invalid type for key: ' + (typeof propPath));
        }
        for (let i = 0; i < propPath.length; i += 1) {
            if ((obj === undefined) ||
                (typeof obj !== 'object') ||
                (obj === null)) {
                return false;
            }
            obj = obj[propPath[i]];
        }
        if (obj === undefined) {
            return false;
        }
        return true;
    }


    function setProp(obj, propPath, value) {
        if (typeof propPath === 'string') {
            propPath = propPath.split('.');
        } else if (!(propPath instanceof Array)) {
            throw new TypeError('Invalid type for key: ' + (typeof propPath));
        }
        if (propPath.length === 0) {
            return;
        }
        // pop off the last property for setting at the end.
        const propKey = propPath[propPath.length - 1];
        let key;
        // Walk the path, creating empty objects if need be.
        for (let i = 0; i < propPath.length - 1; i += 1) {
            key = propPath[i];
            if (obj[key] === undefined) {
                obj[key] = {};
            }
            obj = obj[key];
        }
        // Finally set the property.
        obj[propKey] = value;
        return value;
    }



    function incrProp(obj, propPath, increment) {
        if (typeof propPath === 'string') {
            propPath = propPath.split('.');
        } else if (!(propPath instanceof Array)) {
            throw new TypeError('Invalid type for key: ' + (typeof propPath));
        }
        if (propPath.length === 0) {
            return;
        }
        increment = (increment === undefined) ? 1 : increment;
        const propKey = propPath[propPath.length - 1];
        for (let i = 0; i < propPath.length - 1; i += 1) {
            const key = propPath[i];
            if (obj[key] === undefined) {
                obj[key] = {};
            }
            obj = obj[key];
        }
        if (obj[propKey] === undefined) {
            obj[propKey] = increment;
        } else {
            if (typeof obj[propKey] === 'number') {
                obj[propKey] += increment;
            } else {
                throw new Error('Can only increment a number');
            }
        }
        return obj[propKey];
    }


    function deleteProp(obj, propPath) {
        if (typeof propPath === 'string') {
            propPath = propPath.split('.');
        } else if (!(propPath instanceof Array)) {
            throw new TypeError('Invalid type for key: ' + (typeof propPath));
        }
        if (propPath.length === 0) {
            return false;
        }
        const propKey = propPath[propPath.length - 1];
        for (let i = 0; i < propPath.length - 1; i += 1) {
            const key = propPath[i];
            if (obj[key] === undefined) {
                // for idempotency, and utility, do not throw error if
                // the key doesn't exist.
                return false;
            }
            obj = obj[key];
        }
        if (obj[propKey] === undefined) {
            return false;
        }
        delete obj[propKey];
        return true;
    }

    class Props {
        constructor(config = {}) {
            this.obj = config.data || {};
        }

        getItem(props, defaultValue) {
            return getProp(this.obj, props, defaultValue);
        }

        hasItem(propPath) {
            return hasProp(this.obj, propPath);

        }

        setItem(path, value) {
            return setProp(this.obj, path, value);
        }

        incrItem(path, increment) {
            return incrProp(this.obj, path, increment);
        }

        deleteItem(path) {
            return deleteProp(this.obj, path);
        }

        getRaw() {
            return this.obj;
        }
    }

    return Object.freeze({ Props, getProp, hasProp, setProp, incrProp, deleteProp });
});