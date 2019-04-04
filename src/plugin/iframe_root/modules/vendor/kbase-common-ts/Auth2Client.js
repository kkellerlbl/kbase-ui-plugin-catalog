define(["require", "exports", "./HttpClient", "./Auth2Error"], function (require, exports, HttpClient_1, Auth2Error_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class AuthClient extends HttpClient_1.HttpClient {
        constructor() {
            super();
        }
        isGeneralError(error) {
            return (error instanceof HttpClient_1.GeneralError);
        }
        request(options) {
            return super.request(options)
                .catch(HttpClient_1.GeneralError, (err) => {
                throw new Auth2Error_1.AuthError({
                    code: 'connection-error',
                    message: err.message,
                    detail: 'An error was encountered communicating with the Auth Service',
                    data: {}
                });
            })
                .catch(HttpClient_1.TimeoutError, (err) => {
                throw new Auth2Error_1.AuthError({
                    code: 'timeout-error',
                    message: err.message,
                    detail: 'There was a timeout communicating with the Auth Service',
                    data: {}
                });
            })
                .catch(HttpClient_1.AbortError, (err) => {
                throw new Auth2Error_1.AuthError({
                    code: 'abort-error',
                    message: err.message,
                    detail: 'The connection was aborted while communicating with the Auth Service',
                    data: {}
                });
            });
        }
    }
    exports.AuthClient = AuthClient;
});
