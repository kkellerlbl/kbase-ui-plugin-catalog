define([
    'bluebird',
    './exceptions'
], function (
    Promise,
    exceptions
) {
    'use strict';

    function post(options) {
        const timeout = options.timeout || 60000;
        const startTime = new Date();

        return new Promise((resolve, reject, onCancel) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = () => {
                if (xhr.status >= 300 && xhr.status < 400) {
                    reject(new exceptions.RedirectError(xhr.status, xhr.statusText, xhr));
                } else if (xhr.status >= 400 && xhr.status < 500) {
                    reject(new exceptions.ClientError(xhr.status, xhr.statusText, xhr));
                } else if (xhr.status >= 500) {
                    reject(new exceptions.ServerError(xhr.status, xhr.statusText, xhr));
                } else {
                    // var buf = new Uint8Array(xhr.response);
                    try {
                        resolve(xhr.response);
                    } catch (ex) {
                        reject(ex);
                    }
                }
            };
            xhr.ontimeout = () => {
                const elapsed = (new Date()) - startTime;
                reject(new exceptions.TimeoutError(timeout, elapsed, 'Request timeout', xhr));
            };
            xhr.onerror = () => {
                reject(new exceptions.ConnectionError('Request signaled error', xhr));
            };
            xhr.onabort = () => {
                reject(new exceptions.AbortError('Request was aborted', xhr));
            };

            if (onCancel) {
                onCancel(() => {
                    xhr.abort();
                });
            }

            if (options.responseType) {
                xhr.responseType = options.responseType;
            }
            try {
                xhr.open('POST', options.url, true);
            } catch (ex) {
                reject(new exceptions.GeneralError('Error opening request', xhr));
            }

            try {
                xhr.timeout = options.timeout || 60000;
                if (options.header) {
                    Object.keys(options.header).forEach((key) => {
                        xhr.setRequestHeader(key, options.header[key]);
                    });
                }
                xhr.withCredentials = options.withCredentials || false;

                // We support two types of data to send ... strings or int (byte) buffers
                if (typeof options.data === 'string') {
                    xhr.send(options.data);
                } else if (options.data instanceof Array) {
                    xhr.send(new Uint8Array(options.data));
                } else {
                    reject(new Error('Invalid type of data to send'));
                }
            } catch (ex) {
                reject(new exceptions.GeneralError('Error sending data in request', xhr));
            }
        });
    }

    function get(options) {
        const timeout = options.timeout || 60000;
        const startTime = new Date();

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = () => {
                if (xhr.status >= 400 && xhr.status < 500) {
                    reject(new exceptions.ClientError(xhr.status, xhr.statusText, xhr));
                }
                if (xhr.status >= 500) {
                    reject(new exceptions.ServerError(xhr.status, xhr.statusText, xhr));
                }
                if (xhr.status >= 300 && xhr.status < 400) {
                    reject(new Error('Redirects not currently supported'));
                }
                // var buf = new Uint8Array(xhr.response);
                try {
                    resolve(xhr.response);
                } catch (ex) {
                    reject(ex);
                }
            };

            xhr.ontimeout = () => {
                const elapsed = (new Date()) - startTime;
                reject(new exceptions.TimeoutError(timeout, elapsed, 'Request timeout', xhr));
            };
            xhr.onerror = () => {
                reject(new exceptions.ConnectionError('General request error', xhr));
            };
            xhr.onabort = () => {
                reject(new exceptions.AbortError('Request was aborted', xhr));
            };

            if (options.responseType) {
                xhr.responseType = options.responseType;
            }
            try {
                xhr.open('GET', options.url, true);
            } catch (ex) {
                reject(new exceptions.GeneralError('Error opening request', xhr));
            }

            try {
                xhr.timeout = options.timeout || 60000;

                if (options.header) {
                    Object.keys(options.header).forEach((key) => {
                        xhr.setRequestHeader(key, options.header[key]);
                    });
                }
                xhr.withCredentials = options.withCredentials || false;

                // We support two types of data to send ... strings or int (byte) buffers
                xhr.send();
            } catch (ex) {
                reject(new exceptions.GeneralError('Error sending data in request', xhr));
            }
        });
    }

    return {
        get: get,
        post: post
    };
});