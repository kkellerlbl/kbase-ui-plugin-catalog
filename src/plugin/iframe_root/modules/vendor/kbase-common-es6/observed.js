define(['./props', './asyncQueue', 'bluebird'], (props, AsyncQueue, Promise) => {
    'use strict';

    class Observed {
        constructor() {
            this.state = {};
            this.listeners = {};
            this.queue = new AsyncQueue();
        }

        setItem(key, value) {
            var oldState = props.getProp(this.state, key),
                newListeners = [];
            if (this.listeners[key]) {
                this.listeners[key].forEach((item) => {
                    this.queue.addItem({
                        onRun: ((fun, value, oldvalue) => {
                            return () => {
                                try {
                                    fun(value, oldvalue);
                                } catch (ex) {
                                    //TODO: need a sensible way to manage exception reporting.
                                }
                            };
                        })(item.onSet, value, oldState && oldState.value)
                    });
                    if (!item.oneTime) {
                        newListeners.push(item);
                    }
                });
                this.listeners[key] = newListeners;
            }
            props.setProp(this.state, key, { status: 'set', value: value, time: new Date() });
            return this;
        }

        modifyItem(key, modifier) {
            var oldState = props.getProp(this.state, key),
                newValue = modifier(oldState.value),
                newListeners = [];
            if (this.listeners[key]) {
                this.listeners[key].forEach((item) => {
                    this.queue.addItem({
                        onRun: ((fun, value, oldvalue) => {
                            return () => {
                                try {
                                    fun(value, oldvalue);
                                } catch (ex) {
                                    //TODO: need a sensible way to manage exception reporting.
                                    //console.log('EX running onrun handler');
                                    //console.log(ex);
                                }
                            };
                        })(item.onSet, newValue, oldState && oldState.value)
                    });
                    if (!item.oneTime) {
                        newListeners.push(item);
                    }
                });
                this.listeners[key] = newListeners;
            }

            props.setProp(this.state, key, { status: 'set', value: newValue, time: new Date() });
            return this;
        }

        getItem(key, defaultValue) {
            var item = props.getProp(this.state, key);
            if (item !== undefined) {
                if (item.status === 'set') {
                    return item.value;
                } else {
                    //TODO: is this the best thing to do?
                    return defaultValue;
                }
            } else {
                return defaultValue;
            }
        }

        hasItem(key) {
            return props.hasProp(props.state, key);
        }

        setError(key, err) {
            var newListeners = [];
            if (this.listeners[key]) {
                this.listeners[key].forEach((item) => {
                    this.queue.addItem({
                        onRun: ((fun, err) => {
                            return () => {
                                try {
                                    fun(err);
                                } catch (ex) {
                                    //TODO: need a sensible way of logging exceptions...
                                    //console.log('EX running onRun handler');
                                    //console.log(ex);
                                }
                            };
                        })(item.onError, err)
                    });
                    if (!item.oneTime) {
                        newListeners.push(item);
                    }
                });
                this.listeners[key] = newListeners;
            }
            props.setProp(this.state, key, { status: 'error', error: err, time: new Date() });
        }

        hasError(key) {
            var item = props.getProp(this.state, key);
            if (item && item.status === 'error') {
                return true;
            }
            return false;
        }

        delItem(key) {
            if (props.hasProp(this.state, key)) {
                props.deleteProp(this.state, key);
            }
        }

        listen(key, cfg) {
            return this.listenForItem(key, cfg);
        }

        listenForItem(key, cfg) {
            // A cheap call supplies just a function.
            //TODO: really support this?
            if (typeof cfg === 'function') {
                cfg = { onSet: cfg };
            }
            // If the item is available, provide immediate callback.

            // TODO: We should probably not have any immediate callback --
            // rather just queue this up.
            var item = props.getProp(this.state, key);
            if (item) {
                if (cfg.hear) {
                    cfg.hear(item.value);
                    if (cfg.oneTime) {
                        return;
                    }
                } else {
                    switch (item.status) {
                    case 'set':
                        cfg.onSet(item.value);
                        break;
                    case 'error':
                        cfg.onError(item.error);
                        break;
                    default:
                        throw 'Invalid status: ' + item.status;
                    }
                }
            }

            if (this.listeners[key] === undefined) {
                this.listeners[key] = [];
            }
            this.listeners[key].push(cfg);
        }

        whenItem(key, timeout) {
            var p = new Promise((resolve, reject) => {
                if (props.hasProp(this.state, key)) {
                    var item = props.getProp(this.state, key);
                    if (item.status === 'error') {
                        reject(item.error);
                    } else {
                        resolve(item.value);
                    }
                } else {
                    this.listenForItem(key, {
                        oneTime: true,
                        addedAt: new Date().getTime(),
                        onSet: (value) => {
                            resolve(value);
                        },
                        onError: (err) => {
                            reject(err);
                        }
                    });
                }
            });
            if (timeout) {
                return p.timeout(timeout);
            }
            return p;
        }
    }

    return Observed;
});
