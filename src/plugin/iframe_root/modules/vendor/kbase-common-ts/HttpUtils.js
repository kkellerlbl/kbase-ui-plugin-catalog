define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class HttpQuery {
        constructor(map) {
            this.queryMap = {};
            if (typeof map === 'undefined') {
                map = {};
            }
            this.queryMap = map;
        }
        addField(key, value) {
            this.queryMap[key] = value;
        }
        removeField(key) {
            delete this.queryMap[key];
        }
        toString() {
            let that = this;
            return Object.keys(this.queryMap).map(function (key) {
                return [key, that.queryMap[key]]
                    .map(encodeURIComponent)
                    .join('=');
            }).join('&');
        }
    }
    exports.HttpQuery = HttpQuery;
});
