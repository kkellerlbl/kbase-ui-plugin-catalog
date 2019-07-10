define([
    './jsonRpc-native'
], function (jsonRpc) {
    'use strict';

    /*
     * arg is:
     * url - service wizard url
     * timeout - request timeout
     * version - service release version or tag
     * auth - auth structure
     *   token - auth token
     *   username - username
     * rpcContext
     */
    class GenericClient {
        constructor({module, token, auth, url, timeout, rpcContext}) {
            if (!url) {
                throw new Error('The service url was not provided');
            }
            this.url = url;

            if (!module) {
                throw new Error('The service module was not provided');
            }
            this.module = module;

            this.token = token || (auth ? auth.token : null);
            this.timeout = timeout;
            this.rpcContext = rpcContext;
        }


        callFunc(funcName, params) {
            return jsonRpc.request(this.url, this.module, funcName, params, {
                timeout: this.timeout,
                authorization: this.token,
                rpcContext: this.context
            });
        }
    }
    return GenericClient;
});