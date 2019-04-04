define(["require", "exports", "./HttpClient"], function (require, exports, HttpClient_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class KBaseJsonRpcError extends Error {
        constructor(errorInfo) {
            super(errorInfo.message);
            Object.setPrototypeOf(this, KBaseJsonRpcError.prototype);
            this.name = 'JsonRpcError';
            this.code = errorInfo.code;
            this.message = errorInfo.message;
            this.detail = errorInfo.detail;
            this.data = errorInfo.data;
            this.stack = new Error().stack;
        }
    }
    exports.KBaseJsonRpcError = KBaseJsonRpcError;
    class KBaseJsonRpcClient {
        constructor() {
        }
        isGeneralError(error) {
            return (error instanceof HttpClient_1.GeneralError);
        }
        request(options) {
            let rpc = {
                version: '1.1',
                method: options.module + '.' + options.func,
                id: String(Math.random()).slice(2),
                params: options.params,
            };
            if (options.rpcContext) {
                rpc.context = options.rpcContext;
            }
            let header = new HttpClient_1.HttpHeader();
            if (options.authorization) {
                header.setHeader('authorization', options.authorization);
            }
            let requestOptions = {
                method: 'POST',
                url: options.url,
                timeout: options.timeout,
                data: JSON.stringify(rpc),
                header: header
            };
            let httpClient = new HttpClient_1.HttpClient();
            return httpClient.request(requestOptions)
                .then(function (result) {
                try {
                    return JSON.parse(result.response);
                }
                catch (ex) {
                    throw new KBaseJsonRpcError({
                        code: 'parse-error',
                        message: ex.message,
                        detail: 'The response from the service could not be parsed',
                        data: {
                            responseText: result.response
                        }
                    });
                }
            })
                .catch(HttpClient_1.GeneralError, (err) => {
                throw new KBaseJsonRpcError({
                    code: 'connection-error',
                    message: err.message,
                    detail: 'An error was encountered communicating with the service',
                    data: {}
                });
            })
                .catch(HttpClient_1.TimeoutError, (err) => {
                throw new KBaseJsonRpcError({
                    code: 'timeout-error',
                    message: err.message,
                    detail: 'There was a timeout communicating with the service',
                    data: {}
                });
            })
                .catch(HttpClient_1.AbortError, (err) => {
                throw new KBaseJsonRpcError({
                    code: 'abort-error',
                    message: err.message,
                    detail: 'The connection was aborted while communicating with the s ervice',
                    data: {}
                });
            });
        }
    }
    exports.KBaseJsonRpcClient = KBaseJsonRpcClient;
});
