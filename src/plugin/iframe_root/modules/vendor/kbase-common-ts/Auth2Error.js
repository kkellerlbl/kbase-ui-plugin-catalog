define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class AuthError extends Error {
        constructor(errorInfo) {
            super(errorInfo.message);
            Object.setPrototypeOf(this, AuthError.prototype);
            this.name = 'AuthError';
            this.code = errorInfo.code;
            this.detail = errorInfo.detail;
            this.data = errorInfo.data;
            this.stack = new Error().stack;
        }
    }
    exports.AuthError = AuthError;
});
