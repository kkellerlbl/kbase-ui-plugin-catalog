define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Utils {
        constructor() {
            this.genIdSerial = 0;
        }
        genId() {
            let random = Math.floor(Math.random() * 1000);
            let time = new Date().getTime();
            if (this.genIdSerial === 1000) {
                this.genIdSerial = 0;
            }
            this.genIdSerial += 1;
            return [random, time, this.genIdSerial].map(String).join('-');
        }
    }
    exports.Utils = Utils;
});
