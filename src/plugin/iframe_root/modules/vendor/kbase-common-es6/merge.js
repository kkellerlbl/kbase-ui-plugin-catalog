define([], function () {
    'use strict';

    function getType(x) {
        var t = typeof x;
        if (t === 'object') {
            if (x === null) {
                return 'null';
            } else if (x.pop && x.push) {
                return 'array';
            } else {
                return 'object';
            }
        } else {
            return t;
        }
    }

    class DeepMerger {
        constructor(obj) {
            this.dest = obj;
        }

        value() {
            return this.dest;
        }

        mergeIn(obj) {
            if (!obj) {
                return this;
            }
            switch (getType(obj)) {
            case 'string':
            case 'integer':
            case 'boolean':
            case 'null':
                throw new TypeError('Can\'t merge a \'' + (typeof obj) + '\'');
            case 'object':
                this.mergeObject(obj);
                break;
            case 'array':
                this.mergeArray(obj);
                break;
            default:
                throw new TypeError('Can\'t merge a \'' + (typeof obj) + '\'');
            }
            return this;
        }

        mergeObject(obj) {
            var keys = Object.keys(obj);
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                var val = obj[key];
                var t = getType(val);
                switch (t) {
                case 'string':
                case 'number':
                case 'boolean':
                case 'null':
                case 'function':
                    this.dest[key] = val;
                    break;
                case 'object':
                    if (!this.dest[key]) {
                        this.dest[key] = {};
                    }
                    this.dest[key] = new DeepMerger(this.dest[key]).mergeObject(obj[key]).value();
                    break;
                case 'array':
                    if (!this.dest[key]) {
                        this.dest[key] = [];
                    } else {
                        this.dest[key] = [];
                    }
                    this.dest[key] = new DeepMerger(this.dest[key]).mergeArray(obj[key]).value();
                    break;
                case 'undefined':
                    if (this.dest[key]) {
                        delete this.dest[key];
                    }
                    break;
                }
            }
            return this;
        }

        mergeArray(arr) {
            var deleted = false;
            for (var i = 0; i < arr.length; i++) {
                var val = arr[i];
                var t = getType(val);
                switch (t) {
                case 'string':
                case 'number':
                case 'boolean':
                case 'null':
                case 'function':
                    this.dest[i] = val;
                    break;
                case 'object':
                    if (!this.dest[i]) {
                        this.dest[i] = {};
                    }
                    this.dest[i] = new DeepMerger(this.dest[i]).mergeObject(arr[i]).value();
                    break;
                case 'array':
                    if (!this.dest[i]) {
                        this.dest[i] = [];
                    }
                    this.dest[i] = new DeepMerger(this.dest[i]).mergeArray(arr[i]).value();
                    break;
                case 'undefined':
                    if (this.dest[i]) {
                        this.dest[i] = undefined;
                    }
                    break;
                }
            }
            if (deleted) {
                this.dest = this.dest.filter((value) => {
                    return (value === undefined) ? false : true;
                });
            }
            return this;
        }
    }

    class ShallowMerger {
        constructor(obj) {
            this.dest = obj;
        }

        value() {
            return this.dest;
        }

        mergeIn(obj) {
            if (!obj) {
                return this;
            }
            Object.keys(obj).forEach((key) => {
                this.dest[key] = obj[key];
            });
            return this;
        }
    }

    return {DeepMerger, ShallowMerger};
});