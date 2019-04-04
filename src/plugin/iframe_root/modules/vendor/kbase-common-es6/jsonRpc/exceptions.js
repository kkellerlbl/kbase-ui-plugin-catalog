define([], function () {
    'use strict';

    // // Custom Error Root
    // function CustomError() {
    // }
    // CustomError.prototype = Object.create(Error.prototype);
    // CustomError.prototype.constructor = CustomError;
    // CustomError.prototype.name = 'CustomError';

    // HTTP/AJAX ERROR

    // Ajax root error
    class AjaxError extends Error {
        constructor(message) {
            super(message);
        }
    }

    class RedirectError extends AjaxError {
        constructor(code, message, xhr) {
            super(message);
            this.code = code;
            this.xhr = xhr;
            this.stack = new Error().stack;
        }
    }

    class ClientError extends AjaxError {
        constructor(code, message, xhr) {
            super(message);
            this.code = code;
            this.xhr = xhr;
            this.stack = new Error().stack;
        }
    }

    class ServerError extends AjaxError {
        constructor(code, message, xhr) {
            super(message);
            this.code = code;
            this.xhr = xhr;
            this.stack = new Error().stack;
        }
    }

    class TimeoutError extends AjaxError {
        constructor(timeout, elapsed, message, xhr) {
            super(message);
            this.timeout = timeout;
            this.elapsed = elapsed;
            this.xhr = xhr;
            this.stack = new Error().stack;
        }
    }

    class ConnectionError extends AjaxError {
        constructor(message, xhr) {
            super(message);
            this.xhr = xhr;
            this.stack = new Error().stack;
        }
    }

    class GeneralError extends AjaxError {
        constructor(message, xhr) {
            super(message);
            this.xhr = xhr;
            this.stack = new Error().stack;
        }
    }

    class AbortError extends AjaxError {
        constructor(message, xhr) {
            super(message);
            this.xhr = xhr;
            this.stack = new Error().stack;
        }
    }


    // RPC ERRORS

    class RpcError extends Error {
        constructor(message) {
            super(message);
        }
    }

    /*
     * A response which is invalid.
     * A valid response is most likely a non- or improper-JSON string
     *
     */

    class InvalidResponseError extends RpcError {
        constructor(originalError, url, data) {
            super('Invalid Response');
            this.originalError = originalError;
            this.url = url;
            this.data = data;
            this.stack = new Error().stack;
        }
    }

    /*
     * An error returned by the http server (an http server error)
     */
    class RequestError extends RpcError {
        constructor(statusCode, statusText, url, message) {
            super(message);
            this.statusCode = statusCode;
            this.statusText = statusText;
            this.url = url;
            this.stack = new Error().stack;
        }
    }

    /*
    * Response Value Error
    * An error detected in the response value from the service
    */

    class ResponseValueError extends RpcError {
        constructor(sdkModule, func, params, response, message, processingMessage) {
            super(message);
            this.module = sdkModule;
            this.func = func;
            this.params = params,
            this.response = response;
            this.message = message;
            this.processingMessage = processingMessage;
            this.stack = new Error().stack;
        }
    }

    class JsonRpcError extends RpcError {
        constructor(sdkModule, func, params, url, error) {
            super('JSONRPC Error');
            this.module = sdkModule;
            this.func = func;
            this.params = params;
            this.url = url;
            this.originalError = error;
            let message;
            if (! error.message) {
                const upstreamStackTrace = error.error;
                if (typeof upstreamStackTrace === 'string') {
                    const lines = upstreamStackTrace.split('\n');
                    message = lines[0] || '';
                }
            } else {
                message = error.message;
            }
            this.message = message;
            this.detail = error.error;
            this.type = error.name;
            this.code = error.code;
            this.stack = new Error().stack;
        }
    }

    class JsonRpcNonconformingError extends RpcError {
        constructor(sdkModule, func, params, url, data) {
            super('JSONRPC Non-Conforming Error');
            this.module = sdkModule;
            this.func = func;
            this.params = params;
            this.url = url;
            this.data = data;
            this.stack = new Error().stack;
        }

    }

    class AttributeError extends RpcError {
        constructor(sdkModule, func, originalError) {
            super('Attribute Error');
            this.module = sdkModule;
            this.func = func;
            this.originalError = originalError;
            this.stack = new Error().stack;
        }
    }

    return Object.freeze({
        AjaxError, RedirectError, ClientError, ServerError, TimeoutError,
        GeneralError, ConnectionError, AbortError,
        RpcError, InvalidResponseError, RequestError, ResponseValueError,
        JsonRpcError, JsonRpcNonconformingError, AttributeError
    });

});