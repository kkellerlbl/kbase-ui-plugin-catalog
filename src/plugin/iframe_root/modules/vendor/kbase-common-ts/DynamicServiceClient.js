var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define(["require", "exports", "./HttpClient", "./Auth2Error"], function (require, exports, HttpClient_1, Auth2Error_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var AuthClient = (function (_super) {
        __extends(AuthClient, _super);
        function AuthClient() {
            return _super.call(this) || this;
        }
        AuthClient.prototype.isGeneralError = function (error) {
            return (error instanceof HttpClient_1.GeneralError);
        };
        AuthClient.prototype.request = function (options) {
            return _super.prototype.request.call(this, options)
                .catch(HttpClient_1.GeneralError, function (err) {
                throw new Auth2Error_1.AuthError({
                    code: 'connection-error',
                    message: err.message,
                    detail: 'An error was encountered communicating with the Auth Service',
                    data: {}
                });
            })
                .catch(HttpClient_1.TimeoutError, function (err) {
                throw new Auth2Error_1.AuthError({
                    code: 'timeout-error',
                    message: err.message,
                    detail: 'There was a timeout communicating with the Auth Service',
                    data: {}
                });
            })
                .catch(HttpClient_1.AbortError, function (err) {
                throw new Auth2Error_1.AuthError({
                    code: 'abort-error',
                    message: err.message,
                    detail: 'The connection was aborted while communicating with the Auth Service',
                    data: {}
                });
            });
        };
        return AuthClient;
    }(HttpClient_1.HttpClient));
    exports.AuthClient = AuthClient;
});
