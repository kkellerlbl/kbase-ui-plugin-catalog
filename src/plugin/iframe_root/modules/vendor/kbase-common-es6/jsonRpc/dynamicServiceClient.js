define([
    'bluebird',
    './jsonRpc-native'
], function (
    Promise,
    jsonRpc
) {
    'use strict';

    class Cache {
        constructor({itemLifetime, monitoringFrequency, waiterTimeout, waiterFrequency} = {}) {
            this.cache = {};

            // 10 minute cache lifetime
            this.cacheLifetime = itemLifetime || 1800000;

            // Frequency with which to monitor the cache for expired items
            // or refreshing them.
            this.monitoringFrequency = monitoringFrequency || 60000;

            // The waiter waits for a cache item to become available if it has
            // been reserved. These settings determine how long to wait
            // for a waiter to wait, and how often to check the cache item to see if it has
            // yet been fulfilled.
            this.waiterTimeout = waiterTimeout || 30000;
            this.waiterFrequency = waiterFrequency || 100;

            this.monitoring = false;
        }

        runMonitor() {
            if (this.monitoring) {
                return;
            }
            this.monitoring = true;
            window.setTimeout(() => {
                const newCache = {};
                let cacheRenewed = false;
                Object.keys(this.cache).forEach((id) => {
                    const item = this.cache[id];
                    if (!this.isExpired(item)) {
                        newCache[id] = item;
                        cacheRenewed = true;
                    }
                });
                this.cache = newCache;
                this.monitoring = false;
                if (cacheRenewed) {
                    this.runMonitor();
                }
            }, this.monitoringFrequency);
        }

        isExpired(cacheItem) {
            const now = new Date().getTime();
            const elapsed = now - cacheItem.createdAt;
            return (elapsed > this.cacheLifetime);
        }

        isReserved(cacheItem) {
            return cacheItem.reserved;
        }

        getItem(id) {
            if (this.cache[id] === undefined) {
                return null;
            }
            const cached = this.cache[id];
            if (this.isExpired(cached)) {
                delete this.cache[id];
                return;
            }
            return cached;
        }

        reserveWaiter(item) {
            return new Promise((resolve, reject) => {
                const started = new Date().getTime();
                const waiting = true;

                const waiter = () => {
                    if (!waiting) {
                        return;
                    }
                    window.setTimeout(() => {
                        if (!this.cache[item.id]) {
                            // If on a wait-loop cycle we discover that the
                            // cache item has been deleted, we volunteer
                            // to attempt to fetch it ourselves.
                            // The only case now for this is a cancellation
                            // of the first request to any dynamic service,
                            // which may cancel the initial service wizard
                            // call rather than the service call.
                            return this.reserveAndFetch({
                                id: item.id,
                                fetch: item.fetch
                            })
                                .then(() => {
                                    // resolve(result);
                                    // we resolve with the cache item just
                                    // as if we had waited for it.
                                    resolve(this.cache[item.id]);
                                })
                                .catch((err) => {
                                    reject(err);
                                });
                        }
                        if (!item.reserved) {
                            resolve(item);
                        } else {
                            const elapsed = new Date().getTime() - started;
                            if (elapsed > this.waiterTimeout) {
                                delete this.cache[item.id];
                                reject(new Error(
                                    'Timed-out waiting for cache item to become available; timeout '
                                    + this.waiterTimeout + ', waited ' + elapsed));
                            } else {
                                waiter();
                            }
                        }
                    }, this.waiterFrequency);
                };
                waiter();
            });
        }

        reserveAndFetch({id, fetch}) {
            // now, reserve it.
            this.reserveItem(id, fetch);

            // and then fetch it.
            const fetchPromise = fetch()
                .then((result) => {
                    this.setItem(id, result, fetch);
                    return result;
                })
                .finally(() => {
                    // If the fetch was cancelled, we need to remove
                    // the reserved item. This should signal any queued waiters
                    // to spawn their own fetch.
                    if (fetchPromise.isCancelled()) {
                        delete this.cache[id];
                    }
                });
            return fetchPromise;
        }

        getItemWithWait({id, fetch}) {
            return Promise.try(() => {
                const cached = this.cache[id];
                if (cached) {
                    if (this.isExpired(cached)) {
                        delete this.cache[id];
                    } else if (this.isReserved(cached)) {
                        return this.reserveWaiter(cached)
                            .then((cached) => {
                                return cached.value;
                            });
                    } else {
                        return cached.value;
                    }
                }

                return this.reserveAndFetch({id, fetch});
            });
        }

        reserveItem(id, fetch) {
            this.cache[id] = {
                id: id,
                createdAt: new Date().getTime(),
                reserved: true,
                fetch: fetch
            };
        }

        setItem(id, value, fetch) {
            let item = this.cache[id];
            if (item.reserved) {
                delete item.reserved;
            } else {
                item = {};
            }
            item.id = id;
            item.value = value;
            item.createdAt = new Date().getTime();
            item.fetch = fetch;
            this.runMonitor();
        }
    }
    var moduleCache = new Cache({});


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
    class  DynamicServiceClient {
        constructor({token, auth, url, module, version, timeout, rpcContext}) {
            // Establish an auth object which has properties token and user_id.
            this.token = token || (auth ? auth.token : null);
            this.timeout = timeout;
            this.rpcContext = rpcContext;

            if (!url) {
                throw new Error('The service discovery url was not provided');
            }
            this.url = url;

            if (!module) {
                throw new Error('The module was not provided');
            }
            this.module = module;

            this.version = version || null;
            if (version === 'auto') {
                this.version = null;
            }
        }

        options() {
            return {
                timeout: this.timeout,
                authorization: this.token,
                rpcContext: this.rpcContext
            };
        }

        moduleId() {
            let moduleId;
            if (!this.version) {
                moduleId = this.module + ':auto';
            } else {
                moduleId = this.module + ':' + this.version;
            }
            return moduleId;
        }

        getCached(fetch) {
            return moduleCache.getItemWithWait({
                id: this.moduleId(),
                fetch: fetch
            });
        }

        setCached(value) {
            moduleCache.set(this.moduleId(), value);
        }

        lookupModule() {
            return this.getCached(() => {
                const func = 'get_service_status';
                const params = [{
                    module_name: this.module,
                    version: this.version
                }];
                // NB: pass null for numRets (number of return values) so we get the
                // full return structure.
                return jsonRpc.request(this.url, 'ServiceWizard', func, params, this.options());
            });
        }

        callFunc(funcName, params) {
            return this.lookupModule()
                .spread((serviceStatus) => {
                    return jsonRpc.request(serviceStatus.url, this.module, funcName, params, this.options());
                });
        }
    }
    return DynamicServiceClient;
});