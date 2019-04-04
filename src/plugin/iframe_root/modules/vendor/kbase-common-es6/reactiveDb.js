// a simple reactive database for in-browser general usage

define([
    './props',
    './lang',
    'uuid'
], (
    props,
    lang,
    Uuid
) => {
    'use strict';

    class DB {
        constructor() {
            this.db = new props.Props();
            this.subscriptions = {};
            this.queries = {};
            this.timer = null;
            this.timerInterval = 100;
        }

        runOnce() {
            // console.log('do I need to?', this.timer);
            if (this.timer) {
                return;
            }

            if (Object.keys(this.subscriptions).length === 0) {
                return;
            }

            // console.log('running because need to', this.subscriptions);

            this.timer = window.setTimeout(() => {
                this.runSubscriptions();
                this.timer = null;
                // this.runIfNeedTo();
            }, this.timerInterval);
        }

        runQuery(query) {
            const dbValue = this.db.getItem(query.path);
            if (typeof dbValue === 'undefined') {
                return;
            }
            if (!query.filter) {
                return dbValue;
            }
            return query.filter(dbValue);
        }

        runSubscriptions() {
            Object.entries(this.subscriptions).forEach(([, subscription]) => {
                try {
                    const dbValue = this.runQuery(subscription.query);
                    if (typeof dbValue === 'undefined') {
                        return;
                    }

                    if (typeof subscription.lastValue !== 'undefined') {
                        // TODO: this is pure object equality; but if the
                        // query returns a new collection (via the filter)
                        // we need to do a shallow comparison.
                        if (!lang.isEqual(subscription.lastValue, dbValue)) {
                            subscription.lastValue = dbValue;
                            subscription.fun(dbValue);
                        }
                    } else {
                        subscription.lastValue = dbValue;
                        subscription.fun(dbValue);
                    }
                } catch (ex) {
                    console.error('Error running subscription.');
                    subscription.errorCount += 1;
                }
            });
        }

        // PUBLIC api

        set(path, value) {
            this.db.setItem(path, value);
            this.runOnce();
        }

        get(path, defaultValue) {
            return this.db.getItem(path, defaultValue);
        }

        subscribe(query, fun) {
            const subscription = {
                query: query,
                fun: fun,
                errorCount: 0,
                lastValue: undefined
            };
            const id = new Uuid(4).format();
            this.subscriptions[id] = subscription;
            // this.runOnce();
            return id;
        }

        remove(path) {
            this.db.deleteItem(path);
            this.runOnce();
        }

        unsubscribe(id) {
            delete this.subscriptions[id];
        }

        toJSON() {
            return this.db.getRaw();
        }

    }

    return {
        DB
    };
});