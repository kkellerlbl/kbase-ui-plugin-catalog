define([
    // 'knockout',
    './subscriptionManager',
    './nanoBus'
], function (
    // ko,
    SubscriptionManager,
    NanoBus
) {
    'use strict';

    class ViewModelBase {
        constructor(params) {
            params = params || {};
            this.subscriptions = new SubscriptionManager();
            // is this kosher? Maybe a better way of tying in
            // functionality to the current knockout system?
            // E.g. passing in a ko in the constructor?
            // this.observable = ko.observable;
            // this.observableArray = ko.observableArray;
            this.bus = new NanoBus({
                link: params.bus || params.link
            });

            this.parentBus = params.bus;
        }

        subscribe(observable, fun) {
            this.subscriptions.add(observable.subscribe(fun));
        }

        sendToParent(message, payload) {
            if (this.parentBus) {
                this.parentBus.send(message, payload);
            }
        }

        receiveFromParent(message, handler) {
            this.parentBus.on(message, handler);
        }

        send(message, payload) {
            this.bus.send(message, payload);
        }

        on(message, handler) {
            this.bus.on(message, handler);
        }

        dispose() {
            this.subscriptions.dispose();
            this.bus.stop();
        }
    }

    return ViewModelBase;
});